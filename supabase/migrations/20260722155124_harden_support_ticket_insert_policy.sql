drop policy if exists "Anyone can create a ticket" on public.support_tickets;
drop policy if exists "Visitors can create valid support tickets" on public.support_tickets;
create policy "Visitors can create valid support tickets"
  on public.support_tickets
  for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and char_length(btrim(email)) between 3 and 320
    and char_length(btrim(type)) between 1 and 120
    and char_length(btrim(description)) between 1 and 10000
    and status = 'open'
    and priority in ('low', 'medium', 'high', 'urgent')
    and (
      business_id is null
      or exists (
        select 1
        from public.businesses business
        where business.id = support_tickets.business_id
      )
    )
  );
