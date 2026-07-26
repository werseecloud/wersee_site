-- Marketing & Sales management foundation.
-- Keeps public funnel shares, platform affiliates, workspace mail, and paid
-- campaign promotion state in Postgres with owner-scoped RLS.

alter table public.funnels
  add column if not exists share_token uuid,
  add column if not exists is_public boolean not null default false,
  add column if not exists exported_at timestamptz;
create unique index if not exists funnels_share_token_key
  on public.funnels(share_token) where share_token is not null;

alter table public.partnerships add column if not exists proposal text;
alter table public.affiliate_accounts
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists bio text,
  add column if not exists primary_platform text;

alter table public.ads_campaigns
  add column if not exists promote_on_wersee boolean not null default false,
  add column if not exists promotion_status text not null default 'not_requested',
  add column if not exists promotion_started_at timestamptz;

create table if not exists public.affiliate_monthly_bonus_awards (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  position integer not null default 1,
  bonus_amount_minor bigint,
  currency text not null default 'EUR',
  status text not null default 'qualified'
    check (status in ('qualified','approved','paid','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (month_start, affiliate_account_id)
);

create table if not exists public.workspace_email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  local_part text not null,
  workspace_slug text not null,
  requested_alias text not null unique,
  sending_address text not null unique,
  identity_id uuid references public.mail_bridge_identities(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_promotion_payments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ads_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount_minor bigint not null check (amount_minor >= 1000),
  currency text not null default 'EUR',
  status text not null default 'pending'
    check (status in ('pending','processing','paid','failed','cancelled','refunded')),
  idempotency_key text not null unique default gen_random_uuid()::text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ads_campaigns
  add column if not exists promotion_payment_id uuid
    references public.campaign_promotion_payments(id) on delete set null;
create index if not exists ads_campaigns_promotion_payment_idx
  on public.ads_campaigns(promotion_payment_id) where promotion_payment_id is not null;

alter table public.affiliate_monthly_bonus_awards enable row level security;
alter table public.workspace_email_accounts enable row level security;
alter table public.campaign_promotion_payments enable row level security;

drop policy if exists "Anyone can view shared funnels" on public.funnels;
create policy "Anyone can view shared funnels" on public.funnels
  for select using (is_public = true and share_token is not null);
drop policy if exists "Anyone can view nodes of shared funnels" on public.funnel_nodes;
create policy "Anyone can view nodes of shared funnels" on public.funnel_nodes
  for select using (exists (
    select 1 from public.funnels f
    where f.id = funnel_nodes.funnel_id and f.is_public = true and f.share_token is not null
  ));
drop policy if exists "Anyone can view connections of shared funnels" on public.funnel_connections;
create policy "Anyone can view connections of shared funnels" on public.funnel_connections
  for select using (exists (
    select 1 from public.funnels f
    where f.id = funnel_connections.funnel_id and f.is_public = true and f.share_token is not null
  ));

drop policy if exists affiliate_monthly_bonus_owner_select on public.affiliate_monthly_bonus_awards;
create policy affiliate_monthly_bonus_owner_select on public.affiliate_monthly_bonus_awards
  for select using (exists (
    select 1 from public.affiliate_accounts a
    where a.id = affiliate_account_id and a.user_id = (select auth.uid())
  ));
drop policy if exists workspace_email_accounts_owner_select on public.workspace_email_accounts;
create policy workspace_email_accounts_owner_select on public.workspace_email_accounts
  for select using (user_id = (select auth.uid()));
drop policy if exists workspace_email_accounts_owner_update on public.workspace_email_accounts;
create policy workspace_email_accounts_owner_update on public.workspace_email_accounts
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists campaign_promotion_payments_owner_select on public.campaign_promotion_payments;
create policy campaign_promotion_payments_owner_select on public.campaign_promotion_payments
  for select using (user_id = (select auth.uid()));

grant select on public.affiliate_monthly_bonus_awards,
  public.workspace_email_accounts, public.campaign_promotion_payments to authenticated;
grant update on public.workspace_email_accounts to authenticated;

create or replace function public.save_funnel_graph(
  p_funnel_id uuid, p_nodes jsonb, p_connections jsonb
) returns void
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.funnels f where f.id = p_funnel_id and f.user_id = auth.uid()
  ) then
    raise exception 'Funnel not found or access denied' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_nodes, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_connections, '[]'::jsonb)) <> 'array' then
    raise exception 'Nodes and connections must be arrays' using errcode = '22023';
  end if;
  delete from public.funnel_connections where funnel_id = p_funnel_id;
  delete from public.funnel_nodes where funnel_id = p_funnel_id;
  insert into public.funnel_nodes (id, funnel_id, type, x, y, text)
  select n.id, p_funnel_id, n.type, n.x, n.y, n.text
  from jsonb_to_recordset(coalesce(p_nodes, '[]'::jsonb))
    as n(id uuid, funnel_id uuid, type text, x numeric, y numeric, text text);
  insert into public.funnel_connections (id, funnel_id, from_node_id, to_node_id)
  select c.id, p_funnel_id, c.from_node_id, c.to_node_id
  from jsonb_to_recordset(coalesce(p_connections, '[]'::jsonb))
    as c(id uuid, funnel_id uuid, from_node_id uuid, to_node_id uuid);
  update public.funnels set updated_at = now() where id = p_funnel_id;
