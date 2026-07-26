import { buildAppUrl, supabase } from './supabase';

export const creatorPlatforms = [
  'YouTube', 'TikTok', 'Instagram', 'X', 'Twitch', 'Kick', 'Facebook', 'LinkedIn',
  'Threads', 'Discord', 'Reddit', 'Snapchat', 'Pinterest', 'Telegram', 'WhatsApp Channels',
  'GitHub', 'Medium', 'Substack', 'Podcast', 'Newsletter', 'Website', 'Blog', 'Other',
] as const;

export const reservedCreatorNames = new Set([
  'admin', 'api', 'auth', 'billing', 'creator', 'creators', 'help', 'legal', 'login', 'logout',
  'official', 'payments', 'security', 'settings', 'stripe', 'support', 'system', 'wersee', 'workspace',
]);

export const normalizeCreatorUsername = (value: string) => value.trim().replace(/^@+/, '').toLowerCase();
export const isCreatorUsernameValid = (value: string) => {
  const username = normalizeCreatorUsername(value);
  return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(username) && !reservedCreatorNames.has(username);
};

export const safeInternalDestination = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : null;
  } catch {
    return null;
  }
};

export const creatorReferralUrl = (username: string, slug = 'main') => {
  const normalizedUsername = normalizeCreatorUsername(username);
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '') || 'main';
  return buildAppUrl(`/r/${encodeURIComponent(normalizedUsername)}${normalizedSlug === 'main' ? '' : `/${encodeURIComponent(normalizedSlug)}`}`);
};

const getCookie = (name: string) => document.cookie.split(';').map((part) => part.trim())
  .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

export const connectCreatorAttribution = async () => {
  if (typeof document === 'undefined') return;
  const attributionToken = getCookie('wersee_creator_attribution');
  if (!attributionToken) return;
  const { error } = await supabase.functions.invoke('creator-attribution-connect', { body: { attributionToken } });
  if (error && import.meta.env.DEV) console.warn('Creator attribution connection failed:', error.message);
};

export const money = (minor: number, currency = 'EUR') => new Intl.NumberFormat(undefined, {
  style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 2,
}).format((Number(minor) || 0) / 100);

export const dateRangeStart = (range: string) => {
  const now = new Date();
  if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (range === 'yesterday') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  if (range === '7d') return new Date(now.getTime() - 7 * 86400000).toISOString();
  if (range === '30d') return new Date(now.getTime() - 30 * 86400000).toISOString();
  if (range === '90d') return new Date(now.getTime() - 90 * 86400000).toISOString();
  if (range === 'year') return new Date(now.getFullYear(), 0, 1).toISOString();
  return null;
};
