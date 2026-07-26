import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rewrite = {
  source: string;
  destination: string;
};

type VercelConfig = {
  outputDirectory?: string;
  rewrites?: Rewrite[];
};

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
) as VercelConfig;

const rewrites = config.rewrites ?? [];
const spaFallback = rewrites.at(-1);

const matches = (source: string, pathname: string) =>
  new RegExp(`^${source}$`).test(pathname);

describe('Vercel SPA routing', () => {
  it('builds and serves the Vite application from dist', () => {
    expect(config.outputDirectory).toBe('dist');
  });

  it('keeps the SPA fallback as the final rewrite', () => {
    expect(spaFallback).toEqual({
      source: '/(.*)',
      destination: '/index.html',
    });
  });

  it.each([
    '/@account.example_42/workspace/chats',
    '/workspace/settings',
    '/unknown/client-side/route',
  ])('rewrites client route %s to index.html', (pathname) => {
    expect(matches(spaFallback!.source, pathname)).toBe(true);
  });

  it('routes unmatched API requests before the SPA fallback', () => {
    const apiFallbacks = rewrites.filter(
      (rewrite) => rewrite.destination === '/api/not-found',
    );
    expect(apiFallbacks).toEqual([
      { source: '/api', destination: '/api/not-found' },
      { source: '/api/(.*)', destination: '/api/not-found' },
    ]);
    expect(rewrites.findIndex((rewrite) => rewrite.source === '/api/sites/:path*'))
      .toBeLessThan(rewrites.indexOf(apiFallbacks[0]));
    expect(rewrites.indexOf(apiFallbacks[1])).toBeLessThan(rewrites.length - 1);
  });
});
