-- Keep availability checks behind the authenticated Wersee server endpoint.
revoke all on function public.site_slug_available(text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.site_slug_available(text,uuid) to service_role;

-- Supabase's Data API and database advisor work best with a stable primary key
-- even though the aggregate tables also retain their null-safe natural keys.
alter table public.site_analytics_daily
  add column id bigint generated always as identity primary key;
alter table public.site_analytics_top_pages_daily
  add column id bigint generated always as identity primary key;
alter table public.site_analytics_dimensions_daily
  add column id bigint generated always as identity primary key;
