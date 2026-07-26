import express, { type NextFunction, type Request, type Response } from 'express';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  createDownloadGrant,
  isSha256,
  normalizeLogicalPath,
  signGatewayCapability,
  verifyDownloadGrant,
} from './security.js';
import { parseGatewayInit } from '../../services/werseeStorage/contracts.js';

type Provider = 'strato' | 'supabase';
type Visibility = 'public' | 'private';

class StorageAppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

const PRIVATE_BUCKETS = new Set([
  'business_storage',
  'chat-attachments',
  'contracts',
  'digital-products',
  'investment-private-documents',
  'investment-public-documents',
  'investment-review-documents',
  'launch-ai-media',
  'mail-bridge-outbound-attachments',
  'order-evidence',
  'order-pdfs',
  'public-dm-attachments',
  'site-ai-computer',
  'site-preview-assets',
  'site-upload-staging',
  'trust-evidence',
  'trust-exports',
  'wersee-files',
  'wersee-invest-private-documents',
  'wersee-invest-public-documents',
]);

const required = (name: string, fallbackName?: string) => {
  const value = process.env[name]?.trim() || (fallbackName ? process.env[fallbackName]?.trim() : '');
  if (!value) throw new StorageAppError('STORAGE_CONFIGURATION_MISSING', `Missing storage server configuration: ${name}`, 503);
  return value;
};

