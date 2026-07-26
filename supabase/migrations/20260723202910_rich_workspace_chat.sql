-- Rich workspace chat: private files, live presence, durable receipts and
-- notification fan-out. All client-facing objects remain protected by RLS.

update storage.buckets
set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip'
  ]::text[]
where id = 'chat-attachments';

-- The older global read policy included every bucket except Sites. Exclude
-- private chat files so a signed-in non-participant cannot enumerate them.
drop policy if exists "Allow Public Access to All Buckets" on storage.objects;
create policy "Allow Public Access to All Buckets"
  on storage.objects
  for select
  to public
  using (
    bucket_id not in (
      'site-upload-staging',
      'site-preview-assets',
      'site-icons',
      'chat-attachments'
    )
  );

drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated views" on storage.objects;
drop policy if exists "Allow individual delete" on storage.objects;
drop policy if exists chat_attachment_member_read on storage.objects;
drop policy if exists chat_attachment_member_insert on storage.objects;
drop policy if exists chat_attachment_owner_update on storage.objects;
drop policy if exists chat_attachment_owner_delete on storage.objects;

create policy chat_attachment_member_read
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      public.is_chat_member(
        case
          when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then ((storage.foldername(name))[1])::uuid
          else null
        end
      )
      or exists (
        select 1
        from public.messages message
        where public.is_chat_member(message.chat_id)
          and (
            right(coalesce(message.image_url, ''), length(objects.name)) = objects.name
            or right(coalesce(message.audio_url, ''), length(objects.name)) = objects.name
            or exists (
              select 1
              from jsonb_array_elements(
                case
                  when jsonb_typeof(message.attachments) = 'array' then message.attachments
                  else '[]'::jsonb
                end
              ) attachment
              where attachment ->> 'path' = objects.name
            )
          )
      )
    )
  );

create policy chat_attachment_member_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and public.is_chat_member(
      case
        when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end
    )
  );

create policy chat_attachment_owner_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'chat-attachments' and owner = (select auth.uid()))
  with check (bucket_id = 'chat-attachments' and owner = (select auth.uid()));

create policy chat_attachment_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'chat-attachments' and owner = (select auth.uid()));

create table if not exists public.chat_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null default 'chat-attachments'
    check (bucket = 'chat-attachments'),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0
    check (size_bytes >= 0 and size_bytes <= 26214400),
  kind text not null default 'file'
    check (kind in ('image', 'audio', 'video', 'pdf', 'spreadsheet', 'document', 'file')),
  duration_seconds numeric,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (message_id, storage_path)
);

create index if not exists chat_message_attachments_chat_created_idx
  on public.chat_message_attachments(chat_id, created_at desc);
create index if not exists chat_message_attachments_uploader_idx
  on public.chat_message_attachments(uploader_id);

alter table public.chat_message_attachments enable row level security;

drop policy if exists "Chat members read message attachments" on public.chat_message_attachments;
create policy "Chat members read message attachments"
  on public.chat_message_attachments
  for select
  to authenticated
  using (public.is_chat_member(chat_id));

drop policy if exists "Chat members add their attachments" on public.chat_message_attachments;
create policy "Chat members add their attachments"
  on public.chat_message_attachments
  for insert
  to authenticated
  with check (
    uploader_id = (select auth.uid())
    and public.is_chat_member(chat_id)
    and split_part(storage_path, '/', 1) = chat_id::text
    and split_part(storage_path, '/', 2) = (select auth.uid())::text
  );

drop policy if exists "Uploaders delete their attachments" on public.chat_message_attachments;
create policy "Uploaders delete their attachments"
  on public.chat_message_attachments
  for delete
  to authenticated
  using (
    uploader_id = (select auth.uid())
    and public.is_chat_member(chat_id)
  );

create table if not exists public.chat_message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists chat_message_receipts_user_unread_idx
  on public.chat_message_receipts(user_id, chat_id, created_at desc)
  where read_at is null;

alter table public.chat_message_receipts enable row level security;

