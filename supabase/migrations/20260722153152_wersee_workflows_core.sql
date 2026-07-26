-- Wersee Workflows: durable, versioned workflow definitions, execution queue,
-- step logs, approvals, encrypted connections, templates and scheduled worker.

create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'disabled', 'error', 'archived')),
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual', 'purchase', 'payment_failed', 'message', 'schedule', 'webhook', 'form_submission', 'file_uploaded', 'member_joined')),
  trigger_config jsonb not null default '{}'::jsonb,
  draft_definition jsonb not null default '{"schemaVersion":1,"nodes":[],"edges":[]}'::jsonb,
  settings jsonb not null default '{"deduplicate":true,"testMode":true,"errorNotifications":true,"maxSteps":100,"timeoutSeconds":240}'::jsonb,
  current_version_id uuid,
  published_version_id uuid,
  webhook_token_hash text,
  next_run_at timestamptz,
  last_run_at timestamptz,
  run_count bigint not null default 0 check (run_count >= 0),
  success_count bigint not null default 0 check (success_count >= 0),
  failure_count bigint not null default 0 check (failure_count >= 0),
  ai_actions_count bigint not null default 0 check (ai_actions_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint workflows_definition_is_object check (jsonb_typeof(draft_definition) = 'object'),
  constraint workflows_trigger_config_is_object check (jsonb_typeof(trigger_config) = 'object'),
  constraint workflows_settings_is_object check (jsonb_typeof(settings) = 'object')
);

create table public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  definition jsonb not null,
  change_summary text not null default 'Saved workflow version' check (char_length(change_summary) <= 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint workflow_versions_definition_is_object check (jsonb_typeof(definition) = 'object'),
  unique (workflow_id, version_number)
);

alter table public.workflows
  add constraint workflows_current_version_fk foreign key (current_version_id)
    references public.workflow_versions(id) on delete set null,
  add constraint workflows_published_version_fk foreign key (published_version_id)
    references public.workflow_versions(id) on delete set null;

create table public.workflow_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (char_length(provider) between 2 and 80),
  name text not null check (char_length(name) between 2 and 160),
  status text not null default 'not_connected'
    check (status in ('not_connected', 'connecting', 'connected', 'needs_attention', 'expired')),
  transport text not null default 'https'
    check (transport in ('https', 'streamable_http', 'sse', 'oauth')),
  base_url text,
  vault_secret_id uuid,
  discovered_tools jsonb not null default '[]'::jsonb,
  scopes text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_connections_tools_is_array check (jsonb_typeof(discovered_tools) = 'array'),
  constraint workflow_connections_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_id uuid references public.workflow_versions(id) on delete set null,
  initiated_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'waiting', 'waiting_approval', 'succeeded', 'failed', 'cancelled')),
  trigger_type text not null,
  test_mode boolean not null default false,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  execution_context jsonb not null default '{}'::jsonb,
  public_error text,
  internal_error text,
  current_node_id text,
  idempotency_key text,
  ai_actions_used integer not null default 0 check (ai_actions_used >= 0),
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  resume_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  constraint workflow_runs_input_is_object check (jsonb_typeof(input) = 'object'),
  constraint workflow_runs_output_is_object check (jsonb_typeof(output) = 'object'),
  constraint workflow_runs_context_is_object check (jsonb_typeof(execution_context) = 'object')
);

create unique index workflow_runs_idempotency_idx
  on public.workflow_runs (workflow_id, idempotency_key)
  where idempotency_key is not null;

create table public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  node_id text not null,
  node_type text not null,
  node_title text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'waiting', 'succeeded', 'failed', 'skipped')),
  attempt integer not null default 1 check (attempt between 1 and 20),
  input_preview jsonb not null default '{}'::jsonb,
  output_preview jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  constraint workflow_run_steps_input_is_object check (jsonb_typeof(input_preview) = 'object'),
  constraint workflow_run_steps_output_is_object check (jsonb_typeof(output_preview) = 'object')
);

