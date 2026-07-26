-- Provider-neutral Wersee storage bindings and a durable Supabase fallback.
-- Browser roles may read authorized bindings, but every mutation is server-side.

alter table public.storage_gateway_buckets
  add column if not exists write_provider text not null default 'supabase',
  add column if not exists read_mode text not null default 'hybrid',
  add column if not exists fallback_to_supabase boolean not null default true;

alter table public.storage_gateway_buckets
  drop constraint if exists storage_gateway_buckets_write_provider_check,
  drop constraint if exists storage_gateway_buckets_read_mode_check;

alter table public.storage_gateway_buckets
  add constraint storage_gateway_buckets_write_provider_check
    check (write_provider in ('strato', 'supabase')),
  add constraint storage_gateway_buckets_read_mode_check
    check (read_mode in ('hybrid', 'strato-only', 'supabase-only'));

-- Sensitive product buckets stay private in Wersee routing even if a legacy
-- Storage bucket was accidentally made public.
update public.storage_gateway_buckets
set public = false,
    updated_at = now()
where id = any (array[
  'business_storage',
  'chat-attachments',
  'contracts',
  'digital-products',
  'investment-private-documents',
  'investment-public-documents',
  'investment-review-documents',
  'launch-ai-media',
  'mail-bridge-outbound-attachments',
  'order-evidence',
  'order-pdfs',
  'public-dm-attachments',
  'site-ai-computer',
  'site-preview-assets',
  'site-upload-staging',
  'trust-evidence',
  'trust-exports',
  'wersee-files',
  'wersee-invest-private-documents',
  'wersee-invest-public-documents'
]);

alter table public.storage_gateway_objects
  add column if not exists storage_file_id uuid,
  add column if not exists workspace_id uuid,
  add column if not exists provider_version text not null default 'advanced-v1',
  add column if not exists finalized_upload_id uuid,
  add column if not exists fallback_from_provider text,
  add column if not exists failure_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storage_gateway_objects_storage_file_id_fkey'
      and conrelid = 'public.storage_gateway_objects'::regclass
  ) then
    alter table public.storage_gateway_objects
      add constraint storage_gateway_objects_storage_file_id_fkey
      foreign key (storage_file_id)
      references public.storage_api_files(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'storage_gateway_objects_workspace_id_fkey'
      and conrelid = 'public.storage_gateway_objects'::regclass
  ) then
    alter table public.storage_gateway_objects
      add constraint storage_gateway_objects_workspace_id_fkey
      foreign key (workspace_id)
      references public.businesses(id)
      on delete set null;
  end if;
end
$$;

alter table public.storage_gateway_objects
  drop constraint if exists storage_gateway_objects_bucket_id_owner_id_logical_path_key,
  drop constraint if exists storage_gateway_objects_storage_path_key,
  drop constraint if exists storage_gateway_objects_provider_check;

alter table public.storage_gateway_objects
  add constraint storage_gateway_objects_provider_check
    check (provider in ('strato', 'supabase')),
  add constraint storage_gateway_objects_storage_reference_check
    check (
      (provider = 'strato' and storage_file_id is not null)
      or
      (provider = 'supabase' and storage_file_id is null)
    ),
  add constraint storage_gateway_objects_fallback_provider_check
    check (
      fallback_from_provider is null
      or fallback_from_provider in ('strato', 'supabase')
    );

create unique index if not exists storage_gateway_objects_active_path_uidx
  on public.storage_gateway_objects (owner_id, bucket_id, logical_path)
  where deleted_at is null;

create index if not exists storage_gateway_objects_workspace_listing_idx
  on public.storage_gateway_objects (workspace_id, bucket_id, logical_path)
  where deleted_at is null;

create index if not exists storage_gateway_objects_active_file_ref_idx
  on public.storage_gateway_objects (storage_file_id)
  where deleted_at is null and status = 'available' and storage_file_id is not null;

create index if not exists storage_gateway_objects_provider_status_idx
  on public.storage_gateway_objects (provider, status, updated_at desc);

alter table public.storage_gateway_uploads
  add column if not exists workspace_id uuid,
  add column if not exists provider text not null default 'strato',
  add column if not exists gateway_upload_id uuid,
  add column if not exists supabase_storage_path text,
  add column if not exists fallback_from_provider text,
  add column if not exists grant_nonce uuid not null default gen_random_uuid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storage_gateway_uploads_workspace_id_fkey'
      and conrelid = 'public.storage_gateway_uploads'::regclass
  ) then
    alter table public.storage_gateway_uploads
      add constraint storage_gateway_uploads_workspace_id_fkey
      foreign key (workspace_id)
      references public.businesses(id)
      on delete set null;
  end if;
