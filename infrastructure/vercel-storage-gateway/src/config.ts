import { ApiError } from './errors.js';

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError('CONFIGURATION_MISSING', `Missing server configuration: ${name}`, 503);
  return value;
};

export const MIB = 1024 * 1024;
export const LOGICAL_CHUNK_SIZE = 24 * MIB;
export const TRANSPORT_SLICE_SIZE = 3 * MIB;
export const PACK_ENTRY_MAX = 2 * MIB;
export const PACK_TARGET_SIZE = 64 * MIB;

export type GatewayConfig = ReturnType<typeof getConfig>;

export const getConfig = () => ({
  supabaseUrl: required('SUPABASE_URL').replace(/\/$/, ''),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  sftpHost: required('STRATO_SFTP_HOST'),
  sftpPort: Number(process.env.STRATO_SFTP_PORT || 22),
  sftpUsername: required('STRATO_SFTP_USERNAME'),
  sftpPassword: required('STRATO_SFTP_PASSWORD'),
  sftpRoot: (process.env.STRATO_SFTP_ROOT || '/storage').replace(/\/+$/, ''),
  cronSecret: process.env.CRON_SECRET?.trim() || '',
  capabilitySecret: required('WERSEE_STORAGE_CAPABILITY_SECRET'),
  requestTimeoutMs: Math.min(Number(process.env.STORAGE_TIMEOUT_MS || 120_000), 240_000),
});
