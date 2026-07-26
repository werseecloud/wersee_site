-- Finance sidebar integrity foundation.
-- Stripe remains the payment/payout processor; Supabase stores only verified,
-- user-visible projections and an append-only Wersee Points ledger.

create table if not exists public.finance_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settlement_mode text not null check (settlement_mode in ('points', 'direct_payout')),
  wizard_completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.points_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 48),
  card_label text not null check (char_length(trim(card_label)) between 1 and 32),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists points_wallets_one_default_per_user
  on public.points_wallets(user_id) where is_default;

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.points_wallets(id) on delete restrict,
  amount_points bigint not null check (amount_points <> 0),
  entry_type text not null check (entry_type in ('sale', 'purchase', 'cashout', 'refund', 'adjustment')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'reversed')),
  order_id uuid references public.orders(id) on delete restrict,
  stripe_payment_intent_id text,
  idempotency_key text not null unique,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists points_ledger_user_time_idx
  on public.points_ledger(user_id, occurred_at desc);
create unique index if not exists points_ledger_sale_once_idx
  on public.points_ledger(order_id, entry_type)
  where order_id is not null and entry_type = 'sale' and status = 'approved';

create table if not exists public.finance_reconciliations (
  order_id uuid primary key references public.orders(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  stripe_payment_intent_id text not null,
  stripe_account_id text not null,
  supabase_amount_minor bigint not null check (supabase_amount_minor >= 0),
  stripe_amount_minor bigint,
  currency text not null,
  status text not null check (status in ('matched', 'rejected', 'pending')),
  reason_code text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists finance_reconciliations_seller_time_idx
  on public.finance_reconciliations(seller_id, checked_at desc);

create table if not exists public.payout_recipients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (position('@' in email) > 1),
  stripe_connected_account_id text,
  onboarding_status text not null default 'invited'
    check (onboarding_status in ('invited', 'onboarding', 'ready', 'restricted', 'disabled')),
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, email)
);

