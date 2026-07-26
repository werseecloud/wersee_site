import { createHash } from 'node:crypto';
import {
  LOGICAL_CHUNK_SIZE, PACK_ENTRY_MAX, PACK_TARGET_SIZE, TRANSPORT_SLICE_SIZE, type GatewayConfig,
} from './config.js';
import { prepareChunk, restoreChunk } from './compression.js';
import { ApiError } from './errors.js';
import { StorageRepository } from './repository.js';
import type { StorageProvider } from './types.js';
import {
  safeFilename, safeRemotePath, sha256, storageFilename, uuid,
} from './utils.js';

type SliceInput = {
  uploadId: string;
  chunkIndex: number;
  sliceOffset: number;
  chunkLength: number;
  chunkSha256: string;
  sliceSha256: string;
  body: Buffer;
};

export class UploadService {
  constructor(
    private readonly repository: StorageRepository,
    private readonly storage: StorageProvider,
    private readonly config: GatewayConfig,
  ) {}

  async init(input: Record<string, unknown>, ownerId: string) {
    const originalFilename = safeFilename(input.originalFilename);
    const originalSize = Number(input.originalSize);
    const declaredMimeType = String(input.mimeType || 'application/octet-stream').slice(0, 255);
    const expectedSha256 = input.sha256 ? String(input.sha256).toLowerCase() : null;
    if (!Number.isSafeInteger(originalSize) || originalSize <= 0) throw new ApiError('INVALID_SIZE', 'Invalid original size.');
    if (expectedSha256 && !/^[0-9a-f]{64}$/.test(expectedSha256)) throw new ApiError('INVALID_CHECKSUM', 'Invalid SHA-256.');
    if (expectedSha256) {
      const existing = await this.repository.fileByHash(expectedSha256, originalSize, ownerId);
      if (existing) {
        return {
          deduplicated: true,
          fileId: existing.id,
          sha256: existing.sha256,
          url: `/cdn/${existing.id}`,
        };
      }
    }
    const chunkCount = Math.ceil(originalSize / LOGICAL_CHUNK_SIZE);
    if (chunkCount > 100_000) throw new ApiError('FILE_TOO_LARGE', 'File has too many chunks.', 413);
    return this.repository.createUpload({
      owner_id: ownerId,
      original_filename: originalFilename,
      declared_mime_type: declaredMimeType,
      original_size: originalSize,
      expected_sha256: expectedSha256,
      logical_chunk_size: LOGICAL_CHUNK_SIZE,
      transport_slice_size: TRANSPORT_SLICE_SIZE,
      chunk_count: chunkCount,
      status: 'initiated',
    });
  }

  async health() {
    const [metadata, physical] = await Promise.all([
      this.repository.health(),
      this.storage.exists(safeRemotePath(this.config.sftpRoot)),
    ]);
    return { metadata, physical, ok: metadata && physical };
  }

