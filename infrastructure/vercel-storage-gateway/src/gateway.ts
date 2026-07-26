import express, { type NextFunction, type Request, type Response } from 'express';
import { randomBytes } from 'node:crypto';
import { verifyStorageCapability } from './capability.js';
import { renderCdnViewer, shouldRenderCdnViewer } from './cdn-viewer.js';
import { getConfig, LOGICAL_CHUNK_SIZE, TRANSPORT_SLICE_SIZE } from './config.js';
import { ApiError, asApiError } from './errors.js';
import { StorageRepository } from './repository.js';
import { SftpStorageProvider } from './storage/sftp-provider.js';
import { UploadService } from './upload-service.js';
import { safeId } from './utils.js';

const headerNumber = (request: Request, name: string) => {
  const value = Number(request.header(name));
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiError('INVALID_HEADER', `Invalid ${name}.`);
  return value;
};

const headerHash = (request: Request, name: string) => {
  const value = String(request.header(name) || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(value)) throw new ApiError('INVALID_CHECKSUM', `Invalid ${name}.`);
  return value;
};

const clientKey = (request: Request) =>
  String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 100);

const parseRange = (header: string | undefined, total: number) => {
  if (!header) return undefined;
  const match = header.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) throw new ApiError('INVALID_RANGE', 'Only a single byte range is supported.', 416);
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= total) {
    throw new ApiError('INVALID_RANGE', 'Requested range is outside the file.', 416);
  }
  return { start, end: Math.min(end, total - 1) };
};

