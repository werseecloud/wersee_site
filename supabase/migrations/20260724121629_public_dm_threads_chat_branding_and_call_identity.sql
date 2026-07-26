-- Persistent public-DM threads, optional email, chat branding assets, and
-- participant identity for authenticated WebRTC rooms.

alter table public.public_dm_settings
  alter column require_email set default false;

update public.public_dm_settings
set require_email = false
where require_email = true;

create table if not exists public.public_dm_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.public_dm_submissions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sender_type text not null check (sender_type in ('guest', 'owner')),
  sender_user_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now(),
  constraint public_dm_messages_owner_identity_check check (
    sender_type <> 'owner' or sender_user_id = owner_id
  )
);

create index if not exists public_dm_messages_submission_created_idx
  on public.public_dm_messages(submission_id, created_at);
create index if not exists public_dm_messages_owner_created_idx
  on public.public_dm_messages(owner_id, created_at desc);

alter table public.public_dm_messages enable row level security;

drop policy if exists "Owners read public DM thread messages" on public.public_dm_messages;
create policy "Owners read public DM thread messages"
  on public.public_dm_messages
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners reply to public DM threads" on public.public_dm_messages;
create policy "Owners reply to public DM threads"
  on public.public_dm_messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and sender_type = 'owner'
    and sender_user_id = (select auth.uid())
    and exists (
      select 1
      from public.public_dm_submissions submission
      where submission.id = submission_id
        and submission.owner_id = (select auth.uid())
    )
  );

revoke all on public.public_dm_messages from public, anon;
grant select, insert on public.public_dm_messages to authenticated;
grant all on public.public_dm_messages to service_role;

create or replace function private.touch_public_dm_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.public_dm_submissions
  set updated_at = now(),
      status = case when new.sender_type = 'guest' then 'new' else status end,
      read_at = case when new.sender_type = 'guest' then null else read_at end
  where id = new.submission_id
    and owner_id = new.owner_id;

  return new;
end;
$$;

revoke all on function private.touch_public_dm_thread() from public, anon, authenticated;

drop trigger if exists touch_public_dm_thread on public.public_dm_messages;
create trigger touch_public_dm_thread
after insert on public.public_dm_messages
for each row execute function private.touch_public_dm_thread();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'chat-branding',
  'chat-branding',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Chat members upload branding" on storage.objects;
create policy "Chat members upload branding"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.is_chat_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Chat members replace branding" on storage.objects;
create policy "Chat members replace branding"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.is_chat_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'chat-branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.is_chat_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Chat members delete branding" on storage.objects;
create policy "Chat members delete branding"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-branding'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.is_chat_member(((storage.foldername(name))[1])::uuid)
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_dm_messages'
  ) then
    alter publication supabase_realtime add table public.public_dm_messages;
  end if;
end
$$;
