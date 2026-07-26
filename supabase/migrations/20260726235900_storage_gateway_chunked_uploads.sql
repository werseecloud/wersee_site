create table if not exists public.storage_gateway_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null references public.storage_gateway_buckets(id) on update cascade,
  logical_path text not null,
  visibility text not null check (visibility in ('public', 'private')),
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes > 0),
  expected_checksum_sha256 text
    check (
      expected_checksum_sha256 is null
      or expected_checksum_sha256 ~ '^[0-9a-f]{64}$'
    ),
  chunk_size integer not null default 3145728
    check (chunk_size between 262144 and 3145728),
  part_count integer not null check (part_count between 1 and 10000),
  status text not null default 'initiated'
    check (status in ('initiated', 'uploading', 'finalizing', 'completed', 'failed', 'aborted')),
  object_id uuid references public.storage_gateway_objects(id) on delete set null,
  error_code text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.storage_gateway_upload_parts (
  upload_id uuid not null references public.storage_gateway_uploads(id) on delete cascade,
  part_number integer not null check (part_number >= 0),
  size_bytes integer not null check (size_bytes between 1 and 3145728),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (upload_id, part_number)
);

create index if not exists storage_gateway_uploads_owner_created_idx
  on public.storage_gateway_uploads (owner_id, created_at desc);

create index if not exists storage_gateway_uploads_expiry_idx
  on public.storage_gateway_uploads (expires_at)
  where status in ('initiated', 'uploading', 'failed');

alter table public.storage_gateway_uploads enable row level security;
alter table public.storage_gateway_upload_parts enable row level security;

drop policy if exists "storage gateway users read owned uploads"
  on public.storage_gateway_uploads;
create policy "storage gateway users read owned uploads"
  on public.storage_gateway_uploads
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "storage gateway users create owned uploads"
  on public.storage_gateway_uploads;
create policy "storage gateway users create owned uploads"
  on public.storage_gateway_uploads
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and expires_at <= now() + interval '25 hours'
  );

drop policy if exists "storage gateway users update owned uploads"
  on public.storage_gateway_uploads;
create policy "storage gateway users update owned uploads"
  on public.storage_gateway_uploads
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "storage gateway users delete owned uploads"
  on public.storage_gateway_uploads;
create policy "storage gateway users delete owned uploads"
  on public.storage_gateway_uploads
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "storage gateway users read owned upload parts"
  on public.storage_gateway_upload_parts;
create policy "storage gateway users read owned upload parts"
  on public.storage_gateway_upload_parts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.storage_gateway_uploads upload
      where upload.id = upload_id
        and upload.owner_id = (select auth.uid())
    )
  );

drop policy if exists "storage gateway users create owned upload parts"
  on public.storage_gateway_upload_parts;
create policy "storage gateway users create owned upload parts"
  on public.storage_gateway_upload_parts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.storage_gateway_uploads upload
      where upload.id = upload_id
        and upload.owner_id = (select auth.uid())
        and upload.status in ('initiated', 'uploading')
        and upload.expires_at > now()
        and part_number < upload.part_count
    )
  );

drop policy if exists "storage gateway users update owned upload parts"
  on public.storage_gateway_upload_parts;
create policy "storage gateway users update owned upload parts"
  on public.storage_gateway_upload_parts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.storage_gateway_uploads upload
      where upload.id = upload_id
        and upload.owner_id = (select auth.uid())
        and upload.status in ('initiated', 'uploading')
        and upload.expires_at > now()
    )
  )
  with check (
    exists (
      select 1
      from public.storage_gateway_uploads upload
      where upload.id = upload_id
        and upload.owner_id = (select auth.uid())
        and upload.status in ('initiated', 'uploading')
        and upload.expires_at > now()
        and part_number < upload.part_count
    )
  );

drop policy if exists "storage gateway users delete owned upload parts"
  on public.storage_gateway_upload_parts;
create policy "storage gateway users delete owned upload parts"
  on public.storage_gateway_upload_parts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.storage_gateway_uploads upload
      where upload.id = upload_id
        and upload.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.storage_gateway_uploads to authenticated;
grant select, insert, update, delete on public.storage_gateway_upload_parts to authenticated;

comment on table public.storage_gateway_uploads is
  'Short-lived authenticated multipart sessions for Vercel-to-STRATO uploads.';

comment on table public.storage_gateway_upload_parts is
  'Checksummed parts for a storage gateway upload session.';