create table public.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_id uuid not null references public.workflow_run_steps(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  title text not null,
  description text not null default '',
  preview jsonb not null default '{}'::jsonb,
  decision_note text,
  decided_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint workflow_approvals_preview_is_object check (jsonb_typeof(preview) = 'object')
);

create table public.workflow_usage_events (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  run_id uuid references public.workflow_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  event_type text not null check (event_type in ('run', 'step', 'ai_action', 'email', 'http_request', 'mcp_tool')),
  quantity numeric(14,4) not null default 1 check (quantity >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint workflow_usage_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  category text not null,
  icon text not null default 'sparkles',
  setup_minutes integer not null default 2 check (setup_minutes between 1 and 120),
  required_connections text[] not null default '{}'::text[],
  apps text[] not null default '{}'::text[],
  definition jsonb not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_templates_definition_is_object check (jsonb_typeof(definition) = 'object')
);

create table private.workflow_runtime_config (
  singleton boolean primary key default true check (singleton),
  worker_token_hash text not null,
  worker_vault_secret_id uuid not null,
  engine_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workflows_owner_updated_idx on public.workflows (owner_id, updated_at desc);
create index workflows_business_status_idx on public.workflows (business_id, status, updated_at desc);
create index workflows_schedule_due_idx on public.workflows (next_run_at) where status = 'active' and trigger_type = 'schedule';
create index workflows_current_version_idx on public.workflows (current_version_id) where current_version_id is not null;
create index workflows_published_version_idx on public.workflows (published_version_id) where published_version_id is not null;
create index workflow_versions_workflow_created_idx on public.workflow_versions (workflow_id, created_at desc);
create index workflow_versions_created_by_idx on public.workflow_versions (created_by) where created_by is not null;
create index workflow_connections_business_idx on public.workflow_connections (business_id, provider, status);
create index workflow_connections_user_idx on public.workflow_connections (user_id, provider, status);
create index workflow_runs_workflow_created_idx on public.workflow_runs (workflow_id, created_at desc);
create index workflow_runs_version_idx on public.workflow_runs (version_id) where version_id is not null;
create index workflow_runs_initiated_by_idx on public.workflow_runs (initiated_by) where initiated_by is not null;
create index workflow_runs_queue_idx on public.workflow_runs (status, resume_at, queued_at)
  where status in ('queued', 'waiting');
create index workflow_run_steps_run_created_idx on public.workflow_run_steps (run_id, created_at);
create index workflow_run_steps_workflow_idx on public.workflow_run_steps (workflow_id, created_at);
create index workflow_approvals_pending_idx on public.workflow_approvals (assigned_to, created_at desc) where status = 'pending';
create index workflow_approvals_workflow_idx on public.workflow_approvals (workflow_id, created_at desc);
create index workflow_approvals_run_idx on public.workflow_approvals (run_id);
create index workflow_approvals_step_idx on public.workflow_approvals (step_id) where step_id is not null;
create index workflow_approvals_requested_by_idx on public.workflow_approvals (requested_by) where requested_by is not null;
create index workflow_approvals_decided_by_idx on public.workflow_approvals (decided_by) where decided_by is not null;
create index workflow_usage_business_created_idx on public.workflow_usage_events (business_id, created_at desc);
create index workflow_usage_workflow_idx on public.workflow_usage_events (workflow_id, created_at desc) where workflow_id is not null;
create index workflow_usage_run_idx on public.workflow_usage_events (run_id) where run_id is not null;
create index workflow_usage_user_idx on public.workflow_usage_events (user_id, created_at desc) where user_id is not null;

create or replace function private.workflow_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workflows_set_updated_at
before update on public.workflows
for each row execute function private.workflow_set_updated_at();

create trigger workflow_connections_set_updated_at
before update on public.workflow_connections
for each row execute function private.workflow_set_updated_at();

create trigger workflow_templates_set_updated_at
before update on public.workflow_templates
for each row execute function private.workflow_set_updated_at();

create or replace function private.workflow_can_access_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_business_id is not null and (
    exists (
      select 1 from public.businesses b
      where b.id = p_business_id and b.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.team_members tm
      where tm.business_id = p_business_id
        and tm.user_id = (select auth.uid())
        and coalesce(tm.status, 'active') in ('active', 'accepted', 'joined')
    )
  );
$$;

create or replace function private.workflow_can_manage_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_business_id is not null and (
    exists (
      select 1 from public.businesses b
      where b.id = p_business_id and b.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.team_members tm
      where tm.business_id = p_business_id
        and tm.user_id = (select auth.uid())
        and coalesce(tm.status, 'active') in ('active', 'accepted', 'joined')
        and lower(coalesce(tm.role, 'member')) in ('owner', 'admin', 'manager', 'editor')
    )
  );
$$;

create or replace function private.workflow_can_access_workflow(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workflows w
    where w.id = p_workflow_id
      and (
        w.owner_id = (select auth.uid())
        or private.workflow_can_access_business(w.business_id)
      )
  );
$$;

create or replace function private.workflow_can_manage_workflow(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workflows w
    where w.id = p_workflow_id
      and (
        w.owner_id = (select auth.uid())
        or private.workflow_can_manage_business(w.business_id)
      )
  );
$$;

revoke all on function private.workflow_can_access_business(uuid) from public, anon;
revoke all on function private.workflow_can_manage_business(uuid) from public, anon;
revoke all on function private.workflow_can_access_workflow(uuid) from public, anon;
revoke all on function private.workflow_can_manage_workflow(uuid) from public, anon;
grant execute on function private.workflow_can_access_business(uuid) to authenticated, service_role;
grant execute on function private.workflow_can_manage_business(uuid) to authenticated, service_role;
grant execute on function private.workflow_can_access_workflow(uuid) to authenticated, service_role;
grant execute on function private.workflow_can_manage_workflow(uuid) to authenticated, service_role;

alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.workflow_connections enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_run_steps enable row level security;
alter table public.workflow_approvals enable row level security;
alter table public.workflow_usage_events enable row level security;
alter table public.workflow_templates enable row level security;

create policy workflows_select on public.workflows for select to authenticated
using (owner_id = (select auth.uid()) or private.workflow_can_access_business(business_id));

create policy workflows_insert on public.workflows for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (business_id is null or private.workflow_can_manage_business(business_id))
);

create policy workflows_update on public.workflows for update to authenticated
using (owner_id = (select auth.uid()) or private.workflow_can_manage_business(business_id))
with check (owner_id = (select auth.uid()) or private.workflow_can_manage_business(business_id));

create policy workflows_delete on public.workflows for delete to authenticated
using (owner_id = (select auth.uid()) or private.workflow_can_manage_business(business_id));

create policy workflow_versions_select on public.workflow_versions for select to authenticated
using (private.workflow_can_access_workflow(workflow_id));

create policy workflow_versions_insert on public.workflow_versions for insert to authenticated
with check (created_by = (select auth.uid()) and private.workflow_can_manage_workflow(workflow_id));

create policy workflow_connections_select on public.workflow_connections for select to authenticated
using (user_id = (select auth.uid()) or private.workflow_can_access_business(business_id));

create policy workflow_connections_insert on public.workflow_connections for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (business_id is null or private.workflow_can_manage_business(business_id))
);

