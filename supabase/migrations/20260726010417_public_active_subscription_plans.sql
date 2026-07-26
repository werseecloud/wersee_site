-- Public subscription checkout pages may read plan records, but customer
-- subscription instances must remain owner/subscriber scoped.
drop policy if exists "Public can view active subscription plans"
  on public.subscriptions;

create policy "Public can view active subscription plans"
on public.subscriptions
for select
to anon, authenticated
using (
  active = true
  and username is not null
  and slug is not null
  and buyer_id is null
  and user_id is null
);
