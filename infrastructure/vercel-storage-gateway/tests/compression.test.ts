import { describe, expect, it } from 'vitest';
import { prepareChunk, restoreChunk, shouldCompress } from '../src/compression.js';
import { asApiError } from '../src/errors.js';
import {
  safeFilename, safeRemotePath, sha256, storageFilename,
} from '../src/utils.js';

describe('adaptive lossless compression', () => {
  it('keeps Brotli only when it saves at least five percent', async () => {
    const original = Buffer.from('Wersee storage metadata\n'.repeat(20_000));
    const result = await prepareChunk(original, 'text/plain');
    expect(result.codec).toBe('brotli');
    expect(result.stored.length).toBeLessThanOrEqual(original.length * 0.95);
    expect(restoreChunk(result.stored, result.codec)).toEqual(original);
    expect(result.sha256).toBe(sha256(original));
  });

  it('never recompresses known compressed media', async () => {
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]),
      Buffer.alloc(1024, 7),
    ]);
    const result = await prepareChunk(jpeg, 'text/plain');
    expect(result.detectedMime).toBe('image/jpeg');
    expect(result.codec).toBe('identity');
    expect(result.stored).toEqual(jpeg);
  });

  it('classifies compressed and compressible MIME types conservatively', () => {
    expect(shouldCompress('application/json')).toBe(true);
    expect(shouldCompress('video/mp4')).toBe(false);
    expect(shouldCompress('application/zip')).toBe(false);
  });
});

describe('path safety', () => {
  it('rejects traversal and path separators in filenames', () => {
    expect(() => safeFilename('../secret.txt')).toThrow();
    expect(() => safeFilename('folder\\secret.txt')).toThrow();
    expect(() => safeRemotePath('/storage', '..', 'secret')).toThrow();
  });

  it('allows normalized safe storage paths', () => {
    expect(safeRemotePath('/storage', 'blobs', 'ab', 'abcdef')).toBe('/storage/blobs/ab/abcdef');
  });

  it('keeps a recognizable safe filename for physical STRATO objects', () => {
    expect(storageFilename('My résumé photo (final).jpg')).toBe('My_resume_photo_final.jpg');
    expect(storageFilename('产品图.webp')).toBe('file.webp');
  });
});

describe('request protection', () => {
  it('returns a clear 413 for an oversized raw body', () => {
    expect(asApiError({ type: 'entity.too.large', status: 413 })).toMatchObject({
      code: 'REQUEST_TOO_LARGE',
      status: 413,
    });
  });

  it('classifies numeric SFTP failures as a retriable provider error', () => {
    expect(asApiError({ code: 4 })).toMatchObject({
      code: 'STORAGE_TRANSFER_FAILED',
      status: 503,
    });
  });
});
