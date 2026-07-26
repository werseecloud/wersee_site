create schema if not exists private;

create table if not exists public.chat_calls (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('voice', 'video')),
  name text not null default 'Chat',
  status text not null default 'active'
    check (status in ('active', 'ended', 'missed', 'cancelled')),
  auto_close_at timestamptz not null default (now() + interval '2 minutes'),
  connected_at timestamptz,
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_call_participants (
  call_id uuid not null references public.chat_calls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (call_id, user_id)
);

create index if not exists chat_calls_chat_created_idx
  on public.chat_calls (chat_id, created_at desc);
create index if not exists chat_calls_active_timeout_idx
  on public.chat_calls (auto_close_at)
  where status = 'active';
create index if not exists chat_calls_initiated_by_idx
  on public.chat_calls (initiated_by);
create index if not exists chat_call_participants_user_idx
  on public.chat_call_participants (user_id);
create index if not exists chat_call_participants_active_idx
  on public.chat_call_participants (call_id, last_seen_at)
  where left_at is null;

alter table public.chat_calls enable row level security;
alter table public.chat_call_participants enable row level security;

drop policy if exists chat_calls_member_select on public.chat_calls;
create policy chat_calls_member_select
on public.chat_calls
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_participants participant
    where participant.chat_id = chat_calls.chat_id
      and participant.user_id = (select auth.uid())
  )
);

drop policy if exists chat_calls_member_insert on public.chat_calls;
create policy chat_calls_member_insert
on public.chat_calls
for insert
to authenticated
with check (
  initiated_by = (select auth.uid())
  and exists (
    select 1
    from public.chat_participants participant
    where participant.chat_id = chat_calls.chat_id
      and participant.user_id = (select auth.uid())
  )
);

drop policy if exists chat_call_participants_member_select on public.chat_call_participants;
create policy chat_call_participants_member_select
on public.chat_call_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_calls call_row
    join public.chat_participants participant
      on participant.chat_id = call_row.chat_id
    where call_row.id = chat_call_participants.call_id
      and participant.user_id = (select auth.uid())
  )
);

revoke all on public.chat_calls from anon;
revoke all on public.chat_call_participants from anon;
revoke update, delete on public.chat_calls from authenticated;
revoke insert, update, delete on public.chat_call_participants from authenticated;
grant select, insert on public.chat_calls to authenticated;
grant select on public.chat_call_participants to authenticated;