end;
$$;
revoke all on function public.save_funnel_graph(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.save_funnel_graph(uuid,jsonb,jsonb) to authenticated;

create or replace function public.complete_platform_affiliate_onboarding(
  p_display_name text, p_referral_key text, p_bio text default null,
  p_primary_platform text default null
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := nullif(btrim(p_display_name),'');
  v_key text := lower(nullif(btrim(p_referral_key),''));
  v_bio text := nullif(btrim(p_bio),'');
  v_platform text := lower(nullif(btrim(p_primary_platform),''));
  v_account public.affiliate_accounts;
  v_campaign public.affiliate_campaigns;
  v_link public.affiliate_links;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if v_name is null or length(v_name)>80 then raise exception 'Enter a display name of at most 80 characters' using errcode='22023'; end if;
  if v_key is null or v_key !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'Link name must be 3-30 characters and use letters, numbers, dot, underscore, or dash' using errcode='22023'; end if;
  if length(coalesce(v_bio,''))>500 then raise exception 'Bio must be at most 500 characters' using errcode='22023'; end if;
  if v_platform is not null and v_platform not in ('instagram','tiktok','youtube','linkedin','x','facebook','website','other') then raise exception 'Unsupported platform' using errcode='22023'; end if;
  if exists(select 1 from public.affiliate_accounts where external_referral_key=v_key and user_id is distinct from v_user) then
    raise exception 'This link name is already in use' using errcode='23505';
  end if;
  insert into public.affiliate_accounts(user_id,status,external_display_name,external_referral_key,bio,primary_platform,onboarding_completed_at)
  values(v_user,'active',v_name,v_key,v_bio,v_platform,now())
  on conflict(user_id) do update set external_display_name=excluded.external_display_name,
    external_referral_key=excluded.external_referral_key,bio=excluded.bio,
    primary_platform=excluded.primary_platform,
    onboarding_completed_at=coalesce(affiliate_accounts.onboarding_completed_at,now()),
    status=case when affiliate_accounts.status='closed' then affiliate_accounts.status else 'active' end,
    updated_at=now()
  returning * into v_account;
  insert into public.affiliate_campaigns(affiliate_account_id,name,slug,description,status,metadata)
  values(v_account.id,'Wersee platform','wersee','Official Wersee platform affiliate campaign with a 5% marketplace commission.','active',
    jsonb_build_object('commission_rate',5,'attribution_window_days',30,'bonus','monthly_top_affiliate'))
  on conflict(affiliate_account_id,slug) do update set description=excluded.description,
    status='active',metadata=excluded.metadata,updated_at=now()
  returning * into v_campaign;
  insert into public.affiliate_links(affiliate_account_id,campaign_id,name,slug,destination_path,tracking_label,source_platform,medium,is_primary,status)
  values(v_account.id,v_campaign.id,'Main Wersee link','main','/','Wersee platform',coalesce(v_platform,'affiliate'),'affiliate',true,'active')
  on conflict(affiliate_account_id,slug) do update set campaign_id=excluded.campaign_id,
    source_platform=excluded.source_platform,medium='affiliate',is_primary=true,status='active',updated_at=now()
  returning * into v_link;
  insert into public.creator_commission_rules(affiliate_account_id,name,funding_source,commission_type,rate,holding_period_days,status,created_by)
  select v_account.id,'Wersee official creator agreement','wersee','percentage_purchase',5,30,'active',v_user
  where not exists(select 1 from public.creator_commission_rules r where r.affiliate_account_id=v_account.id and r.name='Wersee official creator agreement');
  update public.creator_commission_rules set commission_type='percentage_purchase',rate=5,
    funding_source='wersee',holding_period_days=30,status='active',updated_at=now()
  where affiliate_account_id=v_account.id and name='Wersee official creator agreement';
  return jsonb_build_object('account',to_jsonb(v_account),'campaign',to_jsonb(v_campaign),'link',to_jsonb(v_link));
end;
$$;
revoke all on function public.complete_platform_affiliate_onboarding(text,text,text,text) from public, anon;
grant execute on function public.complete_platform_affiliate_onboarding(text,text,text,text) to authenticated;

create or replace function public.platform_affiliate_leaderboard(
  p_month date default date_trunc('month', now())::date
) returns table(
  rank bigint, affiliate_account_id uuid, display_name text, unique_clicks bigint,
  conversions bigint, sales_amount_minor bigint, earnings_amount_minor bigint,
  currency text, is_current_user boolean
)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  return query
  with accounts as (
    select a.id, a.user_id, coalesce(nullif(a.external_display_name,''),'Wersee affiliate') display_name
    from public.affiliate_accounts a where a.status='active' and a.onboarding_completed_at is not null
  ), clicks as (
    select c.affiliate_account_id, count(*) filter(where c.is_unique) unique_clicks
    from public.affiliate_clicks c
    where c.occurred_at >= p_month::timestamptz
      and c.occurred_at < (p_month + interval '1 month')::timestamptz
    group by c.affiliate_account_id
  ), conversions as (
    select c.affiliate_account_id, count(*) conversions,
      coalesce(sum(c.amount_minor),0)::bigint sales_amount_minor,
      coalesce(min(c.currency),'EUR') currency
    from public.affiliate_conversions c
    where c.conversion_type in ('purchase','subscription_renewal')
      and c.occurred_at >= p_month::timestamptz
      and c.occurred_at < (p_month + interval '1 month')::timestamptz
    group by c.affiliate_account_id
  ), earnings as (
    select c.affiliate_account_id,
      coalesce(sum(c.commission_amount_minor) filter(where c.status not in ('reversed','cancelled')),0)::bigint earnings_amount_minor
    from public.affiliate_commissions c
    where c.created_at >= p_month::timestamptz
      and c.created_at < (p_month + interval '1 month')::timestamptz
    group by c.affiliate_account_id
  ), ranked as (
    select dense_rank() over(order by coalesce(v.sales_amount_minor,0) desc,
      coalesce(v.conversions,0) desc, coalesce(k.unique_clicks,0) desc, a.id) position,
      a.*, coalesce(k.unique_clicks,0)::bigint unique_clicks,
      coalesce(v.conversions,0)::bigint conversions,
      coalesce(v.sales_amount_minor,0)::bigint sales_amount_minor,
      coalesce(e.earnings_amount_minor,0)::bigint earnings_amount_minor,
      coalesce(v.currency,'EUR') currency
    from accounts a left join clicks k on k.affiliate_account_id=a.id
    left join conversions v on v.affiliate_account_id=a.id
    left join earnings e on e.affiliate_account_id=a.id
  )
  select r.position,r.id,r.display_name,r.unique_clicks,r.conversions,
    r.sales_amount_minor,r.earnings_amount_minor,r.currency,r.user_id=auth.uid()
  from ranked r order by r.position,r.display_name limit 50;
end;
$$;
revoke all on function public.platform_affiliate_leaderboard(date) from public, anon;
grant execute on function public.platform_affiliate_leaderboard(date) to authenticated;

create or replace function public.complete_workspace_email_onboarding(
  p_local_part text, p_workspace_slug text, p_display_name text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid(); v_local text := lower(nullif(btrim(p_local_part),''));
  v_workspace text := lower(nullif(btrim(p_workspace_slug),''));
  v_display text := nullif(btrim(p_display_name),'');
  v_requested text; v_sending text;
  v_identity public.mail_bridge_identities; v_account public.workspace_email_accounts;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if v_local is null or v_local !~ '^[a-z0-9][a-z0-9._-]{1,29}$' then raise exception 'Email name must be 2-30 characters' using errcode='22023'; end if;
  if v_workspace is null or v_workspace !~ '^[a-z0-9][a-z0-9-]{1,29}$' then raise exception 'Workspace name must be 2-30 characters' using errcode='22023'; end if;
  if v_display is null or length(v_display)>80 then raise exception 'Display name is required and may contain at most 80 characters' using errcode='22023'; end if;
  v_requested := v_local||'@'||v_workspace||'.wersee.com';
  v_sending := v_local||'-'||v_workspace||'@wersee.com';
  update public.mail_bridge_identities set is_default=false,updated_at=now()
    where owner_user_id=v_user and is_default=true;
  insert into public.mail_bridge_identities(email,display_name,provider,provider_config,enabled,is_default,owner_user_id)
  values(v_sending,v_display,'resend',jsonb_build_object('requested_alias',v_requested,'domain_status','verified','transport','resend_queue','address_mode','verified_root_domain'),true,true,v_user)
  on conflict(email) do update set display_name=excluded.display_name,provider_config=excluded.provider_config,
    enabled=true,is_default=true,owner_user_id=v_user,updated_at=now()
  returning * into v_identity;
  insert into public.workspace_email_accounts(user_id,local_part,workspace_slug,requested_alias,sending_address,identity_id,status)
  values(v_user,v_local,v_workspace,v_requested,v_sending,v_identity.id,'active')
  on conflict(user_id) do update set local_part=excluded.local_part,workspace_slug=excluded.workspace_slug,
    requested_alias=excluded.requested_alias,sending_address=excluded.sending_address,
    identity_id=excluded.identity_id,status='active',updated_at=now()
  returning * into v_account;
  return jsonb_build_object('account',to_jsonb(v_account),'identity',to_jsonb(v_identity));
end;
$$;
revoke all on function public.complete_workspace_email_onboarding(text,text,text) from public, anon;
grant execute on function public.complete_workspace_email_onboarding(text,text,text) to authenticated;

create or replace function public.enforce_paid_campaign_promotion_activation()
returns trigger language plpgsql security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.promote_on_wersee and (new.promotion_status='active' or new.status='active')
    and (new.promotion_payment_id is null or not exists (
      select 1 from public.campaign_promotion_payments p
      where p.id=new.promotion_payment_id and p.campaign_id=new.id
        and p.user_id=new.user_id and p.status='paid'
    )) then
    raise exception 'A verified paid promotion is required before activation' using errcode='42501';
  end if;
  return new;
end;
$$;
drop trigger if exists ads_campaigns_require_paid_promotion on public.ads_campaigns;
create trigger ads_campaigns_require_paid_promotion
before insert or update of promote_on_wersee,promotion_status,promotion_payment_id,status
on public.ads_campaigns for each row
execute function public.enforce_paid_campaign_promotion_activation();