const configuration = () => ({
  supabaseUrl: required('SUPABASE_URL', 'VITE_SUPABASE_URL').replace(/\/$/, ''),
  publishableKey: required('SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  gatewayUrl: (process.env.WERSEE_STORAGE_GATEWAY_URL?.trim() || 'https://api.wersee.com').replace(/\/$/, ''),
  capabilitySecret: required('WERSEE_STORAGE_CAPABILITY_SECRET'),
  downloadSecret: required('WERSEE_STORAGE_SIGNING_SECRET'),
});

type Context = {
  user: User;
  service: SupabaseClient;
  userClient: SupabaseClient;
  config: ReturnType<typeof configuration>;
};

const bearer = (request: Request) => {
  const value = request.header('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
};

const contextFor = async (request: Request): Promise<Context> => {
  const config = configuration();
  const token = bearer(request);
  if (!token) throw new StorageAppError('AUTH_REQUIRED', 'Sign in to use Wersee storage.', 401);
  const service = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userClient = createClient(config.supabaseUrl, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) throw new StorageAppError('AUTH_INVALID', 'Your session is invalid or expired.', 401);
  return { user: data.user, service, userClient, config };
};

const gatewayRequest = async <T>(
  context: Context,
  path: string,
  method: string,
  purpose: 'upload' | 'download' | 'delete' | 'metadata',
  capabilityClaims: Record<string, unknown>,
  init: RequestInit = {},
): Promise<T> => {
  const capability = signGatewayCapability({
    purpose,
    method,
    path,
    ...capabilityClaims,
  } as any, context.config.capabilitySecret);
  const response = await fetch(`${context.config.gatewayUrl}${path}`, {
    ...init,
    method,
    headers: {
      ...(init.headers || {}),
      'X-Wersee-Storage-Capability': capability,
    },
    signal: init.signal || AbortSignal.timeout(240_000),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as any;
    throw new StorageAppError(
      payload?.error?.code || `GATEWAY_HTTP_${response.status}`,
      'The storage gateway could not complete this request.',
      response.status,
      payload?.error?.requestId ? { requestId: payload.error.requestId } : undefined,
    );
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};

const ensureWorkspace = async (context: Context, workspaceId: string | null) => {
  if (!workspaceId) return;
  const [owned, member, teamMember] = await Promise.all([
    context.service.from('businesses').select('id').eq('id', workspaceId).eq('user_id', context.user.id).maybeSingle(),
    context.service.from('business_members').select('id').eq('business_id', workspaceId).eq('user_id', context.user.id).limit(1).maybeSingle(),
    context.service.from('team_members').select('id').eq('business_id', workspaceId).eq('user_id', context.user.id).eq('status', 'active').limit(1).maybeSingle(),
  ]);
  if (!owned.data && !member.data && !teamMember.data) {
    throw new StorageAppError('WORKSPACE_FORBIDDEN', 'You do not have access to this workspace.', 403);
  }
};

const bucketPolicy = async (context: Context, bucketId: string) => {
  const { data, error } = await context.service.from('storage_gateway_buckets')
    .select('id,public,file_size_limit,allowed_mime_types,enabled,write_provider,read_mode,fallback_to_supabase')
    .eq('id', bucketId)
    .maybeSingle();
  if (error) throw new StorageAppError('BUCKET_POLICY_UNAVAILABLE', 'The bucket policy is unavailable.', 503);
  if (!data?.enabled) throw new StorageAppError('BUCKET_DISABLED', 'This storage bucket is unavailable.', 403);
  return data as {
    id: string;
    public: boolean;
    file_size_limit: number | null;
    allowed_mime_types: string[] | null;
    enabled: boolean;
    write_provider: Provider;
    read_mode: 'hybrid' | 'strato-only' | 'supabase-only';
    fallback_to_supabase: boolean;
  };
};

const validateUploadPolicy = (
  policy: Awaited<ReturnType<typeof bucketPolicy>>,
  size: number,
  mimeType: string,
) => {
  if (!Number.isSafeInteger(size) || size <= 0) throw new StorageAppError('INVALID_FILE_SIZE', 'The file size is invalid.');
  if (policy.file_size_limit !== null && size > policy.file_size_limit) {
    throw new StorageAppError('FILE_TOO_LARGE', 'The file exceeds this bucket limit.', 413, { limit: policy.file_size_limit });
  }
  if (policy.allowed_mime_types?.length && !policy.allowed_mime_types.includes(mimeType)) {
    throw new StorageAppError('MIME_TYPE_NOT_ALLOWED', 'This file type is not allowed in this bucket.', 415);
  }
};

const safeUploadStoragePath = (ownerId: string, uploadId: string, logicalPath: string) => {
  const filename = logicalPath.split('/').pop() || 'file';
  return `${ownerId}/.wersee/${uploadId}/${filename}`;
};

const signedSupabaseUpload = async (
  context: Context,
  bucketId: string,
  storagePath: string,
) => {
  const { data, error } = await context.service.storage.from(bucketId)
    .createSignedUploadUrl(storagePath, { upsert: true });
  if (error || !data?.token) {
    throw new StorageAppError('SUPABASE_BACKUP_INIT_FAILED', 'The Supabase backup could not be prepared.', 503);
  }
  return data.token;
};

const mapObject = (row: any, gatewayUrl: string) => ({
  objectId: row.id,
  provider: row.provider as Provider,
  bucketId: row.bucket_id,
  logicalPath: row.logical_path,
  fileId: row.storage_file_id || null,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes),
  sha256: row.checksum_sha256 || null,
  visibility: row.visibility as Visibility,
  status: row.status,
  url: row.provider === 'strato' && row.visibility === 'public' && row.storage_file_id
    ? `${gatewayUrl}/cdn/${row.storage_file_id}`
    : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const app = express();
app.disable('x-powered-by');

app.use((request, _response, next) => {
  const parsed = new URL(request.url, 'https://wersee.local');
  const rewritten = parsed.searchParams.get('__storage_path');
  if (rewritten) {
    parsed.searchParams.delete('__storage_path');
    request.url = `/api/storage/${rewritten.replace(/^\/+/, '')}${parsed.searchParams.size ? `?${parsed.searchParams}` : ''}`;
  }
  next();
});

app.use('/api/storage/uploads/:uploadId/chunks', express.raw({
  type: 'application/octet-stream',
  limit: '3mb',
}));
app.use('/api/storage', express.json({ limit: '128kb' }));

app.get('/api/storage/configuration', async (_request, response) => {
  try {
    configuration();
    response.json({ configured: true });
  } catch (error) {
    const storageError = error as StorageAppError;
    response.status(storageError.status || 503).json({ configured: false });
  }
});

app.post('/api/storage/uploads/init', async (request, response) => {
  const context = await contextFor(request);
  const bucketId = String(request.body?.bucketId || '');
  const logicalPath = normalizeLogicalPath(request.body?.logicalPath);
  const originalFilename = String(request.body?.originalFilename || logicalPath.split('/').pop() || 'file').slice(0, 255);
  const mimeType = String(request.body?.mimeType || 'application/octet-stream').slice(0, 255);
  const originalSize = Number(request.body?.originalSize);
  const expectedSha256 = request.body?.sha256;
  const workspaceId = request.body?.workspaceId ? String(request.body.workspaceId) : null;
  if (!isSha256(expectedSha256)) throw new StorageAppError('EXPECTED_CHECKSUM_REQUIRED', 'A lowercase SHA-256 checksum is required.');
  await ensureWorkspace(context, workspaceId);
  const policy = await bucketPolicy(context, bucketId);
  validateUploadPolicy(policy, originalSize, mimeType);

  const visibility: Visibility = policy.public && !PRIVATE_BUCKETS.has(bucketId) ? 'public' : 'private';
  const provider: Provider = policy.read_mode === 'supabase-only' ? 'supabase' : policy.write_provider;
  const partCount = Math.max(1, Math.ceil(originalSize / (3 * 1024 * 1024)));
  const { data: upload, error } = await context.service.from('storage_gateway_uploads').insert({
    owner_id: context.user.id,
    workspace_id: workspaceId,
    bucket_id: bucketId,
    logical_path: logicalPath,
    visibility,
    mime_type: mimeType,
    size_bytes: originalSize,
    expected_checksum_sha256: expectedSha256,
    chunk_size: 3 * 1024 * 1024,
    part_count: partCount,
    provider,
    status: 'initiated',
  }).select('id,expires_at').single();
  if (error || !upload) throw new StorageAppError('UPLOAD_RECORD_FAILED', 'The upload could not be recorded.', 503);

  if (provider === 'supabase') {
    const storagePath = safeUploadStoragePath(context.user.id, upload.id, logicalPath);
    const token = await signedSupabaseUpload(context, bucketId, storagePath);
    const update = await context.service.from('storage_gateway_uploads')
      .update({ supabase_storage_path: storagePath })
      .eq('id', upload.id);
    if (update.error) throw new StorageAppError('UPLOAD_RECORD_FAILED', 'The Supabase backup could not be recorded.', 503);
    response.status(201).json({
      uploadId: upload.id,
      provider,
      storagePath,
      signedUploadToken: token,
      expiresAt: upload.expires_at,
      bucketPolicy: policy,
    });
    return;
  }

  const gatewayPath = '/api/storage/uploads/init';
  const init = parseGatewayInit(await gatewayRequest<unknown>(context, gatewayPath, 'POST', 'upload', {
    user_id: context.user.id,
    workspace_id: workspaceId,
    bucket_id: bucketId,
    logical_path: logicalPath,
    original_size: originalSize,
    expected_sha256: expectedSha256,
    visibility,
  }, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalFilename, mimeType, originalSize, sha256: expectedSha256 }),
  }));

  if ('fileId' in init) {
    const { data: finalized, error: finalizeError } = await context.service.rpc('finalize_storage_gateway_object', {
      p_upload_id: upload.id,
      p_owner_id: context.user.id,
      p_storage_file_id: init.fileId,
      p_supabase_storage_path: null,
    });
    if (finalizeError || !finalized?.ok) throw new StorageAppError(finalized?.code || 'BINDING_FINALIZE_FAILED', 'The file binding could not be finalized.', 409);
    response.status(201).json({ uploadId: upload.id, provider, deduplicated: true, objectId: finalized.object_id, fileId: init.fileId });
    return;
  }

  const update = await context.service.from('storage_gateway_uploads')
    .update({ gateway_upload_id: init.id, status: 'uploading' })
    .eq('id', upload.id);
  if (update.error) throw new StorageAppError('UPLOAD_RECORD_FAILED', 'The gateway upload could not be recorded.', 503);
  response.status(201).json({
    uploadId: upload.id,
    provider,
    gatewayUploadId: init.id,
    logicalChunkSize: init.logical_chunk_size,
    transportSliceSize: init.transport_slice_size,
    chunkCount: init.chunk_count,
    expiresAt: init.expires_at,
    bucketPolicy: policy,
  });
});

const ownedUpload = async (context: Context, uploadId: string) => {
  const { data, error } = await context.service.from('storage_gateway_uploads')
    .select('*').eq('id', uploadId).eq('owner_id', context.user.id).maybeSingle();
  if (error) throw new StorageAppError('UPLOAD_LOOKUP_FAILED', 'The upload could not be read.', 503);
  if (!data) throw new StorageAppError('UPLOAD_NOT_FOUND', 'Upload not found.', 404);
  return data;
};

app.post('/api/storage/uploads/:uploadId/chunks', async (request, response) => {
  const context = await contextFor(request);
  const upload = await ownedUpload(context, request.params.uploadId);
  if (upload.provider !== 'strato' || !upload.gateway_upload_id) {
    throw new StorageAppError('UPLOAD_PROVIDER_MISMATCH', 'This upload does not use the STRATO gateway.', 409);
  }
  const gatewayPath = `/api/storage/uploads/${upload.gateway_upload_id}/chunks`;
  const body = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
  const data = await gatewayRequest<any>(context, gatewayPath, 'POST', 'upload', {
    user_id: context.user.id,
    workspace_id: upload.workspace_id,
    bucket_id: upload.bucket_id,
    logical_path: upload.logical_path,
    original_size: Number(upload.size_bytes),
    expected_sha256: upload.expected_checksum_sha256,
    visibility: upload.visibility,
  }, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Chunk-Index': String(request.header('x-chunk-index') || ''),
      'X-Slice-Offset': String(request.header('x-slice-offset') || ''),
      'X-Chunk-Length': String(request.header('x-chunk-length') || ''),
      'X-Chunk-Sha256': String(request.header('x-chunk-sha256') || ''),
      'X-Slice-Sha256': String(request.header('x-slice-sha256') || ''),
    },
    body,
  });
  response.status(201).json(data);
});

