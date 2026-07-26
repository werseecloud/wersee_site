import {
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  detectLocaleFromSignals,
  getLocaleFromPathname,
  normalizeCurrency,
  normalizeLocale,
} from '../../src/lib/locales.ts';

const ONE_YEAR = 31536000;
const PUBLIC_FILE = /\.[a-z0-9]+$/i;
const SKIP_SEGMENTS = new Set([
  'api',
  'assets',
  'auth',
  'dashboard',
  'electron',
  'firebase-messaging-sw.js',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'sitemap-products.xml',
  'sitemap-creators.xml',
  'sitemap-categories.xml',
  'sw.js',
  'workspace',
]);

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getCountryCode = (context: any) => {
  return context?.geo?.country?.code || context?.geo?.country || null;
};

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] || '';

  if (
    request.method !== 'GET' ||
    PUBLIC_FILE.test(url.pathname) ||
    SKIP_SEGMENTS.has(firstSegment)
  ) {
    return context.next();
  }

  const localeInPath = getLocaleFromPathname(url.pathname);
  if (localeInPath) {
    const response = await context.next();
    const config = detectLocaleFromSignals({ preferredLocale: localeInPath });
    const preferredCurrency = normalizeCurrency(getCookie(request, CURRENCY_COOKIE));
    response.headers.append('Set-Cookie', `${LOCALE_COOKIE}=${encodeURIComponent(localeInPath)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`);
    response.headers.append('Set-Cookie', `${CURRENCY_COOKIE}=${encodeURIComponent(preferredCurrency || config.currency)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`);
    return response;
  }

  const preferredLocale = normalizeLocale(getCookie(request, LOCALE_COOKIE));
  const preferredCurrency = normalizeCurrency(getCookie(request, CURRENCY_COOKIE));
  const config = detectLocaleFromSignals({
    preferredLocale,
    countryCode: getCountryCode(context),
    acceptLanguage: request.headers.get('accept-language'),
  });

  const targetUrl = new URL(request.url);
  targetUrl.pathname = `/${config.locale}${url.pathname === '/' ? '' : url.pathname}`;
  const response = Response.redirect(targetUrl, 302);
  response.headers.append('Set-Cookie', `${LOCALE_COOKIE}=${encodeURIComponent(config.locale)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`);
  response.headers.append('Set-Cookie', `${CURRENCY_COOKIE}=${encodeURIComponent(preferredCurrency || config.currency)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
