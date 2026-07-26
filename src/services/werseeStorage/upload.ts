import { Upload as TusUpload } from 'tus-js-client';
import { supabase } from '@/lib/supabase';
import { isTemporaryStorageFailure, storageApi, WerseeStorageError } from './client';
import { hashBlobIncrementally } from './hash';
import { LOGICAL_CHUNK_SIZE, TRANSPORT_SLICE_SIZE } from './slicing';
import type {
  BucketPolicy,
  StorageProgress,
  WerseeStoredObject,
  WerseeUploadController,
  WerseeUploadOptions,
} from './types';

export { LOGICAL_CHUNK_SIZE, TRANSPORT_SLICE_SIZE } from './slicing';
const MAX_CONCURRENCY = 3;
const RESUME_PREFIX = 'wersee-storage-upload:';

type InitResponse = {
  uploadId: string;
  provider: 'strato' | 'supabase';
  gatewayUploadId?: string;
  logicalChunkSize?: number;
  transportSliceSize?: number;
  chunkCount?: number;
  storagePath?: string;
  signedUploadToken?: string;
  deduplicated?: boolean;
  objectId?: string;
  fileId?: string;
  bucketPolicy: BucketPolicy;
};

type PersistedUpload = {
  uploadId: string;
  provider: 'strato' | 'supabase';
  sha256: string;
  fingerprint: string;
  acknowledgedSlices: string[];
  storagePath?: string;
  signedUploadToken?: string;
  updatedAt: string;
};

const fingerprint = (file: File, sha256: string) =>
  `${file.name}:${file.size}:${file.lastModified}:${sha256}`;

const storageKey = (value: string) => `${RESUME_PREFIX}${value}`;

const persist = (state: PersistedUpload) => {
  localStorage.setItem(storageKey(state.fingerprint), JSON.stringify(state));
};

const clearPersisted = (value: string) => {
  localStorage.removeItem(storageKey(value));
};

const pauseGate = () => {
  let paused = false;
  let waiting: Array<() => void> = [];
  return {
    pause: () => { paused = true; },
    resume: () => {
      paused = false;
      waiting.splice(0).forEach((resolve) => resolve());
    },
    wait: async (signal?: AbortSignal) => {
      if (!paused) return;
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new DOMException('Upload aborted.', 'AbortError'));
        signal?.addEventListener('abort', abort, { once: true });
        waiting.push(() => {
          signal?.removeEventListener('abort', abort);
          resolve();
        });
      });
    },
  };
};

const sleep = (milliseconds: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = window.setTimeout(resolve, milliseconds);
  const abort = () => {
    window.clearTimeout(timer);
    reject(new DOMException('Upload aborted.', 'AbortError'));
  };
  signal?.addEventListener('abort', abort, { once: true });
});

const retry = async <T>(work: () => Promise<T>, signal?: AbortSignal, attempts = 4): Promise<T> => {
  let failure: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Upload aborted.', 'AbortError');
    try {
      return await work();
    } catch (error) {
      failure = error;
      if (!isTemporaryStorageFailure(error) || attempt === attempts - 1) throw error;
      const jitter = Math.floor(Math.random() * 250);
      await sleep(Math.min(8_000, 500 * (2 ** attempt)) + jitter, signal);
    }
  }
  throw failure;
};

const progress = (
  acknowledgedBytes: number,
  totalBytes: number,
  callback?: (value: StorageProgress) => void,
) => callback?.({
  acknowledgedBytes,
  totalBytes,
  percent: totalBytes ? Math.round((acknowledgedBytes / totalBytes) * 100) : 100,
});

