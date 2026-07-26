import { createServerClient } from '@supabase/ssr';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAuthArtifactName, SUPABASE_BROWSER_AUTH_STORAGE_KEY } from '../../lib/authSessionCleanup';

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
  };
};

type ServerClientFactory = typeof createServerClient;

export interface FrontChannelLogoutDependencies {
  createClient?: ServerClientFactory;
  supabaseKey?: string;
  supabaseUrl?: string;
}

const fixedAuthCookieNames = [
  SUPABASE_BROWSER_AUTH_STORAGE_KEY,
  'supabase-auth-token',
  'wersee_auth',
  'wersee_session',
  'wersee_oauth_state',
  'wersee_oauth_nonce',
  'wersee_oauth_verifier',
  'wersee_pkce_verifier',
] as const;

const parseCookieHeader = (header: string | undefined) => {
  if (!header) return [] as Array<{ name: string; value: string }>;

  return header.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return [];
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) return [];
    try {
      return [{ name, value: decodeURIComponent(rawValue) }];
    } catch {
      return [{ name, value: rawValue }];
    }
  });
};

const readMicrosoftParameters = (requestUrl: string | undefined) => {
  const url = new URL(requestUrl || '/auth/front-channel-logout', 'https://www.wersee.com');
  const normalize = (value: string | null) => (
    value && value.length <= 2048 && !/[\u0000-\u001f\u007f]/.test(value) ? value : null
  );
  return {
    sid: normalize(url.searchParams.get('sid')),
    iss: normalize(url.searchParams.get('iss')),
  };
};

const serializeExpiredCookie = (name: string, path: '/' | '/auth', domain?: string) => {
  const attributes = [
    `${name}=`,
    `Path=${path}`,
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'Secure',
    'SameSite=None',
  ];
  if (domain) attributes.push(`Domain=${domain}`);
  return attributes.join('; ');
};

const expiredCookieHeaders = (incomingCookies: Array<{ name: string; value: string }>) => {
  const names = new Set<string>(fixedAuthCookieNames);
  for (const { name } of incomingCookies) {
    if (isAuthArtifactName(name)) names.add(name);
  }

  return [...names].flatMap((name) => [
    serializeExpiredCookie(name, '/'),
    serializeExpiredCookie(name, '/auth'),
    serializeExpiredCookie(name, '/', '.wersee.com'),
    serializeExpiredCookie(name, '/auth', '.wersee.com'),
  ]);
};

const serializeSupabaseCookie = ({ name, value, options = {} }: CookieToSet) => {
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) return null;
  const attributes = [`${name}=${encodeURIComponent(value)}`];
  if (options.path) attributes.push(`Path=${options.path}`);
  if (options.domain) attributes.push(`Domain=${options.domain}`);
  if (typeof options.maxAge === 'number') attributes.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly) attributes.push('HttpOnly');
  if (options.secure) attributes.push('Secure');
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? 'Strict' : `${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`;
    attributes.push(`SameSite=${sameSite}`);
  }
  return attributes.join('; ');
};

export const frontChannelLogoutSecurityHeaders = {
  'Cache-Control': 'no-store, private',
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'unsafe-inline'",
    "connect-src https://*.supabase.co",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    'frame-ancestors https://login.microsoftonline.com https://*.microsoftonline.com',
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const;

const signedOutPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>You have been signed out</title>
  <style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080808;color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}.card{width:min(100%,440px);text-align:center;border:1px solid #292929;border-radius:24px;background:#111;padding:40px 28px;box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{font-size:clamp(1.75rem,5vw,2.25rem);line-height:1.1;margin:0 0 14px}p{color:#b6b6b6;line-height:1.6;margin:0 0 28px}a{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:999px;background:#fff;color:#080808;text-decoration:none;font-weight:700;padding:0 24px}a:focus-visible{outline:3px solid #8ab4ff;outline-offset:4px}
  </style>
  <script type="module" src="/assets/front-channel-logout.js"></script>
</head>
<body>
  <main class="card">
    <h1>You have been signed out</h1>
    <p>Your Wersee session has been securely ended.</p>
    <a href="https://www.wersee.com">Return to Wersee</a>
  </main>
</body>
</html>`;

export const handleFrontChannelLogout = async (
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: FrontChannelLogoutDependencies = {},
) => {
  if (request.method && request.method !== 'GET') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET');
    response.end();
    return;
  }

  // Entra supplies these for correlation, but Wersee deliberately neither stores nor reflects them.
  void readMicrosoftParameters(request.url);

  const incomingCookies = parseCookieHeader(request.headers.cookie);
  const outgoingCookies: CookieToSet[] = [];
  const supabaseUrl = dependencies.supabaseUrl
    || process.env.SUPABASE_URL
    || process.env.VITE_SUPABASE_URL;
  const supabaseKey = dependencies.supabaseKey
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const factory = dependencies.createClient || createServerClient;
      const supabase = factory(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: true,
        },
        cookies: {
          getAll: () => incomingCookies,
          setAll: (cookies: CookieToSet[]) => {
            outgoingCookies.push(...cookies);
          },
        },
      });
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Missing, expired, malformed, and already-cleared sessions all produce the same safe response.
    }
  }

  const supabaseCookieHeaders = outgoingCookies
    .map(serializeSupabaseCookie)
    .filter((value): value is string => Boolean(value));
  response.setHeader('Set-Cookie', [
    ...supabaseCookieHeaders,
    ...expiredCookieHeaders(incomingCookies),
  ]);
  for (const [name, value] of Object.entries(frontChannelLogoutSecurityHeaders)) {
    response.setHeader(name, value);
  }
  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(signedOutPage);
};
