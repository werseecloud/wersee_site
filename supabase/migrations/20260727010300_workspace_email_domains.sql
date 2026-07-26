-- Owner-scoped source of truth for workspace and custom email domains.
-- Provider mutations stay in the authenticated Edge Function; clients can
-- only read their own rows.
create table if not exists public.workspace_email_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mailbox_account_id uuid not null references public.workspace_email_accounts(id) on delete cascade,
  domain_name text not null,
  kind text not null check (kind in ('wersee_subdomain', 'custom_domain')),
  provider text not null default 'resend' check (provider = 'resend'),
  provider_domain_id text unique,
  status text not null default 'not_started',
  capabilities jsonb not null default '{"sending":"enabled","receiving":"enabled"}'::jsonb,
  dns_records jsonb not null default '[]'::jsonb,
  dns_automation_status text not null default 'manual'
    check (dns_automation_status in ('manual', 'pending', 'configured', 'failed')),
  is_primary boolean not null default false,
  last_error text,
  verified_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain_name),
  unique (mailbox_account_id, domain_name)
);

create unique index if not exists workspace_email_accounts_workspace_slug_unique_idx
  on public.workspace_email_accounts (lower(workspace_slug));

create index if not exists workspace_email_domains_owner_created_idx
  on public.workspace_email_domains (user_id, created_at desc);

create unique index if not exists workspace_email_domains_primary_mailbox_idx
  on public.workspace_email_domains (mailbox_account_id)
  where is_primary;

alter table public.workspace_email_domains enable row level security;

drop policy if exists workspace_email_domains_owner_select on public.workspace_email_domains;
create policy workspace_email_domains_owner_select
  on public.workspace_email_domains
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.workspace_email_domains from public, anon, authenticated;
grant select on public.workspace_email_domains to authenticated;
grant all on public.workspace_email_domains to service_role;

comment on table public.workspace_email_domains is
  'Owner-scoped email domains. Resend and DNS mutations are performed only by workspace-email-domains.';
comment on column public.workspace_email_domains.dns_records is
  'Provider verification records returned to the owner; never contains API tokens.';

create or replace function public.complete_workspace_email_onboarding(
  p_local_part text, p_workspace_slug text, p_display_name text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_local text := lower(nullif(btrim(p_local_part),''));
  v_workspace text := lower(nullif(btrim(p_workspace_slug),''));
  v_display text := nullif(btrim(p_display_name),'');
  v_requested text;
  v_sending text;
  v_identity public.mail_bridge_identities;
  v_account public.workspace_email_accounts;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if v_local is null or v_local !~ '^[a-z0-9][a-z0-9._-]{1,29}$' then
    raise exception 'Email name must be 2-30 characters' using errcode='22023';
  end if;
  if v_workspace is null or v_workspace !~ '^[a-z0-9][a-z0-9-]{1,29}$' then
    raise exception 'Workspace name must be 2-30 characters' using errcode='22023';
  end if;
  if v_display is null or length(v_display)>80 then
    raise exception 'Display name is required and may contain at most 80 characters' using errcode='22023';
  end if;
  if exists (
    select 1
    from public.workspace_email_accounts a
    where lower(a.workspace_slug) = v_workspace
      and a.user_id <> v_user
  ) then
    raise exception 'This email subdomain is already in use' using errcode='23505';
  end if;

  v_requested := v_local||'@'||v_workspace||'.wersee.com';
  -- The verified root-domain address remains usable while the dedicated
  -- subdomain is being configured and verified.
  v_sending := v_local||'-'||v_workspace||'@wersee.com';

  update public.mail_bridge_identities
  set is_default=false, updated_at=now()
  where owner_user_id=v_user and is_default=true;

  insert into public.mail_bridge_identities(
    email, display_name, provider, provider_config, enabled, is_default, owner_user_id
  )
  values(
    v_sending,
    v_display,
    'resend',
    jsonb_build_object(
      'requested_alias', v_requested,
      'domain_status', 'provisioning',
      'transport', 'resend_queue',
      'address_mode', 'verified_root_fallback'
    ),
    true,
    true,
    v_user
  )
  on conflict(email) do update
  set display_name=excluded.display_name,
      provider_config=excluded.provider_config,
      enabled=true,
      is_default=true,
      owner_user_id=v_user,
      updated_at=now()
  returning * into v_identity;

  insert into public.workspace_email_accounts(
    user_id, local_part, workspace_slug, requested_alias,
    sending_address, identity_id, status
  )
  values(v_user,v_local,v_workspace,v_requested,v_sending,v_identity.id,'active')
  on conflict(user_id) do update
  set local_part=excluded.local_part,
      workspace_slug=excluded.workspace_slug,
      requested_alias=excluded.requested_alias,
      sending_address=excluded.sending_address,
      identity_id=excluded.identity_id,
      status='active',
      updated_at=now()
  returning * into v_account;

  return jsonb_build_object('account',to_jsonb(v_account),'identity',to_jsonb(v_identity));
end;
$$;

revoke all on function public.complete_workspace_email_onboarding(text,text,text)
  from public, anon;
grant execute on function public.complete_workspace_email_onboarding(text,text,text)
  to authenticated;
