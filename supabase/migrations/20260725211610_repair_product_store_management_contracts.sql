alter table public.apps
  add column if not exists price numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'apps_price_nonnegative'
      and conrelid = 'public.apps'::regclass
  ) then
    alter table public.apps
      add constraint apps_price_nonnegative check (price >= 0);
  end if;
end
$$;

alter table public.business_terms enable row level security;

drop policy if exists "Business members can manage terms" on public.business_terms;
create policy "Business members can manage terms"
on public.business_terms
for all
to authenticated
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_terms.business_id
      and businesses.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.team_members
    where team_members.business_id = business_terms.business_id
      and team_members.user_id = (select auth.uid())
      and lower(coalesce(team_members.role, '')) in ('owner', 'admin', 'manager', 'editor')
      and lower(coalesce(team_members.status, '')) in ('active', 'accepted', 'joined')
  )
)
with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_terms.business_id
      and businesses.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.team_members
    where team_members.business_id = business_terms.business_id
      and team_members.user_id = (select auth.uid())
      and lower(coalesce(team_members.role, '')) in ('owner', 'admin', 'manager', 'editor')
      and lower(coalesce(team_members.status, '')) in ('active', 'accepted', 'joined')
  )
);

drop policy if exists "Apps can be updated by developer" on public.apps;
create policy "Apps can be updated by developer"
on public.apps
for update
to authenticated
using ((select auth.uid()) = developer_id)
with check ((select auth.uid()) = developer_id);

revoke all on table public.business_terms from anon;
grant select, insert, update, delete on table public.business_terms to authenticated;

revoke all on table public.apps from anon;
grant select on table public.apps to anon;
grant select, insert, update, delete on table public.apps to authenticated;

revoke all on table public.app_versions from anon;
grant select on table public.app_versions to anon;
grant select, insert, update, delete on table public.app_versions to authenticated;

revoke all on table public.forms from anon;
grant select on table public.forms to anon;
grant select, insert, update, delete on table public.forms to authenticated;

revoke all on table public.form_submissions from anon;
grant insert on table public.form_submissions to anon;
grant select, insert on table public.form_submissions to authenticated;

revoke all on table public.websites from anon;
grant select, insert, update, delete on table public.websites to authenticated;

revoke all on table public.website_sections from anon;
grant select, insert, update, delete on table public.website_sections to authenticated;

revoke all on table public.plans from anon;
grant select on table public.plans to anon;
grant select, insert, update, delete on table public.plans to authenticated;
