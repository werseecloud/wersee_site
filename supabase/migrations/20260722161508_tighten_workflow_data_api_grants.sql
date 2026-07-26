-- Supabase projects can have broad default privileges on newly-created public
-- tables. Reset them before granting the exact workflow Data API surface.
revoke all privileges on table
  public.workflows,
  public.workflow_versions,
  public.workflow_connections,
  public.workflow_runs,
  public.workflow_run_steps,
  public.workflow_approvals,
  public.workflow_usage_events,
  public.workflow_templates
from public, anon, authenticated;

grant select, insert, update, delete on public.workflows to authenticated;
grant select, insert on public.workflow_versions to authenticated;
grant select, insert, update, delete on public.workflow_connections to authenticated;
grant select on table
  public.workflow_runs,
  public.workflow_run_steps,
  public.workflow_approvals,
  public.workflow_usage_events,
  public.workflow_templates
to authenticated;

grant all privileges on table
  public.workflows,
  public.workflow_versions,
  public.workflow_connections,
  public.workflow_runs,
  public.workflow_run_steps,
  public.workflow_approvals,
  public.workflow_usage_events,
  public.workflow_templates
to service_role;

notify pgrst, 'reload schema';
