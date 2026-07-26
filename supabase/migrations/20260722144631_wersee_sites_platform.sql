-- Wersee Sites
-- Immutable static-site releases, private staging/preview storage, Vercel deployment
-- synchronization, team-aware authorization, and first-party privacy-preserving analytics.

create schema if not exists private;

create or replace function private.can_manage_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.businesses b
      where b.id = target_business_id and b.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.business_members bm
      where bm.business_id = target_business_id
        and bm.user_id = (select auth.uid())
        and coalesce(bm.role, 'member') in ('owner', 'admin', 'manager')
    )
    or exists (
      select 1 from public.team_members tm
      where tm.business_id = target_business_id
        and tm.user_id = (select auth.uid())
        and coalesce(tm.status, 'active') = 'active'
        and coalesce(tm.role, 'member') in ('owner', 'admin', 'manager')
    )
  );
$$;

revoke all on function private.can_manage_business(uuid) from public;
grant execute on function private.can_manage_business(uuid) to authenticated, service_role;

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (
    slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'
    and slug !~ '--'
  ),
  description text,
  icon_url text,
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'publishing', 'published', 'failed', 'archived')),
  site_type text not null default 'uploaded_static' check (site_type in ('uploaded_static', 'wersee_builder')),
  spa_fallback boolean not null default false,
  analytics_enabled boolean not null default true,
  default_document text not null default 'index.html' check (default_document ~ '^[A-Za-z0-9._/-]+$'),
  custom_404_behavior text not null default 'file' check (custom_404_behavior in ('file', 'spa', 'default')),
  strict_security_mode boolean not null default false,
  password_protection_prepared boolean not null default false,
  active_release_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.site_reserved_slugs (
  slug text primary key check (slug = lower(slug)),
  reason text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

insert into public.site_reserved_slugs (slug, reason)
select slug, 'Wersee system subdomain'
from unnest(array[
  'www','app','api','admin','auth','account','accounts','ai','assets','billing','blog','cdn',
  'checkout','creator','creators','dashboard','developers','docs','files','help','mail','pay',
  'payments','status','storage','support','workspaces'
]) as slug
on conflict (slug) do nothing;

create table public.site_slug_claims (
  slug text primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  state text not null default 'active' check (state in ('pending', 'active')),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table public.site_uploads (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  source_type text not null check (source_type in ('zip', 'folder', 'wersee_storage')),
  status text not null default 'created' check (status in ('created', 'uploading', 'uploaded', 'validating', 'completed', 'failed', 'cancelled', 'expired')),
  storage_prefix text not null unique,
  original_name text,
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  uploaded_bytes bigint not null default 0 check (uploaded_bytes >= 0),
  file_count integer not null default 0 check (file_count >= 0),
  source_metadata jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  release_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  completed_at timestamptz
);

create table public.site_releases (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'created' check (status in ('created', 'uploading', 'validating', 'ready', 'deploying', 'building', 'published', 'failed', 'cancelled', 'archived')),
  source_type text not null check (source_type in ('zip', 'folder', 'wersee_storage', 'builder')),
  source_storage_path text,
  detected_root text,
  manifest jsonb not null default '{}'::jsonb,
  file_count integer not null default 0 check (file_count >= 0),
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  source_checksum text,
  vercel_deployment_id text,
  vercel_deployment_url text,
  validation_report jsonb not null default '{}'::jsonb,
  release_notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_message text,
  unique (site_id, version)
);

alter table public.sites
  add constraint sites_active_release_fk
  foreign key (active_release_id) references public.site_releases(id) on delete set null;

alter table public.site_uploads
  add constraint site_uploads_release_fk
  foreign key (release_id) references public.site_releases(id) on delete set null;

create table public.site_release_files (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.site_releases(id) on delete cascade,
  path text not null,
  storage_path text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  content_type text not null,
  sha1 text not null check (sha1 ~ '^[a-f0-9]{40}$'),
  is_html boolean not null default false,
  created_at timestamptz not null default now(),
  unique (release_id, path)
);

create table public.site_deployment_jobs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid not null references public.site_releases(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed', 'cancelled')),
  stage text not null default 'preparing' check (stage in ('preparing', 'uploading', 'creating', 'building', 'checking', 'aliasing', 'publishing', 'live', 'failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  vercel_deployment_id text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text,
  error_message text,
  support_reference text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (release_id, idempotency_key)
);

create unique index site_one_active_deployment_job
on public.site_deployment_jobs (site_id)
where status in ('created', 'running');

create table public.site_audit_logs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'site_created','slug_reserved','slug_changed','upload_started','upload_cancelled',
    'validation_completed','publication_started','publication_completed','publication_failed',
    'rollback','analytics_setting_changed','settings_changed','site_deleted'
  )),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid references public.site_releases(id) on delete set null,
  event_type text not null check (event_type in ('page_view','route_change','session_start','session_end','engagement','outbound_click','download_click','button_click')),
  session_id_hash text not null,
  visitor_id_hash text,
  path text not null,
  referrer_domain text,
  outbound_url_domain text,
  element_label text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_page text,
  exit_page text,
  country_code text,
  device_type text,
  browser_family text,
  os_family text,
  engaged_seconds integer check (engaged_seconds between 0 and 86400),
  is_bounce boolean,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create table public.site_analytics_daily (
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid references public.site_releases(id) on delete set null,
  event_date date not null,
  page_views bigint not null default 0,
  sessions bigint not null default 0,
  consented_visitors bigint not null default 0,
  engaged_seconds bigint not null default 0,
  clicks bigint not null default 0,
  bounces bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (site_id, release_id, event_date)
);

create table public.site_analytics_visitor_days (
  site_id uuid not null references public.sites(id) on delete cascade,
  event_date date not null,
  visitor_id_hash text not null,
  created_at timestamptz not null default now(),
  primary key (site_id, event_date, visitor_id_hash)
);

create table public.site_analytics_top_pages_daily (
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid references public.site_releases(id) on delete set null,
  event_date date not null,
  path text not null,
  page_views bigint not null default 0,
  entries bigint not null default 0,
  exits bigint not null default 0,
  engaged_seconds bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (site_id, release_id, event_date, path)
);

create table public.site_analytics_dimensions_daily (
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid references public.site_releases(id) on delete set null,
  event_date date not null,
  dimension text not null check (dimension in ('referrer','country','device','browser','os','utm_campaign','outbound','download')),
  value text not null,
  event_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (site_id, release_id, event_date, dimension, value)
);

create table public.site_rate_limits (
  bucket text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (bucket, key_hash)
);

create index sites_business_active_idx on public.sites (business_id, updated_at desc) where deleted_at is null;
create index sites_owner_idx on public.sites (owner_id, created_at desc);
create index site_releases_site_created_idx on public.site_releases (site_id, created_at desc);
create index site_releases_deployment_idx on public.site_releases (vercel_deployment_id) where vercel_deployment_id is not null;
create index site_release_files_release_idx on public.site_release_files (release_id, path);
create index site_jobs_site_started_idx on public.site_deployment_jobs (site_id, started_at desc);
create index site_uploads_expiry_idx on public.site_uploads (expires_at) where status in ('created','uploading','uploaded','failed');
create index site_audit_site_time_idx on public.site_audit_logs (site_id, occurred_at desc);
create index site_events_site_time_idx on public.site_analytics_events (site_id, occurred_at desc);
create index site_events_site_session_idx on public.site_analytics_events (site_id, session_id_hash, occurred_at);
create index site_events_release_time_idx on public.site_analytics_events (release_id, occurred_at desc) where release_id is not null;
create index site_daily_site_date_idx on public.site_analytics_daily (site_id, event_date desc);
create index site_pages_site_date_idx on public.site_analytics_top_pages_daily (site_id, event_date desc, page_views desc);
create index site_dimensions_site_date_idx on public.site_analytics_dimensions_daily (site_id, dimension, event_date desc, event_count desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sites_touch_updated before update on public.sites for each row execute function private.touch_updated_at();
create trigger site_uploads_touch_updated before update on public.site_uploads for each row execute function private.touch_updated_at();
create trigger site_jobs_touch_updated before update on public.site_deployment_jobs for each row execute function private.touch_updated_at();

create or replace function private.valid_site_slug(candidate text)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select candidate ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'
    and candidate !~ '--'
    and candidate !~ '\.\.';
$$;

create or replace function public.site_slug_available(requested_slug text, current_site_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $$
  select private.valid_site_slug(lower(trim(requested_slug)))
    and not exists (select 1 from public.site_reserved_slugs r where r.slug = lower(trim(requested_slug)))
    and not exists (
      select 1 from public.site_slug_claims c
      where c.slug = lower(trim(requested_slug))
        and c.site_id is distinct from current_site_id
        and (c.state = 'active' or c.expires_at > now())
    );
$$;

create or replace function public.create_site(
  target_business_id uuid,
  site_name text,
  requested_slug text,
  site_description text default null,
  requested_site_type text default 'uploaded_static'
)
returns public.sites
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  normalized_slug text := lower(trim(requested_slug));
  created_site public.sites;
begin
  if not private.can_manage_business(target_business_id) then
    raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED';
  end if;
  if not private.valid_site_slug(normalized_slug) then
    raise exception using errcode = '22023', message = 'SITE_SLUG_INVALID';
  end if;
  if requested_site_type not in ('uploaded_static','wersee_builder') then
    raise exception using errcode = '22023', message = 'SITE_TYPE_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('wersee-site-slug:' || normalized_slug, 0));
  if not public.site_slug_available(normalized_slug, null) then
    raise exception using errcode = '23505', message = 'SITE_SLUG_UNAVAILABLE';
  end if;

  insert into public.sites (business_id, owner_id, name, slug, description, site_type, created_by, updated_by)
  values (target_business_id, (select auth.uid()), trim(site_name), normalized_slug, nullif(trim(site_description), ''), requested_site_type, (select auth.uid()), (select auth.uid()))
  returning * into created_site;

  insert into public.site_slug_claims (slug, site_id, state, created_by)
  values (normalized_slug, created_site.id, 'active', (select auth.uid()));

  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (created_site.id, (select auth.uid()), 'site_created', jsonb_build_object('site_type', requested_site_type));
  return created_site;
end;
$$;

create or replace function public.reserve_site_slug(target_site_id uuid, requested_slug text)
returns text
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  normalized_slug text := lower(trim(requested_slug));
  target_business_id uuid;
begin
  select s.business_id into target_business_id from public.sites s where s.id = target_site_id and s.deleted_at is null;
  if target_business_id is null or not private.can_manage_business(target_business_id) then
    raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED';
  end if;
  if not private.valid_site_slug(normalized_slug) then
    raise exception using errcode = '22023', message = 'SITE_SLUG_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('wersee-site-slug:' || normalized_slug, 0));
  if not public.site_slug_available(normalized_slug, target_site_id) then
    raise exception using errcode = '23505', message = 'SITE_SLUG_UNAVAILABLE';
  end if;
  insert into public.site_slug_claims (slug, site_id, state, expires_at, created_by)
  values (normalized_slug, target_site_id, 'pending', now() + interval '15 minutes', (select auth.uid()))
  on conflict (slug) do update set site_id = excluded.site_id, state = 'pending', expires_at = excluded.expires_at, created_by = excluded.created_by, created_at = now();
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_site_id, (select auth.uid()), 'slug_reserved', jsonb_build_object('slug', normalized_slug));
  return normalized_slug;
end;
$$;

create or replace function public.commit_site_slug(target_site_id uuid, reserved_slug text)
returns public.sites
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  previous_slug text;
  updated_site public.sites;
begin
  select s.slug into previous_slug from public.sites s
  where s.id = target_site_id and private.can_manage_business(s.business_id) and s.deleted_at is null for update;
  if previous_slug is null then raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED'; end if;
  if not exists (select 1 from public.site_slug_claims c where c.slug = reserved_slug and c.site_id = target_site_id and c.state = 'pending' and c.expires_at > now()) then
    raise exception using errcode = '22023', message = 'SITE_SLUG_RESERVATION_EXPIRED';
  end if;
  update public.sites set slug = reserved_slug, updated_by = (select auth.uid()) where id = target_site_id returning * into updated_site;
  update public.site_slug_claims set state = 'active', expires_at = null where slug = reserved_slug and site_id = target_site_id;
  delete from public.site_slug_claims where slug = previous_slug and site_id = target_site_id and previous_slug <> reserved_slug;
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_site_id, (select auth.uid()), 'slug_changed', jsonb_build_object('previous_slug', previous_slug, 'slug', reserved_slug));
  return updated_site;
end;
$$;

create or replace function public.release_pending_site_slug(target_site_id uuid, reserved_slug text)
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not exists (select 1 from public.sites s where s.id = target_site_id and private.can_manage_business(s.business_id)) then
    raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED';
  end if;
  delete from public.site_slug_claims where site_id = target_site_id and slug = reserved_slug and state = 'pending';
end;
$$;

create or replace function public.create_site_release(target_site_id uuid, target_upload_id uuid, notes text default null)
returns public.site_releases
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  target_site public.sites;
  target_upload public.site_uploads;
  next_version integer;
  created_release public.site_releases;
begin
  select * into target_site from public.sites s where s.id = target_site_id and s.deleted_at is null;
  if target_site.id is null or not private.can_manage_business(target_site.business_id) then
    raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED';
  end if;
  select * into target_upload from public.site_uploads u
  where u.id = target_upload_id
    and u.site_id = target_site_id
    and u.owner_id = (select auth.uid())
    and u.release_id is null
    and u.status in ('uploading','uploaded');
  if target_upload.id is null then raise exception using errcode = '22023', message = 'SITE_UPLOAD_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wersee-site-release:' || target_site_id::text, 0));
  select coalesce(max(version), 0) + 1 into next_version from public.site_releases where site_id = target_site_id;
  insert into public.site_releases (site_id, version, status, source_type, source_storage_path, release_notes, created_by)
  values (target_site_id, next_version, 'created', target_upload.source_type, target_upload.storage_prefix, nullif(trim(notes), ''), (select auth.uid()))
  returning * into created_release;
  update public.site_uploads set release_id = created_release.id, status = 'uploaded' where id = target_upload_id;
  return created_release;
