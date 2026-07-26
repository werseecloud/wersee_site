alter table public.sites
  add column if not exists marketplace_listing_id uuid references public.listings(id) on delete set null,
  add column if not exists marketplace_published_at timestamptz;

create unique index if not exists sites_marketplace_listing_unique
  on public.sites (marketplace_listing_id)
  where marketplace_listing_id is not null;

create index if not exists sites_marketplace_published_idx
  on public.sites (marketplace_published_at desc)
  where marketplace_listing_id is not null and deleted_at is null;