app.post('/api/storage/uploads/:uploadId/fallback', async (request, response) => {
  const context = await contextFor(request);
  const upload = await ownedUpload(context, request.params.uploadId);
  const policy = await bucketPolicy(context, upload.bucket_id);
  if (!policy.fallback_to_supabase) throw new StorageAppError('FALLBACK_DISABLED', 'Supabase fallback is disabled for this bucket.', 409);
  if (upload.status === 'completed') throw new StorageAppError('UPLOAD_ALREADY_COMPLETED', 'This upload is already complete.', 409);
  const storagePath = safeUploadStoragePath(context.user.id, upload.id, upload.logical_path);
  const token = await signedSupabaseUpload(context, upload.bucket_id, storagePath);
  const { error } = await context.service.from('storage_gateway_uploads').update({
    provider: 'supabase',
    fallback_from_provider: upload.provider,
    supabase_storage_path: storagePath,
    status: 'initiated',
    error_code: 'STRATO_FALLBACK',
    updated_at: new Date().toISOString(),
  }).eq('id', upload.id).eq('owner_id', context.user.id);
  if (error) throw new StorageAppError('FALLBACK_RECORD_FAILED', 'The Supabase fallback could not be recorded.', 503);
  response.json({
    uploadId: upload.id,
    provider: 'supabase',
    fallbackFromProvider: upload.provider,
    storagePath,
    signedUploadToken: token,
  });
});