  async acceptSlice(input: SliceInput, ownerId: string) {
    const upload = await this.repository.upload(input.uploadId);
    if (upload.owner_id !== ownerId) throw new ApiError('UPLOAD_OWNER_MISMATCH', 'Upload session owner mismatch.', 403);
    if (!['initiated', 'uploading'].includes(upload.status) || new Date(upload.expires_at) <= new Date()) {
      throw new ApiError('UPLOAD_NOT_ACTIVE', 'Upload session is not active.', 409);
    }
    if (input.chunkIndex < 0 || input.chunkIndex >= upload.chunk_count) throw new ApiError('INVALID_CHUNK', 'Invalid chunk index.');
    if (input.body.length < 1 || input.body.length > TRANSPORT_SLICE_SIZE) {
      throw new ApiError(
        'SLICE_TOO_LARGE',
        `Transport slices may not exceed ${TRANSPORT_SLICE_SIZE / (1024 * 1024)} MiB.`,
        413,
      );
    }
    if (sha256(input.body) !== input.sliceSha256) throw new ApiError('SLICE_CHECKSUM_MISMATCH', 'Slice checksum mismatch.', 409);
    const expectedChunkLength = input.chunkIndex === upload.chunk_count - 1
      ? Number(upload.original_size) - (input.chunkIndex * LOGICAL_CHUNK_SIZE)
      : LOGICAL_CHUNK_SIZE;
    if (input.chunkLength !== expectedChunkLength || input.sliceOffset < 0
      || input.sliceOffset + input.body.length > input.chunkLength) {
      throw new ApiError('INVALID_SLICE_RANGE', 'Slice range is outside its logical chunk.', 409);
    }

    const slicePath = safeRemotePath(
      this.config.sftpRoot, 'users', ownerId, 'temp', input.uploadId,
      String(input.chunkIndex), `${input.sliceOffset}.slice`,
    );
    await this.storage.putAtomic(slicePath, input.body);
    await this.repository.upsertSlice({
      upload_id: input.uploadId,
      chunk_index: input.chunkIndex,
      slice_offset: input.sliceOffset,
      size_bytes: input.body.length,
      sha256: input.sliceSha256,
      storage_path: slicePath,
    });

    const slices = await this.repository.slices(input.uploadId, input.chunkIndex);
    let cursor = 0;
    for (const slice of slices) {
      if (slice.slice_offset !== cursor) return { accepted: true, complete: false, nextOffset: cursor };
      cursor += slice.size_bytes;
    }
    if (cursor !== input.chunkLength) return { accepted: true, complete: false, nextOffset: cursor };

    const buffers: Buffer[] = [];
    for (const slice of slices) {
      const body = await this.storage.read(slice.storage_path);
      if (body.length !== slice.size_bytes || sha256(body) !== slice.sha256) {
        throw new ApiError('REMOTE_SLICE_CORRUPT', 'A stored slice failed verification.', 409);
      }
      buffers.push(body);
    }
    const original = Buffer.concat(buffers);
    if (sha256(original) !== input.chunkSha256) throw new ApiError('CHUNK_CHECKSUM_MISMATCH', 'Logical chunk checksum mismatch.', 409);
    const existing = await this.repository.blobByHash(input.chunkSha256, ownerId);
    let blobId: string | null = existing?.id || null;
    let stagedPath: string | null = null;
    let prepared = await prepareChunk(original, upload.declared_mime_type);
    if (!existing) {
      stagedPath = safeRemotePath(
        this.config.sftpRoot, 'users', ownerId, 'temp', input.uploadId, `${input.chunkIndex}.ready`,
      );
      await this.storage.putAtomic(stagedPath, prepared.stored);
    }
    await this.repository.upsertChunk({
      upload_id: input.uploadId,
      chunk_index: input.chunkIndex,
      original_offset: input.chunkIndex * LOGICAL_CHUNK_SIZE,
      original_length: original.length,
      sha256: prepared.sha256,
      detected_mime_type: prepared.detectedMime,
      compression_codec: prepared.codec,
      compression_ratio: prepared.ratio,
      stored_length: prepared.stored.length,
      stored_sha256: prepared.storedSha256,
      staged_storage_path: stagedPath,
      blob_id: blobId,
      status: 'verified',
    });
    for (const slice of slices) await this.storage.delete(slice.storage_path).catch(() => undefined);
    return { accepted: true, complete: true, chunkIndex: input.chunkIndex, sha256: prepared.sha256, deduplicated: Boolean(existing) };
  }

