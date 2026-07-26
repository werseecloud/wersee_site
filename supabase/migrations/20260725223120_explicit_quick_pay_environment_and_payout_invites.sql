-- Quick Pay URLs must have a durable environment contract. Never infer whether
-- money is real from a workspace-wide switch at checkout time.
alter table public.quick_pay_links
  add column if not exists environment text;

update public.quick_pay_links
set environment = case
  when settings->>'is_sandbox' = 'true'
    or stripe_account_id is null
    or stripe_account_id = 'sandbox'
    then 'test'
  else 'live'
end
where environment is null
   or environment not in ('test', 'live');

alter table public.quick_pay_links
  alter column environment set default 'test',
  alter column environment set not null;

alter table public.quick_pay_links
  drop constraint if exists quick_pay_links_environment_check;
alter table public.quick_pay_links
  add constraint quick_pay_links_environment_check
  check (environment in ('test', 'live'));

alter table public.quick_pay_links
  drop constraint if exists quick_pay_links_live_account_check;
alter table public.quick_pay_links
  add constraint quick_pay_links_live_account_check
  check (
    environment = 'test'
    or status = 'draft'
    or (
      stripe_account_id is not null
      and stripe_account_id <> 'sandbox'
    )
  );

create index if not exists quick_pay_links_public_environment_idx
  on public.quick_pay_links (username, slug, environment)
  where active = true;

create or replace function public.sync_quick_pay_environment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.environment is null or new.environment not in ('test', 'live') then
    new.environment := case
      when new.settings->>'is_sandbox' = 'true'
        or new.stripe_account_id is null
        or new.stripe_account_id = 'sandbox'
        then 'test'
      else 'live'
    end;
  end if;

  new.settings := jsonb_set(
    coalesce(new.settings, '{}'::jsonb),
    '{is_sandbox}',
    to_jsonb(new.environment = 'test'),
    true
  );
  return new;
end;
$$;

drop trigger if exists sync_quick_pay_environment_trigger
  on public.quick_pay_links;
create trigger sync_quick_pay_environment_trigger
before insert or update of environment, settings, stripe_account_id
on public.quick_pay_links
for each row execute function public.sync_quick_pay_environment();

-- Recipient invitation tokens are stored only as SHA-256 hashes. The raw
-- bearer token exists only in the share URL.
alter table public.payout_recipients
  add column if not exists recipient_user_id uuid references auth.users(id) on delete set null,
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists claimed_at timestamptz;

create unique index if not exists payout_recipients_invite_token_hash_idx
  on public.payout_recipients (invite_token_hash)
  where invite_token_hash is not null;
create index if not exists payout_recipients_recipient_user_idx
  on public.payout_recipients (recipient_user_id)
  where recipient_user_id is not null;

create or replace function public.lookup_payout_recipient_account(p_email text)
returns table (
  recipient_user_id uuid,
  stripe_account_id text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    auth_user.id,
    coalesce(payout_profile.stripe_account_id, profile.stripe_account_id)
  from auth.users as auth_user
  left join public.seller_payout_profiles as payout_profile
    on payout_profile.user_id = auth_user.id
  left join public.profiles as profile
    on profile.id = auth_user.id
  where lower(auth_user.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.lookup_payout_recipient_account(text)
  from public, anon, authenticated;
grant execute on function public.lookup_payout_recipient_account(text)
  to service_role;
