import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { ApiError } from './errors.js';

export type StorageCapability = {
  purpose: 'upload' | 'download' | 'delete' | 'metadata';
  method: string;
  path: string;
  expires_at: number;
  nonce: string;
  user_id?: string;
  workspace_id?: string | null;
  bucket_id?: string;
  logical_path?: string;
  original_size?: number;
  expected_sha256?: string;
  visibility?: 'public' | 'private';
  storage_file_id?: string;
  object_id?: string;
  allowed_range?: string | null;
};

const decode = (value: string) => {
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new ApiError('CAPABILITY_INVALID', 'Storage capability is invalid.', 401);
  }
};

export const verifyStorageCapability = (
  request: Request,
  secret: string,
  purpose: StorageCapability['purpose'],
) => {
  const raw = String(request.header('x-wersee-storage-capability') || '');
  const [payloadPart, signaturePart, extra] = raw.split('.');
  if (!payloadPart || !signaturePart || extra) {
    throw new ApiError('CAPABILITY_REQUIRED', 'Storage capability is required.', 401);
  }

  const expected = createHmac('sha256', secret).update(payloadPart).digest();
  const supplied = decode(signaturePart);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new ApiError('CAPABILITY_INVALID', 'Storage capability is invalid.', 401);
  }

  let capability: StorageCapability;
  try {
    capability = JSON.parse(decode(payloadPart).toString('utf8')) as StorageCapability;
  } catch {
    throw new ApiError('CAPABILITY_INVALID', 'Storage capability is invalid.', 401);
  }

  if (
    capability.purpose !== purpose
    || capability.method !== request.method
    || capability.path !== request.path
    || !Number.isSafeInteger(capability.expires_at)
    || capability.expires_at <= Math.floor(Date.now() / 1000)
    || capability.expires_at > Math.floor(Date.now() / 1000) + 10 * 60
    || !/^[0-9a-f-]{16,64}$/i.test(capability.nonce || '')
  ) {
    throw new ApiError('CAPABILITY_SCOPE_INVALID', 'Storage capability scope is invalid.', 403);
  }
  return capability;
};