end;
$$;

create or replace function public.begin_site_publish(target_site_id uuid, target_release_id uuid, request_key text)
returns public.site_deployment_jobs
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  target_business_id uuid;
  existing_job public.site_deployment_jobs;
  created_job public.site_deployment_jobs;
begin
  select s.business_id into target_business_id from public.sites s where s.id = target_site_id and s.deleted_at is null;
  if target_business_id is null or not private.can_manage_business(target_business_id) then
    raise exception using errcode = '42501', message = 'SITE_PERMISSION_DENIED';
  end if;
  select * into existing_job from public.site_deployment_jobs j where j.release_id = target_release_id and j.idempotency_key = request_key;
  if existing_job.id is not null then return existing_job; end if;
  perform pg_advisory_xact_lock(hashtextextended('wersee-site-publish:' || target_site_id::text, 0));
  if exists (select 1 from public.site_deployment_jobs where site_id = target_site_id and status in ('created','running')) then
    raise exception using errcode = '55000', message = 'SITE_PUBLISH_IN_PROGRESS';
  end if;
  if not exists (select 1 from public.site_releases where id = target_release_id and site_id = target_site_id and status = 'ready') then
    raise exception using errcode = '55000', message = 'SITE_RELEASE_NOT_READY';
  end if;
  insert into public.site_deployment_jobs (site_id, release_id, idempotency_key, status, stage, progress, created_by)
  values (target_site_id, target_release_id, request_key, 'created', 'preparing', 1, (select auth.uid())) returning * into created_job;
  update public.site_releases set status = 'deploying', error_code = null, error_message = null where id = target_release_id;
  update public.sites set status = 'publishing', updated_by = (select auth.uid()) where id = target_site_id;
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_site_id, (select auth.uid()), 'publication_started', jsonb_build_object('release_id', target_release_id, 'job_id', created_job.id));
  return created_job;
