alter table public.sites
  add column if not exists directory_listed boolean not null default false;

create table if not exists public.site_integrations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('quick_pay', 'wersee_oauth')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'applied', 'disabled', 'failed')),
  release_id uuid references public.site_releases(id) on delete set null,
  candidate_id text,
  placement text check (placement is null or placement in ('existing', 'header', 'footer', 'selector')),
  target_selector text,
  custom_path text not null,
  detected_amount numeric(12,2),
  detected_currency text,
  detected_label text,
  source_path text,
  quick_pay_link_id uuid references public.quick_pay_links(id) on delete set null,
  oauth_client_id text,
  oauth_redirect_uri text,
  config jsonb not null default '{}'::jsonb,
  last_analyzed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, kind),
  check (custom_path ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),
  check (detected_currency is null or detected_currency ~ '^[a-z]{3}$')
);

create index if not exists site_integrations_site_id_idx
  on public.site_integrations(site_id);

create index if not exists site_integrations_owner_id_idx
  on public.site_integrations(owner_id);

create index if not exists site_integrations_release_id_idx
  on public.site_integrations(release_id);

alter table public.site_integrations enable row level security;

drop policy if exists site_integrations_managers_read on public.site_integrations;
create policy site_integrations_managers_read
  on public.site_integrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  );

drop policy if exists site_integrations_managers_insert on public.site_integrations;
create policy site_integrations_managers_insert
  on public.site_integrations
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  );

drop policy if exists site_integrations_managers_update on public.site_integrations;
create policy site_integrations_managers_update
  on public.site_integrations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  );

drop policy if exists site_integrations_managers_delete on public.site_integrations;
create policy site_integrations_managers_delete
  on public.site_integrations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  );

drop policy if exists site_integrations_service_all on public.site_integrations;
create policy site_integrations_service_all
  on public.site_integrations
  for all
  to service_role
  using (true)
  with check (true);

revoke all on public.site_integrations from anon;
grant select, insert, update, delete on public.site_integrations to authenticated;
grant all on public.site_integrations to service_role;

comment on column public.sites.directory_listed is
  'Explicit owner opt-in for the sanitized public Wersee Sites directory.';

comment on table public.site_integrations is
  'Reviewable, fail-closed Quick Pay and Wersee OAuth integrations applied to immutable Sites releases.';
