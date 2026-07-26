import { randomUUID } from 'node:crypto';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { waitUntil } from '@vercel/functions';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { z, ZodError } from 'zod';
import { buildAiTextPrompt, improveVisibleHtmlText } from './src/server/sites/aiText.js';
import { runSiteAiComputer } from './src/server/sites/aiComputer.js';
import { normalizeAnalyticsEvent, parseAnalyticsRange } from './src/server/sites/analytics.js';
import { getSiteConfigurationStatus, getSiteRuntimeConfig } from './src/server/sites/config.js';
import { analyzeSiteIntegrations, applySiteIntegrations, type AppliedSiteIntegrations } from './src/server/sites/integrations.js';
import { sanitizeManagedDirectorySites, werseeSiteHostname } from './src/server/sites/managedDomains.js';
import {
  createPreviewToken,
  isAllowedSiteOrigin,
  normalizeArchivePath,
  normalizeSiteSlug,
  safeAnalyticsPath,
  sha256,
  validateSiteSlug,
  verifyPreviewToken,
} from './src/server/sites/security.js';
import {
  createSiteTempDirectory,
  listWerseeStorageZips,
  materializeReleaseFiles,
  materializeSiteUpload,
  removeSiteTempDirectory,
  removeStoragePrefix,
  replacePreviewFiles,
} from './src/server/sites/storage.js';
import { rewriteHtmlForPreview, validatePreparedSite } from './src/server/sites/validation.js';
import {
  assignVercelAlias,
  createVercelDeployment,
  removeVercelAlias,
  uploadVercelFiles,
  verifyVercelAlias,
  waitForVercelDeployment,
} from './src/server/sites/vercel.js';
import type { SiteRuntimeConfig } from './src/server/sites/types.js';

export const config = { maxDuration: 300 };

class SiteApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

type RequestContext = {
  config: SiteRuntimeConfig;
  service: SupabaseClient;
  userClient: SupabaseClient;
  user: User;
  token: string;
};

const app = express();
app.disable('x-powered-by');

// Vercel rewrites all nested /api/sites paths into the single Express function.
app.use((request, _response, next) => {
  const parsed = new URL(request.url, 'https://wersee.local');
  const rewrittenPath = parsed.searchParams.get('__sites_path');
  if (rewrittenPath) {
    parsed.searchParams.delete('__sites_path');
    const pathname = rewrittenPath === '__events' ? '/api/site-events' : `/api/sites/${rewrittenPath.replace(/^\/+/, '')}`;
    request.url = `${pathname}${parsed.searchParams.size ? `?${parsed.searchParams}` : ''}`;
  }
  next();
});

app.use('/api/site-events', express.text({ type: '*/*', limit: '32kb' }));
app.use('/api/sites', express.json({ limit: '256kb' }));

const getBearerToken = (request: Request) => {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
};

const buildClients = (config: SiteRuntimeConfig, token?: string) => {
  const service = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userClient = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
  return { service, userClient };
};

const requireContext = async (request: Request): Promise<RequestContext> => {
  const status = getSiteConfigurationStatus();
  if (!status.configured) throw new SiteApiError('SITE_CONFIGURATION_MISSING', 'Wersee Sites is missing required server configuration.', 503, { missing: status.missing });
  const config = getSiteRuntimeConfig();
  const token = getBearerToken(request);
  if (!token) throw new SiteApiError('AUTH_REQUIRED', 'Sign in to manage Wersee Sites.', 401);
  const { service, userClient } = buildClients(config, token);
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) throw new SiteApiError('AUTH_INVALID', 'Your session is invalid or expired.', 401);
  return { config, service, userClient, user: data.user, token };
};

const requireSite = async (context: RequestContext, siteId: string, columns = '*') => {
  const { data, error } = await context.userClient.from('sites').select(columns).eq('id', siteId).is('deleted_at', null).maybeSingle();
  if (error) throw new SiteApiError('SITE_READ_FAILED', 'Wersee could not read this site.', 500);
  if (!data) throw new SiteApiError('SITE_NOT_FOUND', 'The site was not found or you do not have access.', 404);
  return data as any;
};

const getRequestIp = (request: Request) => String(request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip || 'unknown').split(',')[0].trim();

const checkRateLimit = async (
  context: Pick<RequestContext, 'service' | 'config'>,
  request: Request,
  bucket: string,
  limit: number,
  windowSeconds: number,
) => {
  const key = sha256(`${context.config.analyticsHashSalt}:${bucket}:${getRequestIp(request)}`);
  const { data, error } = await context.service.rpc('check_site_rate_limit', {
    rate_bucket: bucket,
    rate_key_hash: key,
    request_limit: limit,
    window_seconds: windowSeconds,
  });
  if (error) throw new SiteApiError('RATE_LIMIT_CHECK_FAILED', 'The request could not be verified.', 503);
  if (!data) throw new SiteApiError('RATE_LIMITED', 'Too many requests. Wait a moment and try again.', 429);
};

const requestWerseeAiText = async (context: RequestContext, prompt: string) => {
  const aiResponse = await fetch(`${context.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/wersee-ai/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${context.token}`,
      apikey: context.config.supabasePublishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.15,
        maxOutputTokens: 4000,
        systemInstruction: 'Return strict JSON only. Improve only the supplied visible text fragments and obey every hard rule.',
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const payload = await aiResponse.json().catch(() => null);
  if (!aiResponse.ok || typeof payload?.text !== 'string') throw new Error('WERSEE_AI_TEXT_FAILED');
  return payload.text as string;
};

const managedBusinesses = async (context: RequestContext) => {
  const ids = new Set<string>();
  const [owned, businessMemberships, teamMemberships] = await Promise.all([
    context.service.from('businesses').select('id').eq('user_id', context.user.id),
    context.service.from('business_members').select('business_id,role').eq('user_id', context.user.id).in('role', ['owner', 'admin', 'manager']),
    context.service.from('team_members').select('business_id,role,status').eq('user_id', context.user.id).eq('status', 'active').in('role', ['owner', 'admin', 'manager']),
  ]);
  for (const row of owned.data || []) ids.add(row.id);
  for (const row of businessMemberships.data || []) if (row.business_id) ids.add(row.business_id);
  for (const row of teamMemberships.data || []) if (row.business_id) ids.add(row.business_id);
  if (!ids.size) return [];
  const { data, error } = await context.service.from('businesses').select('id,name,slug,logo_url').in('id', [...ids]).order('created_at');
  if (error) throw new SiteApiError('BUSINESSES_READ_FAILED', 'Wersee could not load the businesses you manage.', 500);
  return data || [];
};

const publicSiteUrl = (site: any, rootDomain: string) => `https://${site.slug}.${rootDomain}`;

const upsertManagedWerseeDomain = async (
  context: RequestContext,
  input: {
    siteId: string;
    releaseId: string | null;
    hostname: string;
    deploymentId: string | null;
    status?: 'pending' | 'active';
  },
) => {
  const status = input.status || 'active';
  const now = new Date().toISOString();
  const { error } = await context.service.from('site_managed_domains').upsert({
    site_id: input.siteId,
    release_id: input.releaseId,
    hostname: input.hostname.toLowerCase(),
    kind: 'wersee_subdomain',
    provider: 'vercel',
    status,
    vercel_deployment_id: input.deploymentId,
    managed_by: context.user.id,
    verified_at: status === 'active' ? now : null,
    detached_at: null,
    updated_at: now,
  }, { onConflict: 'hostname' });
  if (error) throw new Error('SITE_MANAGED_DOMAIN_SYNC_FAILED');
};

const setManagedDomainStatus = async (
  context: RequestContext,
  hostname: string,
  status: 'active' | 'detaching' | 'detached' | 'failed',
  deploymentId?: string | null,
) => {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
    detached_at: status === 'detached' ? now : null,
  };
  if (deploymentId !== undefined) update.vercel_deployment_id = deploymentId;
  if (status === 'active') update.verified_at = now;
  const { error } = await context.service
    .from('site_managed_domains')
    .update(update)
    .eq('hostname', hostname.toLowerCase());
  if (error) throw new Error('SITE_MANAGED_DOMAIN_SYNC_FAILED');
};

app.get('/api/sites/configuration', async (_request, response) => {
  const status = getSiteConfigurationStatus();
  response.status(status.configured ? 200 : 503).json(status);
});

app.options('/api/sites/public-directory', (_request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'content-type');
  response.status(204).end();
});

