drop policy if exists ads_analytics_owner_select on public.ads_analytics;
create policy ads_analytics_owner_select
on public.ads_analytics
for select
to authenticated
using (
  exists (
    select 1
    from public.ads_campaigns c
    where c.id = ads_analytics.campaign_id
      and c.user_id = (select auth.uid())
  )
);

grant select on public.ads_analytics to authenticated;
