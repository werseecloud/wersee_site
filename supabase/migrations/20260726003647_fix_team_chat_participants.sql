create or replace function public.get_or_create_team_chat(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_chat_id uuid;
  v_user_id uuid;
  v_team_name text;
  v_participants uuid[];
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = v_user_id
  ) and not exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and t.owner_id = v_user_id
  ) then
    raise exception 'Not a team member' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_team_id::text, 0)
  );

  select coalesce(
    pg_catalog.array_agg(members.user_id order by members.user_id),
    '{}'::uuid[]
  )
  into v_participants
  from (
    select tm.user_id
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id is not null

    union

    select t.owner_id
    from public.teams t
    where t.id = p_team_id
      and t.owner_id is not null
  ) members;

  select c.id
  into v_chat_id
  from public.chats c
  where c.team_id = p_team_id
  order by c.id asc
  limit 1;

  if v_chat_id is null then
    select t.name
    into v_team_name
    from public.teams t
    where t.id = p_team_id;

    insert into public.chats (
      participants,
      is_group,
      team_id,
      name
    )
    values (
      v_participants,
      true,
      p_team_id,
      coalesce(v_team_name || ' Chat', 'Team Chat')
    )
    returning id into v_chat_id;
  else
    update public.chats
    set participants = v_participants,
        updated_at = pg_catalog.now()
    where id = v_chat_id;
  end if;

  delete from public.chat_participants cp
  where cp.chat_id = v_chat_id
    and not (cp.user_id = any(v_participants));

  insert into public.chat_participants (chat_id, user_id)
  select v_chat_id, participant.user_id
  from pg_catalog.unnest(v_participants) participant(user_id)
  join public.profiles profile
    on profile.id = participant.user_id
  on conflict (chat_id, user_id) do nothing;

  return v_chat_id;
end;
$function$;

revoke all on function public.get_or_create_team_chat(uuid) from public;
revoke all on function public.get_or_create_team_chat(uuid) from anon;
grant execute on function public.get_or_create_team_chat(uuid) to authenticated;
grant execute on function public.get_or_create_team_chat(uuid) to service_role;

update public.chats chat
set participants = coalesce(
  (
    select pg_catalog.array_agg(members.user_id order by members.user_id)
    from (
      select tm.user_id
      from public.team_members tm
      where tm.team_id = chat.team_id
        and tm.user_id is not null

      union

      select team.owner_id
      from public.teams team
      where team.id = chat.team_id
        and team.owner_id is not null
    ) members
  ),
  '{}'::uuid[]
)
where chat.team_id is not null;

delete from public.chat_participants participant
using public.chats chat
where chat.id = participant.chat_id
  and chat.team_id is not null
  and not (participant.user_id = any(chat.participants));

insert into public.chat_participants (chat_id, user_id)
select chat.id, participant.user_id
from public.chats chat
cross join lateral pg_catalog.unnest(chat.participants) participant(user_id)
join public.profiles profile
  on profile.id = participant.user_id
where chat.team_id is not null
on conflict (chat_id, user_id) do nothing;