end;
$$;

create or replace function public.complete_site_publish(target_job_id uuid, deployment_id text, deployment_url text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  target_job public.site_deployment_jobs;
begin
  select * into target_job from public.site_deployment_jobs where id = target_job_id for update;
  if target_job.id is null then raise exception 'SITE_JOB_NOT_FOUND'; end if;
  update public.site_releases set status = 'published', vercel_deployment_id = deployment_id, vercel_deployment_url = deployment_url, published_at = now(), failed_at = null, error_code = null, error_message = null where id = target_job.release_id;
  update public.sites set status = 'published', active_release_id = target_job.release_id, updated_by = target_job.created_by where id = target_job.site_id;
  update public.site_deployment_jobs set status = 'completed', stage = 'live', progress = 100, vercel_deployment_id = deployment_id, completed_at = now() where id = target_job_id;
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_job.site_id, target_job.created_by, 'publication_completed', jsonb_build_object('release_id', target_job.release_id, 'deployment_id', deployment_id));
end;
$$;

create or replace function public.fail_site_publish(target_job_id uuid, failure_code text, failure_message text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  target_job public.site_deployment_jobs;
begin
  select * into target_job from public.site_deployment_jobs where id = target_job_id for update;
  if target_job.id is null then return; end if;
  update public.site_releases set status = 'failed', failed_at = now(), error_code = failure_code, error_message = left(failure_message, 500) where id = target_job.release_id;
  update public.site_deployment_jobs set status = 'failed', stage = 'failed', error_code = failure_code, error_message = left(failure_message, 500), completed_at = now() where id = target_job_id;
  update public.sites set status = case when active_release_id is null then 'failed' else 'published' end where id = target_job.site_id;
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_job.site_id, target_job.created_by, 'publication_failed', jsonb_build_object('release_id', target_job.release_id, 'code', failure_code, 'support_reference', target_job.support_reference));
end;
$$;

