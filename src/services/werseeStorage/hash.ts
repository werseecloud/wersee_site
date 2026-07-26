const HASH_READ_SIZE = 2 * 1024 * 1024;

export const hashBlobIncrementally = async (
  blob: Blob,
  signal?: AbortSignal,
  onBytesRead?: (bytes: number) => void,
) => {
  const worker = new Worker(new URL('./hash.worker.ts', import.meta.url), { type: 'module' });
  try {
    worker.postMessage({ type: 'reset' });
    let read = 0;
    for (let offset = 0; offset < blob.size; offset += HASH_READ_SIZE) {
      if (signal?.aborted) throw new DOMException('Upload aborted.', 'AbortError');
      const bytes = await blob.slice(offset, Math.min(offset + HASH_READ_SIZE, blob.size)).arrayBuffer();
      worker.postMessage({ type: 'update', bytes }, [bytes]);
      read += Math.min(HASH_READ_SIZE, blob.size - offset);
      onBytesRead?.(read);
    }
    return await new Promise<string>((resolve, reject) => {
      const abort = () => reject(new DOMException('Upload aborted.', 'AbortError'));
      signal?.addEventListener('abort', abort, { once: true });
      worker.onmessage = (event: MessageEvent<{ type: string; hex: string }>) => {
        if (event.data.type === 'digest') {
          signal?.removeEventListener('abort', abort);
          resolve(event.data.hex);
        }
      };
      worker.onerror = () => reject(new Error('HASH_WORKER_FAILED'));
      worker.postMessage({ type: 'digest' });
    });
  } finally {
    worker.terminate();
  }
};
