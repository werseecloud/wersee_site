-- Wersee Creator Growth Engine
-- Extends the existing profiles, listings, orders, notifications and Stripe account model.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.creator_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role')
      in ('admin', 'platform_admin'),
    false
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_platform_admin() to anon, authenticated;

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  username text not null,
  display_name text,
  bio text,
  profile_image_url text,
  banner_url text,
  status text not null default 'active' check (status in ('active','pending_review','paused','suspended')),
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 4),
  onboarding_completed_at timestamptz,
  primary_platform text,
  attribution_model text not null default 'lifetime_first_touch' check (attribution_model in ('lifetime_first_touch','first_touch','last_touch')),
  attribution_window_days integer check (attribution_window_days is null or attribution_window_days between 1 and 3650),
  public_profile_enabled boolean not null default false,
  seo_indexable boolean not null default false,
  seo_title text,
  seo_description text,
  payout_status text not null default 'not_connected' check (payout_status in ('not_connected','onboarding','verification_required','active','restricted','payouts_disabled')),
  stripe_account_id text,
  notification_preferences jsonb not null default '{"milestones":true,"commissions":true,"payouts":true,"invites":true}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_profiles_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  constraint creator_profiles_username_lowercase check (username = lower(username))
);

create unique index creator_profiles_username_unique_idx on public.creator_profiles (lower(username));
create index creator_profiles_public_idx on public.creator_profiles (public_profile_enabled, status) where public_profile_enabled;

create table public.creator_platforms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform text not null,
  handle text,
  profile_url text,
  is_primary boolean not null default false,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, platform)
);
create unique index creator_platforms_one_primary_idx on public.creator_platforms (creator_id) where is_primary;

create table public.affiliate_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  creator_id uuid unique references public.creator_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','suspended','closed')),
  lifetime_referred_customers bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.affiliate_campaigns (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active' check (status in ('draft','active','paused','ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (affiliate_account_id, slug),
  constraint affiliate_campaign_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,49}$')
);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  campaign_id uuid references public.affiliate_campaigns(id) on delete set null,
  name text not null,
  slug text not null,
  destination_path text not null default '/',
  tracking_label text,
  source_platform text,
  medium text not null default 'creator',
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (affiliate_account_id, slug),
  constraint affiliate_link_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  constraint affiliate_link_safe_destination check (
    destination_path like '/%'
    and destination_path not like '//%'
    and destination_path !~* '^(javascript|data|vbscript):'
  )
);
create unique index affiliate_links_primary_idx on public.affiliate_links (affiliate_account_id) where is_primary;
create index affiliate_links_redirect_idx on public.affiliate_links (status, affiliate_account_id, slug);

alter table public.creator_profiles add column primary_affiliate_link_id uuid references public.affiliate_links(id) on delete set null;

