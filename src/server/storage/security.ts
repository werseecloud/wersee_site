import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type GatewayCapability = {
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

type DownloadGrant = {
  purpose: 'app-download';
  object_id: string;
  user_id: string;
  expires_at: number;
  nonce: string;
  allowed_range?: string | null;
};

const sign = (payload: object, secret: string) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

export const signGatewayCapability = (
  input: Omit<GatewayCapability, 'expires_at' | 'nonce'>,
  secret: string,
  lifetimeSeconds = 180,
) => sign({
  ...input,
  expires_at: Math.floor(Date.now() / 1000) + lifetimeSeconds,
  nonce: randomUUID(),
}, secret);

export const createDownloadGrant = (
  input: Omit<DownloadGrant, 'purpose' | 'expires_at' | 'nonce'>,
  secret: string,
  lifetimeSeconds = 180,
) => sign({
  ...input,
  purpose: 'app-download',
  expires_at: Math.floor(Date.now() / 1000) + lifetimeSeconds,
  nonce: randomUUID(),
}, secret);

export const verifyDownloadGrant = (raw: string, secret: string): DownloadGrant | null => {
  const [payloadPart, signaturePart, extra] = raw.split('.');
  if (!payloadPart || !signaturePart || extra) return null;
  const expected = createHmac('sha256', secret).update(payloadPart).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signaturePart, 'base64url');
  } catch {
    return null;
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as DownloadGrant;
    const now = Math.floor(Date.now() / 1000);
    if (
      payload.purpose !== 'app-download'
      || payload.expires_at <= now
      || payload.expires_at > now + 10 * 60
      || !payload.object_id
      || !payload.user_id
      || !payload.nonce
    ) return null;
    return payload;
  } catch {
    return null;
  }
};

export const normalizeLogicalPath = (value: unknown) => {
  const path = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
  if (!path || path.length > 1024 || path.includes('\0') || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('INVALID_LOGICAL_PATH');
  }
  return path;
};

export const isSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