create or replace function public.complete_site_rollback(target_site_id uuid, target_release_id uuid, actor_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not exists (select 1 from public.site_releases where id = target_release_id and site_id = target_site_id and status = 'published' and vercel_deployment_id is not null) then
    raise exception 'SITE_ROLLBACK_RELEASE_INVALID';
  end if;
  update public.sites set active_release_id = target_release_id, status = 'published', updated_by = actor_id where id = target_site_id;
  insert into public.site_audit_logs (site_id, actor_id, action, metadata)
  values (target_site_id, actor_id, 'rollback', jsonb_build_object('release_id', target_release_id));
end;
$$;

create or replace function public.check_site_rate_limit(rate_bucket text, rate_key_hash text, request_limit integer, window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  allowed boolean;
begin
  insert into public.site_rate_limits (bucket, key_hash, window_started_at, request_count)
  values (rate_bucket, rate_key_hash, now(), 1)
  on conflict (bucket, key_hash) do update
  set window_started_at = case when public.site_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds) then now() else public.site_rate_limits.window_started_at end,
      request_count = case when public.site_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds) then 1 else public.site_rate_limits.request_count + 1 end,
      updated_at = now()
  returning request_count <= request_limit into allowed;
  return allowed;
end;
$$;

create or replace function public.ingest_site_analytics_event(event_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  created_event_id uuid;
  event_day date := ((event_payload->>'occurred_at')::timestamptz at time zone 'UTC')::date;
  event_site_id uuid := (event_payload->>'site_id')::uuid;
  event_release_id uuid := nullif(event_payload->>'release_id','')::uuid;
  visitor_inserted integer := 0;
  dimension_pair record;
begin
  insert into public.site_analytics_events (
    site_id,release_id,event_type,session_id_hash,visitor_id_hash,path,referrer_domain,outbound_url_domain,element_label,
    utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_page,exit_page,country_code,device_type,
    browser_family,os_family,engaged_seconds,is_bounce,occurred_at
  ) values (
    event_site_id,event_release_id,event_payload->>'event_type',event_payload->>'session_id_hash',nullif(event_payload->>'visitor_id_hash',''),event_payload->>'path',
    nullif(event_payload->>'referrer_domain',''),nullif(event_payload->>'outbound_url_domain',''),nullif(event_payload->>'element_label',''),
    nullif(event_payload->>'utm_source',''),nullif(event_payload->>'utm_medium',''),nullif(event_payload->>'utm_campaign',''),nullif(event_payload->>'utm_content',''),nullif(event_payload->>'utm_term',''),
    nullif(event_payload->>'landing_page',''),nullif(event_payload->>'exit_page',''),nullif(event_payload->>'country_code',''),nullif(event_payload->>'device_type',''),
    nullif(event_payload->>'browser_family',''),nullif(event_payload->>'os_family',''),nullif(event_payload->>'engaged_seconds','')::integer,nullif(event_payload->>'is_bounce','')::boolean,
    (event_payload->>'occurred_at')::timestamptz
  ) returning id into created_event_id;

  if nullif(event_payload->>'visitor_id_hash','') is not null then
    insert into public.site_analytics_visitor_days (site_id,event_date,visitor_id_hash)
    values (event_site_id,event_day,event_payload->>'visitor_id_hash') on conflict do nothing;
    get diagnostics visitor_inserted = row_count;
  end if;

  insert into public.site_analytics_daily (site_id,release_id,event_date,page_views,sessions,consented_visitors,engaged_seconds,clicks,bounces)
  values (
    event_site_id,event_release_id,event_day,
    case when event_payload->>'event_type' in ('page_view','route_change') then 1 else 0 end,
    case when event_payload->>'event_type' = 'session_start' then 1 else 0 end,
    visitor_inserted,
    coalesce(nullif(event_payload->>'engaged_seconds','')::integer,0),
    case when event_payload->>'event_type' in ('outbound_click','download_click','button_click') then 1 else 0 end,
    case when coalesce(nullif(event_payload->>'is_bounce','')::boolean,false) then 1 else 0 end
  ) on conflict (site_id,release_id,event_date) do update set
    page_views = site_analytics_daily.page_views + excluded.page_views,
    sessions = site_analytics_daily.sessions + excluded.sessions,
    consented_visitors = site_analytics_daily.consented_visitors + excluded.consented_visitors,
    engaged_seconds = site_analytics_daily.engaged_seconds + excluded.engaged_seconds,
    clicks = site_analytics_daily.clicks + excluded.clicks,
    bounces = site_analytics_daily.bounces + excluded.bounces,
    updated_at = now();

  if event_payload->>'event_type' in ('page_view','route_change','engagement','session_end') then
    insert into public.site_analytics_top_pages_daily (site_id,release_id,event_date,path,page_views,entries,exits,engaged_seconds)
    values (
      event_site_id,event_release_id,event_day,event_payload->>'path',
      case when event_payload->>'event_type' in ('page_view','route_change') then 1 else 0 end,
      case when event_payload->>'event_type' = 'session_start' or event_payload->>'landing_page' = event_payload->>'path' then 1 else 0 end,
      case when event_payload->>'event_type' = 'session_end' then 1 else 0 end,
      coalesce(nullif(event_payload->>'engaged_seconds','')::integer,0)
    ) on conflict (site_id,release_id,event_date,path) do update set
      page_views = site_analytics_top_pages_daily.page_views + excluded.page_views,
      entries = site_analytics_top_pages_daily.entries + excluded.entries,
      exits = site_analytics_top_pages_daily.exits + excluded.exits,
      engaged_seconds = site_analytics_top_pages_daily.engaged_seconds + excluded.engaged_seconds,
      updated_at = now();
  end if;

  for dimension_pair in
    select * from (values
      ('referrer',nullif(event_payload->>'referrer_domain','')),
      ('country',nullif(event_payload->>'country_code','')),
      ('device',nullif(event_payload->>'device_type','')),
      ('browser',nullif(event_payload->>'browser_family','')),
      ('os',nullif(event_payload->>'os_family','')),
      ('utm_campaign',nullif(event_payload->>'utm_campaign','')),
      ('outbound',case when event_payload->>'event_type' = 'outbound_click' then nullif(event_payload->>'outbound_url_domain','') end),
      ('download',case when event_payload->>'event_type' = 'download_click' then nullif(event_payload->>'path','') end)
    ) as dims(dimension,value) where value is not null
  loop
    insert into public.site_analytics_dimensions_daily (site_id,release_id,event_date,dimension,value,event_count)
    values (event_site_id,event_release_id,event_day,dimension_pair.dimension,dimension_pair.value,1)
    on conflict (site_id,release_id,event_date,dimension,value) do update
    set event_count = site_analytics_dimensions_daily.event_count + 1, updated_at = now();
  end loop;
  return created_event_id;
end;
$$;

create or replace function public.count_site_unique_visitors(target_site_id uuid, from_date date, to_date date)
returns bigint
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select count(distinct visitor_id_hash)
  from public.site_analytics_visitor_days
  where site_id=target_site_id and event_date between from_date and to_date;
$$;

revoke all on function public.site_slug_available(text,uuid) from public;
revoke all on function public.create_site(uuid,text,text,text,text) from public;
revoke all on function public.reserve_site_slug(uuid,text) from public;
revoke all on function public.commit_site_slug(uuid,text) from public;
revoke all on function public.release_pending_site_slug(uuid,text) from public;
revoke all on function public.create_site_release(uuid,uuid,text) from public;
revoke all on function public.begin_site_publish(uuid,uuid,text) from public;
revoke all on function public.complete_site_publish(uuid,text,text) from public;
revoke all on function public.fail_site_publish(uuid,text,text) from public;
revoke all on function public.complete_site_rollback(uuid,uuid,uuid) from public;
revoke all on function public.check_site_rate_limit(text,text,integer,integer) from public;
revoke all on function public.ingest_site_analytics_event(jsonb) from public;
revoke all on function public.count_site_unique_visitors(uuid,date,date) from public;

grant execute on function public.site_slug_available(text,uuid) to authenticated, service_role;
grant execute on function public.create_site(uuid,text,text,text,text) to authenticated;
grant execute on function public.reserve_site_slug(uuid,text) to authenticated;
grant execute on function public.commit_site_slug(uuid,text) to authenticated;
grant execute on function public.release_pending_site_slug(uuid,text) to authenticated;
grant execute on function public.create_site_release(uuid,uuid,text) to authenticated;
grant execute on function public.begin_site_publish(uuid,uuid,text) to authenticated;
grant execute on function public.complete_site_publish(uuid,text,text) to service_role;
grant execute on function public.fail_site_publish(uuid,text,text) to service_role;
grant execute on function public.complete_site_rollback(uuid,uuid,uuid) to service_role;
grant execute on function public.check_site_rate_limit(text,text,integer,integer) to service_role;
grant execute on function public.ingest_site_analytics_event(jsonb) to service_role;
grant execute on function public.count_site_unique_visitors(uuid,date,date) to service_role;

alter table public.sites enable row level security;
alter table public.site_reserved_slugs enable row level security;
alter table public.site_slug_claims enable row level security;
alter table public.site_uploads enable row level security;
alter table public.site_releases enable row level security;
alter table public.site_release_files enable row level security;
alter table public.site_deployment_jobs enable row level security;
alter table public.site_audit_logs enable row level security;
alter table public.site_analytics_events enable row level security;
alter table public.site_analytics_daily enable row level security;
alter table public.site_analytics_visitor_days enable row level security;
alter table public.site_analytics_top_pages_daily enable row level security;
alter table public.site_analytics_dimensions_daily enable row level security;
alter table public.site_rate_limits enable row level security;

create policy sites_managers_read on public.sites for select to authenticated
using (private.can_manage_business(business_id));
create policy sites_managers_update on public.sites for update to authenticated
using (private.can_manage_business(business_id)) with check (private.can_manage_business(business_id));
create policy sites_managers_delete on public.sites for delete to authenticated
using (private.can_manage_business(business_id));

create policy site_slug_claims_managers_read on public.site_slug_claims for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));

