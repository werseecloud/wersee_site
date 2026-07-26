import { describe, expect, it } from 'vitest';
import { LOGICAL_CHUNK_SIZE, TRANSPORT_SLICE_SIZE } from '../src/config.js';
import type { StorageProvider } from '../src/types.js';
import { UploadService } from '../src/upload-service.js';
import { sha256 } from '../src/utils.js';

class MemoryStorage implements StorageProvider {
  files = new Map<string, Buffer>();
  async putAtomic(path: string, data: Buffer) { this.files.set(path, Buffer.from(data)); }
  async read(path: string, start?: number, end?: number) {
    const data = this.files.get(path);
    if (!data) throw new Error('missing');
    return start === undefined ? Buffer.from(data) : data.subarray(start, (end ?? data.length - 1) + 1);
  }
  async exists(path: string) { return this.files.has(path); }
  async delete(path: string) { this.files.delete(path); }
  async verify(path: string, expected: string) { return sha256(await this.read(path)) === expected; }
  async close() {}
}

class MemoryRepository {
  sliceRows: any[] = [];
  chunkRow: any;
  uploadRow = {
    id: '11111111-1111-4111-8111-111111111111',
    owner_id: '22222222-2222-4222-8222-222222222222',
    original_filename: 'large.txt',
    declared_mime_type: 'text/plain',
    original_size: LOGICAL_CHUNK_SIZE,
    chunk_count: 1,
    status: 'uploading',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  };
  async upload() { return this.uploadRow; }
  async upsertSlice(value: any) {
    this.sliceRows = this.sliceRows.filter((row) =>
      !(row.chunk_index === value.chunk_index && row.slice_offset === value.slice_offset));
    this.sliceRows.push(value);
  }
  async slices() { return [...this.sliceRows].sort((a, b) => a.slice_offset - b.slice_offset); }
  async blobByHash() { return null; }
  async upsertChunk(value: any) { this.chunkRow = value; return value; }
}

describe('resumable logical chunks', () => {
  it('accepts retryable transport slices and finalizes one 24 MiB chunk', async () => {
    const storage = new MemoryStorage();
    const repository = new MemoryRepository();
    const service = new UploadService(repository as any, storage, {
      sftpRoot: '/storage',
    } as any);
    const chunk = Buffer.from('abcd'.repeat(LOGICAL_CHUNK_SIZE / 4));
    const chunkHash = sha256(chunk);
    let last: any;
    for (let offset = 0; offset < chunk.length; offset += TRANSPORT_SLICE_SIZE) {
      const body = chunk.subarray(offset, offset + TRANSPORT_SLICE_SIZE);
      last = await service.acceptSlice({
        uploadId: repository.uploadRow.id,
        chunkIndex: 0,
        sliceOffset: offset,
        chunkLength: chunk.length,
        chunkSha256: chunkHash,
        sliceSha256: sha256(body),
        body,
      }, repository.uploadRow.owner_id);
    }
    expect(last.complete).toBe(true);
    expect(repository.chunkRow.sha256).toBe(chunkHash);
    expect(repository.chunkRow.compression_codec).toBe('brotli');
    expect(repository.chunkRow.stored_length).toBeLessThan(chunk.length * 0.05);
    expect(repository.chunkRow.staged_storage_path)
      .toContain(`/users/${repository.uploadRow.owner_id}/temp/${repository.uploadRow.id}/`);
  });

  it('rejects a corrupt transport slice before metadata acceptance', async () => {
    const service = new UploadService(new MemoryRepository() as any, new MemoryStorage(), {
      sftpRoot: '/storage',
    } as any);
    const body = Buffer.from('corrupt');
    await expect(service.acceptSlice({
      uploadId: '11111111-1111-4111-8111-111111111111',
      chunkIndex: 0,
      sliceOffset: 0,
      chunkLength: LOGICAL_CHUNK_SIZE,
      chunkSha256: 'a'.repeat(64),
      sliceSha256: 'b'.repeat(64),
      body,
    }, '22222222-2222-4222-8222-222222222222'))
      .rejects.toMatchObject({ code: 'SLICE_CHECKSUM_MISMATCH' });
  });

  it('rejects chunks signed for a different user', async () => {
    const repository = new MemoryRepository();
    const service = new UploadService(repository as any, new MemoryStorage(), {
      sftpRoot: '/storage',
    } as any);
    await expect(service.acceptSlice({
      uploadId: repository.uploadRow.id,
      chunkIndex: 0,
      sliceOffset: 0,
      chunkLength: LOGICAL_CHUNK_SIZE,
      chunkSha256: 'a'.repeat(64),
      sliceSha256: 'b'.repeat(64),
      body: Buffer.from('blocked'),
    }, '33333333-3333-4333-8333-333333333333'))
      .rejects.toMatchObject({ code: 'UPLOAD_OWNER_MISMATCH', status: 403 });
  });
});
