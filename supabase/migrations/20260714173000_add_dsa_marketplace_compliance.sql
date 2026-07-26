create table if not exists public.dsa_seller_verifications (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid null references public.businesses(id) on delete set null,
  trader_status text not null default 'consumer' check (trader_status in ('consumer', 'business')),
  legal_name text not null default '',
  contact_email text not null default '',
  country_code text not null default '',
  registered_address text null,
  registration_number text null,
  vat_or_tax_id text null,
  status text not null default 'pending' check (status in ('not_required', 'pending', 'verified', 'rejected')),
  rejection_reason text null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id)
);

create table if not exists public.dsa_notices (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid null references auth.users(id) on delete set null,
  listing_id uuid null references public.listings(id) on delete set null,
  notice_type text not null default 'illegal_product' check (notice_type in ('illegal_product', 'illegal_content', 'ip_infringement', 'consumer_safety', 'other')),
  reason text not null,
  description text not null,
  legal_basis text null,
  content_url text null,
  status text not null default 'received' check (status in ('received', 'under_review', 'action_taken', 'rejected', 'closed')),
  decision text null,
  decided_at timestamptz null,
  decided_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses
  add column if not exists country_code text,
  add column if not exists trader_status text default 'consumer',
  add column if not exists dsa_verification_status text default 'not_required';

alter table public.listings
  add column if not exists dsa_notice_status text default 'none',
  add column if not exists dsa_seller_verification_status text default 'unknown';

alter table public.reports
  add column if not exists dsa_notice_id uuid null references public.dsa_notices(id) on delete set null,
  add column if not exists report_type text default 'general';

create index if not exists dsa_seller_verifications_seller_status_idx
  on public.dsa_seller_verifications (seller_id, status);

create index if not exists dsa_notices_listing_status_idx
  on public.dsa_notices (listing_id, status, created_at desc);

create index if not exists dsa_notices_reporter_created_idx
  on public.dsa_notices (reporter_id, created_at desc);

alter table public.dsa_seller_verifications enable row level security;
alter table public.dsa_notices enable row level security;

create policy "Sellers can read their DSA verification"
  on public.dsa_seller_verifications
  for select
  to authenticated
  using ((select auth.uid()) = seller_id);

create policy "Public can read seller traceability fields"
  on public.dsa_seller_verifications
  for select
  to anon, authenticated
  using (status in ('pending', 'verified', 'not_required'));

create policy "Sellers can submit their DSA verification"
  on public.dsa_seller_verifications
  for insert
  to authenticated
  with check ((select auth.uid()) = seller_id);

create policy "Sellers can update their pending DSA verification"
  on public.dsa_seller_verifications
  for update
  to authenticated
  using ((select auth.uid()) = seller_id and status in ('pending', 'rejected', 'not_required'))
  with check ((select auth.uid()) = seller_id);

create policy "Reporters can read their DSA notices"
  on public.dsa_notices
  for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

create policy "Authenticated users can submit DSA notices"
  on public.dsa_notices
  for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

grant select, insert, update on public.dsa_seller_verifications to authenticated;
grant select on public.dsa_seller_verifications to anon;
grant select, insert on public.dsa_notices to authenticated;
