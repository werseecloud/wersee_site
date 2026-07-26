alter table public.profiles
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_image_url text;

alter table public.profiles
  drop constraint if exists profiles_seo_title_length,
  add constraint profiles_seo_title_length
    check (seo_title is null or char_length(seo_title) between 3 and 70),
  drop constraint if exists profiles_seo_description_length,
  add constraint profiles_seo_description_length
    check (seo_description is null or char_length(seo_description) between 20 and 200);

comment on column public.profiles.seo_title is
  'Optional profile-specific search and social title. Falls back to display name and username.';
comment on column public.profiles.seo_description is
  'Optional profile-specific search and social description. Falls back to the public bio.';
comment on column public.profiles.seo_image_url is
  'Optional public landscape share image. Falls back to the generated profile OG card.';

create or replace function public.get_or_create_direct_chat(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid;
  v_low uuid;
  v_high uuid;
  v_chat_id uuid;
begin
  v_user_id := auth.uid();

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

  select d.chat_id
  into v_chat_id
  from public.direct_chat_pairs d
  where d.user_low = v_low
    and d.user_high = v_high;

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
    set participants = (
      select array_agg(distinct user_id order by user_id)
      from public.chat_participants
      where chat_id = v_chat_id
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
grant execute on function public.get_or_create_direct_chat(uuid) to service_role;

revoke insert, update, delete on table public.chats from anon;
revoke insert, update, delete on table public.chat_participants from anon;
revoke insert, update, delete on table public.messages from anon;