create policy site_uploads_managers_read on public.site_uploads for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_uploads_owner_update on public.site_uploads for update to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));

create policy site_releases_managers_read on public.site_releases for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_files_managers_read on public.site_release_files for select to authenticated
using (exists (select 1 from public.site_releases r join public.sites s on s.id = r.site_id where r.id = release_id and private.can_manage_business(s.business_id)));
create policy site_jobs_managers_read on public.site_deployment_jobs for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_audit_managers_read on public.site_audit_logs for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_events_managers_read on public.site_analytics_events for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_daily_managers_read on public.site_analytics_daily for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_pages_managers_read on public.site_analytics_top_pages_daily for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));
create policy site_dimensions_managers_read on public.site_analytics_dimensions_daily for select to authenticated
using (exists (select 1 from public.sites s where s.id = site_id and private.can_manage_business(s.business_id)));

create policy sites_service_all on public.sites for all to service_role using (true) with check (true);
create policy site_reserved_service_all on public.site_reserved_slugs for all to service_role using (true) with check (true);
create policy site_claims_service_all on public.site_slug_claims for all to service_role using (true) with check (true);
create policy site_uploads_service_all on public.site_uploads for all to service_role using (true) with check (true);
create policy site_releases_service_all on public.site_releases for all to service_role using (true) with check (true);
create policy site_files_service_all on public.site_release_files for all to service_role using (true) with check (true);
create policy site_jobs_service_all on public.site_deployment_jobs for all to service_role using (true) with check (true);
create policy site_audit_service_all on public.site_audit_logs for all to service_role using (true) with check (true);
create policy site_events_service_all on public.site_analytics_events for all to service_role using (true) with check (true);
create policy site_daily_service_all on public.site_analytics_daily for all to service_role using (true) with check (true);
create policy site_visitors_service_all on public.site_analytics_visitor_days for all to service_role using (true) with check (true);
create policy site_pages_service_all on public.site_analytics_top_pages_daily for all to service_role using (true) with check (true);
create policy site_dimensions_service_all on public.site_analytics_dimensions_daily for all to service_role using (true) with check (true);
create policy site_rate_limits_service_all on public.site_rate_limits for all to service_role using (true) with check (true);

