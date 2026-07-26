import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getSiteConfigurationStatus,
  getSiteRuntimeConfig,
  resetSiteRuntimeConfigForTests,
} from './config';

const required = {
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-fixture-key-long-enough',
  VERCEL_TOKEN: 'vercel-token-fixture',
  VERCEL_TEAM_ID: 'team_fixture',
  VERCEL_SITES_PROJECT_ID: 'project_fixture',
  SITE_PREVIEW_TOKEN_SECRET: 'p'.repeat(48),
  SITE_ANALYTICS_HASH_SALT: 'a'.repeat(48),
};

const applyRequiredEnvironment = () => {
  for (const [name, value] of Object.entries(required)) vi.stubEnv(name, value);
};

afterEach(() => {
  vi.unstubAllEnvs();
  resetSiteRuntimeConfigForTests();
});

describe('Wersee Sites server configuration', () => {
  it('reports the canonical Supabase names when neither supported variant exists', () => {
    applyRequiredEnvironment();
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    expect(getSiteConfigurationStatus()).toEqual({
      configured: false,
      missing: ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'],
    });
  });

  it('accepts the Vite-named public Supabase fallbacks on the server', () => {
    applyRequiredEnvironment();
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-fixture');
    expect(getSiteConfigurationStatus()).toEqual({ configured: true, missing: [] });
  });

  it('rejects a copied environment-variable list as the Vercel bearer token', () => {
    applyRequiredEnvironment();
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'publishable-fixture');
    vi.stubEnv('VERCEL_TOKEN', 'CRON_SECRET Sensitive Production\nSITE_PREVIEW_TOKEN_SECRET Sensitive');

    expect(getSiteConfigurationStatus()).toEqual({
      configured: false,
      missing: ['VERCEL_TOKEN'],
    });
    expect(() => getSiteRuntimeConfig()).toThrow();
  });

  it('trims a valid Vercel token before it is used in an Authorization header', () => {
    applyRequiredEnvironment();
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'publishable-fixture');
    vi.stubEnv('VERCEL_TOKEN', '  valid-token-fixture  ');

    expect(getSiteRuntimeConfig().vercelToken).toBe('valid-token-fixture');
  });
});
