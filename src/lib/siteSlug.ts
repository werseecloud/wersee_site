const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export const SYSTEM_SITE_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'auth', 'account', 'accounts', 'ai', 'assets', 'billing', 'blog', 'cdn',
  'checkout', 'creator', 'creators', 'dashboard', 'developers', 'docs', 'files', 'help', 'mail', 'pay',
  'payments', 'status', 'storage', 'support', 'workspaces',
]);

export const normalizeSiteSlug = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 63)
  .replace(/-$/g, '');

export const validateSiteSlug = (value: string) => {
  const slug = value.toLowerCase().trim();
  if (slug.length < 3 || slug.length > 63 || !slugPattern.test(slug) || slug.includes('--') || slug.includes('..')) {
    return { valid: false, reason: 'Use 3-63 lowercase letters, numbers, or single hyphens.' };
  }
  if (SYSTEM_SITE_SLUGS.has(slug)) return { valid: false, reason: 'This subdomain is reserved by Wersee.' };
  return { valid: true, reason: null };
};
