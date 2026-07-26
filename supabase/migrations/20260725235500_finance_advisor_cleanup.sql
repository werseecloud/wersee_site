drop policy if exists "Users insert own finance preferences" on public.finance_preferences;
create policy "Users insert own finance preferences"
  on public.finance_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own finance preferences" on public.finance_preferences;
create policy "Users update own finance preferences"
  on public.finance_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant insert, update on public.finance_preferences to authenticated;

alter function public.complete_finance_onboarding(text, text, text) security invoker;

create index if not exists points_ledger_wallet_idx
  on public.points_ledger(wallet_id);
create index if not exists finance_payout_requests_recipient_idx
  on public.finance_payout_requests(recipient_id)
  where recipient_id is not null;

create index if not exists points_activity_user_time_idx
  on public.points_activity(user_id, created_at desc);

drop policy if exists "Users read own points activity" on public.points_activity;
create policy "Users read own points activity"
  on public.points_activity for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.points_activity to authenticated;