end
$$;

alter table public.storage_gateway_uploads
  drop constraint if exists storage_gateway_uploads_provider_check,
  drop constraint if exists storage_gateway_uploads_fallback_provider_check;

alter table public.storage_gateway_uploads
  add constraint storage_gateway_uploads_provider_check
    check (provider in ('strato', 'supabase')),
  add constraint storage_gateway_uploads_fallback_provider_check
    check (
      fallback_from_provider is null
      or fallback_from_provider in ('strato', 'supabase')
    );

create index if not exists storage_gateway_uploads_gateway_upload_idx
  on public.storage_gateway_uploads (gateway_upload_id)
  where gateway_upload_id is not null;

-- Existing browser mutation grants were inherited broadly in this project.
-- RLS alone is not enough for an advanced file-id binding.
revoke all on public.storage_gateway_objects from anon, authenticated;
revoke all on public.storage_gateway_uploads from anon, authenticated;
revoke all on public.storage_gateway_upload_parts from anon, authenticated;
revoke all on public.storage_gateway_buckets from anon, authenticated;

grant select on public.storage_gateway_buckets to anon, authenticated;
grant select on public.storage_gateway_objects to anon, authenticated;

drop policy if exists "storage gateway users create owned objects"
  on public.storage_gateway_objects;
drop policy if exists "storage gateway users update owned objects"
  on public.storage_gateway_objects;
drop policy if exists "storage gateway users delete owned objects"
  on public.storage_gateway_objects;
drop policy if exists "storage gateway users read owned uploads"
  on public.storage_gateway_uploads;
drop policy if exists "storage gateway users create owned uploads"
  on public.storage_gateway_uploads;
drop policy if exists "storage gateway users update owned uploads"
  on public.storage_gateway_uploads;
drop policy if exists "storage gateway users delete owned uploads"
  on public.storage_gateway_uploads;
drop policy if exists "storage gateway users read owned upload parts"
  on public.storage_gateway_upload_parts;
drop policy if exists "storage gateway users create owned upload parts"
  on public.storage_gateway_upload_parts;
drop policy if exists "storage gateway users update owned upload parts"
  on public.storage_gateway_upload_parts;
