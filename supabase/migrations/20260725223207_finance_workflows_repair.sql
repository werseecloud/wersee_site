-- Finance workflow consistency and secure seller visibility.

update public.subscriptions
set amount = coalesce(amount, price, 0),
    price = coalesce(price, amount, 0)
where amount is null
   or price is null;

create or replace function public.sync_subscription_amounts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.amount := coalesce(new.amount, new.price);
  new.price := coalesce(new.price, new.amount);
  if new.amount is null or new.amount < 0 then
    raise exception 'SUBSCRIPTION_AMOUNT_REQUIRED';
  end if;
  new.interval := coalesce(
    new.interval,
    case new.billing_period
      when 'daily' then 'day'
      when 'weekly' then 'week'
      when 'yearly' then 'year'
      else 'month'
    end
  );
  return new;
end;
$$;

revoke all on function public.sync_subscription_amounts() from public, anon, authenticated;

drop trigger if exists trg_sync_subscription_amounts on public.subscriptions;
create trigger trg_sync_subscription_amounts
before insert or update of amount, price, billing_period, interval
on public.subscriptions
for each row execute function public.sync_subscription_amounts();

drop policy if exists "Sellers can view subscribers to their plans" on public.user_subscriptions;
create policy "Sellers can view subscribers to their plans"
on public.user_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.subscriptions s
    where s.id = user_subscriptions.subscription_id
      and s.seller_id = (select auth.uid())
  )
);

create or replace function public.ensure_finance_business()
returns table (business_id uuid, username text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business_id uuid;
  v_username text;
  v_name text;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select tm.business_id
  into v_business_id
  from public.team_members tm
  where tm.user_id = v_user_id
    and tm.business_id is not null
    and coalesce(tm.status, 'active') in ('active', 'joined', 'accepted')
  order by
    case tm.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    tm.joined_at nulls last,
    tm.invited_at nulls last
  limit 1;

  if v_business_id is null then
    select b.id
    into v_business_id
    from public.businesses b
    where b.user_id = v_user_id
    order by b.created_at
    limit 1;
  end if;

  select
    nullif(trim(p.username), ''),
    coalesce(
      nullif(trim(p.company_name), ''),
      nullif(trim(p.full_name), ''),
      nullif(trim(p.name), '')
    )
  into v_username, v_name
  from public.profiles p
  where p.id = v_user_id;

  v_username := coalesce(
    lower(regexp_replace(v_username, '[^a-zA-Z0-9._-]+', '', 'g')),
    'user-' || left(v_user_id::text, 8)
  );
  v_name := coalesce(v_name, '@' || v_username);

  if v_business_id is null then
    v_slug := lower(regexp_replace(v_username, '[^a-zA-Z0-9_-]+', '-', 'g'));
    if exists (select 1 from public.businesses b where b.slug = v_slug) then
      v_slug := v_slug || '-' || left(v_user_id::text, 8);
    end if;

    insert into public.businesses (user_id, name, slug, setup_completed)
    values (v_user_id, v_name, v_slug, false)
    returning id into v_business_id;
  end if;

  return query select v_business_id, v_username;
end;
$$;

revoke all on function public.ensure_finance_business() from public;
grant execute on function public.ensure_finance_business() to authenticated;

create table if not exists public.finance_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  kind text not null check (kind in ('invoice', 'contract_quick_pay')),
  source_id uuid not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  sender_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  resend_email_id text,
  attempts integer not null default 0,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.finance_email_outbox enable row level security;
revoke all on public.finance_email_outbox from anon, authenticated;
grant select on public.finance_email_outbox to authenticated;

drop policy if exists "Owners can view finance email delivery status" on public.finance_email_outbox;
create policy "Owners can view finance email delivery status"
on public.finance_email_outbox
for select
to authenticated
using ((select auth.uid()) = owner_user_id);

create index if not exists finance_email_outbox_owner_created_idx
on public.finance_email_outbox (owner_user_id, created_at desc);