  async complete(uploadId: string, ownerId: string) {
    const upload = await this.repository.upload(uploadId);
    if (upload.owner_id !== ownerId) throw new ApiError('UPLOAD_OWNER_MISMATCH', 'Upload session owner mismatch.', 403);
    const chunks = await this.repository.chunks(uploadId);
    if (chunks.length !== upload.chunk_count || chunks.some((chunk) => chunk.status !== 'verified')) {
      throw new ApiError('UPLOAD_INCOMPLETE', 'Not all chunks are verified.', 409);
    }

    const pendingSmall = chunks.filter((chunk) => !chunk.blob_id && chunk.stored_length <= PACK_ENTRY_MAX);
    for (let batchStart = 0; batchStart < pendingSmall.length;) {
      const batch: any[] = [];
      let batchBytes = 0;
      while (
        batchStart < pendingSmall.length
        && (batch.length === 0 || batchBytes + pendingSmall[batchStart].stored_length <= PACK_TARGET_SIZE)
      ) {
        batch.push(pendingSmall[batchStart]);
        batchBytes += pendingSmall[batchStart].stored_length;
        batchStart += 1;
      }
      const packId = uuid();
      const visibleName = storageFilename(upload.original_filename);
      const packPath = safeRemotePath(
        this.config.sftpRoot, 'users', ownerId, 'packs', packId.slice(0, 2),
        `${packId}--${visibleName}.pack`,
      );
      const entries: Buffer[] = [];
      let offset = 0;
      const metadata: Array<{ chunk: any; offset: number; body: Buffer }> = [];
      for (const chunk of batch) {
        const body = await this.storage.read(chunk.staged_storage_path);
        if (sha256(body) !== chunk.stored_sha256) throw new ApiError('STAGED_CHUNK_CORRUPT', 'Staged chunk checksum mismatch.', 409);
        metadata.push({ chunk, offset, body });
        entries.push(body);
        offset += body.length;
      }
      const packBody = Buffer.concat(entries);
      await this.storage.putAtomic(packPath, packBody);
      const pack = await this.repository.insertPack({
        id: packId,
        owner_id: ownerId,
        storage_path: packPath,
        size_bytes: packBody.length,
        sha256: sha256(packBody),
        status: 'available',
      });
      for (const entry of metadata) {
        const blob = await this.repository.insertBlob({
          owner_id: ownerId,
          sha256: entry.chunk.sha256,
          stored_sha256: entry.chunk.stored_sha256,
          original_length: entry.chunk.original_length,
          stored_length: entry.chunk.stored_length,
          compression_codec: entry.chunk.compression_codec,
          storage_kind: 'pack',
          storage_path: packPath,
          packfile_id: pack.id,
          pack_offset: entry.offset,
          status: 'available',
        });
        entry.chunk.blob_id = blob.id;
        await this.repository.upsertChunk({ ...entry.chunk, blob_id: blob.id });
        await this.storage.delete(entry.chunk.staged_storage_path).catch(() => undefined);
      }
    }

    for (const chunk of chunks.filter((item) => !item.blob_id && item.stored_length > PACK_ENTRY_MAX)) {
      const body = await this.storage.read(chunk.staged_storage_path);
      if (sha256(body) !== chunk.stored_sha256) throw new ApiError('STAGED_CHUNK_CORRUPT', 'Staged chunk checksum mismatch.', 409);
      const visibleName = storageFilename(upload.original_filename);
      const objectPath = safeRemotePath(
        this.config.sftpRoot, 'users', ownerId, 'blobs', chunk.sha256.slice(0, 2),
        `${chunk.sha256}--part-${chunk.chunk_index}--${visibleName}.blob`,
      );
      await this.storage.putAtomic(objectPath, body);
      const blob = await this.repository.insertBlob({
        owner_id: ownerId,
        sha256: chunk.sha256,
        stored_sha256: chunk.stored_sha256,
        original_length: chunk.original_length,
        stored_length: chunk.stored_length,
        compression_codec: chunk.compression_codec,
        storage_kind: 'object',
        storage_path: objectPath,
        status: 'available',
      });
      chunk.blob_id = blob.id;
      await this.repository.upsertChunk({ ...chunk, blob_id: blob.id });
      await this.storage.delete(chunk.staged_storage_path).catch(() => undefined);
    }

    const finalized = await this.repository.chunks(uploadId);
    const fullHash = createHash('sha256');
    let physicalSize = 0;
    let detectedMime = upload.declared_mime_type;
    for (const chunk of finalized) {
      const blob = await this.repository.blobByHash(chunk.sha256, ownerId);
      if (!blob) throw new ApiError('BLOB_MISSING', 'A finalized blob is missing.', 503);
      const stored = await this.storage.read(
        blob.storage_path,
        blob.storage_kind === 'pack' ? blob.pack_offset : undefined,
        blob.storage_kind === 'pack' ? blob.pack_offset + blob.stored_length - 1 : undefined,
      );
      const original = restoreChunk(stored, blob.compression_codec);
      if (sha256(original) !== blob.sha256) throw new ApiError('RECONSTRUCTION_CHECKSUM_MISMATCH', 'Chunk reconstruction failed.', 409);
      fullHash.update(original);
      physicalSize += blob.stored_length;
      if (chunk.chunk_index === 0) detectedMime = chunk.detected_mime_type;
    }
    const fileHash = fullHash.digest('hex');
    if (upload.expected_sha256 && upload.expected_sha256 !== fileHash) throw new ApiError('FILE_CHECKSUM_MISMATCH', 'File checksum mismatch.', 409);
    const links = finalized.map((chunk) => ({
      chunk_index: chunk.chunk_index,
      blob_id: chunk.blob_id,
      original_offset: chunk.original_offset,
      original_length: chunk.original_length,
    }));
    const fileId = await this.repository.completeUpload(uploadId, {
      owner_id: ownerId,
      original_filename: upload.original_filename,
      declared_mime_type: upload.declared_mime_type,
      detected_mime_type: detectedMime,
      original_size: upload.original_size,
      physical_stored_size: physicalSize,
      compression_codec: [...new Set(finalized.map((chunk) => chunk.compression_codec))].length === 1
        ? finalized[0].compression_codec
        : 'mixed',
      sha256: fileHash,
      compression_ratio: physicalSize / Number(upload.original_size),
      status: 'available',
    }, links);
    return {
      fileId,
      sha256: fileHash,
      originalFilename: upload.original_filename,
      originalSize: upload.original_size,
      physicalStoredSize: physicalSize,
      storageFolder: safeRemotePath(this.config.sftpRoot, 'users', ownerId),
      url: `/cdn/${fileId}`,
    };
  }

