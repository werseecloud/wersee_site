import { sha256 } from '@noble/hashes/sha2.js';

type HashMessage =
  | { type: 'reset' }
  | { type: 'update'; bytes: ArrayBuffer }
  | { type: 'digest' };

let hasher = sha256.create();

self.onmessage = (event: MessageEvent<HashMessage>) => {
  if (event.data.type === 'reset') {
    hasher = sha256.create();
    return;
  }
  if (event.data.type === 'update') {
    hasher.update(new Uint8Array(event.data.bytes));
    return;
  }
  const result = hasher.digest();
  const hex = Array.from(result).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  self.postMessage({ type: 'digest', hex });
};