create or replace function public.join_chat_call(p_call_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  call_row public.chat_calls%rowtype;
  active_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into call_row
  from public.chat_calls
  where id = p_call_id
  for update;

  if not found then
    raise exception 'Call not found';
  end if;

  if not exists (
    select 1
    from public.chat_participants
    where chat_id = call_row.chat_id
      and user_id = caller_id
  ) then
    raise exception 'You are not a member of this chat';
  end if;

  if call_row.status <> 'active' then
    raise exception 'This call has ended';
  end if;

  if call_row.connected_at is null and call_row.auto_close_at <= now() then
    raise exception 'This call has expired';
  end if;

  insert into public.chat_call_participants (
    call_id,
    user_id,
    joined_at,
    last_seen_at,
    left_at
  )
  values (p_call_id, caller_id, now(), now(), null)
  on conflict (call_id, user_id)
  do update set
    joined_at = excluded.joined_at,
    last_seen_at = excluded.last_seen_at,
    left_at = null;

  select count(*)::integer
  into active_count
  from public.chat_call_participants
  where call_id = p_call_id
    and left_at is null
    and last_seen_at > now() - interval '90 seconds';

  if active_count >= 2 and call_row.connected_at is null then
    update public.chat_calls
    set connected_at = now(),
        updated_at = now()
    where id = p_call_id;
  end if;

  select *
  into call_row
  from public.chat_calls
  where id = p_call_id;

  return to_jsonb(call_row) || jsonb_build_object('participant_count', active_count);
end;
$$;

create or replace function public.heartbeat_chat_call(p_call_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    return false;
  end if;

  update public.chat_call_participants participant
  set last_seen_at = now()
  from public.chat_calls call_row
  where participant.call_id = p_call_id
    and participant.user_id = caller_id
    and participant.left_at is null
    and call_row.id = participant.call_id
    and call_row.status = 'active';

  return found;
end;
$$;

create or replace function public.leave_chat_call(
  p_call_id uuid,
  p_end_for_everyone boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  call_row public.chat_calls%rowtype;
  active_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into call_row
  from public.chat_calls
  where id = p_call_id
  for update;

  if not found then
    raise exception 'Call not found';
  end if;

  if not exists (
    select 1
    from public.chat_participants
    where chat_id = call_row.chat_id
      and user_id = caller_id
  ) then
    raise exception 'You are not a member of this chat';
  end if;

  update public.chat_call_participants
  set left_at = now(),
      last_seen_at = now()
  where call_id = p_call_id
    and user_id = caller_id
    and left_at is null;

  select count(*)::integer
  into active_count
  from public.chat_call_participants
  where call_id = p_call_id
    and left_at is null
    and last_seen_at > now() - interval '90 seconds';

  if call_row.status = 'active'
    and p_end_for_everyone
    and call_row.initiated_by = caller_id then
    update public.chat_calls
    set status = case when connected_at is null then 'cancelled' else 'ended' end,
        ended_at = now(),
        ended_reason = 'host_ended',
        updated_at = now()
    where id = p_call_id;
  elsif call_row.status = 'active'
    and call_row.connected_at is not null
    and active_count = 0 then
    update public.chat_calls
    set status = 'ended',
        ended_at = now(),
        ended_reason = 'participants_left',
        updated_at = now()
    where id = p_call_id;
  end if;

  select *
  into call_row
  from public.chat_calls
  where id = p_call_id;

  return to_jsonb(call_row) || jsonb_build_object('participant_count', active_count);
end;
$$;

create or replace function private.close_stale_chat_calls()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_count integer := 0;
  affected integer := 0;
begin
  update public.chat_call_participants participant
  set left_at = now()
  from public.chat_calls call_row
  where participant.call_id = call_row.id
    and participant.left_at is null
    and participant.last_seen_at <= now() - interval '90 seconds'
    and call_row.status = 'active';

  update public.chat_calls call_row
  set status = 'missed',
      ended_at = now(),
      ended_reason = 'not_enough_participants',
      updated_at = now()
  where call_row.status = 'active'
    and call_row.connected_at is null
    and call_row.auto_close_at <= now()
    and (
      select count(*)
      from public.chat_call_participants participant
      where participant.call_id = call_row.id
        and participant.left_at is null
        and participant.last_seen_at > now() - interval '90 seconds'
    ) < 2;
  get diagnostics affected = row_count;
  closed_count := closed_count + affected;

  update public.chat_calls call_row
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'participants_left',
      updated_at = now()
  where call_row.status = 'active'
    and call_row.connected_at is not null
    and not exists (
      select 1
      from public.chat_call_participants participant
      where participant.call_id = call_row.id
        and participant.left_at is null
        and participant.last_seen_at > now() - interval '90 seconds'
    );
  get diagnostics affected = row_count;
  closed_count := closed_count + affected;

  return closed_count;
end;
$$;

revoke all on function public.join_chat_call(uuid) from public, anon;
revoke all on function public.heartbeat_chat_call(uuid) from public, anon;
revoke all on function public.leave_chat_call(uuid, boolean) from public, anon;
grant execute on function public.join_chat_call(uuid) to authenticated;
grant execute on function public.heartbeat_chat_call(uuid) to authenticated;
grant execute on function public.leave_chat_call(uuid, boolean) to authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid
  into existing_job
  from cron.job
  where jobname = 'wersee-close-stale-chat-calls';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end
$$;

select cron.schedule(
  'wersee-close-stale-chat-calls',
  '* * * * *',
  'select private.close_stale_chat_calls()'
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_calls'
  ) then
    alter publication supabase_realtime add table public.chat_calls;
  end if;
end
$$;
