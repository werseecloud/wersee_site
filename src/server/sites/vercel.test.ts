import { describe, expect, it } from 'vitest';
import { makeStaticVercelConfig } from './vercel';

describe('generated static Vercel configuration', () => {
  it('applies security headers before filesystem and SPA fallback routes', () => {
    const parsed = JSON.parse(makeStaticVercelConfig({
      spaFallback: true,
      defaultDocument: 'index.html',
      custom404Behavior: 'default',
      strictSecurityMode: true,
    }).toString('utf8'));
    expect(parsed.headers).toBeUndefined();
    expect(parsed.routes[0].headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(parsed.routes).toContainEqual({ handle: 'filesystem' });
    expect(parsed.routes.at(-1)).toEqual({ src: '/.*', dest: '/index.html' });
  });

  it('serves a custom 404 with the correct response status', () => {
    const parsed = JSON.parse(makeStaticVercelConfig({
      spaFallback: false,
      defaultDocument: 'home.html',
      custom404Behavior: 'file',
      strictSecurityMode: false,
    }).toString('utf8'));
    expect(parsed.routes).toContainEqual({ src: '^/$', dest: '/home.html' });
    expect(parsed.routes.at(-1)).toEqual({ src: '/.*', dest: '/404.html', status: 404 });
  });
});