app.get('/api/sites/public-directory', async (_request, response) => {
  const status = getSiteConfigurationStatus();
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  if (!status.configured) return response.status(503).json({ sites: [] });
  const config = getSiteRuntimeConfig();
  const { service } = buildClients(config);
  const { data, error } = await service
    .from('sites')
    .select('id,name,slug,description,icon_url,thumbnail_url,marketplace_published_at,active_release_id,updated_at')
    .eq('status', 'published')
    .not('active_release_id', 'is', null)
    .is('deleted_at', null)
    .or('directory_listed.eq.true,marketplace_published_at.not.is.null')
    .order('marketplace_published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error) throw new SiteApiError('SITE_DIRECTORY_UNAVAILABLE', 'The Wersee Sites directory is temporarily unavailable.', 503);
  const siteIds = (data || []).map((site: any) => site.id);
  const managedDomains = siteIds.length
    ? await service
        .from('site_managed_domains')
        .select('site_id,release_id,hostname,kind,provider,status,vercel_deployment_id')
        .in('site_id', siteIds)
        .eq('status', 'active')
        .eq('kind', 'wersee_subdomain')
        .eq('provider', 'vercel')
    : { data: [], error: null };
  if (managedDomains.error) throw new SiteApiError('SITE_DIRECTORY_UNAVAILABLE', 'The Wersee Sites directory is temporarily unavailable.', 503);
  response.json({
    sites: sanitizeManagedDirectorySites(data || [], managedDomains.data || [], config.rootDomain),
  });
});

app.get('/api/sites', async (request, response) => {
  const context = await requireContext(request);
  const businesses = await managedBusinesses(context);
  const businessIds = businesses.map((business: any) => business.id);
  const { data: profile } = await context.service.from('profiles').select('username').eq('id', context.user.id).maybeSingle();
  if (!businessIds.length) return response.json({ businesses: [], sites: [], username: profile?.username || null });
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [sitesResult, jobsResult, profilesResult] = await Promise.all([
    context.service
      .from('sites')
      .select('*,active_release:site_releases!sites_active_release_fk(id,version,status,file_count,total_bytes,published_at,vercel_deployment_id,vercel_deployment_url,created_by)')
      .in('business_id', businessIds)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    context.service.from('site_deployment_jobs').select('site_id,status,stage,progress,support_reference,updated_at').in('status', ['created', 'running']).order('started_at', { ascending: false }),
    context.service.from('profiles').select('id,username,full_name,name'),
  ]);
  if (sitesResult.error) throw new SiteApiError('SITES_READ_FAILED', 'Wersee could not load your sites.', 500);
  const sites = sitesResult.data || [];
  const siteIds = sites.map((site: any) => site.id);
  let analyticsRows: any[] = [];
  if (siteIds.length) {
    const { data } = await context.service.from('site_analytics_daily').select('site_id,page_views').in('site_id', siteIds).gte('event_date', since);
    analyticsRows = data || [];
  }
  const viewMap = new Map<string, number>();
  for (const row of analyticsRows) viewMap.set(row.site_id, (viewMap.get(row.site_id) || 0) + Number(row.page_views || 0));
  const jobMap = new Map<string, any>();
  for (const job of jobsResult.data || []) if (!jobMap.has(job.site_id)) jobMap.set(job.site_id, job);
  const editorMap = new Map((profilesResult.data || []).map((item: any) => [item.id, item.full_name || item.name || item.username || 'Wersee user']));
  const businessMap = new Map(businesses.map((item: any) => [item.id, item]));
  response.json({
    businesses,
    username: profile?.username || null,
    sites: sites.map((site: any) => ({
      ...site,
      business: businessMap.get(site.business_id),
      public_url: publicSiteUrl(site, context.config.rootDomain),
      views_last_7_days: viewMap.get(site.id) || 0,
      current_job: jobMap.get(site.id) || null,
      last_editor: editorMap.get(site.updated_by || site.active_release?.created_by || site.created_by) || 'Wersee user',
    })),
  });
});

app.get('/api/sites/slug-availability', async (request, response) => {
  const context = await requireContext(request);
  await checkRateLimit(context, request, 'slug-availability', 30, 60);
  const slug = normalizeSiteSlug(String(request.query.slug || ''));
  const currentSiteId = request.query.siteId ? String(request.query.siteId) : null;
  const localValidation = validateSiteSlug(slug);
  if (!localValidation.valid) return response.json({ slug, available: false, reason: localValidation.reason });
  if (currentSiteId) await requireSite(context, z.string().uuid().parse(currentSiteId));
  const { data, error } = await context.service.rpc('site_slug_available', { requested_slug: slug, current_site_id: currentSiteId });
  if (error) throw new SiteApiError('SITE_SLUG_CHECK_FAILED', 'Wersee could not verify this subdomain.', 503);
  response.json({ slug, available: Boolean(data), reason: data ? null : 'This subdomain is already in use or reserved.' });
});

const createSiteSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(3).max(63),
  description: z.string().trim().max(500).optional().nullable(),
  siteType: z.enum(['uploaded_static', 'wersee_builder']).default('uploaded_static'),
});

app.post('/api/sites', async (request, response) => {
  const context = await requireContext(request);
  await checkRateLimit(context, request, 'site-create', 10, 3600);
  const input = createSiteSchema.parse(request.body);
  const slug = normalizeSiteSlug(input.slug);
  const localValidation = validateSiteSlug(slug);
  if (!localValidation.valid) throw new SiteApiError('SITE_SLUG_INVALID', localValidation.reason || 'The subdomain is invalid.');
  const { data, error } = await context.userClient.rpc('create_site', {
    target_business_id: input.businessId,
    site_name: input.name,
    requested_slug: slug,
    site_description: input.description || null,
    requested_site_type: input.siteType,
  });
  if (error) {
    const code = String(error.message).includes('SITE_SLUG_UNAVAILABLE') || error.code === '23505' ? 'SITE_SLUG_UNAVAILABLE' : String(error.message).includes('PERMISSION') ? 'SITE_PERMISSION_DENIED' : 'SITE_CREATE_FAILED';
    throw new SiteApiError(code, code === 'SITE_SLUG_UNAVAILABLE' ? 'This subdomain is already in use.' : 'Wersee could not create the site.', code === 'SITE_PERMISSION_DENIED' ? 403 : 409);
  }
  response.status(201).json({ site: { ...(Array.isArray(data) ? data[0] : data), public_url: `https://${slug}.${context.config.rootDomain}` } });
});

app.get('/api/sites/storage-zips', async (request, response) => {
  const context = await requireContext(request);
  response.json({ files: await listWerseeStorageZips(context.service, context.user.id) });
});

const uploadSchema = z.object({
  sourceType: z.enum(['zip', 'folder', 'wersee_storage']),
  originalName: z.string().max(255).optional(),
  totalBytes: z.number().int().nonnegative().optional().default(0),
  fileCount: z.number().int().nonnegative().optional().default(0),
  storagePath: z.string().max(2048).optional(),
});

app.post('/api/sites/:siteId/uploads', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-upload-token', 30, 3600);
  const input = uploadSchema.parse(request.body);
  if (input.sourceType !== 'folder' && input.totalBytes > context.config.maxArchiveBytes) throw new SiteApiError('SITE_MAX_ARCHIVE_BYTES', 'The archive exceeds the configured upload limit.', 413);
  if (input.fileCount > context.config.maxFileCount) throw new SiteApiError('SITE_MAX_FILE_COUNT', 'The folder contains too many files.', 413);
  if (input.sourceType === 'wersee_storage' && (!input.storagePath || !input.storagePath.startsWith(`${context.user.id}/`))) {
    throw new SiteApiError('STORAGE_SOURCE_DENIED', 'Select a ZIP from your own Wersee Storage.', 403);
  }
  const uploadId = randomUUID();
  const storagePrefix = `${context.user.id}/${site.id}/${uploadId}`;
  const expiresAt = new Date(Date.now() + context.config.stagingRetentionHours * 3600000).toISOString();
  const { data, error } = await context.service.from('site_uploads').insert({
    id: uploadId,
    site_id: site.id,
    owner_id: context.user.id,
    source_type: input.sourceType,
    status: input.sourceType === 'wersee_storage' ? 'uploaded' : 'uploading',
    storage_prefix: storagePrefix,
    original_name: input.originalName || null,
    total_bytes: input.totalBytes,
    file_count: input.fileCount,
    source_metadata: input.sourceType === 'wersee_storage' ? { bucket: 'business_storage', storage_path: input.storagePath } : {},
    expires_at: expiresAt,
  }).select('*').single();
  if (error) throw new SiteApiError('SITE_UPLOAD_CREATE_FAILED', 'Wersee could not prepare the upload.', 500);
  await context.service.from('site_audit_logs').insert({ site_id: site.id, actor_id: context.user.id, action: 'upload_started', metadata: { upload_id: uploadId, source_type: input.sourceType } });
  const projectRef = new URL(context.config.supabaseUrl).hostname.split('.')[0];
  response.status(201).json({
    upload: data,
    destination: {
      bucket: 'site-upload-staging',
      prefix: storagePrefix,
      tusEndpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      chunkSize: 6 * 1024 * 1024,
    },
  });
});

const releaseSchema = z.object({ uploadId: z.string().uuid(), releaseNotes: z.string().trim().max(500).optional() });

app.post('/api/sites/:siteId/releases', async (request, response) => {
  const context = await requireContext(request);
  await requireSite(context, request.params.siteId);
  const input = releaseSchema.parse(request.body);
  const { data, error } = await context.userClient.rpc('create_site_release', {
    target_site_id: request.params.siteId,
    target_upload_id: input.uploadId,
    notes: input.releaseNotes || null,
  });
  if (error) throw new SiteApiError('SITE_RELEASE_CREATE_FAILED', 'Wersee could not create an immutable release.', 400);
  response.status(201).json({ release: Array.isArray(data) ? data[0] : data });
});

const validateSchema = z.object({
  releaseId: z.string().uuid(),
  selectedRoot: z.string().max(1024).optional().nullable(),
  aiTextEnhancement: z.object({
    enabled: z.boolean(),
    locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'),
    tone: z.enum(['clear', 'professional', 'friendly', 'confident', 'concise']).default('clear'),
    instructions: z.string().trim().max(500).optional(),
  }).strict().optional(),
});