  async downloadInfo(fileId: string) {
    return this.repository.file(fileId);
  }

  async *streamDownload(fileId: string, range?: { start: number; end: number }) {
    const file = await this.repository.file(fileId);
    const links = await this.repository.fileChunks(fileId);
    const start = range?.start ?? 0;
    const end = range?.end ?? Number(file.original_size) - 1;
    for (const link of links as any[]) {
      const blob = link.blob;
      const chunkStart = Number(link.original_offset);
      const chunkEnd = chunkStart + Number(link.original_length) - 1;
      if (chunkEnd < start || chunkStart > end) continue;
      const stored = await this.storage.read(
        blob.storage_path,
        blob.storage_kind === 'pack' ? blob.pack_offset : undefined,
        blob.storage_kind === 'pack' ? blob.pack_offset + blob.stored_length - 1 : undefined,
      );
      if (sha256(stored) !== blob.stored_sha256) throw new ApiError('STORED_CHECKSUM_MISMATCH', 'Stored chunk checksum mismatch.', 503);
      const original = restoreChunk(stored, blob.compression_codec);
      if (sha256(original) !== blob.sha256) throw new ApiError('DOWNLOAD_CHECKSUM_MISMATCH', 'Downloaded chunk checksum mismatch.', 503);
      const localStart = Math.max(0, start - chunkStart);
      const localEnd = Math.min(original.length - 1, end - chunkStart);
      yield original.subarray(localStart, localEnd + 1);
    }
  }

  async delete(fileId: string) {
    const garbage = await this.repository.deleteFile(fileId) as Array<{ storage_path: string }>;
    for (const item of garbage) await this.storage.delete(item.storage_path).catch(() => undefined);
    return garbage.length;
  }

  async cleanupExpired() {
    const garbage = await this.repository.cleanupExpired();
    for (const item of garbage) await this.storage.delete(item.storage_path).catch(() => undefined);
    return garbage.length;
  }
}
