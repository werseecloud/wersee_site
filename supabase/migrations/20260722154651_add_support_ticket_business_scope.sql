alter table public.support_tickets
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

create index if not exists support_tickets_business_created_idx
  on public.support_tickets (business_id, created_at desc)
  where business_id is not null;

drop policy if exists "Users can view their own tickets" on public.support_tickets;
drop policy if exists "Business members can view support tickets" on public.support_tickets;
drop policy if exists "Users and business members can view support tickets" on public.support_tickets;
create policy "Users and business members can view support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or email = (select email from auth.users where id = (select auth.uid()))
    or (
      business_id is not null
      and exists (
        select 1
        from public.businesses business
        where business.id = support_tickets.business_id
          and (
            business.user_id = (select auth.uid())
            or exists (
              select 1
              from public.team_members member
              where member.business_id = business.id
                and member.user_id = (select auth.uid())
            )
          )
      )
    )
  );
