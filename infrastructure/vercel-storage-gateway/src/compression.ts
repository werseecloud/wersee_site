import { brotliCompressSync, brotliDecompressSync, constants } from 'node:zlib';
import { fileTypeFromBuffer } from 'file-type';
import type { CompressionCodec, PreparedChunk } from './types.js';
import { sha256 } from './utils.js';

const compressedMimePrefixes = ['image/jpeg', 'image/webp', 'image/avif', 'audio/', 'video/'];
const compressedMimes = new Set([
  'application/zip', 'application/gzip', 'application/x-7z-compressed',
  'application/x-rar-compressed', 'application/pdf', 'application/wasm',
]);
const compressiblePrefixes = ['text/'];
const compressibleMimes = new Set([
  'application/json', 'application/ld+json', 'application/javascript',
  'application/xml', 'application/sql', 'application/rtf',
  'image/svg+xml', 'application/x-subrip', 'text/vtt',
]);

export const detectMime = async (data: Buffer, declared = 'application/octet-stream') => {
  const signature = await fileTypeFromBuffer(data.subarray(0, Math.min(data.length, 8192)));
  return signature?.mime || declared.toLowerCase().split(';')[0].trim() || 'application/octet-stream';
};

export const shouldCompress = (mime: string) => {
  if (compressedMimes.has(mime) || compressedMimePrefixes.some((prefix) => mime.startsWith(prefix))) return false;
  return compressibleMimes.has(mime) || compressiblePrefixes.some((prefix) => mime.startsWith(prefix));
};

export const prepareChunk = async (original: Buffer, declaredMime?: string): Promise<PreparedChunk> => {
  const detectedMime = await detectMime(original, declaredMime);
  let stored = original;
  let codec: CompressionCodec = 'identity';
  if (shouldCompress(detectedMime)) {
    const candidate = brotliCompressSync(original, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 6,
        [constants.BROTLI_PARAM_SIZE_HINT]: original.length,
      },
    });
    if (candidate.length <= original.length * 0.95) {
      stored = candidate;
      codec = 'brotli';
    }
  }
  return {
    original,
    stored,
    sha256: sha256(original),
    storedSha256: sha256(stored),
    codec,
    ratio: original.length ? stored.length / original.length : 1,
    detectedMime,
  };
};

export const restoreChunk = (stored: Buffer, codec: CompressionCodec) =>
  codec === 'brotli' ? brotliDecompressSync(stored) : stored;