drop policy if exists "Chat members read message receipts" on public.chat_message_receipts;
create policy "Chat members read message receipts"
  on public.chat_message_receipts
  for select
  to authenticated
  using (public.is_chat_member(chat_id));

drop policy if exists "Recipients update own message receipts" on public.chat_message_receipts;
create policy "Recipients update own message receipts"
  on public.chat_message_receipts
  for update
  to authenticated
  using (user_id = (select auth.uid()) and public.is_chat_member(chat_id))
  with check (user_id = (select auth.uid()) and public.is_chat_member(chat_id));

drop policy if exists "Participants update own unread count" on public.chat_participants;
create policy "Participants update own unread count"
  on public.chat_participants
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.chat_user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'online'
    check (status in ('online', 'away', 'dnd', 'offline')),
  active_chat_id uuid references public.chats(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_participants
  add column if not exists alias text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.chat_participants'::regclass
      and conname = 'chat_participants_alias_length'
  ) then
    alter table public.chat_participants
      add constraint chat_participants_alias_length
      check (alias is null or char_length(alias) <= 80);
  end if;
end
$$;

create index if not exists chat_user_presence_active_idx
  on public.chat_user_presence(active_chat_id, last_seen_at desc)
  where status <> 'offline';

alter table public.chat_user_presence enable row level security;

create schema if not exists private;

create or replace function private.can_view_chat_presence(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    or exists (
      select 1
      from public.chat_participants mine
      join public.chat_participants theirs
        on theirs.chat_id = mine.chat_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = p_user_id
    );
$$;

revoke all on function private.can_view_chat_presence(uuid) from public, anon;
grant execute on function private.can_view_chat_presence(uuid) to authenticated, service_role;

drop policy if exists "Chat contacts read presence" on public.chat_user_presence;
create policy "Chat contacts read presence"
  on public.chat_user_presence
  for select
  to authenticated
  using (private.can_view_chat_presence(user_id));

drop policy if exists "Users insert own presence" on public.chat_user_presence;
create policy "Users insert own presence"
  on public.chat_user_presence
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (active_chat_id is null or public.is_chat_member(active_chat_id))
  );

drop policy if exists "Users update own presence" on public.chat_user_presence;
create policy "Users update own presence"
  on public.chat_user_presence
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (active_chat_id is null or public.is_chat_member(active_chat_id))
  );

