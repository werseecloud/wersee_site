-- Creator attribution is a fixed first-touch window. The browser keeps only an
-- opaque token as the authoritative key; the server persists the attribution.
alter table public.creator_profiles
  alter column attribution_model set default 'first_touch',
  alter column attribution_window_days set default 30;

update public.creator_profiles
set attribution_model = 'first_touch',
    attribution_window_days = 30
where attribution_model is distinct from 'first_touch'
   or attribution_window_days is distinct from 30;

-- Existing browser attributions that were lifetime-based become 30-day
-- first-touch records without extending beyond 30 days from their first click.
update public.affiliate_attributions
set attribution_model = 'first_touch',
    expires_at = first_attributed_at + interval '30 days',
    locked = true
where attribution_model is distinct from 'first_touch'
   or expires_at is null
   or expires_at > first_attributed_at + interval '30 days';

update public.affiliate_user_attributions
set attribution_model = 'first_touch',
    expires_at = first_attributed_at + interval '30 days',
    locked = true
where attribution_model is distinct from 'first_touch'
   or expires_at is null
   or expires_at > first_attributed_at + interval '30 days';

-- The official marketplace creator agreement is always 5% of the gross order
-- total. Stripe processing still enforces this server-side as a second boundary.
update public.creator_commission_rules
set commission_type = 'percentage_purchase',
    rate = 5,
    status = 'active',
    funding_source = 'wersee'
where name = 'Wersee official creator agreement';

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
    affiliate_account_id, name, funding_source, commission_type, rate,
    holding_period_days, status, created_by
  ) values (
    account_id, 'Wersee official creator agreement', 'wersee',
    'percentage_purchase', 5, 30, 'active', new.user_id
  );
  return new;
end;
$$;

revoke all on function private.creator_after_insert() from public, anon, authenticated;
