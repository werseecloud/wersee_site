import type { SupabaseClient, User } from '@supabase/supabase-js';

export const SUPABASE_BROWSER_AUTH_STORAGE_KEY = 'sb-auth-token';
export const WERSEE_LOGIN_URL = 'https://www.wersee.com/login';

const knownAuthArtifactNames = new Set([
  SUPABASE_BROWSER_AUTH_STORAGE_KEY,
  'supabase-auth-token',
  'wersee_auth',
  'wersee_session',
  'wersee_oauth_state',
  'wersee_oauth_nonce',
  'wersee_oauth_verifier',
  'wersee_pkce_verifier',
  'oauth_provider_token',
  'oauth_provider_refresh_token',
]);

export const isAuthArtifactName = (name: string) => {
  const normalized = name.toLowerCase();
  return knownAuthArtifactNames.has(normalized)
    || /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/.test(normalized)
    || /^supabase[-_:].*auth/.test(normalized)
    || /^wersee[-_:].*(?:auth|session|oauth|pkce)/.test(normalized)
    || /^(?:oauth|pkce)[-_:].*(?:state|nonce|verifier|token)$/.test(normalized);
};

const clearStorage = (storage: Storage) => {
  for (const key of Object.keys(storage)) {
    if (isAuthArtifactName(key)) storage.removeItem(key);
  }
};

export const clearClientAuthArtifacts = () => {
  if (typeof window === 'undefined') return;

  try {
    clearStorage(window.localStorage);
  } catch {
    // Storage can be unavailable in a third-party iframe.
  }

  try {
    clearStorage(window.sessionStorage);
  } catch {
    // Storage can be unavailable in a third-party iframe.
  }

  try {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=', 1)[0]?.trim();
      if (!name || !isAuthArtifactName(name)) continue;
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      document.cookie = `${name}=; Path=/auth; Max-Age=0; SameSite=Lax`;
    }
  } catch {
    // HttpOnly cookies are cleared by the server endpoint.
  }
};

export const clearImplicitAuthCallbackHash = () => {
  if (typeof window === 'undefined' || !window.location.hash) return false;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const isImplicitAuthCallback = [
    'access_token',
    'refresh_token',
    'provider_token',
    'provider_refresh_token',
    'error',
    'error_code',
    'error_description',
  ].some((name) => params.has(name));

  if (!isImplicitAuthCallback) return false;

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, '', cleanUrl);
  return true;
};

export const isMicrosoftSupabaseUser = (user: User | null) => {
  if (!user) return false;
  const provider = String(user.app_metadata?.provider || '').toLowerCase();
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.map((value: unknown) => String(value).toLowerCase())
    : [];
  return provider === 'azure' || providers.includes('azure');
};

export const buildMicrosoftLogoutUrl = () => {
  const configuredEndpoint = String(import.meta.env.VITE_MICROSOFT_LOGOUT_ENDPOINT || '').trim();
  let endpoint = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/logout');

  if (configuredEndpoint) {
    try {
      const candidate = new URL(configuredEndpoint);
      if (
        candidate.protocol === 'https:'
        && (candidate.hostname === 'login.microsoftonline.com' || candidate.hostname.endsWith('.login.microsoftonline.com'))
      ) {
        endpoint = candidate;
      }
    } catch {
      // Use Microsoft's tenant-neutral endpoint when configuration is invalid.
    }
  }

  endpoint.searchParams.set('post_logout_redirect_uri', WERSEE_LOGIN_URL);
  return endpoint.toString();
};

export const terminateInteractiveWerseeSession = async (
  client: SupabaseClient,
  user: User | null,
) => {
  const redirectToMicrosoft = isMicrosoftSupabaseUser(user);

  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Local cleanup must still succeed for expired or malformed sessions.
  } finally {
    clearClientAuthArtifacts();
  }

  try {
    await fetch('/auth/front-channel-logout', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    // The browser cleanup above remains effective if the server is unavailable.
  }

  return redirectToMicrosoft ? buildMicrosoftLogoutUrl() : null;
};
