alter table public.ads_campaigns
  add column if not exists updated_at timestamptz not null default now();
