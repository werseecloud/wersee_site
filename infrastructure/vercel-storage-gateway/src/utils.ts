import { createHash, randomUUID } from 'node:crypto';
import { ApiError } from './errors.js';

export const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');
export const uuid = () => randomUUID();

export const safeFilename = (value: unknown) => {
  const name = String(value || '').normalize('NFKC').trim();
  if (!name || name.length > 255 || /[\u0000-\u001f\u007f/\\]/.test(name) || name === '.' || name === '..') {
    throw new ApiError('INVALID_FILENAME', 'The filename is unsafe.');
  }
  return name;
};

export const safeId = (value: unknown, label = 'id') => {
  const id = String(value || '');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new ApiError('INVALID_ID', `Invalid ${label}.`);
  return id;
};

export const storageFilename = (value: unknown) => {
  const original = safeFilename(value);
  const extensionMatch = original.match(/(\.[A-Za-z0-9]{1,16})$/);
  const extension = extensionMatch?.[1] || '';
  const sourceBasename = extension ? original.slice(0, -extension.length) : original;
  const normalized = sourceBasename.normalize('NFKD').replace(/\p{M}/gu, '');
  const readable = normalized
    .replace(/[^A-Za-z0-9._ -]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[ ._-]+|[ ._-]+$/g, '');
  const fallback = 'file';
  return `${(readable || fallback).slice(0, Math.max(1, 110 - extension.length))}${extension}`;
};

export const safeRemotePath = (...parts: string[]) => {
  const segments = parts.flatMap((part) => part.split('/')).filter(Boolean);
  if (segments.some((part) => part === '.' || part === '..' || !/^[A-Za-z0-9._-]+$/.test(part))) {
    throw new ApiError('UNSAFE_STORAGE_PATH', 'Unsafe storage path.', 500);
  }
  return `/${segments.join('/')}`;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (index + 1 < attempts) await sleep(150 * (2 ** index));
    }
  }
  throw lastError;
}