app.post('/api/storage/uploads/:uploadId/complete', async (request, response) => {
  const context = await contextFor(request);
  const upload = await ownedUpload(context, request.params.uploadId);
  let storageFileId: string | null = null;
  let storagePath: string | null = null;
  let gatewayResult: any = null;

  if (upload.provider === 'strato') {
    if (!upload.gateway_upload_id) throw new StorageAppError('GATEWAY_UPLOAD_MISSING', 'The gateway upload is missing.', 409);
    const gatewayPath = `/api/storage/uploads/${upload.gateway_upload_id}/complete`;
    gatewayResult = await gatewayRequest<any>(context, gatewayPath, 'POST', 'upload', {
      user_id: context.user.id,
      workspace_id: upload.workspace_id,
      bucket_id: upload.bucket_id,
      logical_path: upload.logical_path,
      original_size: Number(upload.size_bytes),
      expected_sha256: upload.expected_checksum_sha256,
      visibility: upload.visibility,
    });
    storageFileId = gatewayResult.fileId;
  } else {
    storagePath = String(request.body?.storagePath || '');
    if (!storagePath || storagePath !== upload.supabase_storage_path) {
      throw new StorageAppError('SUPABASE_BACKUP_PATH_MISMATCH', 'The Supabase backup path does not match.', 409);
    }
  }

  const { data: finalized, error } = await context.service.rpc('finalize_storage_gateway_object', {
    p_upload_id: upload.id,
    p_owner_id: context.user.id,
    p_storage_file_id: storageFileId,
    p_supabase_storage_path: storagePath,
  });
  if (error || !finalized?.ok) throw new StorageAppError(finalized?.code || 'BINDING_FINALIZE_FAILED', 'The file binding could not be finalized.', 409);
  const { data: object } = await context.service.from('storage_gateway_objects').select('*').eq('id', finalized.object_id).single();
  response.status(201).json({ object: mapObject(object, context.config.gatewayUrl), gateway: gatewayResult });
});

