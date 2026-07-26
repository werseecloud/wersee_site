import { z } from 'zod';
import type { SiteRuntimeConfig } from './types.js';

const positiveInteger = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);
const optionalUrl = z.preprocess(
  (value) => typeof value === 'string' && !value.trim() ? undefined : value,
  z.string().url().optional(),
);
const optionalKey = z.preprocess(
  (value) => typeof value === 'string' && !value.trim() ? undefined : value,
  z.string().min(1).optional(),
);
const bearerToken = z.string()
  .trim()
  .min(10)
  .max(512)
  .regex(
    /^[A-Za-z0-9._~+/=-]+$/,
    'Must be a single Vercel access token without whitespace or a Bearer prefix.',
  );

const schema = z.object({
  SUPABASE_URL: optionalUrl,
  VITE_SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: optionalKey,
  VITE_SUPABASE_PUBLISHABLE_KEY: optionalKey,
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  VERCEL_TOKEN: bearerToken,
  VERCEL_TEAM_ID: z.string().min(1),
  VERCEL_TEAM_SLUG: z.string().min(1).optional(),
  VERCEL_SITES_PROJECT_ID: z.string().min(1),
  VERCEL_SITES_PROJECT_SLUG: z.string().min(1).default('wersee-sites'),
  WERSEE_ROOT_DOMAIN: z.string().min(3).default('wersee.com'),
  SITE_PREVIEW_TOKEN_SECRET: z.string().min(32),
  SITE_ANALYTICS_HASH_SALT: z.string().min(32),
  WERSEE_ANALYTICS_SCRIPT_URL: z.string().url().optional(),
  SITE_MAX_ARCHIVE_BYTES: positiveInteger(100 * 1024 * 1024),
  SITE_MAX_UNPACKED_BYTES: positiveInteger(500 * 1024 * 1024),
  SITE_MAX_FILE_COUNT: positiveInteger(10_000),
  SITE_MAX_SINGLE_FILE_BYTES: positiveInteger(50 * 1024 * 1024),
  SITE_STAGING_RETENTION_HOURS: positiveInteger(48),
  SITE_DEPLOYMENT_TIMEOUT_MS: positiveInteger(8 * 60 * 1000),
});

let cachedConfig: SiteRuntimeConfig | null = null;

export const getSiteConfigurationStatus = () => {
  const raw = schema.safeParse(process.env);
  if (raw.success) {
    const missing: string[] = [];
    if (!raw.data.SUPABASE_URL && !raw.data.VITE_SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!raw.data.SUPABASE_PUBLISHABLE_KEY && !raw.data.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push('SUPABASE_PUBLISHABLE_KEY');
    return { configured: missing.length === 0, missing };
  }
  const missing = [...new Set(raw.error.issues.map((issue) => String(issue.path[0] || 'unknown')))].sort();
  return { configured: false, missing };
};

export const getSiteRuntimeConfig = (): SiteRuntimeConfig => {
  if (cachedConfig) return cachedConfig;
  const parsed = schema.parse(process.env);
  const supabaseUrl = parsed.SUPABASE_URL || parsed.VITE_SUPABASE_URL;
  const supabasePublishableKey = parsed.SUPABASE_PUBLISHABLE_KEY || parsed.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY server configuration.');
  }
  cachedConfig = {
    supabaseUrl,
    supabasePublishableKey,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    vercelToken: parsed.VERCEL_TOKEN,
    vercelTeamId: parsed.VERCEL_TEAM_ID,
    vercelTeamSlug: parsed.VERCEL_TEAM_SLUG,
    vercelSitesProjectId: parsed.VERCEL_SITES_PROJECT_ID,
    vercelSitesProjectSlug: parsed.VERCEL_SITES_PROJECT_SLUG,
    rootDomain: parsed.WERSEE_ROOT_DOMAIN.toLowerCase(),
    previewTokenSecret: parsed.SITE_PREVIEW_TOKEN_SECRET,
    analyticsHashSalt: parsed.SITE_ANALYTICS_HASH_SALT,
    analyticsScriptUrl: parsed.WERSEE_ANALYTICS_SCRIPT_URL || `https://${parsed.WERSEE_ROOT_DOMAIN}/sites/analytics.js`,
    maxArchiveBytes: parsed.SITE_MAX_ARCHIVE_BYTES,
    maxUnpackedBytes: parsed.SITE_MAX_UNPACKED_BYTES,
    maxFileCount: parsed.SITE_MAX_FILE_COUNT,
    maxSingleFileBytes: parsed.SITE_MAX_SINGLE_FILE_BYTES,
    stagingRetentionHours: parsed.SITE_STAGING_RETENTION_HOURS,
    deploymentTimeoutMs: parsed.SITE_DEPLOYMENT_TIMEOUT_MS,
  };
  return cachedConfig;
};

export const resetSiteRuntimeConfigForTests = () => {
  cachedConfig = null;
};
