-- Wersee Sites AI Computer
-- Public rows contain only curated progress. Browser artifacts stay in a private
-- Storage bucket and are exposed through short-lived signed URLs by the Sites API.

create table if not exists public.site_ai_computer_runs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  release_id uuid not null references public.site_releases(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  stage text not null default 'queued'
    check (stage in ('queued', 'booting', 'loading', 'desktop', 'mobile', 'analyzing', 'reviewing', 'complete', 'failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  public_message text not null default 'Waiting for a private computer.',
  provider text,
  model text,
  result jsonb not null default '{}'::jsonb,
  error_code text,
  support_reference text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_ai_computer_one_active_run
  on public.site_ai_computer_runs (release_id)
  where status in ('queued', 'running');

create index if not exists site_ai_computer_runs_site_created_idx
  on public.site_ai_computer_runs (site_id, created_at desc);

create table if not exists public.site_ai_computer_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.site_ai_computer_runs(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  event_type text not null check (event_type in ('status', 'snapshot', 'finding', 'completed', 'failed')),
  stage text not null,
  progress integer not null check (progress between 0 and 100),
  public_message text not null check (char_length(public_message) between 1 and 500),
  snapshot_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists site_ai_computer_events_run_id_idx
  on public.site_ai_computer_events (run_id, id);

create table if not exists public.site_ai_computer_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.site_ai_computer_runs(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  storage_path text not null unique,
  viewport text not null check (viewport in ('desktop', 'mobile', 'element')),
  width integer not null check (width between 1 and 4096),
  height integer not null check (height between 1 and 4096),
  sequence integer not null check (sequence between 1 and 20),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  unique (run_id, sequence)
);

alter table public.site_ai_computer_events
  drop constraint if exists site_ai_computer_events_snapshot_id_fkey;
alter table public.site_ai_computer_events
  add constraint site_ai_computer_events_snapshot_id_fkey
  foreign key (snapshot_id) references public.site_ai_computer_snapshots(id) on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-ai-computer', 'site-ai-computer', false, 4194304, array['image/jpeg', 'application/json'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.site_ai_computer_runs enable row level security;
alter table public.site_ai_computer_events enable row level security;
alter table public.site_ai_computer_snapshots enable row level security;

drop policy if exists site_ai_computer_runs_managers_read on public.site_ai_computer_runs;
create policy site_ai_computer_runs_managers_read
  on public.site_ai_computer_runs for select to authenticated
  using (exists (
    select 1 from public.sites s
    where s.id = site_ai_computer_runs.site_id
      and private.can_manage_business(s.business_id)
  ));

drop policy if exists site_ai_computer_runs_managers_insert on public.site_ai_computer_runs;
create policy site_ai_computer_runs_managers_insert
  on public.site_ai_computer_runs for insert to authenticated
  with check (
    (select auth.uid()) = requested_by
    and exists (
      select 1 from public.sites s
      where s.id = site_ai_computer_runs.site_id
        and private.can_manage_business(s.business_id)
    )
  );

drop policy if exists site_ai_computer_events_managers_read on public.site_ai_computer_events;
create policy site_ai_computer_events_managers_read
  on public.site_ai_computer_events for select to authenticated
  using (exists (
    select 1 from public.sites s
    where s.id = site_ai_computer_events.site_id
      and private.can_manage_business(s.business_id)
  ));

drop policy if exists site_ai_computer_snapshots_shared_read on public.site_ai_computer_snapshots;
create policy site_ai_computer_snapshots_shared_read
  on public.site_ai_computer_snapshots for select to authenticated
  using (
    visibility = 'shared'
    and exists (
      select 1 from public.sites s
      where s.id = site_ai_computer_snapshots.site_id
        and private.can_manage_business(s.business_id)
    )
  );

revoke all on public.site_ai_computer_runs from anon, authenticated;
revoke all on public.site_ai_computer_events from anon, authenticated;
revoke all on public.site_ai_computer_snapshots from anon, authenticated;
grant select, insert on public.site_ai_computer_runs to authenticated;
grant select on public.site_ai_computer_events to authenticated;
grant select on public.site_ai_computer_snapshots to authenticated;
grant all on public.site_ai_computer_runs to service_role;
grant all on public.site_ai_computer_events to service_role;
grant all on public.site_ai_computer_snapshots to service_role;
grant usage, select on sequence public.site_ai_computer_events_id_seq to service_role;

comment on table public.site_ai_computer_runs is
  'Durable control-plane state for isolated Wersee Sites browser reviews.';
comment on column public.site_ai_computer_runs.public_message is
  'Curated progress only. Never stores hidden model reasoning or browser secrets.';
comment on table public.site_ai_computer_snapshots is
  'Private browser captures. Shared rows may receive short-lived signed URLs from the Sites API.';