create policy workflow_connections_update on public.workflow_connections for update to authenticated
using (user_id = (select auth.uid()) or private.workflow_can_manage_business(business_id))
with check (user_id = (select auth.uid()) or private.workflow_can_manage_business(business_id));

create policy workflow_connections_delete on public.workflow_connections for delete to authenticated
using (user_id = (select auth.uid()) or private.workflow_can_manage_business(business_id));

create policy workflow_runs_select on public.workflow_runs for select to authenticated
using (private.workflow_can_access_workflow(workflow_id));

create policy workflow_run_steps_select on public.workflow_run_steps for select to authenticated
using (private.workflow_can_access_workflow(workflow_id));

create policy workflow_approvals_select on public.workflow_approvals for select to authenticated
using (private.workflow_can_access_workflow(workflow_id));

create policy workflow_usage_select on public.workflow_usage_events for select to authenticated
using (private.workflow_can_access_workflow(workflow_id));

create policy workflow_templates_select on public.workflow_templates for select to authenticated
using (is_public);

grant select, insert, update, delete on public.workflows to authenticated;
grant select, insert on public.workflow_versions to authenticated;
grant select, insert, update, delete on public.workflow_connections to authenticated;
grant select on public.workflow_runs, public.workflow_run_steps, public.workflow_approvals,
  public.workflow_usage_events, public.workflow_templates to authenticated;