app.get('/api/storage/objects', async (request, response) => {
  const context = await contextFor(request);
  const bucketId = String(request.query.bucket || '');
  const prefix = String(request.query.prefix || '').replace(/^\/+/, '');
  let query = context.userClient.from('storage_gateway_objects').select('*')
    .eq('bucket_id', bucketId)
    .is('deleted_at', null)
    .eq('status', 'available')
    .order('logical_path');
  if (prefix) query = query.like('logical_path', `${prefix.replace(/[%_]/g, '\\$&')}%`);
  const { data, error } = await query;
  if (error) throw new StorageAppError('OBJECT_LIST_FAILED', 'Files could not be listed.', 503);
  response.json({ objects: (data || []).map((row) => mapObject(row, context.config.gatewayUrl)) });
});

app.get('/api/storage/objects/resolve', async (request, response) => {
  const context = await contextFor(request);
  const bucketId = String(request.query.bucket || '');
  const logicalPath = normalizeLogicalPath(request.query.path);
  const { data, error } = await context.userClient.from('storage_gateway_objects').select('*')
    .eq('bucket_id', bucketId).eq('logical_path', logicalPath).is('deleted_at', null).eq('status', 'available').maybeSingle();
  if (error) throw new StorageAppError('OBJECT_RESOLVE_FAILED', 'The file could not be resolved.', 503);
  if (!data) {
    response.status(404).json({ object: null });
    return;
  }
  const object = mapObject(data, context.config.gatewayUrl);
  if (data.provider === 'strato' && data.visibility === 'private') {
    object.url = `/api/storage/objects/${data.id}/download?grant=${encodeURIComponent(createDownloadGrant({
      object_id: data.id,
      user_id: context.user.id,
    }, context.config.downloadSecret))}`;
  } else if (data.provider === 'supabase') {
    if (data.visibility === 'public') {
      object.url = context.service.storage.from(data.bucket_id).getPublicUrl(data.storage_path).data.publicUrl;
    } else {
      const { data: signed, error: signError } = await context.service.storage.from(data.bucket_id).createSignedUrl(data.storage_path, 180);
      if (signError) throw new StorageAppError('DOWNLOAD_SIGN_FAILED', 'The download could not be signed.', 503);
      object.url = signed.signedUrl;
    }
  }
  response.json({ object });
});

