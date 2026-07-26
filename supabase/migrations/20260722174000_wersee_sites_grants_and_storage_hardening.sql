-- Wersee Sites follow-up hardening.
-- Supabase's default privileges grant new public-schema objects to API roles.
-- Replace them with an explicit least-privilege matrix and ensure an older
-- global Storage policy cannot bypass the private Sites bucket policies.

drop policy if exists "Allow Public Access to All Buckets" on storage.objects;
create policy "Allow Public Access to All Buckets" on storage.objects
for select to public
using (bucket_id not in ('site-upload-staging','site-preview-assets','site-icons'));

-- Public buckets serve object URLs without an objects SELECT policy. Removing
-- this policy prevents bucket listing while site icon URLs remain public.
drop policy if exists site_icons_public_read on storage.objects;

revoke all on public.sites, public.site_reserved_slugs, public.site_slug_claims,
  public.site_uploads, public.site_releases, public.site_release_files,
  public.site_deployment_jobs, public.site_audit_logs, public.site_analytics_events,
  public.site_analytics_daily, public.site_analytics_visitor_days,
  public.site_analytics_top_pages_daily, public.site_analytics_dimensions_daily,
  public.site_rate_limits from anon, authenticated;

grant select, update, delete on public.sites to authenticated;
grant select on public.site_slug_claims, public.site_uploads, public.site_releases,
  public.site_release_files, public.site_deployment_jobs, public.site_audit_logs,
  public.site_analytics_events, public.site_analytics_daily,
  public.site_analytics_top_pages_daily, public.site_analytics_dimensions_daily to authenticated;
grant update on public.site_uploads to authenticated;

grant all on public.sites, public.site_reserved_slugs, public.site_slug_claims,
  public.site_uploads, public.site_releases, public.site_release_files,
  public.site_deployment_jobs, public.site_audit_logs, public.site_analytics_events,
  public.site_analytics_daily, public.site_analytics_visitor_days,
  public.site_analytics_top_pages_daily, public.site_analytics_dimensions_daily,
  public.site_rate_limits to service_role;

revoke all on function public.site_slug_available(text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.create_site(uuid,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.reserve_site_slug(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.commit_site_slug(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.release_pending_site_slug(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.create_site_release(uuid,uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.begin_site_publish(uuid,uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.complete_site_publish(uuid,text,text) from public, anon, authenticated, service_role;
revoke all on function public.fail_site_publish(uuid,text,text) from public, anon, authenticated, service_role;
revoke all on function public.complete_site_rollback(uuid,uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.check_site_rate_limit(text,text,integer,integer) from public, anon, authenticated, service_role;
revoke all on function public.ingest_site_analytics_event(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.count_site_unique_visitors(uuid,date,date) from public, anon, authenticated, service_role;

grant execute on function public.site_slug_available(text,uuid) to authenticated, service_role;
grant execute on function public.create_site(uuid,text,text,text,text) to authenticated;
grant execute on function public.reserve_site_slug(uuid,text) to authenticated;
grant execute on function public.commit_site_slug(uuid,text) to authenticated;
grant execute on function public.release_pending_site_slug(uuid,text) to authenticated;
grant execute on function public.create_site_release(uuid,uuid,text) to authenticated;
grant execute on function public.begin_site_publish(uuid,uuid,text) to authenticated;
grant execute on function public.complete_site_publish(uuid,text,text) to service_role;
grant execute on function public.fail_site_publish(uuid,text,text) to service_role;
grant execute on function public.complete_site_rollback(uuid,uuid,uuid) to service_role;
grant execute on function public.check_site_rate_limit(text,text,integer,integer) to service_role;
grant execute on function public.ingest_site_analytics_event(jsonb) to service_role;
grant execute on function public.count_site_unique_visitors(uuid,date,date) to service_role;

revoke all on function private.can_manage_business(uuid) from public, anon, authenticated, service_role;
grant execute on function private.can_manage_business(uuid) to authenticated, service_role;
revoke all on function private.can_access_site_storage(text) from public, anon, authenticated, service_role;
grant execute on function private.can_access_site_storage(text) to authenticated, service_role;

create index site_daily_release_idx on public.site_analytics_daily (release_id) where release_id is not null;
create index site_dimensions_release_idx on public.site_analytics_dimensions_daily (release_id) where release_id is not null;
create index site_pages_release_idx on public.site_analytics_top_pages_daily (release_id) where release_id is not null;
create index site_audit_actor_idx on public.site_audit_logs (actor_id) where actor_id is not null;
create index site_jobs_creator_idx on public.site_deployment_jobs (created_by);
create index site_releases_creator_idx on public.site_releases (created_by);
create index site_reserved_creator_idx on public.site_reserved_slugs (created_by) where created_by is not null;
create index site_claims_creator_idx on public.site_slug_claims (created_by);
create index site_uploads_owner_idx on public.site_uploads (owner_id);
create index site_uploads_release_idx on public.site_uploads (release_id) where release_id is not null;
create index site_uploads_site_idx on public.site_uploads (site_id);
create index sites_active_release_idx on public.sites (active_release_id) where active_release_id is not null;
create index sites_created_by_idx on public.sites (created_by);
create index sites_updated_by_idx on public.sites (updated_by) where updated_by is not null;
