-- Public DMs and reliable friend request delivery.
-- Public submissions are accepted only through the public-dm Edge Function.

create table if not exists public.public_dm_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  access_mode text not null default 'everyone'
    check (access_mode in ('everyone', 'authenticated', 'verified', 'secret_link', 'nobody')),
  secret_token uuid not null default gen_random_uuid(),

  require_name boolean not null default true,
  require_email boolean not null default true,
  require_subject boolean not null default true,
  company_requirement text not null default 'optional'
    check (company_requirement in ('hidden', 'optional', 'required')),
  allow_website boolean not null default true,
  allow_attachments boolean not null default false,
  maximum_length integer not null default 3000 check (maximum_length between 250 and 10000),
  custom_questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(custom_questions) = 'array' and jsonb_array_length(custom_questions) <= 10),

  auto_label boolean not null default true,
  auto_archive_days integer check (auto_archive_days is null or auto_archive_days between 1 and 365),
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  timezone text not null default 'Europe/Amsterdam',
  auto_reply_enabled boolean not null default false,
  auto_reply_message text not null default '',
  away_message_enabled boolean not null default false,
  away_message text not null default '',

  captcha_enabled boolean not null default false,
  rate_limit_per_hour integer not null default 5 check (rate_limit_per_hour between 1 and 100),
  filter_forbidden_words boolean not null default true,
  forbidden_words text[] not null default '{}'::text[],
  filter_links boolean not null default true,
  scan_attachments boolean not null default true,
  blocked_countries text[] not null default '{}'::text[],
  suspicious_to_spam boolean not null default true,

  show_avatar boolean not null default true,
  show_full_name boolean not null default true,
  hide_online_status boolean not null default true,
  read_receipts boolean not null default false,
  guest_retention_days integer not null default 90 check (guest_retention_days between 1 and 365),
  consent_message text not null default
    'Ik ga ermee akkoord dat mijn gegevens worden verwerkt om op dit bericht te reageren.',

  title text not null default 'Stuur mij een bericht',
  description text not null default 'Neem rechtstreeks contact op via Wersee.',
  logo_url text,
  accent_color text not null default '#6366F1'
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  preset_topics text[] not null default array['Samenwerking', 'Support', 'Vraag']::text[],
  thank_you_message text not null default 'Bedankt. Je bericht is veilig verstuurd.',

  wizard_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_dm_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_email_hash text,
  subject text,
  company_name text,
  website_url text,
  message text not null check (char_length(message) between 1 and 10000),
  topic text,
  custom_answers jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_answers) = 'object'),
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  status text not null default 'new' check (status in ('new', 'read', 'archived', 'spam')),
  label text not null default 'question' check (label in ('collaboration', 'support', 'question', 'spam')),
  spam_score integer not null default 0 check (spam_score between 0 and 100),
  source_ip_hash text not null,
  receipt_token_hash text,
  country_code text,
  consented_at timestamptz,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_dm_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid references auth.users(id) on delete cascade,
  blocked_email_hash text,
  reason text,
  created_at timestamptz not null default now(),
  check (blocked_user_id is not null or blocked_email_hash is not null)
);

create unique index if not exists public_dm_blocks_user_unique
  on public.public_dm_blocks(owner_id, blocked_user_id)
  where blocked_user_id is not null;
create unique index if not exists public_dm_blocks_email_unique
  on public.public_dm_blocks(owner_id, blocked_email_hash)
  where blocked_email_hash is not null;

create table if not exists public.public_dm_rate_limits (
  owner_id uuid not null references auth.users(id) on delete cascade,
  key_type text not null check (key_type in ('ip', 'email')),
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (owner_id, key_type, key_hash, window_start)
);

create index if not exists public_dm_submissions_owner_inbox_idx
  on public.public_dm_submissions(owner_id, status, created_at desc);
create index if not exists public_dm_submissions_sender_idx
  on public.public_dm_submissions(sender_user_id)
  where sender_user_id is not null;
create index if not exists public_dm_rate_limits_cleanup_idx
  on public.public_dm_rate_limits(window_start);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'public-dm-attachments',
  'public-dm-attachments',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public DM owners read attachments" on storage.objects;
create policy "Public DM owners read attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'public-dm-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

alter table public.public_dm_settings enable row level security;
alter table public.public_dm_submissions enable row level security;
alter table public.public_dm_blocks enable row level security;
alter table public.public_dm_rate_limits enable row level security;

create policy "Owners read public DM settings"
  on public.public_dm_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners create public DM settings"
  on public.public_dm_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners update public DM settings"
  on public.public_dm_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners read public DM submissions"
  on public.public_dm_submissions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners update public DM submissions"
  on public.public_dm_submissions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete public DM submissions"
  on public.public_dm_submissions for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners read public DM blocks"
  on public.public_dm_blocks for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners create public DM blocks"
  on public.public_dm_blocks for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete public DM blocks"
  on public.public_dm_blocks for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.public_dm_settings, public.public_dm_submissions,
  public.public_dm_blocks, public.public_dm_rate_limits from public, anon;
