create table if not exists public.store_health_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_url text not null,
  strategy text not null check (strategy in ('mobile', 'desktop')),
  total_score integer not null check (total_score between 0 and 100),
  performance_score integer not null check (performance_score between 0 and 100),
  accessibility_score integer not null check (accessibility_score between 0 and 100),
  seo_score integer not null check (seo_score between 0 and 100),
  best_practices_score integer not null check (best_practices_score between 0 and 100),
  opportunities jsonb not null default '[]'::jsonb,
  diagnostics jsonb not null default '{}'::jsonb,
  category_details jsonb not null default '{}'::jsonb,
  raw_summary jsonb not null default '{}'::jsonb,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.store_health_scans
  add column if not exists category_details jsonb not null default '{}'::jsonb,
  add column if not exists raw_summary jsonb not null default '{}'::jsonb;

create index if not exists store_health_scans_business_scanned_at_idx
  on public.store_health_scans (business_id, scanned_at desc);

create index if not exists store_health_scans_user_scanned_at_idx
  on public.store_health_scans (user_id, scanned_at desc);

alter table public.store_health_scans enable row level security;

drop policy if exists "Store owners can read health scans" on public.store_health_scans;
drop policy if exists "Store owners can view health scans" on public.store_health_scans;
drop policy if exists "Store owners can insert health scans" on public.store_health_scans;

create policy "Store owners can view health scans"
  on public.store_health_scans
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.businesses b
      where b.id = store_health_scans.business_id
        and b.user_id = auth.uid()
    )
  );

create policy "Store owners can insert health scans"
  on public.store_health_scans
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.businesses b
      where b.id = store_health_scans.business_id
        and b.user_id = auth.uid()
    )
  );

grant select, insert on public.store_health_scans to authenticated;