app.post('/api/sites/:siteId/validate', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-validation', 20, 3600);
  const input = validateSchema.parse(request.body);
  const { data: release } = await context.service.from('site_releases').select('*').eq('id', input.releaseId).eq('site_id', site.id).maybeSingle();
  if (!release) throw new SiteApiError('SITE_RELEASE_NOT_FOUND', 'The release was not found.', 404);
  const { data: upload } = await context.service.from('site_uploads').select('*').eq('release_id', release.id).eq('site_id', site.id).maybeSingle();
  if (!upload) throw new SiteApiError('SITE_UPLOAD_NOT_FOUND', 'The source upload was not found.', 404);
  await context.service.from('site_releases').update({ status: 'validating', error_code: null, error_message: null }).eq('id', release.id);
  await context.service.from('site_uploads').update({ status: 'validating' }).eq('id', upload.id);
  const tempDirectory = await createSiteTempDirectory(release.id);
  try {
    const sourceDirectory = path.join(tempDirectory, 'source');
    const sourceFiles = await materializeSiteUpload(context.service, upload as any, sourceDirectory, context.config);
    const validation = await validatePreparedSite(sourceFiles, {
      selectedRoot: input.selectedRoot,
      analyticsEnabled: site.analytics_enabled,
      analyticsScriptUrl: context.config.analyticsScriptUrl,
      siteId: site.id,
      releaseId: release.id,
      siteUrl: publicSiteUrl(site, context.config.rootDomain),
      indexingEnabled: site.indexing_enabled !== false,
      aiTextEnhancementEnabled: input.aiTextEnhancement?.enabled ?? Boolean(site.ai_text_enhancement_enabled),
      indexNowKey: sha256(`${context.config.previewTokenSecret}:indexnow:${site.id}`),
      improveText: async (html, aiOptions) => improveVisibleHtmlText(
        html,
        async (aiRequest) => requestWerseeAiText(context, buildAiTextPrompt(aiRequest)),
        {
          locale: input.aiTextEnhancement?.locale || aiOptions.locale,
          tone: input.aiTextEnhancement?.tone || aiOptions.tone,
          instructions: input.aiTextEnhancement?.instructions || aiOptions.instructions,
        },
      ),
      maxUnpackedBytes: context.config.maxUnpackedBytes,
      maxFileCount: context.config.maxFileCount,
      maxSingleFileBytes: context.config.maxSingleFileBytes,
    });
    if (validation.report.detectedSpa && !site.spa_fallback) validation.report.warnings.push({ code: 'SPA_FALLBACK_RECOMMENDED', message: 'Enable SPA fallback for client-side routes.' });
    const nextStatus = validation.report.publishable ? 'ready' : validation.report.errors.every((item) => item.code === 'MULTIPLE_SITE_ROOTS') ? 'created' : 'failed';
    let manifest: any[] = [];
    if (validation.report.publishable) {
      const { data: previousFiles } = await context.service.from('site_release_files').select('storage_path').eq('release_id', release.id);
      const records = await replacePreviewFiles(context.service, context.user.id, site.id, release.id, validation.files, (previousFiles || []).map((item: any) => item.storage_path));
      await context.service.from('site_release_files').delete().eq('release_id', release.id);
      if (records.length) {
        const { error: fileInsertError } = await context.service.from('site_release_files').insert(records);
        if (fileInsertError) throw new Error(`RELEASE_MANIFEST_FAILED:${fileInsertError.message}`);
      }
      manifest = records.map((record) => ({ path: record.path, size: record.size_bytes, contentType: record.content_type, sha1: record.sha1 }));
    }
    await context.service.from('site_releases').update({
      status: nextStatus,
      detected_root: validation.report.detectedRoot,
      manifest,
      file_count: validation.report.totalFiles,
      total_bytes: validation.report.totalSize,
      validation_report: validation.report,
      source_checksum: sha256(manifest.map((item) => `${item.path}:${item.sha1}`).join('\n')),
      failed_at: nextStatus === 'failed' ? new Date().toISOString() : null,
      error_code: validation.report.publishable ? null : validation.report.errors[0]?.code || null,
      error_message: validation.report.publishable ? null : validation.report.errors[0]?.message || null,
    }).eq('id', release.id);
    await context.service.from('site_uploads').update({ status: validation.report.publishable ? 'completed' : 'failed', completed_at: validation.report.publishable ? new Date().toISOString() : null }).eq('id', upload.id);
    await context.service.from('site_audit_logs').insert({
      site_id: site.id,
      actor_id: context.user.id,
      action: 'validation_completed',
      metadata: { release_id: release.id, publishable: validation.report.publishable, errors: validation.report.errors.length, warnings: validation.report.warnings.length },
    });
    response.json({ report: validation.report, release: { ...release, status: nextStatus, file_count: validation.report.totalFiles, total_bytes: validation.report.totalSize } });
  } catch (error) {
    const code = String(error instanceof Error ? error.message : error).split(':')[0].replace(/[^A-Z0-9_]/gi, '_').slice(0, 80) || 'SITE_VALIDATION_FAILED';
    await context.service.from('site_releases').update({ status: 'failed', failed_at: new Date().toISOString(), error_code: code, error_message: 'The uploaded source could not be validated safely.' }).eq('id', release.id);
    await context.service.from('site_uploads').update({ status: 'failed', error_code: code, error_message: 'Validation failed.' }).eq('id', upload.id);
    throw new SiteApiError(code, code === 'ZIP_SLIP_DETECTED' ? 'The ZIP contains an unsafe path and was rejected.' : 'The uploaded source could not be validated safely.', 400);
  } finally {
    await removeSiteTempDirectory(tempDirectory);
  }
});

const aiComputerRunSchema = z.object({ releaseId: z.string().uuid() }).strict();

const runAiComputerJob = async (context: RequestContext, site: any, release: any, run: any) => {
  const tempDirectory = await createSiteTempDirectory(release.id);
  try {
    const { data: fileRows, error } = await context.service
      .from('site_release_files')
      .select('*')
      .eq('release_id', release.id)
      .order('path');
    if (error || !fileRows?.length) throw new Error('SITE_RELEASE_FILES_MISSING');
    const files = await materializeReleaseFiles(
      context.service,
      fileRows as any,
      path.join(tempDirectory, 'computer-release'),
    );
    await runSiteAiComputer({
      service: context.service,
      config: context.config,
      token: context.token,
      userId: context.user.id,
      siteId: site.id,
      releaseId: release.id,
      runId: run.id,
    }, files);
  } catch (error) {
    const code = String(error instanceof Error ? error.message : error)
      .split(':')[0].replace(/[^A-Z0-9_-]/gi, '_').slice(0, 80) || 'SITE_COMPUTER_FAILED';
    const now = new Date().toISOString();
    await context.service.from('site_ai_computer_runs').update({
      status: 'failed',
      stage: 'failed',
      progress: 100,
      public_message: 'The private computer stopped safely. Your release files were not changed.',
      error_code: code,
      completed_at: now,
      updated_at: now,
    }).eq('id', run.id);
    await context.service.from('site_ai_computer_events').insert({
      run_id: run.id,
      site_id: site.id,
      event_type: 'failed',
      stage: 'failed',
      progress: 100,
      public_message: 'The private computer stopped safely. Your release files were not changed.',
    });
  } finally {
    await removeSiteTempDirectory(tempDirectory);
  }
};

app.post('/api/sites/:siteId/ai-computer/runs', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-ai-computer', 10, 3600);
  const input = aiComputerRunSchema.parse(request.body);
  const { data: release } = await context.service
    .from('site_releases')
    .select('*')
    .eq('id', input.releaseId)
    .eq('site_id', site.id)
    .eq('status', 'ready')
    .maybeSingle();
  if (!release) throw new SiteApiError('SITE_RELEASE_NOT_READY', 'Validate this release before starting its private computer.', 409);
  const { data: active } = await context.service
    .from('site_ai_computer_runs')
    .select('*')
    .eq('release_id', release.id)
    .in('status', ['queued', 'running'])
    .maybeSingle();
  if (active) return response.status(202).json({ run: active });
  const { data: run, error } = await context.service.from('site_ai_computer_runs').insert({
    site_id: site.id,
    release_id: release.id,
    requested_by: context.user.id,
    status: 'queued',
    stage: 'queued',
    progress: 0,
    public_message: 'Waiting for a private computer.',
  }).select('*').single();
  if (error || !run) throw new SiteApiError('SITE_COMPUTER_START_FAILED', 'Wersee could not reserve a private computer.', 503);
  await context.service.from('site_ai_computer_events').insert({
    run_id: run.id,
    site_id: site.id,
    event_type: 'status',
    stage: 'queued',
    progress: 0,
    public_message: 'Waiting for a private computer.',
  });
  const work = runAiComputerJob(context, site, release, run);
  try { waitUntil(work); } catch { void work; }
  response.status(202).json({ run });
});

app.get('/api/sites/:siteId/ai-computer/runs/:runId', async (request, response) => {
  const context = await requireContext(request);
  await requireSite(context, request.params.siteId);
  const { data: run, error } = await context.userClient
    .from('site_ai_computer_runs')
    .select('*')
    .eq('id', request.params.runId)
    .eq('site_id', request.params.siteId)
    .maybeSingle();
  if (error || !run) throw new SiteApiError('SITE_COMPUTER_RUN_NOT_FOUND', 'That private computer run was not found.', 404);
  const [{ data: events, error: eventsError }, { data: snapshots, error: snapshotsError }] = await Promise.all([
    context.userClient.from('site_ai_computer_events').select('*').eq('run_id', run.id).order('id'),
    context.userClient.from('site_ai_computer_snapshots').select('*').eq('run_id', run.id).eq('visibility', 'shared').order('sequence'),
  ]);
  if (eventsError || snapshotsError) throw new SiteApiError('SITE_COMPUTER_RUN_READ_FAILED', 'Computer progress could not be loaded.', 500);
  const signedSnapshots = await Promise.all((snapshots || []).map(async (snapshot: any) => {
    const { data } = await context.service.storage.from('site-ai-computer').createSignedUrl(snapshot.storage_path, 300);
    return {
      id: snapshot.id,
      viewport: snapshot.viewport,
      sequence: snapshot.sequence,
      width: snapshot.width,
      height: snapshot.height,
      url: data?.signedUrl || null,
      createdAt: snapshot.created_at,
    };
  }));
  response.setHeader('Cache-Control', 'private, no-store');
  response.json({
    run: {
      id: run.id,
      status: run.status,
      stage: run.stage,
      progress: run.progress,
      message: run.public_message,
      result: run.result,
      errorCode: run.error_code,
      supportReference: run.support_reference,
      startedAt: run.started_at,
      completedAt: run.completed_at,
    },
    events: events || [],
    snapshots: signedSnapshots.filter((snapshot) => snapshot.url),
  });
});

const integrationPath = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/);
const applyIntegrationsSchema = z.object({
  releaseId: z.string().uuid(),
  quickPay: z.object({
    candidateId: z.string().min(8).max(80),
    customPath: integrationPath,
    confirmedAmount: z.number().positive().max(1_000_000),
    currency: z.enum(['eur', 'usd']),
  }).optional(),
  oauth: z.object({
    candidateId: z.string().min(8).max(80).optional(),
    placement: z.enum(['existing', 'header', 'footer', 'selector']),
    targetSelector: z.string().trim().min(1).max(180).optional(),
    customPath: integrationPath.default('auth'),
  }).optional(),
}).refine((input) => input.quickPay || input.oauth, { message: 'Choose at least one integration.' })
  .refine((input) => input.oauth?.placement !== 'existing' || Boolean(input.oauth.candidateId), { message: 'Choose a detected login button.' })
  .refine((input) => input.oauth?.placement !== 'selector' || Boolean(input.oauth.targetSelector), { message: 'Enter a valid CSS selector.' });

