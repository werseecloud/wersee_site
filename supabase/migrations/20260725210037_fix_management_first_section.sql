-- Keep every business reachable through the public team portal.
create or replace function public.ensure_business_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base_slug text;
begin
  if nullif(trim(new.slug), '') is not null then
    new.slug := lower(trim(both '-' from regexp_replace(new.slug, '[^a-zA-Z0-9]+', '-', 'g')));
    return new;
  end if;

  base_slug := lower(trim(both '-' from regexp_replace(coalesce(new.name, 'business'), '[^a-zA-Z0-9]+', '-', 'g')));
  if base_slug = '' then
    base_slug := 'business';
  end if;
  new.slug := base_slug || '-' || left(replace(new.id::text, '-', ''), 8);
  return new;
end;
$$;

drop trigger if exists ensure_business_slug_before_write on public.businesses;
create trigger ensure_business_slug_before_write
before insert or update of name, slug on public.businesses
for each row execute function public.ensure_business_slug();

update public.businesses
set slug = null
where nullif(trim(slug), '') is null;

alter table public.team_tasks
  add column if not exists priority text not null default 'medium',
  add column if not exists deadline timestamptz,
  add column if not exists category text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.team_tasks'::regclass
      and conname = 'team_tasks_priority_check'
  ) then
    alter table public.team_tasks
      add constraint team_tasks_priority_check
      check (priority in ('low', 'medium', 'high'));
  end if;
end;
$$;

create index if not exists team_tasks_team_created_at_idx
  on public.team_tasks (team_id, created_at desc);
create index if not exists team_tasks_assigned_to_idx
  on public.team_tasks (assigned_to)
  where assigned_to is not null;

drop policy if exists "Team members can view tasks" on public.team_tasks;
drop policy if exists "Team members can create tasks" on public.team_tasks;
drop policy if exists "Team members can update tasks" on public.team_tasks;
drop policy if exists "Team members can delete tasks" on public.team_tasks;

create policy "Team members can view tasks"
on public.team_tasks for select
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can create tasks"
on public.team_tasks for insert
to authenticated
with check (
  (public.is_team_member(team_id) or public.is_team_owner(team_id))
  and (created_by is null or created_by = (select auth.uid()))
);

create policy "Team members can update tasks"
on public.team_tasks for update
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id))
with check (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can delete tasks"
on public.team_tasks for delete
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

drop policy if exists "Team members can manage wiki articles" on public.wiki_articles;
drop policy if exists "Team members can view wiki articles" on public.wiki_articles;
drop policy if exists "Team members can create wiki articles" on public.wiki_articles;
drop policy if exists "Team members can update wiki articles" on public.wiki_articles;
drop policy if exists "Team members can delete wiki articles" on public.wiki_articles;

create policy "Team members can view wiki articles"
on public.wiki_articles for select
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can create wiki articles"
on public.wiki_articles for insert
to authenticated
with check (
  (public.is_team_member(team_id) or public.is_team_owner(team_id))
  and (created_by is null or created_by = (select auth.uid()))
);

create policy "Team members can update wiki articles"
on public.wiki_articles for update
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id))
with check (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can delete wiki articles"
on public.wiki_articles for delete
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

drop policy if exists "Team members can manage wiki categories" on public.wiki_categories;
drop policy if exists "Team members can view wiki categories" on public.wiki_categories;
drop policy if exists "Team members can create wiki categories" on public.wiki_categories;
drop policy if exists "Team members can update wiki categories" on public.wiki_categories;
drop policy if exists "Team members can delete wiki categories" on public.wiki_categories;

create policy "Team members can view wiki categories"
on public.wiki_categories for select
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can create wiki categories"
on public.wiki_categories for insert
to authenticated
with check (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can update wiki categories"
on public.wiki_categories for update
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id))
with check (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "Team members can delete wiki categories"
on public.wiki_categories for delete
to authenticated
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

grant select, insert, update, delete on public.team_tasks to authenticated;
grant select, insert, update, delete on public.wiki_articles to authenticated;
grant select, insert, update, delete on public.wiki_categories to authenticated;