create table public.creator_invites (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  token_hash text not null unique,
  invited_email text,
  status text not null default 'created' check (status in ('created','sent','accepted','expired','revoked')),
  accepted_by_user_id uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index creator_invites_creator_created_idx on public.creator_invites (creator_id, created_at desc);

create table public.affiliate_impressions (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  anonymous_visitor_hash text,
  source text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index affiliate_impressions_link_time_idx on public.affiliate_impressions (affiliate_link_id, occurred_at desc);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  campaign_id uuid references public.affiliate_campaigns(id) on delete set null,
  anonymous_visitor_hash text not null,
  session_hash text,
  landing_page text,
  destination_path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  device_category text,
  country_code text,
  is_unique boolean not null default true,
  risk_score numeric(5,2) not null default 0,
  risk_signals jsonb not null default '[]'::jsonb,
  occurred_at timestamptz not null default now()
);
create index affiliate_clicks_link_time_idx on public.affiliate_clicks (affiliate_link_id, occurred_at desc);
create index affiliate_clicks_account_time_idx on public.affiliate_clicks (affiliate_account_id, occurred_at desc);
create index affiliate_clicks_visitor_time_idx on public.affiliate_clicks (anonymous_visitor_hash, occurred_at desc);

create table public.affiliate_attributions (
  id uuid primary key default gen_random_uuid(),
  anonymous_visitor_hash text not null unique,
  original_affiliate_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  latest_affiliate_touch_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  original_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  latest_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  first_attributed_at timestamptz not null,
  last_touched_at timestamptz not null,
  attribution_model text not null,
  expires_at timestamptz,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.affiliate_user_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  original_affiliate_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  latest_affiliate_touch_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  original_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  latest_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  first_attributed_at timestamptz not null,
  last_touched_at timestamptz not null,
  attribution_model text not null,
  expires_at timestamptz,
  locked boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index affiliate_user_attributions_original_idx on public.affiliate_user_attributions (original_affiliate_id, connected_at desc);

create table public.creator_commission_rules (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid references public.affiliate_accounts(id) on delete cascade,
  existing_program_id uuid references public.affiliate_programs(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  name text not null,
  funding_source text not null default 'wersee' check (funding_source in ('wersee','seller','custom')),
  commission_type text not null check (commission_type in ('percentage_purchase','fixed','percentage_platform_fee','percentage_eligible_value')),
  rate numeric(12,6) not null default 0 check (rate >= 0),
  fixed_amount_minor bigint check (fixed_amount_minor is null or fixed_amount_minor >= 0),
  currency text,
  first_purchase_only boolean not null default false,
  recurring_mode text not null default 'none' check (recurring_mode in ('none','every_payment','lifetime','first_x_payments','first_x_months')),
  recurring_limit integer,
  holding_period_days integer not null default 30 check (holding_period_days between 0 and 365),
  priority integer not null default 100,
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_commission_rule_target check (affiliate_account_id is not null or existing_program_id is not null)
);
create index creator_commission_rules_lookup_idx on public.creator_commission_rules (status, affiliate_account_id, listing_id, priority);

create table public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  campaign_id uuid references public.affiliate_campaigns(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete restrict,
  conversion_type text not null check (conversion_type in ('signup','customer','purchase','subscription_renewal')),
  source_event_id text not null,
  amount_minor bigint not null default 0,
  currency text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (source_event_id, conversion_type)
);
create index affiliate_conversions_account_time_idx on public.affiliate_conversions (affiliate_account_id, occurred_at desc);
create index affiliate_conversions_order_idx on public.affiliate_conversions (order_id);

create table public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid not null unique references public.affiliate_conversions(id) on delete restrict,
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  commission_rule_id uuid references public.creator_commission_rules(id) on delete restrict,
  rule_snapshot jsonb not null,
  eligible_amount_minor bigint not null,
  commission_amount_minor bigint not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending','available','paid','reversed','held','cancelled')),
  available_at timestamptz not null,
  paid_at timestamptz,
  source_event_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index affiliate_commissions_account_status_idx on public.affiliate_commissions (affiliate_account_id, status, available_at);

create table public.affiliate_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  commission_id uuid references public.affiliate_commissions(id) on delete restrict,
  payout_id uuid,
  entry_type text not null check (entry_type in ('commission','refund_adjustment','partial_refund_adjustment','chargeback_adjustment','manual_adjustment','payout','recovery')),
  amount_minor bigint not null,
  currency text not null,
  source_event_id text not null unique,
  description text,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index affiliate_ledger_account_time_idx on public.affiliate_commission_ledger (affiliate_account_id, effective_at desc);

create table public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','reversed')),
  stripe_account_id text,
  stripe_transfer_id text unique,
  failure_code text,
  failure_message text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.affiliate_commission_ledger add constraint affiliate_ledger_payout_fk foreign key (payout_id) references public.affiliate_payouts(id) on delete restrict;
create index affiliate_payouts_account_time_idx on public.affiliate_payouts (affiliate_account_id, created_at desc);

create table public.affiliate_fraud_flags (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references public.affiliate_accounts(id) on delete restrict,
  click_id uuid references public.affiliate_clicks(id) on delete set null,
  conversion_id uuid references public.affiliate_conversions(id) on delete set null,
  signal_type text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','reviewing','cleared','confirmed')),
  details jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.affiliate_audit_logs (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid references public.affiliate_accounts(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.creator_share_assets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creator_profiles(id) on delete cascade,
  title text not null,
  asset_type text not null check (asset_type in ('logo','image','social_card','short_description','long_description','caption','youtube_description','bio','cta')),
  content text,
  asset_url text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_share_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  campaign_id uuid references public.affiliate_campaigns(id) on delete set null,
  platform text not null,
  action text not null check (action in ('copy','share','download','qr_generated')),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.creator_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  status text not null default 'processing' check (status in ('processing','processed','ignored','failed')),
  error_message text,
  payload_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create or replace function private.creator_after_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  account_id uuid;
  link_id uuid;
begin
  insert into public.affiliate_accounts (user_id, creator_id)
  values (new.user_id, new.id)
  returning id into account_id;

  insert into public.affiliate_links (affiliate_account_id, name, slug, destination_path, is_primary)
  values (account_id, 'Main Wersee link', 'main', '/', true)
  returning id into link_id;

  update public.creator_profiles set primary_affiliate_link_id = link_id where id = new.id;

  insert into public.creator_commission_rules (
    affiliate_account_id, name, commission_type, rate, holding_period_days, status, created_by
  ) values (
    account_id, 'Wersee official creator agreement', 'percentage_eligible_value', 0, 30, 'draft', new.user_id
  );
  return new;
end;
$$;
revoke all on function private.creator_after_insert() from public, anon, authenticated;

create trigger creator_profiles_after_insert
after insert on public.creator_profiles
for each row execute function private.creator_after_insert();

do $$
declare t text;
begin
  foreach t in array array[
    'creator_profiles','creator_platforms','affiliate_accounts','affiliate_campaigns','affiliate_links',
    'creator_invites','affiliate_impressions','affiliate_clicks','affiliate_attributions',
    'affiliate_user_attributions','creator_commission_rules','affiliate_conversions',
    'affiliate_commissions','affiliate_commission_ledger','affiliate_payouts','affiliate_fraud_flags',
    'affiliate_audit_logs','creator_share_assets','creator_share_events','creator_webhook_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Creator identity and onboarding.
create policy creator_profiles_select on public.creator_profiles for select
to anon, authenticated
using ((public_profile_enabled and status = 'active') or (select auth.uid()) = user_id or private.is_platform_admin());
create policy creator_profiles_insert on public.creator_profiles for insert
to authenticated with check ((select auth.uid()) = user_id);
create policy creator_profiles_update on public.creator_profiles for update
to authenticated using ((select auth.uid()) = user_id or private.is_platform_admin())
with check ((select auth.uid()) = user_id or private.is_platform_admin());

create policy creator_platforms_select on public.creator_platforms for select to anon, authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and ((cp.public_profile_enabled and cp.status='active') or cp.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy creator_platforms_manage on public.creator_platforms for all to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())));

-- Owner-accessible creator resources. Anonymous redirect/event writes are service-role only.
create policy affiliate_accounts_owner_select on public.affiliate_accounts for select to authenticated
using (user_id=(select auth.uid()) or private.is_platform_admin());

create policy affiliate_campaigns_owner on public.affiliate_campaigns for all to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));

create policy affiliate_links_owner on public.affiliate_links for all to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));

create policy creator_invites_owner on public.creator_invites for all to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())));

