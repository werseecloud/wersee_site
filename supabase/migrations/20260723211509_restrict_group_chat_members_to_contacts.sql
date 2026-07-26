create or replace function public.create_group_chat(
  p_name text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
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
    from unnest(member_ids) as requested(member_id)
    where exists (
      select 1
      from public.chat_participants mine
      join public.chat_participants contact on contact.chat_id = mine.chat_id
      where mine.user_id = creator_id
        and contact.user_id = requested.member_id
    )
  ) <> cardinality(member_ids) then
    raise exception 'Groups can only include your existing chat contacts' using errcode = '42501';
  end if;

  insert into public.chats(participants, name, is_group, updated_at, metadata)
  values (
    array[creator_id] || member_ids,
    normalized_name,
    true,
    now(),
    jsonb_build_object('created_by', creator_id)
  )
  returning id into new_chat_id;

  insert into public.chat_participants(chat_id, user_id, unread_count)
  values (new_chat_id, creator_id, 0);

  insert into public.chat_participants(chat_id, user_id, unread_count)
  select new_chat_id, member_id, 0
  from unnest(member_ids) as member_id;

  return new_chat_id;
end;
$$;

revoke all on function public.create_group_chat(text, uuid[]) from public, anon;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated, service_role;
