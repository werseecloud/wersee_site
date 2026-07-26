create index if not exists site_integrations_quick_pay_link_id_idx
  on public.site_integrations(quick_pay_link_id);

drop policy if exists site_integrations_managers_insert on public.site_integrations;
create policy site_integrations_managers_insert
  on public.site_integrations
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1
      from public.sites s
      where s.id = site_integrations.site_id
        and private.can_manage_business(s.business_id)
    )
  );