create table if not exists public.finance_payout_requests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references public.payout_recipients(id) on delete restrict,
  payout_kind text not null check (payout_kind in ('own_bank', 'other_recipient', 'points_cashout')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'eur',
  status text not null default 'pending'
    check (status in ('pending', 'recipient_onboarding', 'processing', 'in_transit', 'paid', 'failed', 'canceled')),
  stripe_payout_id text,
  stripe_transfer_id text,
  estimated_arrival_at timestamptz,
  delivered_at timestamptz,
  failure_code text,
  responsibility_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_payout_requests_owner_time_idx
  on public.finance_payout_requests(owner_user_id, created_at desc);

alter table public.revenue_splits
  add column if not exists name text,
  add column if not exists tax_buffer_enabled boolean not null default true;

alter table public.revenue_splits
  alter column recipient_email drop not null,
  alter column percentage set default 0,
  alter column percentage drop not null;

alter table public.wersee_invest_settings
  add column if not exists wersee_control boolean not null default true;

update public.revenue_splits
set name = coalesce(nullif(name, ''), 'Revenue split')
where name is null or name = '';

alter table public.finance_preferences enable row level security;
alter table public.points_wallets enable row level security;
alter table public.points_ledger enable row level security;
alter table public.finance_reconciliations enable row level security;
alter table public.payout_recipients enable row level security;
alter table public.finance_payout_requests enable row level security;

drop policy if exists "Users read own finance preferences" on public.finance_preferences;
create policy "Users read own finance preferences"
  on public.finance_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own points wallets" on public.points_wallets;
create policy "Users read own points wallets"
  on public.points_wallets for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own points wallets" on public.points_wallets;
create policy "Users insert own points wallets"
  on public.points_wallets for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own points wallets" on public.points_wallets;
create policy "Users update own points wallets"
  on public.points_wallets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own points ledger" on public.points_ledger;
create policy "Users read own points ledger"
  on public.points_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own finance reconciliations" on public.finance_reconciliations;
create policy "Users read own finance reconciliations"
  on public.finance_reconciliations for select to authenticated
  using ((select auth.uid()) = seller_id);

drop policy if exists "Users read own payout recipients" on public.payout_recipients;
create policy "Users read own payout recipients"
  on public.payout_recipients for select to authenticated
  using ((select auth.uid()) = owner_user_id);

drop policy if exists "Users read own finance payout requests" on public.finance_payout_requests;
create policy "Users read own finance payout requests"
  on public.finance_payout_requests for select to authenticated
  using ((select auth.uid()) = owner_user_id);

revoke insert, update, delete on public.points_ledger from anon, authenticated;
revoke insert, update, delete on public.finance_reconciliations from anon, authenticated;
revoke insert, update, delete on public.payout_recipients from anon, authenticated;
revoke insert, update, delete on public.finance_payout_requests from anon, authenticated;

grant select on public.finance_preferences, public.points_wallets, public.points_ledger,
  public.finance_reconciliations, public.payout_recipients, public.finance_payout_requests
  to authenticated;
grant insert, update on public.points_wallets to authenticated;

create or replace function public.complete_finance_onboarding(
  p_settlement_mode text,
  p_wallet_name text,
  p_card_label text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  wallet_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_settlement_mode not in ('points', 'direct_payout') then
    raise exception 'Invalid settlement mode';
  end if;
  if char_length(trim(p_wallet_name)) not between 1 and 48
     or char_length(trim(p_card_label)) not between 1 and 32 then
    raise exception 'Invalid points card details';
  end if;

  insert into public.finance_preferences(user_id, settlement_mode, wizard_completed_at, updated_at)
  values (current_user_id, p_settlement_mode, now(), now())
  on conflict (user_id) do update
    set settlement_mode = excluded.settlement_mode,
        wizard_completed_at = excluded.wizard_completed_at,
        updated_at = excluded.updated_at;

  select id into wallet_id
  from public.points_wallets
  where user_id = current_user_id and is_default
  limit 1;

  if wallet_id is null then
    insert into public.points_wallets(user_id, name, card_label, is_default)
    values (current_user_id, trim(p_wallet_name), trim(p_card_label), true)
    returning id into wallet_id;
  end if;

  return wallet_id;
end;
$$;

revoke all on function public.complete_finance_onboarding(text, text, text) from public, anon;
grant execute on function public.complete_finance_onboarding(text, text, text) to authenticated;

create or replace function public.points_wallet_balances()
returns table (
  wallet_id uuid,
  name text,
  card_label text,
  is_default boolean,
  balance_points bigint
)
language sql
security invoker
set search_path = ''
as $$
  select
    wallet.id,
    wallet.name,
    wallet.card_label,
    wallet.is_default,
    coalesce(sum(ledger.amount_points) filter (where ledger.status = 'approved'), 0)::bigint
  from public.points_wallets wallet
  left join public.points_ledger ledger on ledger.wallet_id = wallet.id
  where wallet.user_id = auth.uid()
  group by wallet.id, wallet.name, wallet.card_label, wallet.is_default
  order by wallet.is_default desc, wallet.created_at asc;
$$;

revoke all on function public.points_wallet_balances() from public, anon;
grant execute on function public.points_wallet_balances() to authenticated;

create or replace function public.award_reconciled_sale_points(p_order_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  target_wallet_id uuid;
  points_to_award bigint;
  payment_intent_id text;
  inserted_id uuid;
begin
  select reconciliation.seller_id, reconciliation.stripe_payment_intent_id
    into target_user_id, payment_intent_id
  from public.finance_reconciliations reconciliation
  where reconciliation.order_id = p_order_id
    and reconciliation.status = 'matched';

  if target_user_id is null then
    raise exception 'Order has not been reconciled';
  end if;

  if not exists (
    select 1 from public.finance_preferences preference
    where preference.user_id = target_user_id
      and preference.settlement_mode = 'points'
  ) then
    return 0;
  end if;

  select wallet.id into target_wallet_id
  from public.points_wallets wallet
  where wallet.user_id = target_user_id and wallet.is_default
  limit 1;

  if target_wallet_id is null then
    return 0;
  end if;

  select greatest(
    0,
    round(coalesce("order".net_amount, "order".amount, "order".total_amount, 0) * 100)
  )::bigint into points_to_award
  from public.orders "order"
  where "order".id = p_order_id and "order".seller_id = target_user_id;

  if coalesce(points_to_award, 0) <= 0 then
    return 0;
  end if;

  insert into public.points_ledger(
    user_id, wallet_id, amount_points, entry_type, status, order_id,
    stripe_payment_intent_id, idempotency_key, description
  )
  values (
    target_user_id, target_wallet_id, points_to_award, 'sale', 'approved', p_order_id,
    payment_intent_id, 'points:sale:' || p_order_id::text, 'Approved Wersee sale'
  )
  on conflict do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    update public.profiles
    set wersee_points = coalesce(wersee_points, 0) + points_to_award
    where id = target_user_id;

    insert into public.points_activity(user_id, amount, description)
    values (target_user_id, points_to_award::integer, 'Approved Wersee sale');
    return points_to_award;
  end if;

  return 0;
end;
$$;

revoke all on function public.award_reconciled_sale_points(uuid) from public, anon, authenticated;
grant execute on function public.award_reconciled_sale_points(uuid) to service_role;

create or replace function private.prevent_finance_projection_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Finance ledger rows are append-only';
end;
$$;

drop trigger if exists points_ledger_immutable on public.points_ledger;
create trigger points_ledger_immutable
  before update or delete on public.points_ledger
  for each row execute function private.prevent_finance_projection_mutation();

drop trigger if exists finance_reconciliations_immutable on public.finance_reconciliations;
create trigger finance_reconciliations_immutable
  before delete on public.finance_reconciliations
  for each row execute function private.prevent_finance_projection_mutation();