grant select, update, delete on public.sites to authenticated;
grant select on public.site_slug_claims, public.site_uploads, public.site_releases, public.site_release_files,
  public.site_deployment_jobs, public.site_audit_logs, public.site_analytics_events,
  public.site_analytics_daily, public.site_analytics_top_pages_daily, public.site_analytics_dimensions_daily to authenticated;
grant update on public.site_uploads to authenticated;
grant all on public.sites, public.site_reserved_slugs, public.site_slug_claims, public.site_uploads,
  public.site_releases, public.site_release_files, public.site_deployment_jobs, public.site_audit_logs,
  public.site_analytics_events, public.site_analytics_daily, public.site_analytics_visitor_days,
  public.site_analytics_top_pages_daily, public.site_analytics_dimensions_daily, public.site_rate_limits to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('site-upload-staging', 'site-upload-staging', false, 1073741824),
  ('site-preview-assets', 'site-preview-assets', false, 1073741824),
  ('site-icons', 'site-icons', true, 10485760)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

create or replace function private.can_access_site_storage(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage, pg_catalog
as $$
declare
  parts text[] := storage.foldername(object_name);
  parsed_site_id uuid;
begin
  if (select auth.uid()) is null or array_length(parts, 1) < 2 or parts[1] <> (select auth.uid())::text then return false; end if;
  if parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false; end if;
  parsed_site_id := parts[2]::uuid;
  return exists (select 1 from public.sites s where s.id = parsed_site_id and s.deleted_at is null and private.can_manage_business(s.business_id));
end;
$$;

revoke all on function private.can_access_site_storage(text) from public;
grant execute on function private.can_access_site_storage(text) to authenticated, service_role;

create policy site_staging_owner_read on storage.objects for select to authenticated
using (bucket_id = 'site-upload-staging' and private.can_access_site_storage(name));
create policy site_staging_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'site-upload-staging' and private.can_access_site_storage(name));
create policy site_staging_owner_update on storage.objects for update to authenticated
using (bucket_id = 'site-upload-staging' and private.can_access_site_storage(name))
with check (bucket_id = 'site-upload-staging' and private.can_access_site_storage(name));
create policy site_staging_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'site-upload-staging' and private.can_access_site_storage(name));

