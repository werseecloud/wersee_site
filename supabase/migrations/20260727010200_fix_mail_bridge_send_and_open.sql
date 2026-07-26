-- Allow the authenticated mailbox wrapper to queue mail for its own user while
-- keeping the lower-level function unavailable through the Data API.
create or replace function public.mail_bridge_queue_outbound_for_user(
  p_owner_user_id uuid,
  p_identity_email text,
  p_to text[],
  p_subject text,
  p_text text default null,
  p_html text default null,
  p_cc text[] default '{}'::text[],
  p_bcc text[] default '{}'::text[],
  p_reply_to text[] default '{}'::text[],
  p_headers jsonb default '{}'::jsonb,
  p_in_reply_to_inbound_id uuid default null,
  p_thread_key text default null,
  p_scheduled_at timestamptz default now(),
  p_idempotency_key text default null,
  p_as_draft boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_identity public.mail_bridge_identities%rowtype;
  v_id uuid;
  v_subject text := regexp_replace(coalesce(p_subject, ''), '[\r\n]+', ' ', 'g');
  v_key text := coalesce(
    nullif(trim(p_idempotency_key), ''),
    'outbound:' || gen_random_uuid()::text
  );
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_owner_user_id then
    raise exception 'not authorized';
  end if;

  if not exists (select 1 from auth.users where id = p_owner_user_id) then
    raise exception 'owner unavailable';
  end if;

  select *
    into v_identity
  from public.mail_bridge_identities
  where lower(email) = lower(trim(p_identity_email))
    and owner_user_id = p_owner_user_id
    and enabled
  limit 1;

  if not found then
    raise exception 'sender identity unavailable';
  end if;

  if p_in_reply_to_inbound_id is not null
     and not exists (
       select 1
       from public.resend_inbound_emails
       where id = p_in_reply_to_inbound_id
         and owner_user_id = p_owner_user_id
         and mailbox_account_id is not null
     ) then
    raise exception 'reply message unavailable';
  end if;

  if length(v_subject) > 998 then
    raise exception 'subject too long';
  end if;
  if coalesce(length(p_text), 0) > 2000000
     or coalesce(length(p_html), 0) > 4000000 then
    raise exception 'body too large';
  end if;

  insert into public.mail_bridge_outbound_messages (
    created_by,
    identity_id,
    thread_key,
    in_reply_to_inbound_id,
    to_addresses,
    cc_addresses,
    bcc_addresses,
    reply_to_addresses,
    subject,
    text_body,
    html_body,
    headers,
    status,
    scheduled_at,
    next_attempt_at,
    idempotency_key
  )
  values (
    p_owner_user_id,
    v_identity.id,
    p_thread_key,
    p_in_reply_to_inbound_id,
    public.mail_bridge_validate_addresses(p_to, p_as_draft),
    public.mail_bridge_validate_addresses(coalesce(p_cc, '{}'::text[]), true),
    public.mail_bridge_validate_addresses(coalesce(p_bcc, '{}'::text[]), true),
    public.mail_bridge_validate_addresses(coalesce(p_reply_to, '{}'::text[]), true),
    v_subject,
    p_text,
    p_html,
    coalesce(p_headers, '{}'::jsonb),
    case when p_as_draft then 'draft' else 'queued' end,
    greatest(coalesce(p_scheduled_at, now()), now()),
    greatest(coalesce(p_scheduled_at, now()), now()),
    v_key
  )
  on conflict (idempotency_key) do update
    set updated_at = now()
    where public.mail_bridge_outbound_messages.created_by = p_owner_user_id
  returning id into v_id;

  if v_id is null then
    select id
      into v_id
    from public.mail_bridge_outbound_messages
    where idempotency_key = v_key
      and created_by = p_owner_user_id;
  end if;

  if v_id is null then
    raise exception 'idempotency key is owned by another mailbox';
  end if;

  insert into public.mail_bridge_events (
    owner_user_id,
    event_type,
    entity_type,
    entity_id,
    outbound_message_id,
    payload
  )
  values (
    p_owner_user_id,
    case when p_as_draft then 'draft.saved' else 'outbound.queued' end,
    case when p_as_draft then 'draft' else 'outbound' end,
    v_id,
    v_id,
    jsonb_build_object('subject', v_subject)
  );

  return v_id;
end;
$function$;

revoke all on function public.mail_bridge_queue_outbound_for_user(
  uuid, text, text[], text, text, text, text[], text[], text[], jsonb,
  uuid, text, timestamptz, text, boolean
) from public, anon, authenticated;

grant execute on function public.mail_bridge_queue_outbound_for_user(
  uuid, text, text[], text, text, text, text[], text[], text[], jsonb,
  uuid, text, timestamptz, text, boolean
) to service_role;

-- Opening a message can mark only the caller's exact, user-created mailbox row
-- as read. Platform-only/unmatched company mail remains inaccessible.
create or replace function public.mail_bridge_mark_inbound_read(
  p_inbound_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_read_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'not authorized';
  end if;

  update public.resend_inbound_emails inbound
  set read_at = coalesce(inbound.read_at, now()),
      updated_at = now()
  where inbound.id = p_inbound_id
    and inbound.owner_user_id = v_user_id
    and exists (
      select 1
      from public.workspace_email_accounts mailbox
      where mailbox.id = inbound.mailbox_account_id
        and mailbox.user_id = v_user_id
    )
  returning inbound.read_at into v_read_at;

  if v_read_at is null then
    raise exception 'message unavailable';
  end if;

  return v_read_at;
end;
$function$;

revoke all on function public.mail_bridge_mark_inbound_read(uuid)
  from public, anon;
grant execute on function public.mail_bridge_mark_inbound_read(uuid)
  to authenticated, service_role;