create policy affiliate_clicks_owner_read on public.affiliate_clicks for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy affiliate_impressions_owner_read on public.affiliate_impressions for select to authenticated
using (exists (select 1 from public.affiliate_links al join public.affiliate_accounts aa on aa.id=al.affiliate_account_id where al.id=affiliate_link_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));

create policy user_attribution_subject_read on public.affiliate_user_attributions for select to authenticated
using (user_id=(select auth.uid()) or exists (select 1 from public.affiliate_accounts aa where aa.id=original_affiliate_id and aa.user_id=(select auth.uid())) or private.is_platform_admin());

create policy commission_rules_owner_read on public.creator_commission_rules for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())) or private.is_platform_admin());

create policy conversions_owner_read on public.affiliate_conversions for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy commissions_owner_read on public.affiliate_commissions for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy ledger_owner_read on public.affiliate_commission_ledger for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy payouts_owner_read on public.affiliate_payouts for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy fraud_flags_owner_read on public.affiliate_fraud_flags for select to authenticated
using (exists (select 1 from public.affiliate_accounts aa where aa.id=affiliate_account_id and (aa.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy audit_admin_read on public.affiliate_audit_logs for select to authenticated using (private.is_platform_admin());

create policy share_assets_public_read on public.creator_share_assets for select to anon, authenticated
using (is_approved or exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy share_assets_owner_manage on public.creator_share_assets for all to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())));
create policy share_events_owner on public.creator_share_events for all to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())))
with check (exists (select 1 from public.creator_profiles cp where cp.id=creator_id and (cp.user_id=(select auth.uid()) or private.is_platform_admin())));