const uploadSupabaseBackup = async (
  file: File,
  bucketId: string,
  storagePath: string,
  signedUploadToken: string,
  options: WerseeUploadOptions,
  controller: WerseeUploadController,
) => {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  if (!supabaseUrl) throw new WerseeStorageError('SUPABASE_URL_MISSING', 'Supabase Storage is unavailable.', 503);
  const directUrl = supabaseUrl.replace('.supabase.co', '.storage.supabase.co');
  await new Promise<void>((resolve, reject) => {
    const upload = new TusUpload(file, {
      endpoint: `${directUrl}/storage/v1/upload/resumable`,
      headers: { 'x-signature': signedUploadToken },
      retryDelays: [0, 1000, 3000, 7000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: bucketId,
        objectName: storagePath,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onProgress: (acknowledgedBytes, totalBytes) => progress(acknowledgedBytes, totalBytes, options.onProgress),
      onError: reject,
      onSuccess: () => resolve(),
    });
    const abort = () => {
      upload.abort(true).finally(() => reject(new DOMException('Upload aborted.', 'AbortError')));
    };
    options.signal?.addEventListener('abort', abort, { once: true });
    controller.pause = () => upload.abort(false);
    controller.resume = () => upload.start();
    controller.cancel = abort;
    upload.start();
  });
};

const uploadStrato = async (
  init: InitResponse,
  file: File,
  sha256: string,
  state: PersistedUpload,
  options: WerseeUploadOptions,
  gate: ReturnType<typeof pauseGate>,
) => {
  const logicalSize = init.logicalChunkSize || LOGICAL_CHUNK_SIZE;
  const sliceSize = init.transportSliceSize || TRANSPORT_SLICE_SIZE;
  if (logicalSize !== LOGICAL_CHUNK_SIZE || sliceSize !== TRANSPORT_SLICE_SIZE) {
    throw new WerseeStorageError('GATEWAY_CHUNK_CONTRACT_MISMATCH', 'The gateway returned an unsupported chunk contract.', 409);
  }
  const acknowledged = new Set(state.acknowledgedSlices);
  let acknowledgedBytes = [...acknowledged].reduce((sum, key) => {
    const [, offsetText, lengthText] = key.split(':');
    return sum + (Number(lengthText) || Math.min(sliceSize, file.size - Number(offsetText)));
  }, 0);
  progress(acknowledgedBytes, file.size, options.onProgress);
  const concurrency = Math.max(1, Math.min(MAX_CONCURRENCY, options.concurrency || 2));

  for (let chunkIndex = 0; chunkIndex < Math.ceil(file.size / logicalSize); chunkIndex += 1) {
    const chunkStart = chunkIndex * logicalSize;
    const chunkEnd = Math.min(chunkStart + logicalSize, file.size);
    const chunk = file.slice(chunkStart, chunkEnd);
    const chunkSha256 = await hashBlobIncrementally(chunk, options.signal);
    const tasks: Array<() => Promise<void>> = [];
    for (let sliceOffset = 0; sliceOffset < chunk.size; sliceOffset += sliceSize) {
      const absoluteOffset = chunkStart + sliceOffset;
      const slice = chunk.slice(sliceOffset, Math.min(sliceOffset + sliceSize, chunk.size));
      const sliceKey = `${chunkIndex}:${absoluteOffset}:${slice.size}`;
      if (acknowledged.has(sliceKey)) continue;
      tasks.push(async () => {
        await gate.wait(options.signal);
        const sliceSha256 = await hashBlobIncrementally(slice, options.signal);
        await retry(() => storageApi(`/uploads/${init.uploadId}/chunks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Chunk-Index': String(chunkIndex),
            'X-Slice-Offset': String(sliceOffset),
            'X-Chunk-Length': String(chunk.size),
            'X-Chunk-Sha256': chunkSha256,
            'X-Slice-Sha256': sliceSha256,
          },
          body: slice,
          signal: options.signal,
        }), options.signal);
        acknowledged.add(sliceKey);
        state.acknowledgedSlices = [...acknowledged];
        state.updatedAt = new Date().toISOString();
        persist(state);
        acknowledgedBytes += slice.size;
        progress(acknowledgedBytes, file.size, options.onProgress);
      });
    }
    for (let index = 0; index < tasks.length; index += concurrency) {
      await Promise.all(tasks.slice(index, index + concurrency).map((task) => task()));
    }
  }
  const result = await retry(() => storageApi<{ object: WerseeStoredObject }>(`/uploads/${init.uploadId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha256 }),
    signal: options.signal,
  }), options.signal);
  return result.object;
};

const initiate = async (options: WerseeUploadOptions, sha256: string) =>
  storageApi<InitResponse>('/uploads/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucketId: options.bucketId,
      logicalPath: options.logicalPath,
      originalFilename: options.file.name,
      mimeType: options.file.type || 'application/octet-stream',
      originalSize: options.file.size,
      sha256,
      workspaceId: options.workspaceId || null,
    }),
    signal: options.signal,
  });

