import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabaseAnonKey = supabasePublishableKey;
export const authEmail2faPendingKey = 'wersee:auth-email-2fa-pending';

const authEmail2faTtlMs = 10 * 60 * 1000;
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const productionAppBaseUrl = trimTrailingSlash(
  import.meta.env.VITE_APP_BASE_URL ||
  import.meta.env.VITE_SITE_URL ||
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  'https://wersee.com',
);

export const getAppBaseUrl = () => {
  if (typeof window === 'undefined') return productionAppBaseUrl;

  const { hostname, origin } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local');

  return import.meta.env.DEV || isLocalHost ? origin : productionAppBaseUrl;
};

export const buildAppUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
};

export const setAuthEmail2faPending = (email: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(authEmail2faPendingKey, JSON.stringify({
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
  }));
};

export const clearAuthEmail2faPending = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(authEmail2faPendingKey);
};

export const isAuthEmail2faPending = () => {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(authEmail2faPendingKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { createdAt?: number };
    const isFresh = typeof parsed.createdAt === 'number' && Date.now() - parsed.createdAt < authEmail2faTtlMs;
    if (!isFresh) clearAuthEmail2faPending();
    return isFresh;
  } catch {
    clearAuthEmail2faPending();
    return false;
  }
};

// --- INITIALIZE CLIENT ---
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    experimental: {
      passkey: true,
    },
    storage: typeof window !== 'undefined'
      ? {
          getItem: (key: string) => window.localStorage.getItem(key),
          setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
          removeItem: (key: string) => window.localStorage.removeItem(key),
        }
      : undefined,
  },
  global: {
    fetch: (input, init) => globalThis.fetch(input, init),
  }
});

export const trackCurrentAuthDevice = async () => {
  try {
    const { error } = await supabase.functions.invoke('track-auth-device', { body: {} });
    if (error) throw error;
  } catch (error) {
    console.warn('Auth device tracking failed:', error);
  }
};

// --- WAIT FOR SERVER HELPER ---
let serverHealthStatus: 'unknown' | 'ready' | 'unavailable' = 'unknown';
let serverHealthPromise: Promise<boolean> | null = null;