app.post('/api/sites/:siteId/integrations/apply', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-integrations-apply', 10, 3600);
  const input = applyIntegrationsSchema.parse(request.body);
  const { data: release } = await context.service.from('site_releases').select('*').eq('id', input.releaseId).eq('site_id', site.id).maybeSingle();
  if (!release) throw new SiteApiError('SITE_RELEASE_NOT_FOUND', 'The release was not found.', 404);
  if (release.status !== 'ready') throw new SiteApiError('SITE_RELEASE_NOT_READY', 'Only a validated, unpublished release can be changed.', 409);
  if (Array.isArray(release.validation_report?.integrations?.applied) && release.validation_report.integrations.applied.length) {
    throw new SiteApiError('SITE_INTEGRATIONS_ALREADY_APPLIED', 'These release files already contain reviewed integrations. Create a new release to change them.', 409);
  }
  const { data: fileRows, error: fileRowsError } = await context.service.from('site_release_files').select('*').eq('release_id', release.id).order('path');
  if (fileRowsError || !fileRows?.length) throw new SiteApiError('SITE_RELEASE_FILES_MISSING', 'The validated release files were not found.', 409);

  const tempDirectory = await createSiteTempDirectory(`${release.id}-integrations`);
  let newlyCreatedOAuthClientId: string | null = null;
  try {
    const files = await materializeReleaseFiles(context.service, fileRows as any, path.join(tempDirectory, 'release'));
    const candidates = await analyzeSiteIntegrations(files);
    const applied: AppliedSiteIntegrations = {};
    const integrationRows: any[] = [];

    if (input.quickPay) {
      const candidate = candidates.find((item) => item.id === input.quickPay?.candidateId && item.kind === 'quick_pay');
      if (!candidate) throw new SiteApiError('SITE_PAY_CANDIDATE_STALE', 'The selected Pay button is no longer present in this release.', 409);
      if (candidate.detectedAmount != null && Math.abs(candidate.detectedAmount - input.quickPay.confirmedAmount) > 0.001) {
        throw new SiteApiError('SITE_PAY_PRICE_CHANGED', 'The confirmed price no longer matches the price detected in the release.', 409);
      }
      const { data: payOwner } = await context.service.from('profiles')
        .select('username,stripe_account_id,managed_payments_enabled,stripe_onboarding_complete')
        .eq('id', site.owner_id)
        .maybeSingle();
      if (!payOwner?.username || !payOwner.stripe_account_id || payOwner.stripe_account_id === 'sandbox' || payOwner.managed_payments_enabled !== true || payOwner.stripe_onboarding_complete !== true) {
        throw new SiteApiError('WERSEE_PAY_NOT_READY', 'Finish Wersee Pay onboarding before connecting a real payment button.', 409);
      }
      const { data: existingIntegration } = await context.service.from('site_integrations').select('quick_pay_link_id').eq('site_id', site.id).eq('kind', 'quick_pay').maybeSingle();
      let quickPayLinkId = existingIntegration?.quick_pay_link_id || null;
      let quickPaySlug = `site-${site.slug}-${input.quickPay.customPath}-${candidate.id.slice(0, 6)}`.slice(0, 96).replace(/-+$/g, '');
      if (quickPayLinkId) {
        const { data: existingLink } = await context.service.from('quick_pay_links').select('id,slug,user_id').eq('id', quickPayLinkId).eq('user_id', site.owner_id).maybeSingle();
        if (!existingLink) quickPayLinkId = null;
        else quickPaySlug = existingLink.slug;
      }
      if (!quickPayLinkId) {
        const idempotencyKey = `sites:${site.id}:${candidate.id}`;
        const { data: existingLink } = await context.service.from('quick_pay_links').select('id,slug').eq('ai_idempotency_key', idempotencyKey).maybeSingle();
        if (existingLink) {
          quickPayLinkId = existingLink.id;
          quickPaySlug = existingLink.slug;
        } else {
          const { data: createdLink, error: linkError } = await context.service.from('quick_pay_links').insert({
            user_id: site.owner_id,
            username: payOwner.username,
            name: `${site.name} · ${candidate.label}`.slice(0, 120),
            slug: quickPaySlug,
            product_name: candidate.label.slice(0, 160),
            description: `Secure payment from ${publicSiteUrl(site, context.config.rootDomain)}`,
            price: input.quickPay.confirmedAmount,
            currency: input.quickPay.currency,
            stripe_account_id: payOwner.stripe_account_id,
            settings: { pricing_type: 'fixed', payment_methods: ['card', 'ideal'], source: 'wersee_sites' },
            active: true,
            status: 'active',
            ai_idempotency_key: idempotencyKey,
          }).select('id,slug').single();
          if (linkError || !createdLink) throw new SiteApiError('QUICK_PAY_CREATE_FAILED', 'Wersee Pay could not create the secure payment link.', 502);
          quickPayLinkId = createdLink.id;
          quickPaySlug = createdLink.slug;
        }
      }
      const routePath = `/${input.quickPay.customPath}/`;
      const checkoutUrl = `https://${context.config.rootDomain}/${encodeURIComponent(payOwner.username)}/quick-pay/${encodeURIComponent(quickPaySlug)}`;
      applied.quickPay = { candidateId: candidate.id, label: candidate.label, routePath, checkoutUrl };
      integrationRows.push({
        site_id: site.id, owner_id: site.owner_id, kind: 'quick_pay', status: 'applied', release_id: release.id,
        candidate_id: candidate.id, placement: 'existing', custom_path: input.quickPay.customPath,
        detected_amount: input.quickPay.confirmedAmount, detected_currency: input.quickPay.currency,
        detected_label: candidate.label, source_path: candidate.sourcePath, quick_pay_link_id: quickPayLinkId,
        config: { checkout_url: checkoutUrl, route_path: routePath }, last_analyzed_at: new Date().toISOString(), applied_at: new Date().toISOString(),
      });
    }

    if (input.oauth) {
      const candidate = input.oauth.candidateId
        ? candidates.find((item) => item.id === input.oauth?.candidateId && item.kind === 'wersee_oauth')
        : null;
      if (input.oauth.placement === 'existing' && !candidate) throw new SiteApiError('SITE_LOGIN_CANDIDATE_STALE', 'The selected login button is no longer present in this release.', 409);
      const callbackPath = `/${input.oauth.customPath}/wersee/callback/`;
      const redirectUri = new URL(callbackPath, `${publicSiteUrl(site, context.config.rootDomain)}/`).href;
      const { data: existingIntegration } = await context.service.from('site_integrations').select('oauth_client_id,oauth_redirect_uri').eq('site_id', site.id).eq('kind', 'wersee_oauth').maybeSingle();
      let oauthClientId = existingIntegration?.oauth_client_id || null;
      if (oauthClientId) {
        const { data: existingClient, error: clientError } = await context.service.auth.admin.oauth.getClient(oauthClientId);
        if (clientError || !existingClient) oauthClientId = null;
        else if (existingIntegration.oauth_redirect_uri !== redirectUri) {
          const { error: updateClientError } = await context.service.auth.admin.oauth.updateClient(oauthClientId, {
            client_name: `${site.name} on Wersee Sites`,
            client_uri: publicSiteUrl(site, context.config.rootDomain),
            redirect_uris: [redirectUri],
            grant_types: ['authorization_code', 'refresh_token'],
            token_endpoint_auth_method: 'none',
          });
          if (updateClientError) throw new SiteApiError('WERSEE_OAUTH_CLIENT_UPDATE_FAILED', 'Wersee OAuth could not update the exact callback URL.', 502);
        }
      }
      if (!oauthClientId) {
        const { data: oauthClient, error: oauthError } = await context.service.auth.admin.oauth.createClient({
          client_name: `${site.name} on Wersee Sites`,
          client_uri: publicSiteUrl(site, context.config.rootDomain),
          redirect_uris: [redirectUri],
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          scope: 'openid email profile',
          token_endpoint_auth_method: 'none',
        });
        if (oauthError || !oauthClient) throw new SiteApiError('WERSEE_OAUTH_CLIENT_CREATE_FAILED', 'Wersee OAuth 2.1 could not register this site.', 502);
        oauthClientId = oauthClient.client_id;
        newlyCreatedOAuthClientId = oauthClientId;
      }
      applied.oauth = {
        candidateId: candidate?.id,
        label: candidate?.label || 'Log in with Wersee',
        placement: input.oauth.placement,
        targetSelector: input.oauth.targetSelector,
        callbackPath,
        clientId: oauthClientId,
        issuerUrl: context.config.supabaseUrl,
      };
      integrationRows.push({
        site_id: site.id, owner_id: site.owner_id, kind: 'wersee_oauth', status: 'applied', release_id: release.id,
        candidate_id: candidate?.id || null, placement: input.oauth.placement, target_selector: input.oauth.targetSelector || null,
        custom_path: input.oauth.customPath, detected_label: candidate?.label || 'Log in with Wersee',
        source_path: candidate?.sourcePath || null, oauth_client_id: oauthClientId, oauth_redirect_uri: redirectUri,
        config: { callback_path: callbackPath, issuer_url: context.config.supabaseUrl }, last_analyzed_at: new Date().toISOString(), applied_at: new Date().toISOString(),
      });
    }

    const transformed = await applySiteIntegrations(files, applied);
    const previousStoragePaths = fileRows.map((item: any) => item.storage_path);
    const records = await replacePreviewFiles(context.service, context.user.id, site.id, release.id, transformed.files, previousStoragePaths);
    await context.service.from('site_release_files').delete().eq('release_id', release.id);
    const { error: recordsError } = await context.service.from('site_release_files').insert(records);
    if (recordsError) throw new SiteApiError('SITE_INTEGRATION_FILES_FAILED', 'The integrated release manifest could not be saved.', 502);
    const manifest = records.map((record) => ({ path: record.path, size: record.size_bytes, contentType: record.content_type, sha1: record.sha1 }));
    const validationReport = {
      ...(release.validation_report || {}),
      integrations: {
        ...(release.validation_report?.integrations || {}),
        candidates,
        applied: Object.keys(applied),
        appliedAt: new Date().toISOString(),
      },
    };
    const { error: releaseError } = await context.service.from('site_releases').update({
      manifest,
      file_count: records.length,
      total_bytes: records.reduce((sum, item) => sum + Number(item.size_bytes || 0), 0),
      validation_report: validationReport,
      source_checksum: sha256(manifest.map((item) => `${item.path}:${item.sha1}`).join('\n')),
    }).eq('id', release.id);
    if (releaseError) throw new SiteApiError('SITE_INTEGRATION_RELEASE_FAILED', 'The integrated release could not be finalized.', 502);
    const { error: integrationError } = await context.service.from('site_integrations').upsert(integrationRows, { onConflict: 'site_id,kind' });
    if (integrationError) throw new SiteApiError('SITE_INTEGRATION_SAVE_FAILED', 'The integration settings could not be saved.', 502);
    await context.service.from('site_audit_logs').insert({
      site_id: site.id,
      actor_id: context.user.id,
      action: 'site_integrations_applied',
      metadata: { release_id: release.id, integrations: Object.keys(applied) },
    });
    response.json({ applied: Object.keys(applied), report: validationReport });
  } catch (error) {
    if (newlyCreatedOAuthClientId) await context.service.auth.admin.oauth.deleteClient(newlyCreatedOAuthClientId).catch(() => undefined);
    throw error;
  } finally {
    await removeSiteTempDirectory(tempDirectory);
  }
});

