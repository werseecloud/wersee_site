-- Bind each inbound Resend message to the actual Wersee mailbox it was sent to.
-- Messages for platform/company addresses stay archived, but are not exposed in
-- a user's workspace inbox unless the recipient exactly matches their mailbox.

alter table public.resend_inbound_emails
  add column if not exists mailbox_account_id uuid
  references public.workspace_email_accounts(id) on delete set null;

create index if not exists resend_inbound_emails_mailbox_account_received_idx
  on public.resend_inbound_emails(mailbox_account_id, received_at desc)
  where mailbox_account_id is not null;

create or replace function public.mail_bridge_assign_inbound_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_mailbox_id uuid;
  v_mailbox_owner uuid;
begin
  -- A supplied mailbox id is accepted only when it resolves to a real account.
  if new.mailbox_account_id is not null then
    select a.id, a.user_id
      into v_mailbox_id, v_mailbox_owner
    from public.workspace_email_accounts a
    where a.id = new.mailbox_account_id;
  end if;

  -- Resend recipients can be either a plain address or "Name <address>".
  -- Match exact normalized addresses; never route by substring or domain alone.
  if v_mailbox_id is null then
    select a.id, a.user_id
      into v_mailbox_id, v_mailbox_owner
    from public.workspace_email_accounts a
    join lateral unnest(coalesce(new.recipients, array[]::text[])) recipient(raw)
      on lower(a.sending_address) = lower(
           coalesce(
             substring(recipient.raw from '(?i)<([^<>[:space:]]+@[^<>[:space:]]+)>'),
             substring(recipient.raw from '(?i)([a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})')
           )
         )
      or lower(a.requested_alias) = lower(
           coalesce(
             substring(recipient.raw from '(?i)<([^<>[:space:]]+@[^<>[:space:]]+)>'),
             substring(recipient.raw from '(?i)([a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})')
           )
         )
    order by a.created_at, a.id
    limit 1;
  end if;

  if v_mailbox_id is not null then
    new.mailbox_account_id := v_mailbox_id;
    new.owner_user_id := v_mailbox_owner;
  elsif new.source_account_id is not null then
    select a.user_id
      into new.owner_user_id
    from public.mail_bridge_connected_accounts a
    where a.id = new.source_account_id;
    new.mailbox_account_id := null;
  else
    -- Keep unmatched platform mail archived for internal processing, but the
    -- RLS policy below deliberately makes it invisible to workspace users.
    new.mailbox_account_id := null;
    new.owner_user_id := coalesce(
      new.owner_user_id,
      public.mail_bridge_platform_owner_id()
    );
  end if;

  if new.owner_user_id is null then
    raise exception 'mailbox owner unavailable';
  end if;
  return new;
end;
$function$;

drop trigger if exists mail_bridge_assign_inbound_owner_trigger
  on public.resend_inbound_emails;
create trigger mail_bridge_assign_inbound_owner_trigger
before insert or update of recipients, source_account_id, owner_user_id, mailbox_account_id
on public.resend_inbound_emails
for each row execute function public.mail_bridge_assign_inbound_owner();

-- Repair ownership for existing messages that were previously defaulted to the
-- platform owner. Unmatched company mail intentionally keeps a null mailbox id.
with mailbox_matches as (
  select distinct on (e.id)
    e.id as inbound_id,
    a.id as mailbox_account_id,
    a.user_id as mailbox_owner_user_id
  from public.resend_inbound_emails e
  join lateral unnest(coalesce(e.recipients, array[]::text[])) recipient(raw)
    on true
  join public.workspace_email_accounts a
    on lower(a.sending_address) = lower(
         coalesce(
           substring(recipient.raw from '(?i)<([^<>[:space:]]+@[^<>[:space:]]+)>'),
           substring(recipient.raw from '(?i)([a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})')
         )
       )
    or lower(a.requested_alias) = lower(
         coalesce(
           substring(recipient.raw from '(?i)<([^<>[:space:]]+@[^<>[:space:]]+)>'),
           substring(recipient.raw from '(?i)([a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})')
         )
       )
  order by e.id, a.created_at, a.id
)
update public.resend_inbound_emails e
set mailbox_account_id = m.mailbox_account_id,
    owner_user_id = m.mailbox_owner_user_id
from mailbox_matches m
where e.id = m.inbound_id
  and (
    e.mailbox_account_id is distinct from m.mailbox_account_id
    or e.owner_user_id is distinct from m.mailbox_owner_user_id
  );

drop policy if exists mail_bridge_owner_read_inbound
  on public.resend_inbound_emails;
create policy mail_bridge_owner_read_inbound
on public.resend_inbound_emails
for select
to authenticated
using (
  public.mail_bridge_has_mailbox_access(owner_user_id, 'read')
  and (
    exists (
      select 1
      from public.workspace_email_accounts mailbox
      where mailbox.id = mailbox_account_id
        and mailbox.user_id = owner_user_id
    )
    or exists (
      select 1
      from public.mail_bridge_connected_accounts connected
      where connected.id = source_account_id
        and connected.user_id = owner_user_id
    )
  )
);

comment on column public.resend_inbound_emails.mailbox_account_id is
  'Exact Wersee mailbox selected from the normalized inbound recipient; null means platform-only/unmatched mail.';