create policy site_icons_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'site-icons');
create policy site_icons_manager_insert on storage.objects for insert to authenticated
with check (bucket_id = 'site-icons' and private.can_access_site_storage(name));
create policy site_icons_manager_update on storage.objects for update to authenticated
using (bucket_id = 'site-icons' and private.can_access_site_storage(name))
with check (bucket_id = 'site-icons' and private.can_access_site_storage(name));
create policy site_icons_manager_delete on storage.objects for delete to authenticated
using (bucket_id = 'site-icons' and private.can_access_site_storage(name));

-- Register existing Wersee Builder content without replacing existing storefront routes.
insert into public.sites (business_id, owner_id, name, slug, description, status, site_type, analytics_enabled, created_by, updated_by)
select
  b.id,
  b.user_id,
  coalesce(nullif(b.name,''), 'Wersee Storefront'),
  case
    when lower(coalesce(b.slug,'')) ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'
      and not exists (select 1 from public.site_reserved_slugs r where r.slug = lower(b.slug))
      and not exists (select 1 from public.sites s0 where s0.slug = lower(b.slug))
    then lower(b.slug)
    else 'builder-' || substr(replace(sc.id::text, '-', ''), 1, 12)
  end,
  b.description,
  'published',
  'wersee_builder',
  true,
  b.user_id,
  b.user_id