drop policy if exists "storage gateway users delete owned upload parts"
  on public.storage_gateway_upload_parts;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.storage_workspace_member(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_workspace_id is not null
    and (
    exists (
      select 1
      from public.businesses business
      where business.id = target_workspace_id
        and business.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.business_members member
      where member.business_id = target_workspace_id
        and member.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.team_members member
      where member.business_id = target_workspace_id
        and member.user_id = (select auth.uid())
        and coalesce(member.status, 'active') = 'active'
    )
    );
$$;

revoke execute on function private.storage_workspace_member(uuid)
  from public, anon;
grant execute on function private.storage_workspace_member(uuid)
  to authenticated;

drop policy if exists "storage gateway public or owned objects are readable"
  on public.storage_gateway_objects;

create policy "storage gateway public objects are readable"
  on public.storage_gateway_objects
  for select
  to anon
  using (
    deleted_at is null
    and status = 'available'
    and visibility = 'public'
  );

create policy "storage gateway authorized objects are readable"
  on public.storage_gateway_objects
  for select
  to authenticated
  using (
    deleted_at is null
    and status = 'available'
    and (
      visibility = 'public'
      or owner_id = (select auth.uid())
      or (
        workspace_id is not null
        and (select private.storage_workspace_member(workspace_id))
      )
    )
  );

create or replace function public.finalize_storage_gateway_object(
  p_upload_id uuid,
  p_owner_id uuid,
  p_storage_file_id uuid default null,
  p_supabase_storage_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  upload_row public.storage_gateway_uploads%rowtype;
  file_row public.storage_api_files%rowtype;
  existing_row public.storage_gateway_objects%rowtype;
  result_row public.storage_gateway_objects%rowtype;
  resolved_storage_path text;
  old_size bigint := 0;
  usage_delta bigint := 0;
begin
  select *
  into upload_row
  from public.storage_gateway_uploads
  where id = p_upload_id
  for update;

  if upload_row.id is null
    or upload_row.owner_id <> p_owner_id
    or upload_row.status not in ('initiated', 'uploading', 'finalizing')
    or upload_row.expires_at <= now() then
    raise exception using errcode = '22023', message = 'UPLOAD_NOT_FINALIZABLE';
  end if;

  if upload_row.expected_checksum_sha256 is null then
    raise exception using errcode = '22023', message = 'EXPECTED_CHECKSUM_REQUIRED';
  end if;

  if upload_row.workspace_id is not null
    and not (
      exists (
        select 1 from public.businesses business
        where business.id = upload_row.workspace_id
          and business.user_id = p_owner_id
      )
      or exists (
        select 1 from public.business_members member
        where member.business_id = upload_row.workspace_id
          and member.user_id = p_owner_id
      )
      or exists (
        select 1 from public.team_members member
        where member.business_id = upload_row.workspace_id
          and member.user_id = p_owner_id
          and coalesce(member.status, 'active') = 'active'
      )
    ) then
    raise exception using errcode = '42501', message = 'WORKSPACE_FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.storage_gateway_buckets bucket
    where bucket.id = upload_row.bucket_id
      and bucket.enabled
      and (
        bucket.file_size_limit is null
        or upload_row.size_bytes <= bucket.file_size_limit
      )
      and (
        bucket.allowed_mime_types is null
        or upload_row.mime_type = any (bucket.allowed_mime_types)
      )
  ) then
    raise exception using errcode = '22023', message = 'BUCKET_POLICY_REJECTED';
  end if;

  if upload_row.provider = 'strato' then
    if p_storage_file_id is null then
      raise exception using errcode = '22023', message = 'STORAGE_FILE_ID_REQUIRED';
    end if;

    select *
    into file_row
    from public.storage_api_files
    where id = p_storage_file_id
      and status = 'available';

    if file_row.id is null
      or file_row.original_size <> upload_row.size_bytes
      or (
        upload_row.expected_checksum_sha256 is not null
        and file_row.sha256 <> upload_row.expected_checksum_sha256
      ) then
      raise exception using errcode = '22023', message = 'GATEWAY_METADATA_MISMATCH';
    end if;

    resolved_storage_path := 'advanced:' || p_storage_file_id::text;
  else
    if p_supabase_storage_path is null
      or p_supabase_storage_path <> upload_row.supabase_storage_path
      or not exists (
        select 1
        from storage.objects object
        where object.bucket_id = upload_row.bucket_id
          and object.name = p_supabase_storage_path
      ) then
      raise exception using errcode = '22023', message = 'SUPABASE_BACKUP_NOT_FOUND';
    end if;
    resolved_storage_path := p_supabase_storage_path;
  end if;

  select *
  into existing_row
  from public.storage_gateway_objects object
  where object.owner_id = p_owner_id
    and object.bucket_id = upload_row.bucket_id
    and object.logical_path = upload_row.logical_path
    and object.deleted_at is null
  for update;

  if existing_row.id is not null then
    old_size := existing_row.size_bytes;
    update public.storage_gateway_objects
    set storage_path = resolved_storage_path,
        storage_file_id = case when upload_row.provider = 'strato' then p_storage_file_id else null end,
        workspace_id = upload_row.workspace_id,
        provider = upload_row.provider,
        provider_version = case when upload_row.provider = 'strato' then 'advanced-v1' else 'supabase-v1' end,
        visibility = upload_row.visibility,
        mime_type = upload_row.mime_type,
        size_bytes = upload_row.size_bytes,
        checksum_sha256 = coalesce(
          upload_row.expected_checksum_sha256,
          case when upload_row.provider = 'strato' then file_row.sha256 else existing_row.checksum_sha256 end
        ),
        status = 'available',
        finalized_upload_id = upload_row.id,
        fallback_from_provider = upload_row.fallback_from_provider,
        failure_code = null,
        updated_at = now()
    where id = existing_row.id
    returning * into result_row;
  else
    insert into public.storage_gateway_objects (
      bucket_id,
      logical_path,
      storage_path,
      storage_file_id,
      workspace_id,
      owner_id,
      provider,
      provider_version,
      visibility,
      mime_type,
      size_bytes,
      checksum_sha256,
      status,
      finalized_upload_id,
      fallback_from_provider
    )
    values (
      upload_row.bucket_id,
      upload_row.logical_path,
      resolved_storage_path,
      case when upload_row.provider = 'strato' then p_storage_file_id else null end,
      upload_row.workspace_id,
      p_owner_id,
      upload_row.provider,
      case when upload_row.provider = 'strato' then 'advanced-v1' else 'supabase-v1' end,
      upload_row.visibility,
      upload_row.mime_type,
      upload_row.size_bytes,
      coalesce(
        upload_row.expected_checksum_sha256,
        case when upload_row.provider = 'strato' then file_row.sha256 else repeat('0', 64) end
      ),
      'available',
      upload_row.id,
      upload_row.fallback_from_provider
    )
    returning * into result_row;
  end if;

  usage_delta := upload_row.size_bytes - old_size;
  insert into public.storage_usage (user_id, used_bytes)
  values (p_owner_id, greatest(usage_delta, 0))
  on conflict (user_id) do update
  set used_bytes = greatest(0, coalesce(public.storage_usage.used_bytes, 0) + usage_delta),
      updated_at = now();

  update public.storage_gateway_uploads
  set status = 'completed',
      object_id = result_row.id,
      completed_at = now(),
      updated_at = now(),
      error_code = null
  where id = upload_row.id;

  return jsonb_build_object(
    'ok', true,
    'object_id', result_row.id,
    'provider', result_row.provider,
    'storage_file_id', result_row.storage_file_id
  );
exception
  when others then
    update public.storage_gateway_uploads
    set status = 'failed',
        error_code = left(sqlerrm, 100),
        updated_at = now()
    where id = p_upload_id;
    return jsonb_build_object(
      'ok', false,
      'code', left(sqlerrm, 100)
    );
end;
$$;

create or replace function public.soft_delete_storage_gateway_object(
  p_object_id uuid,
  p_owner_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  object_row public.storage_gateway_objects%rowtype;
  remaining_refs bigint := 0;
begin
  select *
  into object_row
  from public.storage_gateway_objects
  where id = p_object_id
  for update;

  if object_row.id is null or object_row.owner_id <> p_owner_id then
    raise exception using errcode = '42501', message = 'OBJECT_FORBIDDEN';
  end if;

  if object_row.deleted_at is null then
    update public.storage_gateway_objects
    set status = 'deleted',
        deleted_at = now(),
        updated_at = now()
    where id = object_row.id;

    update public.storage_usage
    set used_bytes = greatest(0, coalesce(used_bytes, 0) - object_row.size_bytes),
        updated_at = now()
    where user_id = p_owner_id;
  end if;

  if object_row.storage_file_id is not null then
    select count(*)
    into remaining_refs
    from public.storage_gateway_objects
    where storage_file_id = object_row.storage_file_id
      and deleted_at is null
      and status = 'available';
  end if;

  return jsonb_build_object(
    'object_id', object_row.id,
    'provider', object_row.provider,
    'bucket_id', object_row.bucket_id,
    'storage_path', object_row.storage_path,
    'storage_file_id', object_row.storage_file_id,
    'remaining_references', remaining_refs,
    'delete_physical', object_row.storage_file_id is not null and remaining_refs = 0
  );
end;
$$;

create or replace function public.move_storage_gateway_object(
  p_object_id uuid,
  p_owner_id uuid,
  p_logical_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  moved_id uuid;
begin
  if p_logical_path is null
    or length(p_logical_path) = 0
    or length(p_logical_path) > 1024
    or p_logical_path like '/%'
    or p_logical_path like '%..%' then
    raise exception using errcode = '22023', message = 'INVALID_LOGICAL_PATH';
  end if;

  update public.storage_gateway_objects
  set logical_path = p_logical_path,
      updated_at = now()
  where id = p_object_id
    and owner_id = p_owner_id
    and deleted_at is null
    and status = 'available'
  returning id into moved_id;

  if moved_id is null then
    raise exception using errcode = '42501', message = 'OBJECT_FORBIDDEN';
  end if;
  return moved_id;
end;
$$;

revoke all on function public.finalize_storage_gateway_object(uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.soft_delete_storage_gateway_object(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.move_storage_gateway_object(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.finalize_storage_gateway_object(uuid, uuid, uuid, text)
  to service_role;
grant execute on function public.soft_delete_storage_gateway_object(uuid, uuid)
  to service_role;
grant execute on function public.move_storage_gateway_object(uuid, uuid, text)
  to service_role;

comment on column public.storage_gateway_buckets.write_provider is
  'Server-side rollout flag. Non-STRATO writes use the durable Supabase Storage fallback.';
comment on column public.storage_gateway_buckets.read_mode is
  'Provider-neutral read rollout mode; existing buckets default to hybrid.';
comment on column public.storage_gateway_objects.storage_file_id is
  'Canonical advanced gateway file reference. Never contains a physical SFTP path.';