app.get('/api/sites/:siteId/preview-token', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const releaseId = z.string().uuid().parse(request.query.releaseId);
  const { data: release } = await context.service.from('site_releases').select('id,status').eq('id', releaseId).eq('site_id', site.id).maybeSingle();
  if (!release || !['ready', 'published'].includes(release.status)) throw new SiteApiError('SITE_PREVIEW_NOT_READY', 'This release is not ready to preview.', 409);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const token = createPreviewToken({ siteId: site.id, releaseId, expiresAt }, context.config.previewTokenSecret);
  response.json({ token, expiresAt, url: `/api/sites/${site.id}/preview/${releaseId}/${token}/` });
});

app.get('/api/sites/:siteId/preview/:releaseId/:token/{*rest}', async (request, response) => {
  const status = getSiteConfigurationStatus();
  if (!status.configured) throw new SiteApiError('SITE_CONFIGURATION_MISSING', 'Preview is unavailable.', 503);
  const config = getSiteRuntimeConfig();
  const payload = verifyPreviewToken(request.params.token, config.previewTokenSecret);
  if (!payload || payload.siteId !== request.params.siteId || payload.releaseId !== request.params.releaseId) throw new SiteApiError('SITE_PREVIEW_TOKEN_INVALID', 'This preview link is invalid or expired.', 403);
  const { service } = buildClients(config);
  const { data: site } = await service.from('sites').select('id,default_document,spa_fallback,custom_404_behavior').eq('id', payload.siteId).is('deleted_at', null).maybeSingle();
  if (!site) throw new SiteApiError('SITE_NOT_FOUND', 'The site was not found.', 404);
  const restParameter = request.params.rest as unknown;
  let requestedPath = (Array.isArray(restParameter) ? restParameter.join('/') : String(restParameter || '')).replace(/^\/+/, '');
  try { requestedPath = requestedPath ? normalizeArchivePath(requestedPath) : site.default_document; }
  catch { throw new SiteApiError('SITE_PREVIEW_PATH_INVALID', 'The preview path is invalid.', 400); }
  const findFile = async (filePath: string) => service.from('site_release_files').select('*').eq('release_id', payload.releaseId).eq('path', filePath).maybeSingle();
  let { data: file } = await findFile(requestedPath);
  if (!file && !path.posix.extname(requestedPath)) ({ data: file } = await findFile(`${requestedPath.replace(/\/$/, '')}/index.html`));
  if (!file && site.spa_fallback && !path.posix.extname(requestedPath)) ({ data: file } = await findFile('index.html'));
  if (!file && site.custom_404_behavior === 'file') ({ data: file } = await findFile('404.html'));
  if (!file) throw new SiteApiError('SITE_PREVIEW_FILE_NOT_FOUND', 'This preview file does not exist.', 404);
  const { data: blob, error } = await service.storage.from('site-preview-assets').download(file.storage_path);
  if (error || !blob) throw new SiteApiError('SITE_PREVIEW_READ_FAILED', 'The preview file could not be read.', 502);
  let buffer = Buffer.from(await blob.arrayBuffer());
  if (file.is_html) {
    const prefix = `/api/sites/${site.id}/preview/${payload.releaseId}/${request.params.token}`;
    buffer = Buffer.from(rewriteHtmlForPreview(buffer.toString('utf8'), prefix));
  }
  response.setHeader('Content-Type', file.content_type);
  response.setHeader('Cache-Control', 'private, no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.status(requestedPath === '404.html' ? 404 : 200).send(buffer);
});

const updateJob = async (service: SupabaseClient, jobId: string, values: Record<string, unknown>) => {
  const { error } = await service.from('site_deployment_jobs').update({ ...values, status: 'running' }).eq('id', jobId);
  if (error) throw new Error(`SITE_JOB_UPDATE_FAILED:${error.message}`);
};

const syncSiteMarketplaceListing = async (context: RequestContext, site: any, release: any) => {
  const now = new Date().toISOString();
  const siteUrl = publicSiteUrl(site, context.config.rootDomain);
  const imageUrl = site.thumbnail_url || site.icon_url || 'https://wersee.com/brand/wersee-social-card.jpg';
  const listingPayload = {
    seller_id: site.owner_id,
    user_id: site.owner_id,
    title: site.name,
    description: site.description || `Discover ${site.name}, published with Wersee Sites.`,
    short_description: site.description || 'A live website published with Wersee Sites.',
    price: '0',
    original_price: 0,
    type: 'website',
    category: 'Websites',
    image_url: imageUrl,
    thumbnail: imageUrl,
    images: [imageUrl],
    card_badge: 'Live website',
    status: 'published',
    marketplace_status: 'approved',
    is_sandbox: false,
    is_indexable: true,
    published_at: now,
    slug: `site-${site.slug}`,
    metadata: {
      marketplace_kind: 'wersee_site',
      site_id: site.id,
      site_url: siteUrl,
      site_release_id: release.id,
      site_release_version: release.version,
    },
  };

  let listingId = site.marketplace_listing_id as string | null;
  if (listingId) {
    const { data, error } = await context.service
      .from('listings')
      .update(listingPayload)
      .eq('id', listingId)
      .eq('seller_id', site.owner_id)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`SITE_MARKETPLACE_UPDATE_FAILED:${error.message}`);
    listingId = data?.id || null;
  }
  if (!listingId) {
    const { data, error } = await context.service.from('listings').insert(listingPayload).select('id').single();
    if (error || !data) throw new Error(`SITE_MARKETPLACE_CREATE_FAILED:${error?.message || 'No listing was returned.'}`);
    listingId = data.id;
  }

  const { error: siteUpdateError } = await context.service.from('sites').update({
    marketplace_listing_id: listingId,
    marketplace_published_at: now,
  }).eq('id', site.id);
  if (siteUpdateError) throw new Error(`SITE_MARKETPLACE_LINK_FAILED:${siteUpdateError.message}`);
  await context.service.from('site_audit_logs').insert({
    site_id: site.id,
    actor_id: context.user.id,
    action: 'marketplace_published',
    metadata: { listing_id: listingId, release_id: release.id },
  });
};

const hideSiteMarketplaceListing = async (context: RequestContext, site: any, release: any) => {
  if (!site.marketplace_listing_id || !site.marketplace_published_at) return;
  const { error } = await context.service.from('listings').update({
    status: 'archived',
    marketplace_status: 'draft',
    is_indexable: false,
    deleted_at: null,
  }).eq('id', site.marketplace_listing_id).eq('seller_id', site.owner_id);
  if (error) throw new Error(`SITE_MARKETPLACE_ARCHIVE_FAILED:${error.message}`);
  const { error: siteUpdateError } = await context.service.from('sites').update({
    marketplace_published_at: null,
  }).eq('id', site.id);
  if (siteUpdateError) throw new Error(`SITE_MARKETPLACE_LINK_FAILED:${siteUpdateError.message}`);
  await context.service.from('site_audit_logs').insert({
    site_id: site.id,
    actor_id: context.user.id,
    action: 'marketplace_unpublished',
    metadata: { listing_id: site.marketplace_listing_id, release_id: release.id },
  });
};

const runPublishJob = async (context: RequestContext, site: any, release: any, job: any, publishToMarketplace: boolean) => {
  const tempDirectory = await createSiteTempDirectory(release.id);
  let aliasAssigned = false;
  const alias = `${site.slug}.${context.config.rootDomain}`;
  let previousDeploymentId: string | null = null;
  try {
    if (site.active_release_id) {
      const { data: previous } = await context.service.from('site_releases').select('vercel_deployment_id').eq('id', site.active_release_id).maybeSingle();
      previousDeploymentId = previous?.vercel_deployment_id || null;
    }
    await updateJob(context.service, job.id, { stage: 'preparing', progress: 5 });
    const { data: fileRows, error: filesError } = await context.service.from('site_release_files').select('*').eq('release_id', release.id).order('path');
    if (filesError || !fileRows?.length) throw new Error('SITE_RELEASE_FILES_MISSING:No prepared release files were found.');
    const preparedFiles = await materializeReleaseFiles(context.service, fileRows as any, path.join(tempDirectory, 'release'));
    await updateJob(context.service, job.id, { stage: 'uploading', progress: 10 });
    const deploymentFiles = await uploadVercelFiles(context.config, preparedFiles, {
      spaFallback: site.spa_fallback,
      defaultDocument: site.default_document,
      custom404Behavior: site.custom_404_behavior,
      strictSecurityMode: site.strict_security_mode,
    }, async (completed, total) => updateJob(context.service, job.id, { stage: 'uploading', progress: 10 + Math.round((completed / total) * 40) }));
    await updateJob(context.service, job.id, { stage: 'creating', progress: 52 });
    const deployment = await createVercelDeployment(context.config, deploymentFiles, { siteId: site.id, releaseId: release.id, version: release.version });
    await updateJob(context.service, job.id, { stage: 'building', progress: 58, vercel_deployment_id: deployment.id });
    await context.service.from('site_releases').update({ status: 'building', vercel_deployment_id: deployment.id, vercel_deployment_url: deployment.url }).eq('id', release.id);
    const ready = await waitForVercelDeployment(context.config, deployment.id, async (state) => {
      await updateJob(context.service, job.id, { stage: state === 'BUILDING' ? 'building' : 'checking', progress: state === 'BUILDING' ? 68 : 78 });
    });
    await updateJob(context.service, job.id, { stage: 'aliasing', progress: 85 });
    await assignVercelAlias(context.config, ready.id, alias);
    aliasAssigned = true;
    const aliasWorks = await verifyVercelAlias(context.config, alias, ready.id);
    if (!aliasWorks) throw new Error('VERCEL_ALIAS_VERIFICATION_FAILED:The new subdomain did not become reachable.');
    await updateJob(context.service, job.id, { stage: 'publishing', progress: 94 });
    if (publishToMarketplace) await syncSiteMarketplaceListing(context, site, release);
    else await hideSiteMarketplaceListing(context, site, release);
    await upsertManagedWerseeDomain(context, {
      siteId: site.id,
      releaseId: release.id,
      hostname: alias,
      deploymentId: ready.id,
    });
    const { error: completeError } = await context.service.rpc('complete_site_publish', {
      target_job_id: job.id,
      deployment_id: ready.id,
      deployment_url: ready.url,
    });
    if (completeError) throw new Error(`SITE_PUBLICATION_STATE_FAILED:${completeError.message}`);
    if (site.indexing_enabled !== false && release.validation_report?.seo?.indexingEnabled) {
      const publicUrl = `https://${alias}`;
      const key = sha256(`${context.config.previewTokenSecret}:indexnow:${site.id}`);
      const urls = (Array.isArray(release.manifest) ? release.manifest : [])
        .map((item: any) => String(item?.path || ''))
        .filter((filePath: string) => /\.html?$/i.test(filePath) && !/(?:^|\/)404\.html?$/i.test(filePath))
        .map((filePath: string) => {
          const publicPath = filePath.toLowerCase() === 'index.html'
            ? '/'
            : filePath.toLowerCase().endsWith('/index.html')
              ? `/${filePath.slice(0, -'index.html'.length)}`
              : `/${filePath}`;
          return new URL(publicPath, `${publicUrl}/`).href;
        })
        .slice(0, 10_000);
      const submittedAt = new Date().toISOString();
      let indexingStatus = 'failed';
      let responseStatus: number | null = null;
      try {
        const indexResponse = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: alias,
            key,
            keyLocation: `${publicUrl}/${key}.txt`,
            urlList: urls.length ? urls : [publicUrl],
          }),
          signal: AbortSignal.timeout(15_000),
        });
        responseStatus = indexResponse.status;
        indexingStatus = [200, 202].includes(indexResponse.status) ? 'submitted' : 'failed';
      } catch {
        indexingStatus = 'failed';
      }
      await context.service.from('site_indexing_submissions').insert({
        site_id: site.id,
        release_id: release.id,
        provider: 'indexnow',
        status: indexingStatus,
        url_count: Math.max(1, urls.length),
        response_status: responseStatus,
        submitted_at: submittedAt,
      });
      await context.service.from('sites').update({
        indexing_status: indexingStatus,
        last_indexing_requested_at: submittedAt,
      }).eq('id', site.id);
      await context.service.from('site_audit_logs').insert({
        site_id: site.id,
        actor_id: context.user.id,
        action: 'indexing_requested',
        metadata: { provider: 'indexnow', status: indexingStatus, url_count: Math.max(1, urls.length), response_status: responseStatus },
      });
    }
  } catch (error) {
    if (aliasAssigned) {
      if (previousDeploymentId) {
        try {
          await assignVercelAlias(context.config, previousDeploymentId, alias);
          await upsertManagedWerseeDomain(context, {
            siteId: site.id,
            releaseId: site.active_release_id || null,
            hostname: alias,
            deploymentId: previousDeploymentId,
          });
        } catch { /* audit support reference preserves recovery context */ }
      } else {
        try {
          await removeVercelAlias(context.config, alias);
          await setManagedDomainStatus(context, alias, 'detached', null);
        } catch { /* audit support reference preserves recovery context */ }
      }
    }
    const raw = String(error instanceof Error ? error.message : error);
    const [code] = raw.split(':');
    await context.service.rpc('fail_site_publish', {
      target_job_id: job.id,
      failure_code: code.replace(/[^A-Z0-9_-]/gi, '_').slice(0, 80) || 'SITE_PUBLISH_FAILED',
      failure_message: raw.slice(0, 500),
    });
  } finally {
    await removeSiteTempDirectory(tempDirectory);
  }
};

