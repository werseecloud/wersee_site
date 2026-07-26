create index if not exists site_analytics_metrics_release_idx
  on public.site_analytics_metrics_daily(release_id);

create index if not exists site_indexing_submissions_release_idx
  on public.site_indexing_submissions(release_id);
