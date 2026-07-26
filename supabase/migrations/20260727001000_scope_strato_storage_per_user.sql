-- Scope the advanced STRATO engine to one physical namespace per Wersee user.
-- Legacy rows remain readable with a null owner; every new upload is owner-bound.

alter table public.storage_api_packfiles
  add column if not exists owner_id uuid;
alter table public.storage_api_blobs
  add column if not exists owner_id uuid;
alter table public.storage_api_files
  add column if not exists owner_id uuid;
alter table public.storage_api_uploads
  add column if not exists owner_id uuid;

update public.storage_api_files file
set owner_id = binding.owner_id
from public.storage_gateway_objects binding
where binding.storage_file_id = file.id
  and file.owner_id is null;

update public.storage_api_uploads upload
set owner_id = gateway.owner_id
from public.storage_gateway_uploads gateway
where gateway.gateway_upload_id = upload.id
  and upload.owner_id is null;

with single_owner as (
  select
    chunk.blob_id,
    min(file.owner_id::text)::uuid as owner_id
  from public.storage_api_file_chunks chunk
  join public.storage_api_files file on file.id = chunk.file_id
  where file.owner_id is not null
  group by chunk.blob_id
  having count(distinct file.owner_id) = 1
)
update public.storage_api_blobs blob
set owner_id = single_owner.owner_id
from single_owner
where single_owner.blob_id = blob.id
  and blob.owner_id is null;

with single_owner as (
  select
    blob.packfile_id,
    min(blob.owner_id::text)::uuid as owner_id
  from public.storage_api_blobs blob
  where blob.packfile_id is not null
    and blob.owner_id is not null
  group by blob.packfile_id
  having count(distinct blob.owner_id) = 1
)
update public.storage_api_packfiles pack
set owner_id = single_owner.owner_id
from single_owner
where single_owner.packfile_id = pack.id
  and pack.owner_id is null;

alter table public.storage_api_blobs
  drop constraint if exists storage_api_blobs_sha256_key;

create unique index if not exists storage_api_blobs_owner_sha256_uidx
  on public.storage_api_blobs (owner_id, sha256)
  nulls not distinct;
create index if not exists storage_api_files_owner_hash_idx
  on public.storage_api_files (owner_id, sha256, original_size)
  where status = 'available';
create index if not exists storage_api_uploads_owner_status_idx
  on public.storage_api_uploads (owner_id, status, created_at desc);
create index if not exists storage_api_packfiles_owner_idx
  on public.storage_api_packfiles (owner_id, created_at desc);

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
  v_owner_id uuid := (p_file->>'owner_id')::uuid;
begin
  if v_owner_id is null or not exists (
    select 1
    from public.storage_api_uploads
    where id = p_upload_id
      and owner_id = v_owner_id
      and status in ('initiated', 'uploading', 'finalizing')
      and expires_at > now()
  ) then
    raise exception 'upload is not active for this owner';
  end if;

  insert into public.storage_api_files (
    id, owner_id, original_filename, declared_mime_type, detected_mime_type,
    original_size, physical_stored_size, compression_codec, compression_ratio,
    sha256, status
  ) values (
    v_file_id, v_owner_id, p_file->>'original_filename',
    p_file->>'declared_mime_type', p_file->>'detected_mime_type',
    (p_file->>'original_size')::bigint,
    (p_file->>'physical_stored_size')::bigint,
    p_file->>'compression_codec', (p_file->>'compression_ratio')::numeric,
    p_file->>'sha256', 'available'
  );

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    if not exists (
      select 1
      from public.storage_api_blobs
      where id = (v_chunk->>'blob_id')::uuid
        and owner_id = v_owner_id
        and status = 'available'
    ) then
      raise exception 'blob is not available for this owner';
    end if;

    insert into public.storage_api_file_chunks (
      file_id, chunk_index, blob_id, original_offset, original_length
    ) values (
      v_file_id, (v_chunk->>'chunk_index')::integer,
      (v_chunk->>'blob_id')::uuid, (v_chunk->>'original_offset')::bigint,
      (v_chunk->>'original_length')::bigint
    );

    update public.storage_api_blobs
    set reference_count = reference_count + 1
    where id = (v_chunk->>'blob_id')::uuid
      and owner_id = v_owner_id
      and status = 'available';
  end loop;

  update public.storage_api_uploads
  set status = 'completed',
      file_id = v_file_id,
      completed_at = now(),
      updated_at = now()
  where id = p_upload_id
    and owner_id = v_owner_id;

  return v_file_id;
end;
$$;

revoke all on function public.storage_api_complete_upload(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.storage_api_complete_upload(uuid, jsonb, jsonb)
  to service_role;

create or replace function private.storage_gateway_enforce_file_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  file_owner uuid;
begin
  if new.storage_file_id is null then
    return new;
  end if;

  select owner_id
  into file_owner
  from public.storage_api_files
  where id = new.storage_file_id
    and status = 'available';

  if not found then
    raise exception using errcode = '23503', message = 'STORAGE_FILE_NOT_AVAILABLE';
  end if;
  if file_owner is not null and file_owner <> new.owner_id then
    raise exception using errcode = '42501', message = 'STORAGE_FILE_OWNER_MISMATCH';
  end if;
  return new;
end;
$$;

revoke all on function private.storage_gateway_enforce_file_owner()
  from public, anon, authenticated;

drop trigger if exists storage_gateway_enforce_file_owner
  on public.storage_gateway_objects;
create trigger storage_gateway_enforce_file_owner
before insert or update of storage_file_id, owner_id
on public.storage_gateway_objects
for each row
execute function private.storage_gateway_enforce_file_owner();

comment on column public.storage_api_uploads.owner_id is
  'Wersee user that owns the upload and the physical STRATO users/<uuid> namespace.';
comment on column public.storage_api_files.owner_id is
  'Wersee user that owns this manifest; null is reserved for legacy files.';
comment on column public.storage_api_blobs.owner_id is
  'Scopes deduplication to one user so physical data never crosses user folders.';