const publishSchema = z.object({
  idempotencyKey: z.string().min(12).max(160),
  acceptWarnings: z.boolean().default(false),
  publishToMarketplace: z.boolean().default(false),
});

app.post('/api/sites/:siteId/releases/:releaseId/publish', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-publish', 10, 3600);
  const input = publishSchema.parse(request.body);
  const { data: release } = await context.service.from('site_releases').select('*').eq('id', request.params.releaseId).eq('site_id', site.id).maybeSingle();
  if (!release) throw new SiteApiError('SITE_RELEASE_NOT_FOUND', 'The release was not found.', 404);
  const report = release.validation_report || {};
  if (report.errors?.length || !report.publishable) throw new SiteApiError('SITE_RELEASE_NOT_READY', 'Resolve the critical validation errors before publishing.', 409);
  if (report.warnings?.length && !input.acceptWarnings) throw new SiteApiError('SITE_WARNINGS_NOT_ACCEPTED', 'Review and accept the validation warnings before publishing.', 409, { warningCount: report.warnings.length });
  const { data, error } = await context.userClient.rpc('begin_site_publish', {
    target_site_id: site.id,
    target_release_id: release.id,
    request_key: input.idempotencyKey,
  });
  if (error) {
    const code = String(error.message).includes('IN_PROGRESS') ? 'SITE_PUBLISH_IN_PROGRESS' : String(error.message).includes('NOT_READY') ? 'SITE_RELEASE_NOT_READY' : 'SITE_PUBLISH_START_FAILED';
    throw new SiteApiError(code, code === 'SITE_PUBLISH_IN_PROGRESS' ? 'Another release is already publishing for this site.' : 'The release could not start publishing.', 409);
  }
  const job = Array.isArray(data) ? data[0] : data;
  const work = runPublishJob(context, site, release, job, input.publishToMarketplace);
  try { waitUntil(work); } catch { void work; }
  response.status(202).json({ job });
});

app.get('/api/sites/:siteId/deployments', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const limit = Math.min(Math.max(Number(request.query.limit || 25), 1), 50);
  let query = context.service.from('site_releases').select('*,created_by_profile:profiles!site_releases_created_by_fkey(username,full_name,name)').eq('site_id', site.id).order('version', { ascending: false }).limit(limit);
  if (request.query.beforeVersion) query = query.lt('version', Number(request.query.beforeVersion));
  const { data, error } = await query;
  if (error) {
    const fallback = await context.service.from('site_releases').select('*').eq('site_id', site.id).order('version', { ascending: false }).limit(limit);
    if (fallback.error) throw new SiteApiError('SITE_DEPLOYMENTS_READ_FAILED', 'Deployment history could not be loaded.', 500);
    return response.json({ deployments: fallback.data || [], activeReleaseId: site.active_release_id });
  }
  response.json({ deployments: data || [], activeReleaseId: site.active_release_id });
});

app.post('/api/sites/:siteId/releases/:releaseId/rollback', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-rollback', 10, 3600);
  const { data: target } = await context.service.from('site_releases').select('*').eq('id', request.params.releaseId).eq('site_id', site.id).eq('status', 'published').maybeSingle();
  if (!target?.vercel_deployment_id) throw new SiteApiError('SITE_ROLLBACK_RELEASE_INVALID', 'Only a successful immutable deployment can be restored.', 409);
  const { data: current } = site.active_release_id
    ? await context.service.from('site_releases').select('vercel_deployment_id').eq('id', site.active_release_id).maybeSingle()
    : { data: null } as any;
  const alias = `${site.slug}.${context.config.rootDomain}`;
  await assignVercelAlias(context.config, target.vercel_deployment_id, alias);
  try {
    if (!await verifyVercelAlias(context.config, alias, target.vercel_deployment_id)) throw new Error('alias verification failed');
    await upsertManagedWerseeDomain(context, {
      siteId: site.id,
      releaseId: target.id,
      hostname: alias,
      deploymentId: target.vercel_deployment_id,
    });
    const { error } = await context.service.rpc('complete_site_rollback', { target_site_id: site.id, target_release_id: target.id, actor_id: context.user.id });
    if (error) throw error;
  } catch (error) {
    if (current?.vercel_deployment_id) {
      await assignVercelAlias(context.config, current.vercel_deployment_id, alias);
      await upsertManagedWerseeDomain(context, {
        siteId: site.id,
        releaseId: site.active_release_id,
        hostname: alias,
        deploymentId: current.vercel_deployment_id,
      });
    }
    throw new SiteApiError('SITE_ROLLBACK_FAILED', 'The previous release could not be restored safely.', 502);
  }
  response.json({ activeReleaseId: target.id, publicUrl: `https://${alias}` });
});

app.delete('/api/sites/:siteId/releases/:releaseId', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  if (site.active_release_id === request.params.releaseId) throw new SiteApiError('SITE_RELEASE_ACTIVE', 'The active release cannot be deleted.', 409);
  const { data: release } = await context.service.from('site_releases').select('id,status').eq('id', request.params.releaseId).eq('site_id', site.id).maybeSingle();
  if (!release) throw new SiteApiError('SITE_RELEASE_NOT_FOUND', 'The release was not found.', 404);
  if (release.status === 'published') {
    await context.service.from('site_releases').update({ status: 'archived' }).eq('id', release.id);
    return response.json({ archived: true });
  }
  const { data: files } = await context.service.from('site_release_files').select('storage_path').eq('release_id', release.id);
  const storagePaths = (files || []).map((file: any) => file.storage_path);
  for (let index = 0; index < storagePaths.length; index += 100) await context.service.storage.from('site-preview-assets').remove(storagePaths.slice(index, index + 100));
  await context.service.from('site_releases').delete().eq('id', release.id);
  response.status(204).end();
});

const patchSiteSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  slug: z.string().trim().min(3).max(63).optional(),
  spaFallback: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional(),
  indexingEnabled: z.boolean().optional(),
  aiTextEnhancementEnabled: z.boolean().optional(),
  directoryListed: z.boolean().optional(),
  iconUrl: z.string().url().nullable().optional(),
  defaultDocument: z.string().regex(/^[A-Za-z0-9._/-]+$/).optional(),
  custom404Behavior: z.enum(['file', 'spa', 'default']).optional(),
  strictSecurityMode: z.boolean().optional(),
});

