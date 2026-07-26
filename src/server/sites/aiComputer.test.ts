import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Sites AI computer security contract', () => {
  const source = readFileSync(new URL('./aiComputer.ts', import.meta.url), 'utf8');

  it('removes network access before rendering untrusted site code', () => {
    expect(source.indexOf("updateNetworkPolicy('deny-all')")).toBeGreaterThan(source.indexOf('writePreparedFiles(sandbox, files)'));
    expect(source.indexOf('runBrowser(sandbox)')).toBeGreaterThan(source.indexOf("updateNetworkPolicy('deny-all')"));
  });

  it('never mounts provider or Supabase secrets inside the sandbox', () => {
    expect(source).not.toMatch(/env:\s*\{[^}]*(?:GROQ|SUPABASE|SERVICE_ROLE)/s);
    expect(source).toContain('Secrets are not mounted.');
  });

  it('masks form content and disables external requests before screenshots', () => {
    expect(source).toContain('input,textarea,[contenteditable=true],[data-wersee-private]');
    expect(source).toContain('route.abort("blockedbyclient")');
    expect(source).toContain('serviceWorkers: "block"');
  });
});