create or replace function public.store_workflow_connection_secret(
  p_connection_id uuid,
  p_value text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
begin
  if p_value is null or char_length(p_value) < 1 or char_length(p_value) > 20000 then
    raise exception 'INVALID_SECRET_VALUE';
  end if;

  select c.vault_secret_id into v_secret_id
  from public.workflow_connections c
  where c.id = p_connection_id
  for update;

  if not found then
    raise exception 'WORKFLOW_CONNECTION_NOT_FOUND';
  end if;

  if v_secret_id is null then
    select vault.create_secret(
      p_value,
      'workflow_connection_' || p_connection_id::text,
      'Encrypted credential for a Wersee Workflow connection'
    ) into v_secret_id;

    update public.workflow_connections
    set vault_secret_id = v_secret_id, updated_at = now()
    where id = p_connection_id;
  else
    perform vault.update_secret(v_secret_id, p_value);
  end if;

  return v_secret_id;
end;
$$;

create or replace function public.read_workflow_connection_secret(p_connection_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ds.decrypted_secret
  from public.workflow_connections c
  join vault.decrypted_secrets ds on ds.id = c.vault_secret_id
  where c.id = p_connection_id;
$$;

create or replace function public.delete_workflow_connection_secret(p_connection_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
begin
  select c.vault_secret_id into v_secret_id
  from public.workflow_connections c
  where c.id = p_connection_id
  for update;

  if not found then return false; end if;
  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;

  update public.workflow_connections
  set vault_secret_id = null, updated_at = now()
  where id = p_connection_id;
  return true;
end;
$$;

revoke all on function public.store_workflow_connection_secret(uuid, text) from public, anon, authenticated;
revoke all on function public.read_workflow_connection_secret(uuid) from public, anon, authenticated;
revoke all on function public.delete_workflow_connection_secret(uuid) from public, anon, authenticated;
grant execute on function public.store_workflow_connection_secret(uuid, text) to service_role;
grant execute on function public.read_workflow_connection_secret(uuid) to service_role;
grant execute on function public.delete_workflow_connection_secret(uuid) to service_role;

create or replace function public.verify_workflow_worker_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.workflow_runtime_config c
    where c.worker_token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
  );
$$;

revoke all on function public.verify_workflow_worker_token(text) from public, anon, authenticated;
grant execute on function public.verify_workflow_worker_token(text) to service_role;

create or replace function public.claim_workflow_runs(p_limit integer default 10)
returns setof public.workflow_runs
language sql
volatile
security definer
set search_path = ''
as $$
  with candidates as (
    select r.id
    from public.workflow_runs r
    where r.status = 'queued'
       or (r.status = 'waiting' and r.resume_at is not null and r.resume_at <= now())
    order by coalesce(r.resume_at, r.queued_at), r.queued_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
  )
  update public.workflow_runs r
  set status = 'running',
      started_at = coalesce(r.started_at, now()),
      resume_at = null
  from candidates c
  where r.id = c.id
  returning r.*;
$$;

create or replace function public.claim_due_workflow_schedules(p_limit integer default 25)
returns setof public.workflows
language sql
volatile
security definer
set search_path = ''
as $$
  with candidates as (
    select w.id
    from public.workflows w
    where w.status = 'active'
      and w.trigger_type = 'schedule'
      and w.published_version_id is not null
      and w.next_run_at is not null
      and w.next_run_at <= now()
    order by w.next_run_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
  )
  update public.workflows w
  set next_run_at = now() + interval '5 minutes'
  from candidates c
  where w.id = c.id
  returning w.*;
$$;

revoke all on function public.claim_workflow_runs(integer) from public, anon, authenticated;
revoke all on function public.claim_due_workflow_schedules(integer) from public, anon, authenticated;
grant execute on function public.claim_workflow_runs(integer) to service_role;
grant execute on function public.claim_due_workflow_schedules(integer) to service_role;

create or replace function public.complete_workflow_run(
  p_run_id uuid,
  p_status text,
  p_output jsonb default '{}'::jsonb,
  p_public_error text default null,
  p_internal_error text default null,
  p_ai_actions_used integer default 0,
  p_duration_ms integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workflow_id uuid;
begin
  if p_status not in ('succeeded', 'failed', 'cancelled') then
    raise exception 'INVALID_TERMINAL_STATUS';
  end if;

  update public.workflow_runs
  set status = p_status,
      output = coalesce(p_output, '{}'::jsonb),
      public_error = p_public_error,
      internal_error = p_internal_error,
      ai_actions_used = greatest(coalesce(p_ai_actions_used, 0), 0),
      duration_ms = p_duration_ms,
      finished_at = now(),
      resume_at = null
  where id = p_run_id
    and status not in ('succeeded', 'failed', 'cancelled')
  returning workflow_id into v_workflow_id;

  if v_workflow_id is null then raise exception 'WORKFLOW_RUN_NOT_FOUND_OR_ALREADY_COMPLETED'; end if;

  update public.workflows
  set last_run_at = now(),
      run_count = run_count + 1,
      success_count = success_count + case when p_status = 'succeeded' then 1 else 0 end,
      failure_count = failure_count + case when p_status = 'failed' then 1 else 0 end,
      ai_actions_count = ai_actions_count + greatest(coalesce(p_ai_actions_used, 0), 0),
      status = case when p_status = 'failed' and status = 'active' then status else status end
  where id = v_workflow_id;
end;
$$;

revoke all on function public.complete_workflow_run(uuid, text, jsonb, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.complete_workflow_run(uuid, text, jsonb, text, text, integer, integer) to service_role;

create or replace function public.enqueue_workflow_event(
  p_event_type text,
  p_user_id uuid,
  p_business_id uuid,
  p_payload jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.workflow_runs (
    workflow_id, version_id, initiated_by, status, trigger_type, input, idempotency_key
  )
  select w.id, w.published_version_id, p_user_id, 'queued', p_event_type,
         coalesce(p_payload, '{}'::jsonb),
         case when p_idempotency_key is null then null else p_idempotency_key || ':' || w.id::text end
  from public.workflows w
  where w.status = 'active'
    and w.trigger_type = p_event_type
    and w.published_version_id is not null
    and (w.owner_id = p_user_id or (p_business_id is not null and w.business_id = p_business_id))
  on conflict (workflow_id, idempotency_key) where idempotency_key is not null do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.enqueue_workflow_event(text, uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.enqueue_workflow_event(text, uuid, uuid, jsonb, text) to service_role;

create or replace function private.enqueue_order_workflow_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_was_paid boolean := false;
  v_is_paid boolean := false;
  v_was_failed boolean := false;
  v_is_failed boolean := false;
  v_product_title text;
  v_payload jsonb;
begin
  v_is_paid := coalesce(new.payment_status, new.status, '') in ('paid', 'succeeded', 'complete', 'completed')
    or coalesce(new.total_amount, new.amount, 0) = 0;
  v_is_failed := coalesce(new.payment_status, new.status, '') in ('failed', 'payment_failed', 'requires_payment_method');

  if tg_op = 'UPDATE' then
    v_was_paid := coalesce(old.payment_status, old.status, '') in ('paid', 'succeeded', 'complete', 'completed')
      or coalesce(old.total_amount, old.amount, 0) = 0;
    v_was_failed := coalesce(old.payment_status, old.status, '') in ('failed', 'payment_failed', 'requires_payment_method');
  end if;

  select l.title into v_product_title from public.listings l where l.id = new.listing_id;
  v_payload := jsonb_build_object(
    'order_id', new.id,
    'order_number', coalesce(new.public_order_code, new.id::text),
    'customer_email', coalesce(new.customer_email, new.buyer_email),
    'customer_name', coalesce(new.customer_details->>'name', new.customer_details->>'full_name'),
    'product_id', new.listing_id,
    'product_title', v_product_title,
    'purchase_amount', coalesce(new.total_amount, new.amount),
    'currency', coalesce(new.currency, new.buyer_currency, 'eur'),
    'payment_status', coalesce(new.payment_status, new.status),
    'occurred_at', coalesce(new.updated_at, new.created_at, now())
  );

  if v_is_paid and not v_was_paid then
    insert into public.workflow_runs (workflow_id, version_id, status, trigger_type, input, idempotency_key)
    select w.id, w.published_version_id, 'queued', 'purchase', v_payload, 'order:' || new.id::text || ':purchase'
    from public.workflows w
    left join public.businesses b on b.id = w.business_id
    where w.status = 'active'
      and w.trigger_type = 'purchase'
      and w.published_version_id is not null
      and (w.owner_id = new.seller_id or b.user_id = new.seller_id)
      and (coalesce(w.trigger_config->>'productId', '') = '' or w.trigger_config->>'productId' = new.listing_id::text)
    on conflict (workflow_id, idempotency_key) where idempotency_key is not null do nothing;
  end if;

  if v_is_failed and not v_was_failed then
    insert into public.workflow_runs (workflow_id, version_id, status, trigger_type, input, idempotency_key)
    select w.id, w.published_version_id, 'queued', 'payment_failed', v_payload, 'order:' || new.id::text || ':payment_failed'
    from public.workflows w
    left join public.businesses b on b.id = w.business_id
    where w.status = 'active'
      and w.trigger_type = 'payment_failed'
      and w.published_version_id is not null
      and (w.owner_id = new.seller_id or b.user_id = new.seller_id)
      and (coalesce(w.trigger_config->>'productId', '') = '' or w.trigger_config->>'productId' = new.listing_id::text)
    on conflict (workflow_id, idempotency_key) where idempotency_key is not null do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enqueue_workflow_events on public.orders;
create trigger orders_enqueue_workflow_events
after insert or update of status, payment_status on public.orders
for each row execute function private.enqueue_order_workflow_events();

insert into public.workflow_templates (
  slug, name, description, category, icon, setup_minutes, required_connections, apps, definition
)
values
(
  'welcome-new-customers',
  'Welcome new customers',
  'Send a warm, personalized welcome email immediately after a customer purchases a product.',
  'Sales', 'mail', 2, array['Email'], array['Wersee', 'Email'],
  '{"schemaVersion":1,"name":"Welcome new customers","summary":"When a customer purchases a product, send a welcome email.","trigger":{"type":"purchase","label":"A customer purchases a product","config":{}},"nodes":[{"id":"trigger","type":"trigger","title":"A customer purchases a product","config":{"event":"purchase"},"position":{"x":80,"y":140}},{"id":"email","type":"email","title":"Send a welcome email","config":{"to":"{{trigger.customer_email}}","subject":"Welcome to {{trigger.product_title}}","body":"Hi {{trigger.customer_name}},\n\nThank you for purchasing {{trigger.product_title}}. We are glad to have you here."},"position":{"x":420,"y":140}}],"edges":[{"id":"trigger-email","source":"trigger","target":"email"}],"requiredConnections":["email"],"dataAccess":["Customer name and email","Product and order information"],"estimatedUsage":{"emailsPerRun":1,"aiActionsPerRun":0}}'::jsonb
),
(
  'recover-failed-payments',
  'Recover failed payments',
  'Wait 24 hours after a payment fails, then send the customer a helpful recovery email.',
  'Payments', 'credit-card', 3, array['Email'], array['Wersee Pay', 'Email'],
  '{"schemaVersion":1,"name":"Recover failed payments","summary":"When a payment fails, wait 24 hours and send a recovery email.","trigger":{"type":"payment_failed","label":"A payment fails","config":{}},"nodes":[{"id":"trigger","type":"trigger","title":"A payment fails","config":{"event":"payment_failed"},"position":{"x":60,"y":140}},{"id":"wait","type":"delay","title":"Wait 24 hours","config":{"amount":24,"unit":"hours"},"position":{"x":360,"y":140}},{"id":"email","type":"email","title":"Send a payment recovery email","config":{"to":"{{trigger.customer_email}}","subject":"Complete your purchase","body":"Hi {{trigger.customer_name}},\n\nYour payment for {{trigger.product_title}} did not complete. You can safely try again from Wersee."},"position":{"x":680,"y":140}}],"edges":[{"id":"trigger-wait","source":"trigger","target":"wait"},{"id":"wait-email","source":"wait","target":"email"}],"requiredConnections":["email"],"dataAccess":["Customer email","Order and payment status"],"estimatedUsage":{"emailsPerRun":1,"aiActionsPerRun":0}}'::jsonb
),
(
  'weekly-sales-summary',
  'Create weekly sales summaries',
  'Every Friday, use Wersee AI to summarize sales and email the report to you.',
  'Analytics', 'chart', 3, array['Email'], array['Wersee Analytics', 'Wersee AI', 'Email'],
  '{"schemaVersion":1,"name":"Weekly sales summary","summary":"Every Friday, Wersee AI creates and emails a sales summary.","trigger":{"type":"schedule","label":"Every Friday at 09:00","config":{"cron":"0 9 * * 5","timezone":"Europe/Amsterdam"}},"nodes":[{"id":"trigger","type":"trigger","title":"Every Friday at 09:00","config":{"event":"schedule","cron":"0 9 * * 5","timezone":"Europe/Amsterdam"},"position":{"x":50,"y":140}},{"id":"ai","type":"ai","title":"Ask AI to summarize sales","config":{"prompt":"Create a concise weekly sales summary using this workflow input: {{trigger}}"},"position":{"x":370,"y":140}},{"id":"email","type":"email","title":"Email the summary","config":{"to":"{{owner.email}}","subject":"Your weekly Wersee sales summary","body":"{{steps.ai.text}}"},"position":{"x":700,"y":140}}],"edges":[{"id":"trigger-ai","source":"trigger","target":"ai"},{"id":"ai-email","source":"ai","target":"email"}],"requiredConnections":["email"],"dataAccess":["Workspace sales analytics","Workspace owner email"],"estimatedUsage":{"emailsPerRun":1,"aiActionsPerRun":1}}'::jsonb
),
(
  'large-order-notification',
  'Notify my team about large orders',
  'When an order is above €500, send a clear notification to the workspace owner.',
  'Sales', 'bell', 2, array[]::text[], array['Wersee', 'Notifications'],
  '{"schemaVersion":1,"name":"Large order notification","summary":"Notify the team when an order is over €500.","trigger":{"type":"purchase","label":"A customer purchases a product","config":{}},"nodes":[{"id":"trigger","type":"trigger","title":"A customer purchases a product","config":{"event":"purchase"},"position":{"x":40,"y":140}},{"id":"condition","type":"condition","title":"Order is above €500","config":{"field":"trigger.purchase_amount","operator":"greater_than","value":500},"position":{"x":350,"y":140}},{"id":"notify","type":"notification","title":"Notify the workspace owner","config":{"title":"Large order received","message":"{{trigger.customer_name}} placed an order for {{trigger.purchase_amount}} {{trigger.currency}}."},"position":{"x":690,"y":80}}],"edges":[{"id":"trigger-condition","source":"trigger","target":"condition"},{"id":"condition-notify","source":"condition","target":"notify","sourceHandle":"true"}],"requiredConnections":[],"dataAccess":["Order amount","Customer and product information"],"estimatedUsage":{"emailsPerRun":0,"aiActionsPerRun":0}}'::jsonb
),
(
  'approve-refunds',
  'Approve refunds before processing',
  'Pause a refund workflow until a team member explicitly approves or rejects it.',
  'Operations', 'shield-check', 3, array[]::text[], array['Wersee Pay', 'Approvals'],
  '{"schemaVersion":1,"name":"Refund approval","summary":"Require human approval before a refund action continues.","trigger":{"type":"webhook","label":"A refund is requested","config":{}},"nodes":[{"id":"trigger","type":"trigger","title":"A refund is requested","config":{"event":"webhook"},"position":{"x":40,"y":140}},{"id":"approval","type":"approval","title":"Ask a team member to approve","config":{"description":"Review the refund amount and reason before continuing."},"position":{"x":370,"y":140}},{"id":"notify","type":"notification","title":"Record the approval","config":{"title":"Refund approved","message":"The refund request was approved and is ready for processing."},"position":{"x":700,"y":140}}],"edges":[{"id":"trigger-approval","source":"trigger","target":"approval"},{"id":"approval-notify","source":"approval","target":"notify"}],"requiredConnections":[],"dataAccess":["Refund request details","Approval decision"],"estimatedUsage":{"emailsPerRun":0,"aiActionsPerRun":0}}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  icon = excluded.icon,
  setup_minutes = excluded.setup_minutes,
  required_connections = excluded.required_connections,
  apps = excluded.apps,
  definition = excluded.definition,
  is_public = true,
  updated_at = now();

do $$
declare
  v_token text;
  v_secret_id uuid;
begin
  if not exists (select 1 from private.workflow_runtime_config where singleton) then
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    select vault.create_secret(
      v_token,
      'wersee_workflow_worker_token',
      'Internal token used by pg_cron to invoke the Wersee Workflow worker'
    ) into v_secret_id;

    insert into private.workflow_runtime_config (
      singleton, worker_token_hash, worker_vault_secret_id, engine_url
    ) values (
      true,
      encode(extensions.digest(v_token, 'sha256'), 'hex'),
      v_secret_id,
      'https://pkgwzusngqwnmdfpifnd.supabase.co/functions/v1/workflow-engine'
    );
  else
    update private.workflow_runtime_config
    set engine_url = 'https://pkgwzusngqwnmdfpifnd.supabase.co/functions/v1/workflow-engine',
        updated_at = now()
    where singleton;
  end if;
end;
$$;

create or replace function private.invoke_workflow_worker()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_token text;
  v_request_id bigint;
begin
  select c.engine_url, ds.decrypted_secret
  into v_url, v_token
  from private.workflow_runtime_config c
  join vault.decrypted_secrets ds on ds.id = c.worker_vault_secret_id
  where c.singleton;

  if v_url is null or v_token is null then
    raise exception 'WORKFLOW_WORKER_NOT_CONFIGURED';
  end if;

  select net.http_post(
    url := v_url,
    body := '{"action":"drain"}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-workflow-worker-token', v_token
    ),
    timeout_milliseconds := 55000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.invoke_workflow_worker() from public, anon, authenticated;
grant execute on function private.invoke_workflow_worker() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'wersee-workflows-worker') then
    perform cron.unschedule('wersee-workflows-worker');
  end if;
  perform cron.schedule(
    'wersee-workflows-worker',
    '* * * * *',
    'select private.invoke_workflow_worker();'
  );
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workflows'
  ) then alter publication supabase_realtime add table public.workflows; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workflow_runs'
  ) then alter publication supabase_realtime add table public.workflow_runs; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workflow_run_steps'
  ) then alter publication supabase_realtime add table public.workflow_run_steps; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workflow_approvals'
  ) then alter publication supabase_realtime add table public.workflow_approvals; end if;
end;
$$;

notify pgrst, 'reload schema';