app.patch('/api/sites/:siteId', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const input = patchSiteSchema.parse(request.body);
  let updatedSite = site;
  if (input.slug && normalizeSiteSlug(input.slug) !== site.slug) {
    await checkRateLimit(context, request, 'site-slug-change', 10, 3600);
    const slug = normalizeSiteSlug(input.slug);
    const validation = validateSiteSlug(slug);
    if (!validation.valid) throw new SiteApiError('SITE_SLUG_INVALID', validation.reason || 'The subdomain is invalid.');
    const { error: reserveError } = await context.userClient.rpc('reserve_site_slug', { target_site_id: site.id, requested_slug: slug });
    if (reserveError) throw new SiteApiError('SITE_SLUG_UNAVAILABLE', 'This subdomain is already in use.', 409);
    const newAlias = `${slug}.${context.config.rootDomain}`;
    const oldAlias = `${site.slug}.${context.config.rootDomain}`;
    let newAssigned = false;
    let activeDeploymentId: string | null = null;
    try {
      if (site.active_release_id) {
        const { data: active } = await context.service.from('site_releases').select('vercel_deployment_id,vercel_deployment_url').eq('id', site.active_release_id).maybeSingle();
        if (active?.vercel_deployment_id) {
          activeDeploymentId = active.vercel_deployment_id;
          await assignVercelAlias(context.config, active.vercel_deployment_id, newAlias);
          newAssigned = true;
          if (!await verifyVercelAlias(context.config, newAlias, active.vercel_deployment_id)) throw new Error('new alias verification failed');
          await upsertManagedWerseeDomain(context, {
            siteId: site.id,
            releaseId: site.active_release_id,
            hostname: newAlias,
            deploymentId: active.vercel_deployment_id,
            status: 'pending',
          });
        }
      }
      const { data, error } = await context.userClient.rpc('commit_site_slug', { target_site_id: site.id, reserved_slug: slug });
      if (error) throw error;
      updatedSite = Array.isArray(data) ? data[0] : data;
    } catch {
      await context.userClient.rpc('release_pending_site_slug', { target_site_id: site.id, reserved_slug: slug });
      if (newAssigned && site.active_release_id) {
        if (activeDeploymentId) await assignVercelAlias(context.config, activeDeploymentId, oldAlias);
        await removeVercelAlias(context.config, newAlias);
        try { await setManagedDomainStatus(context, newAlias, 'detached', null); } catch { /* pending rows are never directory-visible */ }
      }
      throw new SiteApiError('SITE_SLUG_CHANGE_FAILED', 'The new subdomain could not be connected safely. The old address remains active.', 502);
    }
    if (newAssigned && activeDeploymentId) {
      try {
        await removeVercelAlias(context.config, oldAlias);
        await setManagedDomainStatus(context, oldAlias, 'detached', null);
        await upsertManagedWerseeDomain(context, {
          siteId: site.id,
          releaseId: site.active_release_id,
          hostname: newAlias,
          deploymentId: activeDeploymentId,
        });
      } catch {
        await context.service.from('site_audit_logs').insert({
          site_id: site.id,
          actor_id: context.user.id,
          action: 'domain_cleanup_required',
          metadata: { old_hostname: oldAlias, new_hostname: newAlias },
        });
      }
    }
  }
  const update: Record<string, unknown> = { updated_by: context.user.id };
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description || null;
  if (input.spaFallback !== undefined) update.spa_fallback = input.spaFallback;
  if (input.analyticsEnabled !== undefined) update.analytics_enabled = input.analyticsEnabled;
  if (input.indexingEnabled !== undefined) update.indexing_enabled = input.indexingEnabled;
  if (input.aiTextEnhancementEnabled !== undefined) update.ai_text_enhancement_enabled = input.aiTextEnhancementEnabled;
  if (input.directoryListed !== undefined) update.directory_listed = input.directoryListed;
  if (input.iconUrl !== undefined) update.icon_url = input.iconUrl;
  if (input.defaultDocument !== undefined) update.default_document = input.defaultDocument;
  if (input.custom404Behavior !== undefined) update.custom_404_behavior = input.custom404Behavior;
  if (input.strictSecurityMode !== undefined) update.strict_security_mode = input.strictSecurityMode;
  if (Object.keys(update).length > 1) {
    const { data, error } = await context.userClient.from('sites').update(update).eq('id', site.id).select('*').single();
    if (error) throw new SiteApiError('SITE_UPDATE_FAILED', 'The site settings could not be saved.', 400);
    updatedSite = data;
    await context.service.from('site_audit_logs').insert({
      site_id: site.id,
      actor_id: context.user.id,
      action: input.analyticsEnabled !== undefined ? 'analytics_setting_changed' : 'settings_changed',
      metadata: { fields: Object.keys(input) },
    });
  }
  response.json({ site: { ...updatedSite, public_url: publicSiteUrl(updatedSite, context.config.rootDomain) } });
});

app.delete('/api/sites/:siteId', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  await checkRateLimit(context, request, 'site-delete', 5, 3600);
  if ((await context.service.from('site_deployment_jobs').select('id').eq('site_id', site.id).in('status', ['created', 'running'])).data?.length) {
    throw new SiteApiError('SITE_PUBLISH_IN_PROGRESS', 'Wait for the current publication to finish before deleting this site.', 409);
  }
  if (site.active_release_id) {
    const alias = `${site.slug}.${context.config.rootDomain}`;
    try {
      await setManagedDomainStatus(context, alias, 'detaching');
      await removeVercelAlias(context.config, alias);
      await setManagedDomainStatus(context, alias, 'detached', null);
    } catch {
      try { await setManagedDomainStatus(context, alias, 'active'); } catch { /* fail closed directory query also checks release identity */ }
      throw new SiteApiError('SITE_ALIAS_REMOVE_FAILED', 'The public domain could not be disconnected, so the site was not deleted.', 502);
    }
  }
  await context.service.from('site_audit_logs').insert({ site_id: site.id, actor_id: context.user.id, action: 'site_deleted', metadata: { slug: site.slug } });
  if (site.marketplace_listing_id) {
    const { error: listingArchiveError } = await context.service.from('listings').update({
      status: 'archived',
      marketplace_status: 'draft',
      deleted_at: new Date().toISOString(),
      is_indexable: false,
    }).eq('id', site.marketplace_listing_id).eq('seller_id', site.owner_id);
    if (listingArchiveError) throw new SiteApiError('SITE_MARKETPLACE_ARCHIVE_FAILED', 'The marketplace showcase could not be archived, so the site was not deleted.', 502);
  }
  const { error } = await context.userClient.from('sites').update({ status: 'archived', deleted_at: new Date().toISOString(), updated_by: context.user.id }).eq('id', site.id);
  if (error) throw new SiteApiError('SITE_DELETE_FAILED', 'The site could not be deleted.', 500);
  await context.service.from('site_slug_claims').delete().eq('site_id', site.id);
  response.status(204).end();
});

app.get('/api/sites/:siteId', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const [releases, jobs, audit] = await Promise.all([
    context.service.from('site_releases').select('*').eq('site_id', site.id).order('version', { ascending: false }).limit(25),
    context.service.from('site_deployment_jobs').select('*').eq('site_id', site.id).order('started_at', { ascending: false }).limit(10),
    context.service.from('site_audit_logs').select('*').eq('site_id', site.id).order('occurred_at', { ascending: false }).limit(25),
  ]);
  response.json({ site: { ...site, public_url: publicSiteUrl(site, context.config.rootDomain) }, releases: releases.data || [], jobs: jobs.data || [], audit: audit.data || [] });
});

const analyticsRowsForRange = async (service: SupabaseClient, siteId: string, from: string, to: string) => {
  const { data, error } = await service.from('site_analytics_daily').select('*').eq('site_id', siteId).gte('event_date', from).lte('event_date', to).order('event_date');
  if (error) throw new SiteApiError('SITE_ANALYTICS_UNAVAILABLE', 'Analytics is temporarily unavailable.', 503);
  return data || [];
};

const summarizeAnalytics = (rows: any[]) => {
  const totals = rows.reduce((result, row) => ({
    pageViews: result.pageViews + Number(row.page_views || 0),
    sessions: result.sessions + Number(row.sessions || 0),
    uniqueVisitors: result.uniqueVisitors + Number(row.consented_visitors || 0),
    engagedSeconds: result.engagedSeconds + Number(row.engaged_seconds || 0),
    totalClicks: result.totalClicks + Number(row.clicks || 0),
    bounces: result.bounces + Number(row.bounces || 0),
    conversions: result.conversions + Number(row.conversions || 0),
    formSubmissions: result.formSubmissions + Number(row.form_submissions || 0),
    errors: result.errors + Number(row.errors || 0),
  }), { pageViews: 0, sessions: 0, uniqueVisitors: 0, engagedSeconds: 0, totalClicks: 0, bounces: 0, conversions: 0, formSubmissions: 0, errors: 0 });
  return {
    ...totals,
    averageEngagedSeconds: totals.sessions ? Math.round(totals.engagedSeconds / totals.sessions) : 0,
    bounceRate: totals.sessions ? Number(((totals.bounces / totals.sessions) * 100).toFixed(1)) : 0,
    sessionsPerVisitor: totals.uniqueVisitors ? Number((totals.sessions / totals.uniqueVisitors).toFixed(2)) : null,
  };
};

const requireAnalyticsRange = (request: Request) => parseAnalyticsRange(request.query.from, request.query.to);

app.get('/api/sites/:siteId/analytics/summary', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const range = requireAnalyticsRange(request);
  const days = Math.floor((Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000) + 1;
  const previousTo = new Date(Date.parse(`${range.from}T00:00:00Z`) - 86400000);
  const previousFrom = new Date(previousTo.getTime() - (days - 1) * 86400000);
  const [currentRows, previousRows, realtimeRows, recentRows, currentVisitors, previousVisitors, vitalRows] = await Promise.all([
    analyticsRowsForRange(context.service, site.id, range.from, range.to),
    analyticsRowsForRange(context.service, site.id, previousFrom.toISOString().slice(0, 10), previousTo.toISOString().slice(0, 10)),
    context.service.from('site_analytics_events').select('session_id_hash').eq('site_id', site.id).gte('received_at', new Date(Date.now() - 5 * 60000).toISOString()).limit(1000),
    context.service.from('site_analytics_events').select('event_type,path,element_label,event_name,metric_name,metric_value,country_code,device_type,received_at').eq('site_id', site.id).order('received_at', { ascending: false }).limit(20),
    context.service.rpc('count_site_unique_visitors', { target_site_id: site.id, from_date: range.from, to_date: range.to }),
    context.service.rpc('count_site_unique_visitors', { target_site_id: site.id, from_date: previousFrom.toISOString().slice(0, 10), to_date: previousTo.toISOString().slice(0, 10) }),
    context.service.from('site_analytics_metrics_daily').select('metric_name,sample_count,metric_total,metric_min,metric_max').eq('site_id', site.id).gte('event_date', range.from).lte('event_date', range.to),
  ]);
  const releaseIds = [...new Set(currentRows.map((row: any) => row.release_id).filter(Boolean))];
  const releaseResult = releaseIds.length
    ? await context.service.from('site_releases').select('id,version,status,published_at').in('id', releaseIds)
    : { data: [] as any[] };
  const releaseMap = new Map((releaseResult.data || []).map((release: any) => [release.id, release]));
  const current = summarizeAnalytics(currentRows);
  const previous = summarizeAnalytics(previousRows);
  current.uniqueVisitors = Number(currentVisitors.data || 0);
  current.sessionsPerVisitor = current.uniqueVisitors ? Number((current.sessions / current.uniqueVisitors).toFixed(2)) : null;
  previous.uniqueVisitors = Number(previousVisitors.data || 0);
  previous.sessionsPerVisitor = previous.uniqueVisitors ? Number((previous.sessions / previous.uniqueVisitors).toFixed(2)) : null;
  const vitalMap = new Map<string, { metricName: string; samples: number; total: number; minimum: number | null; maximum: number | null }>();
  for (const row of vitalRows.data || []) {
    const currentVital = vitalMap.get(row.metric_name) || { metricName: row.metric_name, samples: 0, total: 0, minimum: null, maximum: null };
    currentVital.samples += Number(row.sample_count || 0);
    currentVital.total += Number(row.metric_total || 0);
    const minimum = row.metric_min == null ? null : Number(row.metric_min);
    const maximum = row.metric_max == null ? null : Number(row.metric_max);
    currentVital.minimum = minimum == null ? currentVital.minimum : currentVital.minimum == null ? minimum : Math.min(currentVital.minimum, minimum);
    currentVital.maximum = maximum == null ? currentVital.maximum : currentVital.maximum == null ? maximum : Math.max(currentVital.maximum, maximum);
    vitalMap.set(row.metric_name, currentVital);
  }
  response.json({
    current,
    previous,
    realtimeVisitors: new Set((realtimeRows.data || []).map((row: any) => row.session_id_hash)).size,
    recentActivity: recentRows.data || [],
    webVitals: [...vitalMap.values()].map((item) => ({ ...item, average: item.samples ? Number((item.total / item.samples).toFixed(item.metricName === 'CLS' ? 3 : 1)) : null })),
    releasePerformance: releaseIds.map((releaseId) => ({ ...releaseMap.get(releaseId), ...summarizeAnalytics(currentRows.filter((row: any) => row.release_id === releaseId)) })),
  });
});

