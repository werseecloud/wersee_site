type DirectorySite = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  thumbnail_url?: string | null;
  marketplace_published_at?: string | null;
  active_release_id?: string | null;
};

type ManagedDomain = {
  site_id: string;
  release_id?: string | null;
  hostname: string;
  kind: string;
  provider: string;
  status: string;
  vercel_deployment_id?: string | null;
};

export const werseeSiteHostname = (slug: string, rootDomain: string) =>
  `${slug.trim().toLowerCase()}.${rootDomain.trim().toLowerCase()}`;

export const sanitizeManagedDirectorySites = (
  sites: DirectorySite[],
  domains: ManagedDomain[],
  rootDomain: string,
) => {
  const activeDomains = new Map<string, ManagedDomain>();
  for (const domain of domains) {
    if (
      domain.status !== 'active'
      || domain.kind !== 'wersee_subdomain'
      || domain.provider !== 'vercel'
      || !domain.vercel_deployment_id
    ) continue;
    activeDomains.set(domain.site_id, domain);
  }

  return sites.flatMap((site) => {
    const domain = activeDomains.get(site.id);
    const expectedHostname = werseeSiteHostname(site.slug, rootDomain);
    if (
      !site.active_release_id
      || !domain
      || domain.release_id !== site.active_release_id
      || domain.hostname !== expectedHostname
    ) return [];

    return [{
      name: site.name,
      description: site.description || null,
      iconUrl: site.icon_url || null,
      thumbnailUrl: site.thumbnail_url || null,
      url: `https://${domain.hostname}`,
      marketplace: Boolean(site.marketplace_published_at),
    }];
  });
};