export const uploadWerseeFile = async (options: WerseeUploadOptions): Promise<WerseeStoredObject> => {
  const abortController = new AbortController();
  const gate = pauseGate();
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, abortController.signal])
    : abortController.signal;
  const uploadOptions = { ...options, signal: combinedSignal };
  const controller: WerseeUploadController = {
    pause: gate.pause,
    resume: gate.resume,
    cancel: () => abortController.abort(),
  };
  options.onController?.(controller);

  const sha256 = await hashBlobIncrementally(options.file, combinedSignal);
  const fileFingerprint = fingerprint(options.file, sha256);
  const init = await initiate(uploadOptions, sha256);
  if (init.deduplicated && init.objectId) {
    clearPersisted(fileFingerprint);
    const resolved = await storageApi<{ object: WerseeStoredObject }>(
      `/objects/resolve?bucket=${encodeURIComponent(options.bucketId)}&path=${encodeURIComponent(options.logicalPath)}`,
      { signal: combinedSignal },
    );
    return resolved.object;
  }

  const state: PersistedUpload = {
    uploadId: init.uploadId,
    provider: init.provider,
    sha256,
    fingerprint: fileFingerprint,
    acknowledgedSlices: [],
    storagePath: init.storagePath,
    signedUploadToken: init.signedUploadToken,
    updatedAt: new Date().toISOString(),
  };
  persist(state);

  try {
    if (init.provider === 'supabase') {
      if (!init.storagePath || !init.signedUploadToken) throw new Error('SUPABASE_UPLOAD_GRANT_MISSING');
      await uploadSupabaseBackup(options.file, options.bucketId, init.storagePath, init.signedUploadToken, uploadOptions, controller);
      const completed = await storageApi<{ object: WerseeStoredObject }>(`/uploads/${init.uploadId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: init.storagePath }),
        signal: combinedSignal,
      });
      clearPersisted(fileFingerprint);
      return completed.object;
    }
    const object = await uploadStrato(init, options.file, sha256, state, uploadOptions, gate);
    clearPersisted(fileFingerprint);
    return object;
  } catch (error) {
    if (
      init.provider !== 'strato'
      || combinedSignal.aborted
      || !isTemporaryStorageFailure(error)
      || init.bucketPolicy?.fallback_to_supabase === false
    ) throw error;

    const fallback = await storageApi<{
      storagePath: string;
      signedUploadToken: string;
    }>(`/uploads/${init.uploadId}/fallback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: combinedSignal,
    });
    state.provider = 'supabase';
    state.storagePath = fallback.storagePath;
    state.signedUploadToken = fallback.signedUploadToken;
    persist(state);
    await uploadSupabaseBackup(
      options.file,
      options.bucketId,
      fallback.storagePath,
      fallback.signedUploadToken,
      uploadOptions,
      controller,
    );
    const completed = await storageApi<{ object: WerseeStoredObject }>(`/uploads/${init.uploadId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: fallback.storagePath }),
      signal: combinedSignal,
    });
    clearPersisted(fileFingerprint);
    return completed.object;
  }
};

export const resumeWerseeUpload = async (options: WerseeUploadOptions) => {
  const sha256 = await hashBlobIncrementally(options.file, options.signal);
  const saved = localStorage.getItem(storageKey(fingerprint(options.file, sha256)));
  if (!saved) return uploadWerseeFile(options);
  // Re-init is deliberate: the server is authoritative about expiry and provider.
  // Deduplication prevents duplicate physical bytes when the earlier upload completed.
  return uploadWerseeFile(options);
};
