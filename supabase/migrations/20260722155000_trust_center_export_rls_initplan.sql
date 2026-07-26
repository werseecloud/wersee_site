alter policy "Users can create their own exports"
  on public.user_data_exports
  with check ((select auth.uid()) = user_id);

alter policy "Users can view their own exports"
  on public.user_data_exports
  using ((select auth.uid()) = user_id);