export function createGateway() {
  const app = express();
  app.disable('x-powered-by');

  app.use((request, _response, next) => {
    const parsed = new URL(request.url, 'https://api.wersee.com');
    const rewritten = parsed.searchParams.get('__storage_path');
    if (rewritten) {
      parsed.searchParams.delete('__storage_path');
      request.url = `/api/storage/${rewritten.replace(/^\/+/, '')}${parsed.searchParams.size ? `?${parsed.searchParams}` : ''}`;
    }
    next();
  });

  app.use((request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers',
      'Content-Type, Range, X-Chunk-Index, X-Slice-Offset, X-Chunk-Length, X-Chunk-Sha256, X-Slice-Sha256, X-Wersee-Storage-Capability');
    response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, DELETE, OPTIONS');
    if (request.method === 'OPTIONS') return response.status(204).end();
    request.setTimeout(240_000);
    next();
  });

  app.use('/api/storage/uploads/:uploadId/chunks', express.raw({
    type: 'application/octet-stream',
    limit: TRANSPORT_SLICE_SIZE,
  }));
  app.use(express.json({ limit: '64kb' }));

  app.use(async (request, response, next) => {
    if (request.path === '/api/storage/health') return next();
    try {
      const repository = new StorageRepository(getConfig());
      const allowed = await repository.rateLimit(clientKey(request), request.path, request.method === 'GET' ? 300 : 120, 60);
      if (!allowed) throw new ApiError('RATE_LIMITED', 'Too many storage requests.', 429);
      next();
    } catch (error) {
      next(error);
    }
  });

  const run = async <T>(work: (service: UploadService, repository: StorageRepository) => Promise<T>) => {
    const config = getConfig();
    const repository = new StorageRepository(config);
    const storage = new SftpStorageProvider(config);
    try {
      return await work(new UploadService(repository, storage, config), repository);
    } finally {
      await storage.close();
    }
  };

  app.get('/api/storage/health', async (_request, response) => {
    const names = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRATO_SFTP_HOST', 'STRATO_SFTP_USERNAME', 'STRATO_SFTP_PASSWORD', 'WERSEE_STORAGE_CAPABILITY_SECRET'];
    const configured = names.every((name) => Boolean(process.env[name]?.trim()));
    const dependencies = configured
      ? await run((service) => service.health()).catch(() => ({ metadata: false, physical: false, ok: false }))
      : { metadata: false, physical: false, ok: false };
    response.status(configured && dependencies.ok ? 200 : 503).json({
      ok: configured && dependencies.ok,
      service: 'wersee-storage-api',
      provider: 'strato-sftp',
      logicalChunkSize: LOGICAL_CHUNK_SIZE,
      transportSliceSize: TRANSPORT_SLICE_SIZE,
      dependencies: {
        metadata: dependencies.metadata ? 'available' : 'unavailable',
        physical: dependencies.physical ? 'available' : 'unavailable',
      },
    });
  });

  app.post('/api/storage/uploads/init', async (request, response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'upload');
    const ownerId = safeId(capability.user_id, 'user_id');
    if (
      capability.original_size !== request.body?.originalSize
      || capability.expected_sha256 !== (request.body?.sha256 || undefined)
    ) throw new ApiError('CAPABILITY_BODY_MISMATCH', 'Upload capability does not match the request.', 403);
    const data = await run((service) => service.init(request.body || {}, ownerId));
    response.status(201).json(data);
  });

  app.post('/api/storage/uploads/:uploadId/chunks', async (request, response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'upload');
    const ownerId = safeId(capability.user_id, 'user_id');
    const body = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    const data = await run((service) => service.acceptSlice({
      uploadId: safeId(request.params.uploadId, 'uploadId'),
      chunkIndex: headerNumber(request, 'X-Chunk-Index'),
      sliceOffset: headerNumber(request, 'X-Slice-Offset'),
      chunkLength: headerNumber(request, 'X-Chunk-Length'),
      chunkSha256: headerHash(request, 'X-Chunk-Sha256'),
      sliceSha256: headerHash(request, 'X-Slice-Sha256'),
      body,
    }, ownerId));
    response.status(201).json(data);
  });

  app.post('/api/storage/uploads/:uploadId/complete', async (request, response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'upload');
    const ownerId = safeId(capability.user_id, 'user_id');
    const data = await run((service) =>
      service.complete(safeId(request.params.uploadId, 'uploadId'), ownerId));
    response.status(201).json(data);
  });

  app.get('/api/storage/files/:fileId', async (request, response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'metadata');
    if (capability.storage_file_id !== request.params.fileId) {
      throw new ApiError('CAPABILITY_FILE_MISMATCH', 'Storage capability does not match the file.', 403);
    }
    const data = await run((service) => service.downloadInfo(safeId(request.params.fileId, 'fileId')));
    response.json(data);
  });

  const contentDisposition = (request: Request, filename: string) =>
    `${request.query.download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(filename)}`;

  const downloadHead = async (request: Request, response: Response) => {
    if (request.path.includes('/files/')) {
      const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'download');
      if (
        capability.storage_file_id !== request.params.fileId
        || (capability.allowed_range && capability.allowed_range !== request.header('range'))
      ) throw new ApiError('CAPABILITY_FILE_MISMATCH', 'Storage capability does not match the download.', 403);
    } else {
      const fileId = safeId(request.params.fileId, 'fileId');
      const isPublic = await run((_service, repository) => repository.hasPublicBinding(fileId));
      if (!isPublic) throw new ApiError('PUBLIC_BINDING_REQUIRED', 'This file is not publicly available.', 404);
    }
    const file = await run((service) => service.downloadInfo(safeId(request.params.fileId, 'fileId')));
    response.setHeader('Content-Type', file.detected_mime_type || 'application/octet-stream');
    response.setHeader('Content-Disposition', contentDisposition(request, file.original_filename));
    response.setHeader('Content-Length', String(file.original_size));
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('ETag', `"sha256-${file.sha256}"`);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.status(200).end();
  };

  const download = async (request: Request, response: Response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'download');
    if (
      capability.storage_file_id !== request.params.fileId
      || (capability.allowed_range && capability.allowed_range !== request.header('range'))
    ) throw new ApiError('CAPABILITY_FILE_MISMATCH', 'Storage capability does not match the download.', 403);
    const fileId = safeId(request.params.fileId, 'fileId');
    const config = getConfig();
    const repository = new StorageRepository(config);
    const storage = new SftpStorageProvider(config);
    const service = new UploadService(repository, storage, config);
    try {
      const file = await service.downloadInfo(fileId);
      const total = Number(file.original_size);
      const range = parseRange(request.header('range'), total);
      response.status(range ? 206 : 200);
      response.setHeader('Content-Type', file.detected_mime_type || 'application/octet-stream');
      response.setHeader('Content-Disposition', contentDisposition(request, file.original_filename));
      response.setHeader('Accept-Ranges', 'bytes');
      response.setHeader('ETag', `"sha256-${file.sha256}"`);
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      response.setHeader('Content-Length', String(range ? range.end - range.start + 1 : total));
      if (range) response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${total}`);
      for await (const chunk of service.streamDownload(fileId, range)) {
        if (!response.write(chunk)) await new Promise((resolve) => response.once('drain', resolve));
      }
      response.end();
    } finally {
      await storage.close();
    }
  };

  app.head('/api/storage/files/:fileId/download', downloadHead);
  app.get('/api/storage/files/:fileId/download', download);

  app.head('/api/storage/cdn/:fileId', downloadHead);
  app.get('/api/storage/cdn/:fileId', async (request, response) => {
    const fileId = safeId(request.params.fileId, 'fileId');
    const file = await run(async (service, repository) => {
      if (!await repository.hasPublicBinding(fileId)) {
        throw new ApiError('PUBLIC_BINDING_REQUIRED', 'This file is not publicly available.', 404);
      }
      return service.downloadInfo(fileId);
    });
    const forceRaw = request.query.raw === '1';
    response.setHeader('Vary', 'Accept');
    if (!shouldRenderCdnViewer(request.header('accept'), file.detected_mime_type || '', forceRaw)) {
      const config = getConfig();
      const repository = new StorageRepository(config);
      const storage = new SftpStorageProvider(config);
      const service = new UploadService(repository, storage, config);
      try {
        const total = Number(file.original_size);
        const range = parseRange(request.header('range'), total);
        response.status(range ? 206 : 200);
        response.setHeader('Content-Type', file.detected_mime_type || 'application/octet-stream');
        response.setHeader('Content-Disposition', contentDisposition(request, file.original_filename));
        response.setHeader('Accept-Ranges', 'bytes');
        response.setHeader('ETag', `"sha256-${file.sha256}"`);
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        response.setHeader('Content-Length', String(range ? range.end - range.start + 1 : total));
        if (range) response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${total}`);
        for await (const chunk of service.streamDownload(fileId, range)) {
          if (!response.write(chunk)) await new Promise((resolve) => response.once('drain', resolve));
        }
        response.end();
      } finally {
        await storage.close();
      }
      return;
    }
    const nonce = randomBytes(18).toString('base64');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    response.setHeader('Content-Security-Policy',
      `default-src 'none'; img-src 'self' data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; `
      + "base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    response.status(200).send(renderCdnViewer(fileId, file, nonce));
  });

  app.delete('/api/storage/files/:fileId', async (request, response) => {
    const capability = verifyStorageCapability(request, getConfig().capabilitySecret, 'delete');
    if (capability.storage_file_id !== request.params.fileId) {
      throw new ApiError('CAPABILITY_FILE_MISMATCH', 'Storage capability does not match the file.', 403);
    }
    const garbageCollected = await run((service) =>
      service.delete(safeId(request.params.fileId, 'fileId')));
    response.status(200).json({ deleted: true, garbageCollected });
  });

  const cleanup = async (request: Request, response: Response) => {
    const config = getConfig();
    if (!config.cronSecret || request.header('authorization') !== `Bearer ${config.cronSecret}`) {
      throw new ApiError('MAINTENANCE_FORBIDDEN', 'Maintenance request denied.', 403);
    }
    const removedTemporaryObjects = await run((service) => service.cleanupExpired());
    response.json({ removedTemporaryObjects });
  };
  app.get('/api/storage/maintenance/cleanup', cleanup);
  app.post('/api/storage/maintenance/cleanup', cleanup);


  app.use((error: unknown, request: Request, response: Response, _next: NextFunction) => {
    const apiError = asApiError(error);
    const requestId = request.header('x-vercel-id') || crypto.randomUUID();
    console.error(JSON.stringify({
      level: apiError.status >= 500 ? 'error' : 'warn',
      event: 'storage_api_error',
      requestId,
      method: request.method,
      path: request.path,
      code: apiError.code,
      status: apiError.status,
      causeName: error instanceof Error ? error.name : undefined,
      causeType: (error as { type?: string })?.type,
      causeCode: (error as { code?: string })?.code,
    }));
    if (!response.headersSent) {
      response.status(apiError.status).json({
        error: { code: apiError.code, message: apiError.message, requestId, details: apiError.details },
      });
    } else {
      response.end();
    }
  });

  return app;
}
