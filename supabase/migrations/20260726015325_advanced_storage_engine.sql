create table public.storage_api_packfiles (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'available' check (status in ('available', 'deleted', 'failed')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.storage_api_blobs (
  id uuid primary key default gen_random_uuid(),
  sha256 text not null unique check (sha256 ~ '^[0-9a-f]{64}$'),
  stored_sha256 text not null check (stored_sha256 ~ '^[0-9a-f]{64}$'),
  original_length bigint not null check (original_length > 0),
  stored_length bigint not null check (stored_length > 0),
  compression_codec text not null check (compression_codec in ('identity', 'brotli')),
  storage_kind text not null check (storage_kind in ('object', 'pack')),
  storage_path text not null,
  packfile_id uuid references public.storage_api_packfiles(id) on delete restrict,
  pack_offset bigint check (pack_offset is null or pack_offset >= 0),
  reference_count bigint not null default 0 check (reference_count >= 0),
  status text not null default 'available' check (status in ('available', 'deleted', 'failed')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (
    (storage_kind = 'object' and packfile_id is null and pack_offset is null)
    or
    (storage_kind = 'pack' and packfile_id is not null and pack_offset is not null)
  )
);

create table public.storage_api_files (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null check (length(original_filename) between 1 and 255),
  declared_mime_type text not null,
  detected_mime_type text not null,
  original_size bigint not null check (original_size > 0),
  physical_stored_size bigint not null check (physical_stored_size > 0),
  compression_codec text not null check (compression_codec in ('identity', 'brotli', 'mixed')),
  compression_ratio numeric(12,6) not null check (compression_ratio > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'available' check (status in ('available', 'deleted', 'failed')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.storage_api_file_chunks (
  file_id uuid not null references public.storage_api_files(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  blob_id uuid not null references public.storage_api_blobs(id) on delete restrict,
  original_offset bigint not null check (original_offset >= 0),
  original_length bigint not null check (original_length > 0),
  primary key (file_id, chunk_index)
);

create table public.storage_api_uploads (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null check (length(original_filename) between 1 and 255),
  declared_mime_type text not null,
  original_size bigint not null check (original_size > 0),
  expected_sha256 text check (expected_sha256 is null or expected_sha256 ~ '^[0-9a-f]{64}$'),
  logical_chunk_size integer not null check (logical_chunk_size between 16777216 and 33554432),
  transport_slice_size integer not null check (transport_slice_size between 262144 and 4194304),
  chunk_count integer not null check (chunk_count between 1 and 100000),
  status text not null default 'initiated'
    check (status in ('initiated', 'uploading', 'finalizing', 'completed', 'failed', 'expired')),
  file_id uuid references public.storage_api_files(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.storage_api_upload_chunks (
  upload_id uuid not null references public.storage_api_uploads(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  original_offset bigint not null check (original_offset >= 0),
  original_length bigint not null check (original_length > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  detected_mime_type text not null,
  compression_codec text not null check (compression_codec in ('identity', 'brotli')),
  compression_ratio numeric(12,6) not null check (compression_ratio > 0),
  stored_length bigint not null check (stored_length > 0),
  stored_sha256 text not null check (stored_sha256 ~ '^[0-9a-f]{64}$'),
  staged_storage_path text,
  blob_id uuid references public.storage_api_blobs(id) on delete restrict,
  status text not null default 'verified' check (status in ('verified', 'failed')),
  created_at timestamptz not null default now(),
  primary key (upload_id, chunk_index)
);

create table public.storage_api_chunk_slices (
  upload_id uuid not null references public.storage_api_uploads(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  slice_offset bigint not null check (slice_offset >= 0),
  size_bytes integer not null check (size_bytes between 1 and 4194304),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  primary key (upload_id, chunk_index, slice_offset)
);

create table public.storage_api_rate_limits (
  client_key text not null,
  route text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (client_key, route, window_started_at)
);

create index storage_api_uploads_expiry_idx on public.storage_api_uploads (expires_at)
  where status in ('initiated', 'uploading', 'failed');
create index storage_api_file_chunks_blob_idx on public.storage_api_file_chunks (blob_id);
create index storage_api_blobs_pack_idx on public.storage_api_blobs (packfile_id)
  where packfile_id is not null and status = 'available';
create index storage_api_files_hash_idx on public.storage_api_files (sha256)
  where status = 'available';

alter table public.storage_api_packfiles enable row level security;
alter table public.storage_api_blobs enable row level security;
alter table public.storage_api_files enable row level security;
alter table public.storage_api_file_chunks enable row level security;
alter table public.storage_api_uploads enable row level security;
alter table public.storage_api_upload_chunks enable row level security;
alter table public.storage_api_chunk_slices enable row level security;
alter table public.storage_api_rate_limits enable row level security;

revoke all on public.storage_api_packfiles from anon, authenticated;
revoke all on public.storage_api_blobs from anon, authenticated;
revoke all on public.storage_api_files from anon, authenticated;
revoke all on public.storage_api_file_chunks from anon, authenticated;
revoke all on public.storage_api_uploads from anon, authenticated;
revoke all on public.storage_api_upload_chunks from anon, authenticated;
revoke all on public.storage_api_chunk_slices from anon, authenticated;
revoke all on public.storage_api_rate_limits from anon, authenticated;

create or replace function public.storage_api_complete_upload(
  p_upload_id uuid,
  p_file jsonb,
  p_chunks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_file_id uuid := gen_random_uuid();
  v_chunk jsonb;
begin
  if not exists (
    select 1 from public.storage_api_uploads
    where id = p_upload_id and status in ('initiated', 'uploading', 'finalizing') and expires_at > now()
  ) then
    raise exception 'upload is not active';
  end if;

  insert into public.storage_api_files (
    id, original_filename, declared_mime_type, detected_mime_type, original_size,
    physical_stored_size, compression_codec, compression_ratio, sha256, status
  ) values (
    v_file_id, p_file->>'original_filename', p_file->>'declared_mime_type',
    p_file->>'detected_mime_type', (p_file->>'original_size')::bigint,
    (p_file->>'physical_stored_size')::bigint, p_file->>'compression_codec',
    (p_file->>'compression_ratio')::numeric,
    p_file->>'sha256', 'available'
  );

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    insert into public.storage_api_file_chunks (
      file_id, chunk_index, blob_id, original_offset, original_length
    ) values (
      v_file_id, (v_chunk->>'chunk_index')::integer, (v_chunk->>'blob_id')::uuid,
      (v_chunk->>'original_offset')::bigint, (v_chunk->>'original_length')::bigint
    );
    update public.storage_api_blobs
      set reference_count = reference_count + 1
      where id = (v_chunk->>'blob_id')::uuid and status = 'available';
    if not found then raise exception 'blob is not available'; end if;
  end loop;

  update public.storage_api_uploads set
    status = 'completed', file_id = v_file_id, completed_at = now(), updated_at = now()
  where id = p_upload_id;
  return v_file_id;
end;
$$;

create or replace function public.storage_api_delete_file(p_file_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_blob_id uuid;
  v_pack_id uuid;
  v_candidate_blob_ids uuid[];
  v_candidate_pack_ids uuid[];
  v_paths jsonb := '[]'::jsonb;
begin
  if not exists (
    select 1 from public.storage_api_files where id = p_file_id and status = 'available'
  ) then
    raise exception 'file is not available';
  end if;

  select array_agg(distinct blob_id) into v_candidate_blob_ids
  from public.storage_api_file_chunks where file_id = p_file_id;
  select array_agg(distinct b.packfile_id) filter (where b.packfile_id is not null)
    into v_candidate_pack_ids
  from public.storage_api_blobs b where b.id = any(v_candidate_blob_ids);

  for v_blob_id in select unnest(v_candidate_blob_ids)
  loop
    update public.storage_api_blobs
      set reference_count = greatest(reference_count - 1, 0)
      where id = v_blob_id;
  end loop;
  update public.storage_api_files set status = 'deleted', deleted_at = now() where id = p_file_id;

  for v_blob_id in
    select distinct b.id
    from public.storage_api_blobs b
    where b.id = any(v_candidate_blob_ids)
      and b.reference_count = 0 and b.status = 'available' and b.storage_kind = 'object'
  loop
    v_paths := v_paths || jsonb_build_array(jsonb_build_object(
      'storage_path', (select storage_path from public.storage_api_blobs where id = v_blob_id)
    ));
    update public.storage_api_blobs set status = 'deleted', deleted_at = now() where id = v_blob_id;
  end loop;

  for v_pack_id in
    select p.id from public.storage_api_packfiles p
    where p.id = any(coalesce(v_candidate_pack_ids, array[]::uuid[]))
      and p.status = 'available'
      and not exists (
        select 1 from public.storage_api_blobs b
        where b.packfile_id = p.id and b.status = 'available' and b.reference_count > 0
      )
  loop
    v_paths := v_paths || jsonb_build_array(jsonb_build_object(
      'storage_path', (select storage_path from public.storage_api_packfiles where id = v_pack_id)
    ));
    update public.storage_api_blobs set status = 'deleted', deleted_at = now()
      where packfile_id = v_pack_id and reference_count = 0;
    update public.storage_api_packfiles set status = 'deleted', deleted_at = now() where id = v_pack_id;
  end loop;
  return v_paths;
end;
$$;

create or replace function public.storage_api_expire_uploads()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paths jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('storage_path', path)), '[]'::jsonb)
  into v_paths
  from (
    select s.storage_path as path
    from public.storage_api_chunk_slices s
    join public.storage_api_uploads u on u.id = s.upload_id
    where u.status in ('initiated', 'uploading', 'failed') and u.expires_at <= now()
    union
    select c.staged_storage_path
    from public.storage_api_upload_chunks c
    join public.storage_api_uploads u on u.id = c.upload_id
    where u.status in ('initiated', 'uploading', 'failed') and u.expires_at <= now()
      and c.staged_storage_path is not null
  ) garbage;
  update public.storage_api_uploads set status = 'expired', updated_at = now()
  where status in ('initiated', 'uploading', 'failed') and expires_at <= now();
  delete from public.storage_api_chunk_slices s
  using public.storage_api_uploads u
  where s.upload_id = u.id and u.status = 'expired';
  delete from public.storage_api_upload_chunks c
  using public.storage_api_uploads u
  where c.upload_id = u.id and u.status = 'expired';
  delete from public.storage_api_rate_limits where window_started_at < now() - interval '1 day';
  return v_paths;
end;
$$;

create or replace function public.storage_api_take_rate_limit(
  p_key text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_key) > 100 or length(p_route) > 300 then
    return false;
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.storage_api_rate_limits (client_key, route, window_started_at, request_count)
  values (p_key, p_route, v_window, 1)
  on conflict (client_key, route, window_started_at)
  do update set request_count = public.storage_api_rate_limits.request_count + 1
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function public.storage_api_complete_upload(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.storage_api_delete_file(uuid) from public, anon, authenticated;
revoke all on function public.storage_api_expire_uploads() from public, anon, authenticated;
revoke all on function public.storage_api_take_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.storage_api_complete_upload(uuid, jsonb, jsonb) to service_role;
grant execute on function public.storage_api_delete_file(uuid) to service_role;
grant execute on function public.storage_api_expire_uploads() to service_role;
grant execute on function public.storage_api_take_rate_limit(text, text, integer, integer) to service_role;

comment on table public.storage_api_files is
  'Canonical manifests for the isolated Wersee storage API; unavailable to browser roles.';