revoke all on public.public_dm_rate_limits from authenticated;
grant select, insert, update on public.public_dm_settings to authenticated;
grant select, update, delete on public.public_dm_submissions to authenticated;
grant select, insert, delete on public.public_dm_blocks to authenticated;
grant all on public.public_dm_settings, public.public_dm_submissions,
  public.public_dm_blocks, public.public_dm_rate_limits to service_role;

create or replace function private.touch_public_dm_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_public_dm_updated_at() from public, anon, authenticated;

drop trigger if exists touch_public_dm_settings_updated_at on public.public_dm_settings;
create trigger touch_public_dm_settings_updated_at
before update on public.public_dm_settings
for each row execute function private.touch_public_dm_updated_at();

drop trigger if exists touch_public_dm_submissions_updated_at on public.public_dm_submissions;
create trigger touch_public_dm_submissions_updated_at
before update on public.public_dm_submissions
for each row execute function private.touch_public_dm_updated_at();

create or replace function public.consume_public_dm_rate_limit(
  p_owner_id uuid,
  p_key_type text,
  p_key_hash text,
  p_limit integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_count integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  if p_owner_id is null
    or p_key_type not in ('ip', 'email')
    or nullif(p_key_hash, '') is null
    or p_limit not between 1 and 100 then
    raise exception 'Invalid rate-limit input' using errcode = '22023';
  end if;

  insert into public.public_dm_rate_limits (
    owner_id, key_type, key_hash, window_start, request_count
  )
  values (p_owner_id, p_key_type, p_key_hash, current_window, 1)
  on conflict (owner_id, key_type, key_hash, window_start)
  do update
    set request_count = public.public_dm_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_public_dm_rate_limit(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.consume_public_dm_rate_limit(uuid, text, text, integer)
  to service_role;

create or replace function private.notify_public_dm_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings_row public.public_dm_settings%rowtype;
  sender_label text;
begin
  select * into settings_row
  from public.public_dm_settings
  where user_id = new.owner_id;

  sender_label := coalesce(nullif(new.guest_name, ''), 'Nieuwe afzender');

  insert into public.notifications (
    user_id, type, category, title, message, data, read
  )
  values (
    new.owner_id,
    'public_dm',
    'messages',
    'Nieuwe publieke DM',
    sender_label || ' stuurde je een bericht.',
    jsonb_build_object(
      'url', '/workspace/chats?section=dms&public_dm=' || new.id,
      'submission_id', new.id,
      'label', new.label,
      'push_enabled', coalesce(settings_row.push_notifications, true),
      'quiet_hours_enabled', coalesce(settings_row.quiet_hours_enabled, false)
    ),
    false
  );

  return new;
end;
$$;

revoke all on function private.notify_public_dm_submission()
  from public, anon, authenticated;

drop trigger if exists notify_public_dm_submission on public.public_dm_submissions;
create trigger notify_public_dm_submission
after insert on public.public_dm_submissions
for each row execute function private.notify_public_dm_submission();

create or replace function private.archive_expired_public_dms()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.public_dm_submissions submission
  set status = 'archived',
      archived_at = coalesce(archived_at, now())
  from public.public_dm_settings settings
  where settings.user_id = submission.owner_id
    and settings.auto_archive_days is not null
    and submission.status in ('new', 'read')
    and submission.created_at < now() - make_interval(days => settings.auto_archive_days);

  delete from public.public_dm_submissions submission
  using public.public_dm_settings settings
  where settings.user_id = submission.owner_id
    and submission.sender_user_id is null
    and submission.created_at < now() - make_interval(days => settings.guest_retention_days);

  delete from public.public_dm_rate_limits
  where window_start < now() - interval '48 hours';
end;
$$;

revoke all on function private.archive_expired_public_dms()
  from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'archive-expired-public-dms') then
      perform cron.unschedule('archive-expired-public-dms');
    end if;
    perform cron.schedule(
      'archive-expired-public-dms',
      '17 3 * * *',
      'select private.archive_expired_public_dms()'
    );
  end if;
end
$$;

-- The receiver must see INSERT/UPDATE events and the sender must see acceptance.
drop policy if exists "Users can send friend requests" on public.friend_requests;
drop policy if exists "Users can update their own received requests" on public.friend_requests;
drop policy if exists "Users can view their own friend requests" on public.friend_requests;

create policy "Authenticated users send friend requests"
  on public.friend_requests for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> receiver_id
  );
create policy "Receivers update friend requests"
  on public.friend_requests for update to authenticated
  using ((select auth.uid()) = receiver_id)
  with check (
    (select auth.uid()) = receiver_id
    and sender_id <> receiver_id
  );
create policy "Participants read friend requests"
  on public.friend_requests for select to authenticated
  using ((select auth.uid()) in (sender_id, receiver_id));

revoke all on public.friend_requests from public, anon;
revoke delete, truncate, references, trigger on public.friend_requests from authenticated;
grant select, insert, update on public.friend_requests to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friend_requests'
  ) then
    alter publication supabase_realtime add table public.friend_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_dm_submissions'
  ) then
    alter publication supabase_realtime add table public.public_dm_submissions;
  end if;
end
$$;
