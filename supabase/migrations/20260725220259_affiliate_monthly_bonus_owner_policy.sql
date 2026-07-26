drop policy if exists affiliate_monthly_bonus_owner_select
on public.affiliate_monthly_bonus_awards;

create policy affiliate_monthly_bonus_owner_select
on public.affiliate_monthly_bonus_awards
for select
to authenticated
using (
  exists (
    select 1
    from public.affiliate_accounts a
    where a.id = affiliate_monthly_bonus_awards.affiliate_account_id
      and a.user_id = (select auth.uid())
  )
);

grant select on public.affiliate_monthly_bonus_awards to authenticated;
