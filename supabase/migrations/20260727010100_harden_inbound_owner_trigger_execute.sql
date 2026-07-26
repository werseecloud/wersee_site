revoke all on function public.mail_bridge_assign_inbound_owner()
  from public, anon, authenticated;

grant execute on function public.mail_bridge_assign_inbound_owner()
  to service_role;
