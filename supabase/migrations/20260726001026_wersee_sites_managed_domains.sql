create table public.site_managed_domains (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid references public.site_releases(id) on delete set null,
  hostname text not null unique check (
    hostname = lower(hostname)
    and hostname ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
  ),
  kind text not null check (kind in ('wersee_subdomain', 'custom_domain')),
  provider text not null default 'vercel' check (provider in ('vercel')),
  status text not null default 'pending' check (status in ('pending', 'active', 'detaching', 'detached', 'failed')),
  vercel_deployment_id text,
  managed_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  detached_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, hostname)
);

create index site_managed_domains_active_site_idx
  on public.site_managed_domains (site_id, release_id)
  where status = 'active';

alter table public.site_managed_domains enable row level security;

revoke all on public.site_managed_domains from public, anon, authenticated;
grant all on public.site_managed_domains to service_role;

comment on table public.site_managed_domains is
  'Private source of truth for domains that Wersee has connected and verified through its deployment control plane.';

comment on column public.site_managed_domains.status is
  'Only active records with a matching published release may be exposed through the sanitized Sites directory API.';
