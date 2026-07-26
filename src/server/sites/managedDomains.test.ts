import { describe, expect, it } from 'vitest';
import { sanitizeManagedDirectorySites, werseeSiteHostname } from './managedDomains.js';

const site = {
  id: 'site-1',
  name: 'Studio North',
  slug: 'studio-north',
  active_release_id: 'release-1',
  directory_listed: true,
};

describe('managed Wersee domains', () => {
  it('normalizes the Wersee-managed hostname', () => {
    expect(werseeSiteHostname(' Studio-North ', 'WERSEE.COM')).toBe('studio-north.wersee.com');
  });

  it('only exposes an active verified Vercel domain for the active release', () => {
    expect(sanitizeManagedDirectorySites([site], [{
      site_id: site.id,
      release_id: 'release-1',
      hostname: 'studio-north.wersee.com',
      kind: 'wersee_subdomain',
      provider: 'vercel',
      status: 'active',
      vercel_deployment_id: 'dpl_live',
    }], 'wersee.com')).toEqual([expect.objectContaining({
      name: 'Studio North',
      url: 'https://studio-north.wersee.com',
    })]);
  });

  it.each([
    [{ status: 'pending' }, 'pending domain'],
    [{ kind: 'custom_domain' }, 'non-Wersee hostname kind'],
    [{ provider: 'other' }, 'unmanaged provider'],
    [{ release_id: 'release-old' }, 'old release'],
    [{ hostname: 'other.wersee.com' }, 'mismatched hostname'],
    [{ vercel_deployment_id: null }, 'missing deployment'],
  ])('rejects a %s', (override) => {
    const domain = {
      site_id: site.id,
      release_id: 'release-1',
      hostname: 'studio-north.wersee.com',
      kind: 'wersee_subdomain',
      provider: 'vercel',
      status: 'active',
      vercel_deployment_id: 'dpl_live',
      ...override,
    };
    expect(sanitizeManagedDirectorySites([site], [domain], 'wersee.com')).toEqual([]);
  });
});