-- Explicit Data API grants (new Supabase projects no longer auto-expose tables).
revoke all on public.creator_profiles, public.creator_platforms, public.affiliate_accounts,
  public.affiliate_campaigns, public.affiliate_links, public.creator_invites,
  public.affiliate_impressions, public.affiliate_clicks, public.affiliate_attributions,
  public.affiliate_user_attributions, public.creator_commission_rules,
  public.affiliate_conversions, public.affiliate_commissions,
  public.affiliate_commission_ledger, public.affiliate_payouts,
  public.affiliate_fraud_flags, public.affiliate_audit_logs,
  public.creator_share_assets, public.creator_share_events,
  public.creator_webhook_events from anon, authenticated;
grant select on public.creator_profiles, public.creator_platforms, public.creator_share_assets to anon;
grant select, insert, update on public.creator_profiles to authenticated;
grant select, insert, update, delete on public.creator_platforms, public.affiliate_campaigns, public.affiliate_links, public.creator_invites, public.creator_share_assets, public.creator_share_events to authenticated;
grant select on public.affiliate_accounts, public.affiliate_impressions, public.affiliate_clicks, public.affiliate_user_attributions, public.creator_commission_rules, public.affiliate_conversions, public.affiliate_commissions, public.affiliate_commission_ledger, public.affiliate_payouts, public.affiliate_fraud_flags, public.affiliate_audit_logs to authenticated;

-- Service role remains the only writer for clicks, attribution, conversions, commissions, ledger, payouts and webhook events.
grant select, insert, update, delete on public.creator_profiles, public.creator_platforms,
  public.affiliate_accounts, public.affiliate_campaigns, public.affiliate_links,
  public.creator_invites, public.affiliate_impressions, public.affiliate_clicks,
  public.affiliate_attributions, public.affiliate_user_attributions,
  public.creator_commission_rules, public.affiliate_conversions,
  public.affiliate_commissions, public.affiliate_commission_ledger,
  public.affiliate_payouts, public.affiliate_fraud_flags,
  public.affiliate_audit_logs, public.creator_share_assets,
  public.creator_share_events, public.creator_webhook_events to service_role;

create trigger creator_profiles_updated_at before update on public.creator_profiles for each row execute function private.creator_set_updated_at();
create trigger creator_platforms_updated_at before update on public.creator_platforms for each row execute function private.creator_set_updated_at();
create trigger affiliate_accounts_updated_at before update on public.affiliate_accounts for each row execute function private.creator_set_updated_at();
create trigger affiliate_campaigns_updated_at before update on public.affiliate_campaigns for each row execute function private.creator_set_updated_at();
create trigger affiliate_links_updated_at before update on public.affiliate_links for each row execute function private.creator_set_updated_at();
create trigger affiliate_attributions_updated_at before update on public.affiliate_attributions for each row execute function private.creator_set_updated_at();
create trigger affiliate_user_attributions_updated_at before update on public.affiliate_user_attributions for each row execute function private.creator_set_updated_at();
create trigger creator_commission_rules_updated_at before update on public.creator_commission_rules for each row execute function private.creator_set_updated_at();
create trigger affiliate_commissions_updated_at before update on public.affiliate_commissions for each row execute function private.creator_set_updated_at();
create trigger affiliate_payouts_updated_at before update on public.affiliate_payouts for each row execute function private.creator_set_updated_at();
create trigger creator_share_assets_updated_at before update on public.creator_share_assets for each row execute function private.creator_set_updated_at();
