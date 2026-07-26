import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMicrosoftLogoutUrl,
  clearImplicitAuthCallbackHash,
  isAuthArtifactName,
  isMicrosoftSupabaseUser,
  terminateInteractiveWerseeSession,
} from './authSessionCleanup';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('interactive Wersee logout', () => {
  it('recognizes only authentication and temporary OAuth artifacts', () => {
    expect(isAuthArtifactName('sb-project-auth-token.1')).toBe(true);
    expect(isAuthArtifactName('wersee_session')).toBe(true);
    expect(isAuthArtifactName('wersee_oauth_nonce')).toBe(true);
    expect(isAuthArtifactName('wersee_locale')).toBe(false);
    expect(isAuthArtifactName('wersee-shopping-cart-v1')).toBe(false);
  });

  it('removes a rejected implicit callback hash without dropping the redirect query', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      location: {
        hash: '#access_token=rejected&refresh_token=stale&expires_in=3600',
        pathname: '/auth/callback',
        search: '?redirect=%2Fworkspace',
      },
      history: { state: null, replaceState },
    });

    expect(clearImplicitAuthCallbackHash()).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/auth/callback?redirect=%2Fworkspace',
    );
  });

  it('detects Microsoft Supabase accounts and creates a loop-safe return URL', () => {
    const user = { app_metadata: { provider: 'azure', providers: ['email', 'azure'] } };
    expect(isMicrosoftSupabaseUser(user as never)).toBe(true);

    const logoutUrl = new URL(buildMicrosoftLogoutUrl());
    expect(logoutUrl.origin).toBe('https://login.microsoftonline.com');
    expect(logoutUrl.pathname).toBe('/common/oauth2/v2.0/logout');
    expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe('https://www.wersee.com/login');
    expect(logoutUrl.toString()).not.toContain('front-channel-logout');
  });

  it('uses local Supabase sign-out, clears server cookies, and only redirects Microsoft users', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const redirect = await terminateInteractiveWerseeSession(
      { auth: { signOut } } as never,
      { app_metadata: { providers: ['azure'] } } as never,
    );

    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(fetchMock).toHaveBeenCalledWith('/auth/front-channel-logout', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    expect(redirect).toContain('login.microsoftonline.com');
  });

  it('does not fail or redirect when the local session is already absent', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('missing session'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(terminateInteractiveWerseeSession(
      { auth: { signOut } } as never,
      null,
    )).resolves.toBeNull();
  });
});
