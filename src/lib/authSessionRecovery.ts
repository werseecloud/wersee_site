import type { Session, SupabaseClient } from '@supabase/supabase-js';

interface SessionRecoveryOptions {
  clearStoredSession?: () => void;
}

const hasUserSubject = (accessToken: string) => {
  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return false;
    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const payload = JSON.parse(globalThis.atob(normalized)) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub.length > 0;
  } catch {
    return false;
  }
};

const isRejectedCredential = (error: unknown) => {
  const status = Number((error as { status?: number } | null)?.status || 0);
  const code = String((error as { code?: string } | null)?.code || '').toLowerCase();
  const message = String((error as { message?: string } | null)?.message || '').toLowerCase();

  return (
    status === 400
    || status === 401
    || status === 403
    || code === 'bad_jwt'
    || code === 'refresh_token_not_found'
    || message.includes('invalid claim')
    || message.includes('invalid jwt')
    || message.includes('jwt expired')
    || message.includes('refresh token')
  );
};

const clearRejectedSession = async (
  client: SupabaseClient,
  clearStoredSession?: () => void,
) => {
  if (clearStoredSession) {
    clearStoredSession();
  } else {
    try {
      await client.auth.signOut({ scope: 'local' });
    } catch {
      // Removing the local auth record is best-effort in blocked-storage browsers.
    }
  }

  try {
    await client.realtime.setAuth();
  } catch {
    // Realtime may not have been initialized yet.
  }
};

export const recoverSupabaseSession = async (
  client: SupabaseClient,
  options: SessionRecoveryOptions = {},
): Promise<Session | null> => {
  const { data: storedData, error: storedError } = await client.auth.getSession();
  if (storedError) {
    if (isRejectedCredential(storedError)) {
      await clearRejectedSession(client, options.clearStoredSession);
    }
    return null;
  }

  const storedSession = storedData.session;
  if (!storedSession) {
    await client.realtime.setAuth();
    return null;
  }

  // A Supabase user access token always has a subject. Legacy anon keys and
  // corrupted JWTs do not, and sending either to Auth/REST/Realtime only
  // creates the missing-sub 401/403 cascade seen in production.
  if (!hasUserSubject(storedSession.access_token)) {
    await clearRejectedSession(client, options.clearStoredSession);
    return null;
  }

  const { data: userData, error: userError } = await client.auth.getUser(
    storedSession.access_token,
  );
  if (!userError && userData.user?.id === storedSession.user.id) {
    await client.realtime.setAuth(storedSession.access_token);
    return storedSession;
  }

  // Keep a cached session during a transient network outage. Only rejected
  // credentials should trigger refresh/removal.
  if (userError && !isRejectedCredential(userError)) return storedSession;

  const { data: refreshedData, error: refreshError } = await client.auth.refreshSession();
  if (!refreshError && refreshedData.session) {
    await client.realtime.setAuth(refreshedData.session.access_token);
    return refreshedData.session;
  }

  if (refreshError && !isRejectedCredential(refreshError)) return storedSession;

  await clearRejectedSession(client, options.clearStoredSession);
  return null;
};