app.get('/api/storage/objects/:objectId/download', async (request, response) => {
  const config = configuration();
  const grant = verifyDownloadGrant(String(request.query.grant || ''), config.downloadSecret);
  if (!grant || grant.object_id !== request.params.objectId) {
    throw new StorageAppError('DOWNLOAD_GRANT_INVALID', 'The download grant is invalid or expired.', 401);
  }
  const service = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: object, error } = await service.from('storage_gateway_objects').select('*')
    .eq('id', grant.object_id).eq('owner_id', grant.user_id).is('deleted_at', null).eq('status', 'available').maybeSingle();
  if (error || !object || object.provider !== 'strato' || !object.storage_file_id) {
    throw new StorageAppError('OBJECT_NOT_FOUND', 'The file was not found.', 404);
  }
  const range = request.header('range') || null;
  if (grant.allowed_range && grant.allowed_range !== range) throw new StorageAppError('DOWNLOAD_RANGE_FORBIDDEN', 'This range is not allowed.', 403);
  const gatewayPath = `/api/storage/files/${object.storage_file_id}/download`;
  const capability = signGatewayCapability({
    purpose: 'download',
    method: 'GET',
    path: gatewayPath,
    storage_file_id: object.storage_file_id,
    object_id: object.id,
    user_id: grant.user_id,
    allowed_range: grant.allowed_range || null,
  }, config.capabilitySecret);
  const gateway = await fetch(`${config.gatewayUrl}${gatewayPath}`, {
    headers: {
      'X-Wersee-Storage-Capability': capability,
      ...(range ? { Range: range } : {}),
    },
    signal: AbortSignal.timeout(240_000),
  });
  response.status(gateway.status);
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'content-disposition']) {
    const value = gateway.headers.get(name);
    if (value) response.setHeader(name, value);
  }
  if (!gateway.ok || !gateway.body) {
    const payload = await gateway.text();
    response.send(payload);
    return;
  }
  const reader = gateway.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!response.write(Buffer.from(value))) await new Promise((resolve) => response.once('drain', resolve));
  }
  response.end();
});

app.patch('/api/storage/objects/:objectId', async (request, response) => {
  const context = await contextFor(request);
  const logicalPath = normalizeLogicalPath(request.body?.logicalPath);
  const { data, error } = await context.service.rpc('move_storage_gateway_object', {
    p_object_id: request.params.objectId,
    p_owner_id: context.user.id,
    p_logical_path: logicalPath,
  });
  if (error) throw new StorageAppError('OBJECT_MOVE_FAILED', 'The file could not be moved.', 409);
  response.json({ objectId: data, logicalPath });
});

app.delete('/api/storage/objects/:objectId', async (request, response) => {
  const context = await contextFor(request);
  const { data: deleted, error } = await context.service.rpc('soft_delete_storage_gateway_object', {
    p_object_id: request.params.objectId,
    p_owner_id: context.user.id,
  });
  if (error || !deleted) throw new StorageAppError('OBJECT_DELETE_FAILED', 'The file could not be deleted.', 409);

  if (deleted.provider === 'strato' && deleted.delete_physical && deleted.storage_file_id) {
    const gatewayPath = `/api/storage/files/${deleted.storage_file_id}`;
    await gatewayRequest(context, gatewayPath, 'DELETE', 'delete', {
      user_id: context.user.id,
      object_id: deleted.object_id,
      storage_file_id: deleted.storage_file_id,
    }).catch(async () => {
      await context.service.from('storage_gateway_objects').update({ failure_code: 'PHYSICAL_DELETE_PENDING' }).eq('id', deleted.object_id);
    });
  } else if (deleted.provider === 'supabase' && deleted.storage_path) {
    await context.service.storage.from(String(deleted.bucket_id || '')).remove([deleted.storage_path]).catch(() => undefined);
  }
  response.json({ deleted: true, remainingReferences: Number(deleted.remaining_references || 0) });
});

app.use((error: unknown, request: Request, response: Response, _next: NextFunction) => {
  const candidate = error as StorageAppError;
  const code = candidate.code || (candidate.message === 'INVALID_LOGICAL_PATH' ? 'INVALID_LOGICAL_PATH' : 'STORAGE_INTERNAL_ERROR');
  const status = candidate.status || (code === 'INVALID_LOGICAL_PATH' ? 400 : 500);
  const requestId = request.header('x-vercel-id') || crypto.randomUUID();
  console.error(JSON.stringify({
    event: 'wersee_storage_error',
    requestId,
    method: request.method,
    path: request.path,
    code,
    status,
  }));
  if (!response.headersSent) {
    response.status(status).json({
      error: {
        code,
        message: status >= 500 ? 'Wersee storage is temporarily unavailable.' : candidate.message,
        requestId,
        details: candidate.details,
      },
    });
  } else {
    response.end();
  }
});

export default app;