const apiRunnerEnv = (import.meta.env.VITE_API_RUNNER_URL as string) || '';
const isLocalDevHost =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiRunnerUrl = apiRunnerEnv.replace(/\/$/, '') || (isLocalDevHost ? '/api/api-runner' : '');
const directApiRunnerUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/api-runner`;

const isHtmlResponse = (text: string) => /<!doctype|<html/i.test(text.trim());

export const isMissingSupabaseSchemaError = (error: any) => {
  const code = String(error?.code || '');
  const status = Number(error?.status || 0);
  const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();

  return (
    status === 404 ||
    ['42P01', '42703', 'PGRST202', 'PGRST204'].includes(code) ||
    message.includes('could not find') ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('relation') && message.includes('not found') ||
    message.includes('function') && message.includes('not found')
  );
};

export const isStripeAccountInaccessibleError = (error: any) => {
  const code = String(error?.code || '');
  const message = String(error?.message || error?.error || '').toLowerCase();

  return (
    error?.resetAccount === true ||
    code === 'STRIPE_ACCOUNT_INACCESSIBLE' ||
    code === 'account_invalid' ||
    message.includes('does not have access to account') ||
    message.includes('account does not exist') ||
    message.includes('application access may have been revoked') ||
    message.includes('is not a connected account')
  );
};

export const clearStoredStripeAccount = async (userId: string) => {
  localStorage.removeItem(`stripe_account_id_${userId}`);

  const clearProfile = supabase
    .from('profiles')
    .update({ stripe_account_id: null })
    .eq('id', userId);

  const clearBusinessInfo = supabase
    .from('business_info')
    .update({ stripe_account_id: null })
    .eq('user_id', userId);

  await Promise.allSettled([clearProfile, clearBusinessInfo]);
};

const runHealthCheck = async (retries = 6, delay = 1000) => {
  if (!apiRunnerUrl) {
    // No local API runner is configured in production; use Supabase Functions directly.
    serverHealthStatus = 'ready';
    return true;
  }

  const healthUrl = apiRunnerEnv ? `${apiRunnerUrl}/health` : '/api/health';
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(healthUrl, { cache: 'no-store' });
      const text = await response.text();

      if (response.ok && text.includes('"status":"ok"')) {
        serverHealthStatus = 'ready';
        if (import.meta.env.DEV) {
          console.log('Backend server is ready.');
        }
        return true;
      }

      // In static/SSR-only deployments this endpoint often does not exist.
      if ([403, 404, 405].includes(response.status) || isHtmlResponse(text)) {
        serverHealthStatus = 'unavailable';
        return false;
      }
    } catch {
      // Ignore transient startup/network failures and retry.
    }

    if (import.meta.env.DEV && i % 5 === 0) {
      console.log(`Waiting for backend server... (attempt ${i + 1}/${retries})`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  serverHealthStatus = 'unavailable';
  return false;
};

export const waitForServer = async (retries = 6, delay = 1000) => {
  if (serverHealthStatus === 'ready') return true;
  if (serverHealthStatus === 'unavailable') return false;

  if (!serverHealthPromise) {
    serverHealthPromise = runHealthCheck(retries, delay).finally(() => {
      serverHealthPromise = null;
    });
  }

  return serverHealthPromise;
};

// --- API RUNNER HELPER ---
export const invokeApiRunner = async (action: string, params: any = {}, retries = 5, delay = 2000) => {
  // Wait for server to be ready before attempting any API calls
  const localRunnerReady = await waitForServer();

  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = apiRunnerUrl && localRunnerReady ? apiRunnerUrl : directApiRunnerUrl;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${supabasePublishableKey}`,
          'apikey': supabasePublishableKey,
        },
        body: JSON.stringify({ action, ...params }),
      });

      const text = await response.text();
      const lowerText = text.trim().toLowerCase();
      
      // Check if the response is HTML (Starting Server page)
      if (lowerText.startsWith('<!doctype') || lowerText.startsWith('<html')) {
        if (i < retries) {
          if (import.meta.env.DEV) console.warn(`API Runner returned HTML (attempt ${i + 1}/${retries + 1}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000); // Exponential backoff with cap
          continue;
        }
        throw new Error('API Runner is currently unavailable (returned HTML). The server might still be starting up. Please refresh the page in a few seconds.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (i < retries) {
          if (import.meta.env.DEV) console.warn(`API Runner returned invalid JSON (attempt ${i + 1}/${retries + 1}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000);
          continue;
        }
        throw new Error(`API Runner returned invalid JSON: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        const apiError: any = new Error(data.error || 'API Runner failed');
        apiError.code = data.code;
        apiError.status = response.status;
        apiError.details = data.details;
        apiError.resetAccount = data.resetAccount || data.details?.resetAccount;
        throw apiError;
      }

      // Check if the response itself indicates an error (e.g., from our global middleware)
      if (data && data.success === false && data.error) {
        const apiError: any = new Error(data.error);
        apiError.code = data.code;
        apiError.details = data.details;
        apiError.resetAccount = data.resetAccount || data.details?.resetAccount;
        throw apiError;
      }

      return data;
    } catch (error: any) {
      if (i < retries && (error.message.includes('Failed to fetch') || error.message.includes('unreachable') || error.message.includes('returned HTML'))) {
        if (import.meta.env.DEV) console.warn(`API Runner fetch failed (attempt ${i + 1}/${retries + 1}). Retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000);
        continue;
      }
      
      if (error.message.includes('Failed to fetch')) {
        console.error('Critical: Failed to fetch from API. Please ensure your VITE_SUPABASE_URL is correct and the backend server is running.');
      }
      // Let the caller handle the error logging
      throw error;
    }
  }
};

const teamChatSetupPromises = new Map<string, Promise<string | null>>();
const teamChatSetupFailures = new Set<string>();

const rpcGetOrCreateTeamChat = async (teamId: string) => {
  const { data, error } = await supabase.rpc('get_or_create_team_chat', { p_team_id: teamId });

  if (error) {
    if (isMissingSupabaseSchemaError(error) || Number((error as any).status || 0) === 400) {
      teamChatSetupFailures.add(teamId);
      return null;
    }
    throw error;
  }

  return data as string | null;
};

const createTeamChatDirectly = async (teamId: string, teamName?: string) => {
  const { data: existing, error: existingError } = await supabase
    .from('chats')
    .select('id')
    .eq('team_id', teamId)
    .limit(1);

  if (existingError) {
    if (isMissingSupabaseSchemaError(existingError)) {
      teamChatSetupFailures.add(teamId);
      return null;
    }
    return rpcGetOrCreateTeamChat(teamId);
  }

  if (existing?.[0]?.id) return existing[0].id as string;

  const { data: created, error: createError } = await supabase
    .from('chats')
    .insert({
      is_group: true,
      team_id: teamId,
      name: teamName ? `${teamName} Team Chat` : 'Team Chat',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (createError) {
    return rpcGetOrCreateTeamChat(teamId);
  }

  const chatId = created?.id as string | undefined;
  if (!chatId) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('chat_participants')
      .insert({ chat_id: chatId, user_id: user.id });
  }

  return chatId;
};

export const getOrCreateTeamChat = (teamId: string, teamName?: string) => {
  if (!teamId || teamChatSetupFailures.has(teamId)) return Promise.resolve(null);

  const existingPromise = teamChatSetupPromises.get(teamId);
  if (existingPromise) return existingPromise;

  const setupPromise = createTeamChatDirectly(teamId, teamName).catch((error) => {
    if (isMissingSupabaseSchemaError(error)) {
      teamChatSetupFailures.add(teamId);
      return null;
    }
    throw error;
  });

  teamChatSetupPromises.set(teamId, setupPromise);
  return setupPromise;
};
