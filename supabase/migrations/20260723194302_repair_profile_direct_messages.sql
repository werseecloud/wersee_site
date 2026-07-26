-- Make profile-started direct messages usable and keep membership checks in
-- Postgres, where every client (web, mobile, and future integrations) shares
-- the same authorization boundary.

create or replace function public.get_or_create_direct_chat(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_low uuid;
  v_high uuid;
  v_chat_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'Invalid direct chat participant' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_other_user_id
  ) then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_user_id < p_other_user_id then
    v_low := v_user_id;
    v_high := p_other_user_id;
  else
    v_low := p_other_user_id;
    v_high := v_user_id;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_low::text || ':' || v_high::text, 0)
  );

  select direct_pair.chat_id
  into v_chat_id
  from public.direct_chat_pairs as direct_pair
  where direct_pair.user_low = v_low
    and direct_pair.user_high = v_high;

  if v_chat_id is null then
    insert into public.chats (participants, is_group, name, metadata)
    values (
      array[v_low, v_high]::uuid[],
      false,
      null,
      jsonb_build_object('chat_type', 'direct')
    )
    returning id into v_chat_id;

    insert into public.chat_participants (chat_id, user_id)
    values (v_chat_id, v_low), (v_chat_id, v_high)
    on conflict (chat_id, user_id) do nothing;

    insert into public.direct_chat_pairs (user_low, user_high, chat_id)
    values (v_low, v_high, v_chat_id);
  else
    insert into public.chat_participants (chat_id, user_id)
    values (v_chat_id, v_low), (v_chat_id, v_high)
    on conflict (chat_id, user_id) do nothing;

    update public.chats
    set
      participants = (
        select array_agg(distinct participant.user_id order by participant.user_id)
        from public.chat_participants as participant
        where participant.chat_id = v_chat_id
      ),
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('chat_type', 'direct'),
      updated_at = now()
    where id = v_chat_id;
  end if;

  return v_chat_id;
end;
$function$;

revoke all on function public.get_or_create_direct_chat(uuid) from public;
revoke all on function public.get_or_create_direct_chat(uuid) from anon;
grant execute on function public.get_or_create_direct_chat(uuid) to authenticated;

drop policy if exists "Users can insert chats" on public.chats;
create policy "Authenticated users create member chats"
  on public.chats
  for insert
  to authenticated
  with check ((select auth.uid()) = any(participants));

drop policy if exists "Authenticated users can view chat participants" on public.chat_participants;
drop policy if exists "Users can insert chat participants" on public.chat_participants;
create policy "Chat members add participants"
  on public.chat_participants
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    or public.is_chat_member(chat_id)
  );

revoke all on table public.chats, public.chat_participants, public.messages from anon;
grant select, insert, update, delete on table public.chats to authenticated;
grant select, insert, update, delete on table public.chat_participants to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;

do $block$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$block$;

create index if not exists chat_participants_user_chat_idx
  on public.chat_participants (user_id, chat_id);

create index if not exists messages_chat_created_idx
  on public.messages (chat_id, created_at);
