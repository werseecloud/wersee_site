create table if not exists public.storage_gateway_buckets (
  id text primary key,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.storage_gateway_buckets (
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  enabled
)
select
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  true
from storage.buckets
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

create table if not exists public.storage_gateway_objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references public.storage_gateway_buckets(id) on update cascade,
  logical_path text not null,
  storage_path text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'strato' check (provider in ('strato', 'supabase')),
  visibility text not null check (visibility in ('public', 'private')),
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'available'
    check (status in ('uploading', 'available', 'quarantined', 'deleted', 'failed')),
  migrated_from_object_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket_id, owner_id, logical_path),
  unique (storage_path)
);

create index if not exists storage_gateway_objects_owner_created_idx
  on public.storage_gateway_objects (owner_id, created_at desc);

create index if not exists storage_gateway_objects_bucket_path_idx
  on public.storage_gateway_objects (bucket_id, logical_path text_pattern_ops)
  where deleted_at is null;

alter table public.storage_gateway_buckets enable row level security;
alter table public.storage_gateway_objects enable row level security;

drop policy if exists "storage gateway bucket configuration is readable"
  on public.storage_gateway_buckets;
create policy "storage gateway bucket configuration is readable"
  on public.storage_gateway_buckets
  for select
  to anon, authenticated
  using (enabled);

drop policy if exists "storage gateway public or owned objects are readable"
  on public.storage_gateway_objects;
create policy "storage gateway public or owned objects are readable"
  on public.storage_gateway_objects
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'available'
    and (
      visibility = 'public'
      or owner_id = (select auth.uid())
    )
  );

drop policy if exists "storage gateway users create owned objects"
  on public.storage_gateway_objects;
create policy "storage gateway users create owned objects"
  on public.storage_gateway_objects
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and provider = 'strato'
    and deleted_at is null
  );

drop policy if exists "storage gateway users update owned objects"
  on public.storage_gateway_objects;
create policy "storage gateway users update owned objects"
  on public.storage_gateway_objects
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "storage gateway users delete owned objects"
  on public.storage_gateway_objects;
create policy "storage gateway users delete owned objects"
  on public.storage_gateway_objects
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

grant select on public.storage_gateway_buckets to anon, authenticated;
grant select, insert, update, delete on public.storage_gateway_objects to authenticated;
grant select on public.storage_gateway_objects to anon;

comment on table public.storage_gateway_objects is
  'Metadata for objects written to STRATO during the Supabase-to-STRATO hybrid migration.';
