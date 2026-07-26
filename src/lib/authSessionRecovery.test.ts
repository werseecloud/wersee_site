import { describe, expect, it, vi } from 'vitest';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { recoverSupabaseSession } from './authSessionRecovery';

const session = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.signature',
  refresh_token: 'user-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'user-1' },
} as Session;

const createClient = ({
  getUserResult = { data: { user: session.user }, error: null },
  refreshResult = { data: { session: null, user: null }, error: null },
}: {
  getUserResult?: unknown;
  refreshResult?: unknown;
} = {}) => {
  const getSession = vi.fn().mockResolvedValue({
    data: { session },
    error: null,
  });
  const getUser = vi.fn().mockResolvedValue(getUserResult);
  const refreshSession = vi.fn().mockResolvedValue(refreshResult);
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const setAuth = vi.fn().mockResolvedValue(undefined);

  return {
    client: {
      auth: { getSession, getUser, refreshSession, signOut },
      realtime: { setAuth },
    } as unknown as SupabaseClient,
    getUser,
    refreshSession,
    signOut,
    setAuth,
  };
};

describe('Supabase session recovery', () => {
  it('validates a stored user token before exposing the session', async () => {
    const fixture = createClient();

    await expect(recoverSupabaseSession(fixture.client)).resolves.toBe(session);
    expect(fixture.getUser).toHaveBeenCalledWith(session.access_token);
    expect(fixture.refreshSession).not.toHaveBeenCalled();
    expect(fixture.setAuth).toHaveBeenCalledWith(session.access_token);
  });

  it('refreshes a rejected stored token and updates Realtime auth', async () => {
    const refreshedSession = {
      ...session,
      access_token: 'refreshed-user-token',
    } as Session;
    const fixture = createClient({
      getUserResult: {
        data: { user: null },
        error: { status: 403, code: 'bad_jwt', message: 'invalid claim' },
      },
      refreshResult: {
        data: { session: refreshedSession, user: refreshedSession.user },
        error: null,
      },
    });

    await expect(recoverSupabaseSession(fixture.client)).resolves.toBe(refreshedSession);
    expect(fixture.refreshSession).toHaveBeenCalledOnce();
    expect(fixture.signOut).not.toHaveBeenCalled();
    expect(fixture.setAuth).toHaveBeenCalledWith(refreshedSession.access_token);
  });

  it('removes an unrecoverable session instead of leaking it into REST and Realtime', async () => {
    const fixture = createClient({
      getUserResult: {
        data: { user: null },
        error: { status: 403, code: 'bad_jwt', message: 'missing sub claim' },
      },
      refreshResult: {
        data: { session: null, user: null },
        error: { status: 400, message: 'Invalid Refresh Token' },
      },
    });

    await expect(recoverSupabaseSession(fixture.client)).resolves.toBeNull();
    expect(fixture.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(fixture.setAuth).toHaveBeenLastCalledWith();
  });

  it('clears a missing-sub token locally without making an Auth request', async () => {
    const missingSubjectSession = {
      ...session,
      access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.signature',
    } as Session;
    const fixture = createClient();
    (fixture.client.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: missingSubjectSession },
      error: null,
    });
    const clearStoredSession = vi.fn();

    await expect(recoverSupabaseSession(
      fixture.client,
      { clearStoredSession },
    )).resolves.toBeNull();
    expect(clearStoredSession).toHaveBeenCalledOnce();
    expect(fixture.getUser).not.toHaveBeenCalled();
    expect(fixture.refreshSession).not.toHaveBeenCalled();
    expect(fixture.signOut).not.toHaveBeenCalled();
    expect(fixture.setAuth).toHaveBeenCalledWith();
  });

  it('does not destroy a cached session for a transient network failure', async () => {
    const fixture = createClient({
      getUserResult: {
        data: { user: null },
        error: { status: 0, message: 'Failed to fetch' },
      },
    });

    await expect(recoverSupabaseSession(fixture.client)).resolves.toBe(session);
    expect(fixture.refreshSession).not.toHaveBeenCalled();
    expect(fixture.signOut).not.toHaveBeenCalled();
  });
});
