import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { normalizeSiteSlug, SYSTEM_SITE_SLUGS, validateSiteSlug } from '../../lib/siteSlug.js';

export { normalizeSiteSlug, SYSTEM_SITE_SLUGS, validateSiteSlug };

export const normalizeArchivePath = (input: string) => {
  if (!input || input.includes('\0')) throw new Error('EMPTY_OR_NULL_PATH');
  const slashPath = input.replace(/\\/g, '/');
  if (slashPath.startsWith('/') || /^[a-zA-Z]:\//.test(slashPath)) throw new Error('ABSOLUTE_PATH');
  const segments = slashPath.split('/').filter((segment) => segment && segment !== '.');
  if (segments.some((segment) => segment === '..')) throw new Error('PATH_TRAVERSAL');
  const normalized = path.posix.normalize(segments.join('/'));
  if (!normalized || normalized === '.' || normalized.startsWith('../')) throw new Error('PATH_TRAVERSAL');
  return normalized;
};

const secretBasenames = new Set([
  'id_rsa', 'id_ed25519', 'service-account.json', 'credentials.json', '.ds_store', 'thumbs.db',
]);
const executableExtensions = new Set([
  '.exe', '.dll', '.com', '.msi', '.bat', '.cmd', '.ps1', '.sh', '.bash', '.zsh', '.fish', '.app',
  '.apk', '.deb', '.rpm', '.dmg', '.pkg', '.jar', '.class', '.py', '.rb', '.php', '.pl', '.cgi',
]);

export const blockedFileReason = (input: string) => {
  const normalized = input.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();
  const segments = lower.split('/');
  const basename = segments.at(-1) || '';
  const extension = path.posix.extname(basename);
  if (segments.includes('.git')) return 'Git metadata is not publishable.';
  if (segments.includes('node_modules')) return 'Dependency folders are not publishable.';
  if (basename === '.env' || basename.startsWith('.env.')) return 'Environment files may contain secrets.';
  if (extension === '.pem' || extension === '.key' || secretBasenames.has(basename)) return 'Credential or key material is blocked.';
  if (executableExtensions.has(extension)) return 'Executable or server-side files are blocked.';
  if (segments[0] === 'api' || segments[0] === 'functions' || segments[0] === '.vercel') return 'Server routes and Vercel internals are reserved.';
  if (lower === 'vercel.json' || lower === 'now.json') return 'Deployment configuration is generated securely by Wersee.';
  if (lower.startsWith('_wersee/') || lower.startsWith('.well-known/wersee/') || lower.startsWith('api/wersee/')) return 'This path is reserved by Wersee.';
  return null;
};

const sensitiveQueryNames = /^(token|code|key|secret|password|email|session|auth)$/i;

export const stripSensitiveQueryParameters = (value: string, origin = 'https://example.invalid') => {
  const url = new URL(value, origin);
  for (const key of [...url.searchParams.keys()]) {
    if (sensitiveQueryNames.test(key)) url.searchParams.delete(key);
  }
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ''}`;
};

export const safeAnalyticsPath = (value: string) => {
  try {
    return stripSensitiveQueryParameters(value).slice(0, 2048);
  } catch {
    return '/';
  }
};

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
export const sha1Buffer = (value: Buffer) => createHash('sha1').update(value).digest('hex');

export type PreviewTokenPayload = { siteId: string; releaseId: string; expiresAt: number };

export const createPreviewToken = (payload: PreviewTokenPayload, secret: string) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

export const verifyPreviewToken = (token: string, secret: string): PreviewTokenPayload | null => {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = createHmac('sha256', secret).update(encoded).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PreviewTokenPayload;
    if (!payload.siteId || !payload.releaseId || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const sanitizeElementLabel = (value: unknown) => String(value || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 120);

export const isAllowedSiteOrigin = (origin: string, slug: string, rootDomain: string) => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.hostname === `${slug}.${rootDomain}` && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};
