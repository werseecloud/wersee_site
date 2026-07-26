import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import vercelConfig from '../../../vercel.json';
import {
  frontChannelLogoutSecurityHeaders,
  handleFrontChannelLogout,
  type FrontChannelLogoutDependencies,
} from './frontChannelLogout';

class MockResponse {
  statusCode = 0;
  body = '';
  readonly headers = new Map<string, string | number | readonly string[]>();

  setHeader(name: string, value: string | number | readonly string[]) {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }

  end(body?: string) {
    this.body = body || '';
    return this;
  }
}

const request = (
  url = '/auth/front-channel-logout',
  cookie?: string,
) => ({
  headers: cookie ? { cookie } : {},
  method: 'GET',
  url,
}) as IncomingMessage;

const response = () => new MockResponse() as unknown as ServerResponse;

const dependencies = (
  signOut: ReturnType<typeof vi.fn>,
): FrontChannelLogoutDependencies => ({
  supabaseKey: 'publishable-test-key',
  supabaseUrl: 'https://project-ref.supabase.co',
  createClient: (() => ({ auth: { signOut } })) as FrontChannelLogoutDependencies['createClient'],
});

const getMockResponse = (value: ServerResponse) => value as unknown as MockResponse;

describe('Microsoft Entra front-channel logout', () => {
  it('terminates an active local Supabase session and removes auth cookies', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const res = response();

    await handleFrontChannelLogout(
      request(
        '/auth/front-channel-logout',
        'sb-project-ref-auth-token=active-session; wersee_oauth_state=temporary; wersee_locale=en',
      ),
      res,
      dependencies(signOut),
    );

    const result = getMockResponse(res);
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('<title>You have been signed out</title>');
    expect(result.body).toContain('Your Wersee session has been securely ended.');
    expect(result.body).toContain('href="https://www.wersee.com"');

    const cookies = result.headers.get('set-cookie') as string[];
    expect(cookies.some((cookie) => cookie.startsWith('sb-project-ref-auth-token=') && cookie.includes('Max-Age=0'))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('wersee_oauth_state=') && cookie.includes('Max-Age=0'))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('wersee_locale='))).toBe(false);
  });

  it('returns the same safe HTTP 200 page when no session exists', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const res = response();

    await handleFrontChannelLogout(request(), res, dependencies(signOut));

    const result = getMockResponse(res);
    expect(result.statusCode).toBe(200);
    expect(result.body).not.toMatch(/error|exception|token/i);
    expect(result.headers.get('location')).toBeUndefined();
  });

  it('is idempotent across repeated and already-expired logout requests', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('expired session'));
    const first = response();
    const second = response();

    await handleFrontChannelLogout(request(), first, dependencies(signOut));
    await handleFrontChannelLogout(request(), second, dependencies(signOut));

    expect(getMockResponse(first).statusCode).toBe(200);
    expect(getMockResponse(second).statusCode).toBe(200);
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('accepts sid and iss without reflecting identifiers or redirecting', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const res = response();
    const sid = 'private-session-identifier';
    const iss = 'https://login.microsoftonline.com/private-tenant/v2.0';

    await handleFrontChannelLogout(
      request(`/auth/front-channel-logout?sid=${sid}&iss=${encodeURIComponent(iss)}`),
      res,
      dependencies(signOut),
    );

    const result = getMockResponse(res);
    expect(result.statusCode).toBe(200);
    expect(result.body).not.toContain(sid);
    expect(result.body).not.toContain(iss);
    expect(result.headers.get('location')).toBeUndefined();
  });

  it('handles malformed and oversized query parameters without an error response', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const res = response();
    const oversized = 'x'.repeat(3000);

    await handleFrontChannelLogout(
      request(`/auth/front-channel-logout?sid=%E0%A4%A&iss=${oversized}`),
      res,
      dependencies(signOut),
    );

    expect(getMockResponse(res).statusCode).toBe(200);
  });

  it('sets private no-store and iframe-compatible route security headers', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const res = response();

    await handleFrontChannelLogout(request(), res, dependencies(signOut));

    const result = getMockResponse(res);
    expect(result.headers.get('cache-control')).toBe('no-store, private');
    expect(result.headers.get('x-frame-options')).toBeUndefined();
    expect(result.headers.get('content-security-policy')).toContain(
      'frame-ancestors https://login.microsoftonline.com https://*.microsoftonline.com',
    );
    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect(result.headers.get('referrer-policy')).toBe('no-referrer');
    expect(frontChannelLogoutSecurityHeaders).not.toHaveProperty('X-Frame-Options');
  });

  it('retains anti-framing headers for every other Wersee route', () => {
    const normalRouteHeaders = vercelConfig.headers[0];
    expect(normalRouteHeaders.source).toContain('(?!auth/front-channel-logout');
    expect(normalRouteHeaders.headers).toContainEqual({
      key: 'X-Frame-Options',
      value: 'DENY',
    });
    expect(normalRouteHeaders.headers).toContainEqual({
      key: 'Content-Security-Policy',
      value: "frame-ancestors 'none'",
    });
    expect(vercelConfig.rewrites[0]).toEqual({
      source: '/auth/front-channel-logout',
      destination: '/api/auth/front-channel-logout',
    });
  });
});