from public.site_content sc
join public.businesses b on b.id = sc.business_id
where b.user_id is not null
  and not exists (select 1 from public.sites s where s.business_id = b.id and s.site_type = 'wersee_builder');

insert into public.site_slug_claims (slug, site_id, state, created_by)
select s.slug, s.id, 'active', s.created_by from public.sites s
where not exists (select 1 from public.site_slug_claims c where c.slug = s.slug)
on conflict (slug) do nothing;

-- Legacy analytics is copied once into the new secure event table for migrated builder sites.
insert into public.site_analytics_events (
  site_id,event_type,session_id_hash,path,engaged_seconds,occurred_at,received_at
)
select s.id,'page_view',encode(digest(coalesce(pv.visitor_id,'legacy') || ':wersee-sites-legacy','sha256'),'hex'),pv.path,pv.duration_seconds,pv.created_at,pv.created_at
from public.page_views pv join public.sites s on s.business_id = pv.business_id and s.site_type = 'wersee_builder'
where not exists (select 1 from public.site_analytics_events e where e.site_id=s.id and e.occurred_at=pv.created_at and e.path=pv.path and e.event_type='page_view');

insert into public.site_analytics_events (
  site_id,event_type,session_id_hash,path,element_label,occurred_at,received_at
)
select s.id,'button_click',encode(digest(coalesce(c.visitor_id,'legacy') || ':wersee-sites-legacy','sha256'),'hex'),'/',left(c.element_id,120),c.created_at,c.created_at
from public.clicks c join public.sites s on s.business_id = c.business_id and s.site_type = 'wersee_builder'
where not exists (select 1 from public.site_analytics_events e where e.site_id=s.id and e.occurred_at=c.created_at and e.element_label=left(c.element_id,120) and e.event_type='button_click');

insert into public.site_analytics_daily (site_id,release_id,event_date,page_views,sessions,consented_visitors,engaged_seconds,clicks,bounces)
select
  e.site_id,
  e.release_id,
  (e.occurred_at at time zone 'UTC')::date,
  count(*) filter (where e.event_type in ('page_view','route_change')),
  count(*) filter (where e.event_type = 'session_start'),
  count(distinct e.visitor_id_hash) filter (where e.visitor_id_hash is not null),
  coalesce(sum(e.engaged_seconds),0),
  count(*) filter (where e.event_type in ('outbound_click','download_click','button_click')),
  count(*) filter (where e.is_bounce is true)
from public.site_analytics_events e
group by e.site_id,e.release_id,(e.occurred_at at time zone 'UTC')::date
on conflict (site_id,release_id,event_date) do update set
  page_views=excluded.page_views,sessions=excluded.sessions,consented_visitors=excluded.consented_visitors,
  engaged_seconds=excluded.engaged_seconds,clicks=excluded.clicks,bounces=excluded.bounces,updated_at=now();

insert into public.site_analytics_top_pages_daily (site_id,release_id,event_date,path,page_views,entries,exits,engaged_seconds)
select
  e.site_id,
  e.release_id,
  (e.occurred_at at time zone 'UTC')::date,
  e.path,
  count(*) filter (where e.event_type in ('page_view','route_change')),
  count(*) filter (where e.landing_page=e.path),
  count(*) filter (where e.event_type='session_end'),
  coalesce(sum(e.engaged_seconds),0)
from public.site_analytics_events e
where e.event_type in ('page_view','route_change','engagement','session_end')
group by e.site_id,e.release_id,(e.occurred_at at time zone 'UTC')::date,e.path
on conflict (site_id,release_id,event_date,path) do update set
  page_views=excluded.page_views,entries=excluded.entries,exits=excluded.exits,
  engaged_seconds=excluded.engaged_seconds,updated_at=now();

drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists "Anyone can insert clicks" on public.clicks;
revoke all on public.page_views from anon, authenticated;
revoke all on public.clicks from anon, authenticated;

comment on table public.page_views is 'Retired legacy storefront analytics. Browser grants and anonymous insert policies were removed by Wersee Sites.';
comment on table public.clicks is 'Retired legacy storefront analytics. Browser grants and anonymous insert policies were removed by Wersee Sites.';
comment on table public.site_analytics_events is 'Server-ingested, privacy-preserving events. Browser roles have no INSERT grant or policy.';
