export type GatewayInitUpload = {
  id: string;
  logical_chunk_size: number;
  transport_slice_size: number;
  chunk_count: number;
  expires_at: string;
};

export type GatewayDeduplicatedUpload = {
  deduplicated: true;
  fileId: string;
  sha256: string;
  url: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = /^[0-9a-f]{64}$/;

export const parseGatewayInit = (value: unknown): GatewayInitUpload | GatewayDeduplicatedUpload => {
  const input = value as Record<string, unknown>;
  if (input?.deduplicated === true) {
    if (!uuid.test(String(input.fileId || '')) || !hash.test(String(input.sha256 || '')) || typeof input.url !== 'string') {
      throw new Error('GATEWAY_INIT_RESPONSE_INVALID');
    }
    return input as GatewayDeduplicatedUpload;
  }
  if (
    !uuid.test(String(input?.id || ''))
    || input.logical_chunk_size !== 24 * 1024 * 1024
    || input.transport_slice_size !== 3 * 1024 * 1024
    || !Number.isSafeInteger(input.chunk_count)
    || Number(input.chunk_count) < 1
    || Number.isNaN(Date.parse(String(input.expires_at || '')))
  ) throw new Error('GATEWAY_INIT_RESPONSE_INVALID');
  return input as GatewayInitUpload;
};