create or replace function public.mark_chat_read(p_chat_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_chat_member(p_chat_id) then
    raise exception 'not a chat member' using errcode = '42501';
  end if;

  update public.chat_message_receipts
  set
    delivered_at = coalesce(delivered_at, now()),
    read_at = coalesce(read_at, now())
  where chat_id = p_chat_id
    and user_id = (select auth.uid())
    and read_at is null;

  update public.chat_participants
  set unread_count = 0
  where chat_id = p_chat_id
    and user_id = (select auth.uid());

  update public.messages message
  set is_read = true
  where message.chat_id = p_chat_id
    and message.sender_id <> (select auth.uid())
    and not exists (
      select 1
      from public.chat_message_receipts receipt
      where receipt.message_id = message.id
        and receipt.read_at is null
    );
end;
$$;

revoke all on function public.mark_chat_read(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated, service_role;

create or replace function public.reset_unread_count(p_chat_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_user_id is distinct from (select auth.uid())
    or not public.is_chat_member(p_chat_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform public.mark_chat_read(p_chat_id);
end;
$$;

revoke all on function public.reset_unread_count(uuid, uuid) from public, anon;
grant execute on function public.reset_unread_count(uuid, uuid) to authenticated, service_role;

create or replace function private.after_chat_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preview text;
  v_chat_name text;
begin
  v_preview := case
    when new.type = 'voice' or new.audio_url is not null then 'Voice message'
    when new.type = 'image' or new.image_url is not null then 'Image attachment'
    when new.type in ('file', 'pdf', 'spreadsheet', 'document', 'video') then 'File attachment'
    when new.type in ('invoice', 'payment_link', 'quick_link') then 'Shared link'
    when new.is_encrypted then 'Encrypted message'
    else left(coalesce(new.content, 'New message'), 120)
  end;

  select coalesce(nullif(name, ''), 'Chats')
  into v_chat_name
  from public.chats
  where id = new.chat_id;

  insert into public.chat_message_receipts(message_id, chat_id, user_id)
  select new.id, new.chat_id, participant.user_id
  from public.chat_participants participant
  where participant.chat_id = new.chat_id
    and participant.user_id <> new.sender_id
  on conflict (message_id, user_id) do nothing;

  update public.chat_participants
  set unread_count = coalesce(unread_count, 0) + 1
  where chat_id = new.chat_id
    and user_id <> new.sender_id;

  update public.chats
  set
    updated_at = now(),
    last_message_at = new.created_at,
    last_message = v_preview
  where id = new.chat_id;

  insert into public.notifications(user_id, type, category, title, message, data)
  select
    participant.user_id,
    'chat_message',
    'chat',
    coalesce(v_chat_name, 'Chats'),
    v_preview,
    jsonb_build_object(
      'chat_id', new.chat_id,
      'message_id', new.id,
      'sender_id', new.sender_id
    )
  from public.chat_participants participant
  where participant.chat_id = new.chat_id
    and participant.user_id <> new.sender_id;

  if jsonb_typeof(new.attachments) = 'array' then
    insert into public.chat_message_attachments(
      message_id,
      chat_id,
      uploader_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes,
      kind,
      duration_seconds,
      width,
      height,
      metadata
    )
    select
      new.id,
      new.chat_id,
      new.sender_id,
      attachment ->> 'path',
      coalesce(attachment ->> 'name', 'Attachment'),
      coalesce(attachment ->> 'mimeType', 'application/octet-stream'),
      case
        when coalesce(attachment ->> 'size', '') ~ '^[0-9]+$'
          then (attachment ->> 'size')::bigint
        else 0
      end,
      case
        when attachment ->> 'kind' in ('image', 'audio', 'video', 'pdf', 'spreadsheet', 'document', 'file')
          then attachment ->> 'kind'
        else 'file'
      end,
      case
        when coalesce(attachment ->> 'duration', '') ~ '^[0-9]+([.][0-9]+)?$'
          then (attachment ->> 'duration')::numeric
        else null
      end,
      case
        when coalesce(attachment ->> 'width', '') ~ '^[0-9]+$'
          then (attachment ->> 'width')::integer
        else null
      end,
      case
        when coalesce(attachment ->> 'height', '') ~ '^[0-9]+$'
          then (attachment ->> 'height')::integer
        else null
      end,
      attachment - array['path', 'name', 'mimeType', 'size', 'kind', 'duration', 'width', 'height']
    from jsonb_array_elements(new.attachments) attachment
    where nullif(attachment ->> 'path', '') is not null
    on conflict (message_id, storage_path) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.after_chat_message_insert() from public, anon, authenticated;

drop trigger if exists after_chat_message_insert on public.messages;
create trigger after_chat_message_insert
after insert on public.messages
for each row execute function private.after_chat_message_insert();

-- Private Realtime Broadcast and Presence channels are authorized by chat
-- membership. Topic format is chat:<uuid>.
drop policy if exists "Chat members receive realtime" on realtime.messages;
create policy "Chat members receive realtime"
  on realtime.messages
  for select
  to authenticated
  using (
    extension in ('broadcast', 'presence')
    and case
      when realtime.topic() ~* '^chat:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then public.is_chat_member(split_part(realtime.topic(), ':', 2)::uuid)
      else false
    end
  );

drop policy if exists "Chat members publish realtime" on realtime.messages;
create policy "Chat members publish realtime"
  on realtime.messages
  for insert
  to authenticated
  with check (
    extension in ('broadcast', 'presence')
    and case
      when realtime.topic() ~* '^chat:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then public.is_chat_member(split_part(realtime.topic(), ':', 2)::uuid)
      else false
    end
  );

grant select, insert, delete on public.chat_message_attachments to authenticated;
grant select, update on public.chat_message_receipts to authenticated;
grant select, insert, update on public.chat_user_presence to authenticated;
grant all on public.chat_message_attachments, public.chat_message_receipts, public.chat_user_presence to service_role;
revoke all on public.chat_message_attachments, public.chat_message_receipts, public.chat_user_presence from anon;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_message_receipts'
  ) then
    alter publication supabase_realtime add table public.chat_message_receipts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_user_presence'
  ) then
    alter publication supabase_realtime add table public.chat_user_presence;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
/*
  Historical draft retained for context only. The executable migration ends
  above; the newer draft below duplicated triggers and policies and must never
  run on a fresh database.

-- Rich workspace chat foundation:
-- - private, membership-scoped attachments
-- - durable presence and message receipts
-- - server-owned unread counts and notification fan-out
-- - private Realtime Broadcast/Presence channels

begin;

create schema if not exists private;

create or replace function private.chat_id_from_storage_path(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 1)::uuid
    else null
  end
$$;

create or replace function private.can_read_chat_attachment(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.chat_participants cp
      where cp.chat_id = private.chat_id_from_storage_path(p_name)
        and cp.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.messages m
      join public.chat_participants cp on cp.chat_id = m.chat_id
      where cp.user_id = (select auth.uid())
        and (
          m.image_url like '%' || p_name
          or m.audio_url like '%' || p_name
        )
    )
$$;

create or replace function private.can_write_chat_attachment(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    split_part(p_name, '/', 2) = (select auth.uid())::text
    and exists (
      select 1
      from public.chat_participants cp
      where cp.chat_id = private.chat_id_from_storage_path(p_name)
        and cp.user_id = (select auth.uid())
    )
$$;

revoke all on function private.chat_id_from_storage_path(text) from public, anon, authenticated;
revoke all on function private.can_read_chat_attachment(text) from public, anon, authenticated;
revoke all on function private.can_write_chat_attachment(text) from public, anon, authenticated;
grant execute on function private.can_read_chat_attachment(text) to authenticated;
grant execute on function private.can_write_chat_attachment(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  26214400,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
    'audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg',
    'video/mp4','video/webm',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','text/csv','application/zip'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- A legacy global read policy included every bucket. Keep its original public
-- bucket behaviour while explicitly excluding private chat assets.
drop policy if exists "Allow Public Access to All Buckets" on storage.objects;
create policy "Allow Public Access to All Buckets"
on storage.objects
for select
to public
using (
  bucket_id not in (
    'site-upload-staging',
    'site-preview-assets',
    'site-icons',
    'chat-attachments'
  )
);

drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated views" on storage.objects;
drop policy if exists "Allow individual delete" on storage.objects;
drop policy if exists "Chat members upload attachments" on storage.objects;
drop policy if exists "Chat members read attachments" on storage.objects;
drop policy if exists "Chat uploaders update attachments" on storage.objects;
drop policy if exists "Chat uploaders delete attachments" on storage.objects;

create policy "Chat members upload attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and owner = (select auth.uid())
  and private.can_write_chat_attachment(name)
);

create policy "Chat members read attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and private.can_read_chat_attachment(name)
);

create policy "Chat uploaders update attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-attachments'
  and owner = (select auth.uid())
  and private.can_read_chat_attachment(name)
)
with check (
  bucket_id = 'chat-attachments'
  and owner = (select auth.uid())
  and private.can_write_chat_attachment(name)
);

create policy "Chat uploaders delete attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-attachments'
  and owner = (select auth.uid())
  and private.can_read_chat_attachment(name)
);

create table if not exists public.chat_user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'online' check (status in ('online','away','dnd','offline')),
  active_chat_id uuid references public.chats(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_user_presence_recent_idx
  on public.chat_user_presence (last_seen_at desc);
create index if not exists chat_user_presence_active_chat_idx
  on public.chat_user_presence (active_chat_id)
  where active_chat_id is not null;

create or replace function private.can_view_chat_presence(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    or exists (
      select 1
      from public.chat_participants mine
      join public.chat_participants theirs on theirs.chat_id = mine.chat_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = p_user_id
    )
$$;

revoke all on function private.can_view_chat_presence(uuid) from public, anon, authenticated;
grant execute on function private.can_view_chat_presence(uuid) to authenticated;

alter table public.chat_user_presence enable row level security;
drop policy if exists "Chat contacts read presence" on public.chat_user_presence;
drop policy if exists "Users insert own presence" on public.chat_user_presence;
drop policy if exists "Users update own presence" on public.chat_user_presence;
drop policy if exists "Users delete own presence" on public.chat_user_presence;

create policy "Chat contacts read presence"
on public.chat_user_presence
for select
to authenticated
using (private.can_view_chat_presence(user_id));

create policy "Users insert own presence"
on public.chat_user_presence
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users update own presence"
on public.chat_user_presence
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users delete own presence"
on public.chat_user_presence
for delete
to authenticated
using (user_id = (select auth.uid()));

create table if not exists public.chat_message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists chat_message_receipts_user_unread_idx
  on public.chat_message_receipts (user_id, chat_id, created_at desc)
  where read_at is null;

alter table public.chat_message_receipts enable row level security;
drop policy if exists "Chat members read receipts" on public.chat_message_receipts;
drop policy if exists "Users update own receipts" on public.chat_message_receipts;

create policy "Chat members read receipts"
on public.chat_message_receipts
for select
to authenticated
using (public.is_chat_member(chat_id));

create policy "Users update own receipts"
on public.chat_message_receipts
for update
to authenticated
using (user_id = (select auth.uid()) and public.is_chat_member(chat_id))
with check (user_id = (select auth.uid()) and public.is_chat_member(chat_id));

drop policy if exists "Chat members update own participation" on public.chat_participants;
create policy "Chat members update own participation"
on public.chat_participants
for update
to authenticated
using (user_id = (select auth.uid()) and public.is_chat_member(chat_id))
with check (user_id = (select auth.uid()) and public.is_chat_member(chat_id));

create or replace function public.mark_chat_read(p_chat_id uuid)
returns void
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
begin
  if not public.is_chat_member(p_chat_id) then
    raise exception 'Not a member of this chat' using errcode = '42501';
  end if;

  update public.chat_message_receipts
  set delivered_at = coalesce(delivered_at, now()),
      read_at = coalesce(read_at, now())
  where chat_id = p_chat_id
    and user_id = (select auth.uid());

  update public.chat_participants
  set unread_count = 0
  where chat_id = p_chat_id
    and user_id = (select auth.uid());

  update public.messages m
  set is_read = not exists (
    select 1
    from public.chat_message_receipts receipt
    where receipt.message_id = m.id
      and receipt.read_at is null
  )
  where m.chat_id = p_chat_id
    and m.sender_id <> (select auth.uid());
end;
$$;

revoke all on function public.mark_chat_read(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated;

create or replace function public.create_group_chat(
  p_name text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
declare
  creator_id uuid := (select auth.uid());
  normalized_name text := nullif(trim(p_name), '');
  member_ids uuid[];
  new_chat_id uuid;
begin
  if creator_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if normalized_name is null or char_length(normalized_name) > 80 then
    raise exception 'Choose a group name between 1 and 80 characters' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct member_id), '{}'::uuid[])
  into member_ids
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) as member_id
  where member_id is not null
    and member_id <> creator_id;

  if cardinality(member_ids) = 0 then
    raise exception 'Select at least one person for this group' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.profiles p
    where p.id = any(member_ids)
  ) <> cardinality(member_ids) then
    raise exception 'One or more selected members no longer exist' using errcode = '22023';
  end if;

  insert into public.chats (
    participants,
    name,
    is_group,
    updated_at,
    metadata
  )
  values (
    array[creator_id] || member_ids,
    normalized_name,
    true,
    now(),
    jsonb_build_object('created_by', creator_id)
  )
  returning id into new_chat_id;

  insert into public.chat_participants (chat_id, user_id, unread_count)
  values (new_chat_id, creator_id, 0);

  insert into public.chat_participants (chat_id, user_id, unread_count)
  select new_chat_id, member_id, 0
  from unnest(member_ids) as member_id;

  return new_chat_id;
end;
$$;

revoke all on function public.create_group_chat(text, uuid[]) from public, anon;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated;

create or replace function private.handle_new_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chat_name text;
  sender_name text;
  preview text;
begin
  if new.chat_id is null or new.sender_id is null then
    return new;
  end if;

  select coalesce(nullif(c.name, ''), 'Chat')
  into chat_name
  from public.chats c
  where c.id = new.chat_id;

  select coalesce(nullif(p.full_name, ''), nullif(p.name, ''), nullif(p.username, ''), 'Iemand')
  into sender_name
  from public.profiles p
  where p.id = new.sender_id;

  preview := case
    when new.audio_url is not null
      or coalesce(new.attachments, '[]'::jsonb) @> '[{"kind":"audio"}]'::jsonb
      then 'Nieuw spraakbericht'
    when new.image_url is not null
      or coalesce(new.attachments, '[]'::jsonb) @> '[{"kind":"image"}]'::jsonb
      then 'Nieuwe afbeelding'
    when jsonb_array_length(coalesce(new.attachments, '[]'::jsonb)) > 0
      then 'Nieuw bestand'
    when new.is_encrypted is true
      then 'Nieuw versleuteld bericht'
    else left(coalesce(nullif(new.content, ''), 'Nieuw bericht'), 140)
  end;

  update public.chats
  set updated_at = now(),
      last_message_at = new.created_at,
      last_message = preview,
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('last_message_encrypted', coalesce(new.is_encrypted, false))
  where id = new.chat_id;

  update public.chat_participants
  set unread_count = coalesce(unread_count, 0) + 1
  where chat_id = new.chat_id
    and user_id <> new.sender_id;

  insert into public.chat_message_receipts (message_id, chat_id, user_id)
  select new.id, new.chat_id, cp.user_id
  from public.chat_participants cp
  where cp.chat_id = new.chat_id
    and cp.user_id <> new.sender_id
  on conflict (message_id, user_id) do nothing;

  insert into public.notifications (user_id, type, category, title, message, data, read)
  select
    cp.user_id,
    'chat_message',
    'chats',
    coalesce(sender_name, 'Iemand') || ' stuurde een bericht',
    preview || ' in ' || coalesce(chat_name, 'Chat'),
    jsonb_build_object(
      'chat_id', new.chat_id,
      'message_id', new.id,
      'sender_id', new.sender_id
    ),
    false
  from public.chat_participants cp
  where cp.chat_id = new.chat_id
    and cp.user_id <> new.sender_id;

  return new;
end;
$$;

revoke all on function private.handle_new_chat_message() from public, anon, authenticated;

drop trigger if exists handle_new_chat_message on public.messages;
create trigger handle_new_chat_message
after insert on public.messages
for each row execute function private.handle_new_chat_message();

create or replace function private.can_access_chat_topic(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    split_part(p_topic, ':', 1) = 'chat'
    and split_part(p_topic, ':', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.chat_participants cp
      where cp.chat_id = split_part(p_topic, ':', 2)::uuid
        and cp.user_id = (select auth.uid())
    )
$$;

revoke all on function private.can_access_chat_topic(text) from public, anon, authenticated;
grant execute on function private.can_access_chat_topic(text) to authenticated;

drop policy if exists "Chat members receive realtime events" on realtime.messages;
drop policy if exists "Chat members send realtime events" on realtime.messages;

create policy "Chat members receive realtime events"
on realtime.messages
for select
to authenticated
using (
  extension in ('broadcast', 'presence')
  and private.can_access_chat_topic((select realtime.topic()))
);

create policy "Chat members send realtime events"
on realtime.messages
for insert
to authenticated
with check (
  extension in ('broadcast', 'presence')
  and private.can_access_chat_topic((select realtime.topic()))
);

grant select, insert, update, delete on public.chat_user_presence to authenticated;
grant select, update on public.chat_message_receipts to authenticated;
grant update on public.chat_participants to authenticated;
revoke all on public.chat_user_presence, public.chat_message_receipts from anon;
grant all on public.chat_user_presence, public.chat_message_receipts to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_user_presence'
  ) then
    alter publication supabase_realtime add table public.chat_user_presence;
  end if;
end
$$;

commit;
*/