app.get('/api/sites/:siteId/analytics/timeseries', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const range = requireAnalyticsRange(request);
  const rows = await analyticsRowsForRange(context.service, site.id, range.from, range.to);
  const byDate = new Map<string, any>();
  for (const row of rows) {
    const item = byDate.get(row.event_date) || { date: row.event_date, pageViews: 0, sessions: 0, clicks: 0, engagedSeconds: 0 };
    item.pageViews += Number(row.page_views || 0); item.sessions += Number(row.sessions || 0); item.clicks += Number(row.clicks || 0); item.engagedSeconds += Number(row.engaged_seconds || 0);
    byDate.set(row.event_date, item);
  }
  response.json({ points: [...byDate.values()] });
});

app.get('/api/sites/:siteId/analytics/pages', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const range = requireAnalyticsRange(request);
  const { data, error } = await context.service.from('site_analytics_top_pages_daily').select('*').eq('site_id', site.id).gte('event_date', range.from).lte('event_date', range.to).limit(5000);
  if (error) throw new SiteApiError('SITE_ANALYTICS_UNAVAILABLE', 'Page analytics is temporarily unavailable.', 503);
  const pages = new Map<string, any>();
  for (const row of data || []) {
    const item = pages.get(row.path) || { path: row.path, pageViews: 0, entries: 0, exits: 0, engagedSeconds: 0 };
    item.pageViews += Number(row.page_views || 0); item.entries += Number(row.entries || 0); item.exits += Number(row.exits || 0); item.engagedSeconds += Number(row.engaged_seconds || 0);
    pages.set(row.path, item);
  }
  response.json({ pages: [...pages.values()].sort((a, b) => b.pageViews - a.pageViews).slice(0, 100) });
});

app.get('/api/sites/:siteId/analytics/referrers', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const range = requireAnalyticsRange(request);
  const dimension = z.enum(['referrer', 'country', 'device', 'browser', 'os', 'utm_campaign', 'outbound', 'download', 'goal', 'form', 'scroll_depth', 'error']).parse(request.query.dimension || 'referrer');
  const { data, error } = await context.service.from('site_analytics_dimensions_daily').select('value,event_count').eq('site_id', site.id).eq('dimension', dimension).gte('event_date', range.from).lte('event_date', range.to).limit(5000);
  if (error) throw new SiteApiError('SITE_ANALYTICS_UNAVAILABLE', 'Analytics dimensions are temporarily unavailable.', 503);
  const values = new Map<string, number>();
  for (const row of data || []) values.set(row.value, (values.get(row.value) || 0) + Number(row.event_count || 0));
  response.json({ dimension, values: [...values.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 100) });
});

app.get('/api/sites/:siteId/analytics/export', async (request, response) => {
  const context = await requireContext(request);
  const site = await requireSite(context, request.params.siteId);
  const range = requireAnalyticsRange(request);
  const rows = await analyticsRowsForRange(context.service, site.id, range.from, range.to);
  const byDate = new Map<string, ReturnType<typeof summarizeAnalytics>>();
  for (const date of [...new Set(rows.map((row: any) => row.event_date))]) byDate.set(date, summarizeAnalytics(rows.filter((row: any) => row.event_date === date)));
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [['date','page_views','sessions','consented_visitors','average_engaged_seconds','bounce_rate','clicks','conversions','form_submissions','errors'].join(',')];
  for (const [date, values] of byDate) lines.push([date,values.pageViews,values.sessions,values.uniqueVisitors,values.averageEngagedSeconds,values.bounceRate,values.totalClicks,values.conversions,values.formSubmissions,values.errors].map(escape).join(','));
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${site.slug}-analytics-${range.from}-${range.to}.csv"`);
  response.send(lines.join('\n'));
});

app.options('/api/site-events', (request, response) => {
  const origin = String(request.headers.origin || '');
  const rootDomain = process.env.WERSEE_ROOT_DOMAIN || 'wersee.com';
  if (new RegExp(`^https:\\/\\/(?:[a-z0-9-]{3,63}\\.)?${rootDomain.replaceAll('.', '\\.')}$`, 'i').test(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Max-Age', '600');
  response.status(204).end();
});

app.post('/api/site-events', async (request, response) => {
  const status = getSiteConfigurationStatus();
  if (!status.configured) throw new SiteApiError('SITE_ANALYTICS_UNAVAILABLE', 'Analytics is temporarily unavailable.', 503);
  const config = getSiteRuntimeConfig();
  const { service } = buildClients(config);
  const rateContext = { service, config };
  await checkRateLimit(rateContext, request, 'site-analytics-ingest', 240, 60);
  let input: any;
  try { input = typeof request.body === 'string' ? JSON.parse(request.body) : request.body; }
  catch { throw new SiteApiError('SITE_EVENT_INVALID', 'The analytics event is invalid.', 400); }
  if (!input?.siteId && input?.businessId) {
    const businessId = z.string().uuid().parse(input.businessId);
    const { data: builderSite } = await service.from('sites').select('id').eq('business_id', businessId).eq('site_type', 'wersee_builder').eq('status', 'published').is('deleted_at', null).maybeSingle();
    if (!builderSite) throw new SiteApiError('SITE_EVENT_REJECTED', 'No published Wersee site matches this event.', 403);
    input = { ...input, siteId: builderSite.id };
  }
  const normalized = normalizeAnalyticsEvent(input, {
    hashSalt: config.analyticsHashSalt,
    userAgent: String(request.headers['user-agent'] || ''),
    countryCode: String(request.headers['x-vercel-ip-country'] || '').toUpperCase(),
  });
  const { data: site } = await service.from('sites').select('id,slug,site_type,active_release_id,analytics_enabled,status,deleted_at').eq('id', normalized.site_id).maybeSingle();
  if (!site || site.deleted_at || site.status !== 'published' || !site.analytics_enabled) throw new SiteApiError('SITE_EVENT_REJECTED', 'The analytics event does not match a published site.', 403);
  const origin = String(request.headers.origin || request.headers.referer || '');
  let allowedOrigin = false;
  if (site.site_type === 'uploaded_static') {
    allowedOrigin = site.active_release_id === normalized.release_id && isAllowedSiteOrigin(origin, site.slug, config.rootDomain);
  } else {
    try {
      const url = new URL(origin);
      allowedOrigin = !normalized.release_id && url.protocol === 'https:' && [config.rootDomain, `www.${config.rootDomain}`].includes(url.hostname.toLowerCase());
    } catch { allowedOrigin = false; }
  }
  if (!allowedOrigin) throw new SiteApiError('SITE_EVENT_ORIGIN_INVALID', 'The analytics event origin is invalid.', 403);
  const { error } = await service.rpc('ingest_site_analytics_event', { event_payload: normalized });
  if (error) throw new SiteApiError('SITE_ANALYTICS_UNAVAILABLE', 'Analytics is temporarily unavailable.', 503);
  response.setHeader('Access-Control-Allow-Origin', new URL(origin).origin);
  response.setHeader('Vary', 'Origin');
  response.status(202).end();
});

app.get('/api/sites/maintenance/cleanup', async (request, response) => {
  const expected = process.env.CRON_SECRET;
  if (!expected || getBearerToken(request) !== expected) throw new SiteApiError('AUTH_REQUIRED', 'Maintenance authorization is required.', 401);
  const config = getSiteRuntimeConfig();
  const { service } = buildClients(config);
  const { data: uploads, error } = await service.from('site_uploads').select('id,storage_prefix,release_id').lt('expires_at', new Date().toISOString()).in('status', ['created', 'uploading', 'uploaded', 'failed']).is('release_id', null).limit(200);
  if (error) throw new SiteApiError('SITE_CLEANUP_FAILED', 'Staging cleanup could not run.', 500);
  let deletedObjects = 0;
  for (const upload of uploads || []) {
    deletedObjects += await removeStoragePrefix(service, 'site-upload-staging', upload.storage_prefix);
    await service.from('site_uploads').update({ status: 'expired' }).eq('id', upload.id);
  }
  await service.from('site_slug_claims').delete().eq('state', 'pending').lt('expires_at', new Date().toISOString());
  response.json({ expiredUploads: uploads?.length || 0, deletedObjects });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (response.headersSent) return;
  if (error instanceof ZodError) {
    return response.status(400).json({ error: { code: 'REQUEST_INVALID', message: 'Check the submitted fields and try again.', details: { fields: error.issues.map((issue) => issue.path.join('.')).filter(Boolean) } } });
  }
  if (error instanceof SiteApiError) return response.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
  const supportReference = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  console.error(`[Wersee Sites ${supportReference}]`, error instanceof Error ? error.message : 'Unknown server error');
  return response.status(500).json({ error: { code: 'SITE_INTERNAL_ERROR', message: 'Wersee Sites encountered an unexpected error.', details: { supportReference } } });
});

export default app;
