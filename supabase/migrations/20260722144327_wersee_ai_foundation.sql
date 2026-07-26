-- Wersee AI control plane: conversations, typed runs, approvals, permissions,
-- usage and append-only audit data. Existing ai_chats/ai_messages remain
-- available during the client migration.

create schema if not exists private;

alter table public.listings add column if not exists ai_idempotency_key text;
alter table public.quick_pay_links add column if not exists ai_idempotency_key text;
alter table public.invoices add column if not exists ai_idempotency_key text;
alter table public.automations add column if not exists ai_idempotency_key text;
alter table public.proposals add column if not exists ai_idempotency_key text;
alter table public.contracts add column if not exists ai_idempotency_key text;
alter table public.forms add column if not exists ai_idempotency_key text;
alter table public.email_campaigns add column if not exists ai_idempotency_key text;
alter table public.websites add column if not exists ai_idempotency_key text;
alter table public.wiki_articles add column if not exists ai_idempotency_key text;
alter table public.call_configs add column if not exists ai_idempotency_key text;
alter table public.job_application_flows add column if not exists ai_idempotency_key text;
alter table public.businesses add column if not exists ai_idempotency_key text;
alter table public.communities add column if not exists ai_idempotency_key text;
alter table public.ads_campaigns add column if not exists ai_idempotency_key text;

create unique index if not exists listings_ai_idempotency_idx
  on public.listings (seller_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists quick_pay_links_ai_idempotency_idx
  on public.quick_pay_links (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists invoices_ai_idempotency_idx
  on public.invoices (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists automations_ai_idempotency_idx
  on public.automations (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists proposals_ai_idempotency_idx
  on public.proposals (business_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists contracts_ai_idempotency_idx
  on public.contracts (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists forms_ai_idempotency_idx
  on public.forms (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists email_campaigns_ai_idempotency_idx
  on public.email_campaigns (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists websites_ai_idempotency_idx
  on public.websites (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists wiki_articles_ai_idempotency_idx
  on public.wiki_articles (created_by, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists call_configs_ai_idempotency_idx
  on public.call_configs (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists job_application_flows_ai_idempotency_idx
  on public.job_application_flows (job_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists businesses_ai_idempotency_idx
  on public.businesses (user_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists communities_ai_idempotency_idx
  on public.communities (owner_id, ai_idempotency_key) where ai_idempotency_key is not null;
create unique index if not exists ads_campaigns_ai_idempotency_idx
  on public.ads_campaigns (user_id, ai_idempotency_key) where ai_idempotency_key is not null;

create or replace function private.ai_can_access_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_business_id is null
    or exists (
      select 1
      from public.businesses b
      where b.id = p_business_id
        and b.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.team_members tm
      where tm.business_id = p_business_id
        and tm.user_id = (select auth.uid())
        and coalesce(tm.status, 'active') in ('active', 'accepted', 'joined')
    );
$$;

revoke all on function private.ai_can_access_business(uuid) from public, anon;
grant execute on function private.ai_can_access_business(uuid) to authenticated, service_role;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null default 'New conversation',
  mode text not null default 'assistant' check (mode in ('assistant', 'agent')),
  status text not null default 'active' check (status in ('active', 'archived')),
  last_prompt_draft text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_messages
  add column if not exists conversation_id uuid references public.ai_conversations(id) on delete cascade,
  add column if not exists run_id uuid,
  add column if not exists tool_call_id uuid,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb,
  add column if not exists token_count integer;

alter table public.ai_messages drop constraint if exists ai_messages_role_check;
alter table public.ai_messages
  add constraint ai_messages_role_check
  check (role in ('user', 'assistant', 'model', 'tool', 'system'));

insert into public.ai_conversations (id, user_id, title, mode, last_prompt_draft, metadata, created_at, updated_at)
select c.id, c.user_id, coalesce(c.title, 'New conversation'),
       case when c.mode in ('assistant', 'agent') then c.mode else 'assistant' end,
       c.last_prompt_draft, coalesce(c.metadata, '{}'::jsonb), coalesce(c.created_at, now()), coalesce(c.updated_at, now())
from public.ai_chats c
where c.user_id is not null
on conflict (id) do nothing;

update public.ai_messages
set conversation_id = chat_id
where conversation_id is null
  and chat_id is not null
  and exists (select 1 from public.ai_conversations c where c.id = ai_messages.chat_id);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  mode text not null check (mode in ('assistant', 'agent')),
  status text not null default 'queued' check (status in ('queued', 'running', 'waiting_for_approval', 'completed', 'failed', 'cancelled')),
  provider text,
  model text,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  kind text not null default 'tool',
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'waiting_for_approval', 'completed', 'failed', 'cancelled')),
  safe_result jsonb,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  step_id uuid references public.ai_run_steps(id) on delete set null,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  tool_name text not null,
  category text not null,
  validated_arguments jsonb not null default '{}'::jsonb,
  risk_level text not null check (risk_level in ('read', 'low', 'medium', 'high', 'restricted')),
  required_scopes text[] not null default '{}',
  status text not null default 'proposed' check (status in ('proposed', 'waiting_for_approval', 'running', 'completed', 'failed', 'rejected', 'cancelled', 'undone')),
  approval_status text not null default 'not_required' check (approval_status in ('not_required', 'pending', 'approved', 'rejected')),
  preview jsonb,
  sanitized_result jsonb,
  error_code text,
  reversible boolean not null default false,
  undo_payload jsonb,
  idempotency_key text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_action_approvals (
  id uuid primary key default gen_random_uuid(),
  tool_call_id uuid not null unique references public.ai_tool_calls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  approver_id uuid references auth.users(id) on delete set null,
  edited_arguments jsonb,
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.ai_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  agent_enabled boolean not null default false,
  memory_enabled boolean not null default true,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  page text,
  entity_type text,
  entity_id text,
  sanitized_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ai_runs(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  provider text,
  model text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  tool_calls integer not null default 0 check (tool_calls >= 0),
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ai_runs(id) on delete set null,
  tool_call_id uuid references public.ai_tool_calls(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  event_type text not null,
  tool_name text,
  risk_level text,
  status text not null,
  sanitized_arguments jsonb not null default '{}'::jsonb,
  sanitized_result jsonb,
  error_code text,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_saved_instructions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  label text not null,
  instruction text not null check (char_length(instruction) between 1 and 2000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.ai_messages
    add constraint ai_messages_run_id_fkey foreign key (run_id) references public.ai_runs(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.ai_messages
    add constraint ai_messages_tool_call_id_fkey foreign key (tool_call_id) references public.ai_tool_calls(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists ai_conversations_user_updated_idx on public.ai_conversations (user_id, updated_at desc);
create index if not exists ai_conversations_business_updated_idx on public.ai_conversations (business_id, updated_at desc) where business_id is not null;
create index if not exists ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index if not exists ai_runs_conversation_created_idx on public.ai_runs (conversation_id, created_at desc);
create index if not exists ai_runs_user_status_idx on public.ai_runs (user_id, status, created_at desc);
create index if not exists ai_run_steps_run_position_idx on public.ai_run_steps (run_id, position);
create index if not exists ai_tool_calls_run_status_idx on public.ai_tool_calls (run_id, status, created_at);
create index if not exists ai_tool_calls_business_status_idx on public.ai_tool_calls (business_id, status, created_at desc) where business_id is not null;
create unique index if not exists ai_tool_calls_user_idempotency_idx on public.ai_tool_calls (user_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists ai_permissions_user_default_idx on public.ai_permissions (user_id) where business_id is null;
create unique index if not exists ai_permissions_user_business_idx on public.ai_permissions (user_id, business_id) where business_id is not null;
create index if not exists ai_usage_user_created_idx on public.ai_usage_events (user_id, created_at desc);
create index if not exists ai_audit_user_created_idx on public.ai_audit_logs (user_id, created_at desc);
create index if not exists ai_saved_instructions_user_idx on public.ai_saved_instructions (user_id, business_id, created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_run_steps enable row level security;
alter table public.ai_tool_calls enable row level security;
alter table public.ai_action_approvals enable row level security;
alter table public.ai_permissions enable row level security;
alter table public.ai_context_snapshots enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.ai_audit_logs enable row level security;
alter table public.ai_saved_instructions enable row level security;

drop policy if exists ai_conversations_select on public.ai_conversations;
create policy ai_conversations_select on public.ai_conversations for select to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_conversations_insert on public.ai_conversations;
create policy ai_conversations_insert on public.ai_conversations for insert to authenticated
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_conversations_update on public.ai_conversations;
create policy ai_conversations_update on public.ai_conversations for update to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id))
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_conversations_delete on public.ai_conversations;
create policy ai_conversations_delete on public.ai_conversations for delete to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));

drop policy if exists ai_messages_v2_select on public.ai_messages;
create policy ai_messages_v2_select on public.ai_messages for select to authenticated
using (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));
drop policy if exists ai_messages_v2_insert on public.ai_messages;
create policy ai_messages_v2_insert on public.ai_messages for insert to authenticated
with check (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));
drop policy if exists ai_messages_v2_delete on public.ai_messages;
create policy ai_messages_v2_delete on public.ai_messages for delete to authenticated
using (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));

drop policy if exists ai_runs_select on public.ai_runs;
create policy ai_runs_select on public.ai_runs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_run_steps_select on public.ai_run_steps;
create policy ai_run_steps_select on public.ai_run_steps for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_tool_calls_select on public.ai_tool_calls;
create policy ai_tool_calls_select on public.ai_tool_calls for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_action_approvals_select on public.ai_action_approvals;
create policy ai_action_approvals_select on public.ai_action_approvals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_context_snapshots_select on public.ai_context_snapshots;
create policy ai_context_snapshots_select on public.ai_context_snapshots for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_usage_events_select on public.ai_usage_events;
create policy ai_usage_events_select on public.ai_usage_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ai_audit_logs_select on public.ai_audit_logs;
create policy ai_audit_logs_select on public.ai_audit_logs for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists ai_permissions_select on public.ai_permissions;
create policy ai_permissions_select on public.ai_permissions for select to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_permissions_insert on public.ai_permissions;
create policy ai_permissions_insert on public.ai_permissions for insert to authenticated
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_permissions_update on public.ai_permissions;
create policy ai_permissions_update on public.ai_permissions for update to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id))
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_permissions_delete on public.ai_permissions;
create policy ai_permissions_delete on public.ai_permissions for delete to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));

drop policy if exists ai_saved_instructions_select on public.ai_saved_instructions;
create policy ai_saved_instructions_select on public.ai_saved_instructions for select to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_saved_instructions_insert on public.ai_saved_instructions;
create policy ai_saved_instructions_insert on public.ai_saved_instructions for insert to authenticated
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_saved_instructions_update on public.ai_saved_instructions;
create policy ai_saved_instructions_update on public.ai_saved_instructions for update to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id))
with check ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));
drop policy if exists ai_saved_instructions_delete on public.ai_saved_instructions;
create policy ai_saved_instructions_delete on public.ai_saved_instructions for delete to authenticated
using ((select auth.uid()) = user_id and private.ai_can_access_business(business_id));

revoke all on table public.ai_conversations, public.ai_runs, public.ai_run_steps,
  public.ai_tool_calls, public.ai_action_approvals, public.ai_permissions,
  public.ai_context_snapshots, public.ai_usage_events, public.ai_audit_logs,
  public.ai_saved_instructions from anon;

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, delete on public.ai_messages to authenticated;
grant select on public.ai_runs, public.ai_run_steps, public.ai_tool_calls,
  public.ai_action_approvals, public.ai_context_snapshots, public.ai_usage_events,
  public.ai_audit_logs to authenticated;
grant select, insert, update, delete on public.ai_permissions, public.ai_saved_instructions to authenticated;

-- Clients can read audit entries but cannot modify or remove them. The verified
-- Edge Function writes control-plane and audit records with service_role only
-- after authenticating the caller and resolving resource ownership.
revoke insert, update, delete on public.ai_audit_logs from authenticated, anon;

-- Repair legacy broad policies that exposed private workspace records.
drop policy if exists "Anyone can view listings" on public.listings;
drop policy if exists "Authenticated users can read listings" on public.listings;
drop policy if exists "Listings are viewable by everyone." on public.listings;
drop policy if exists "Public listings" on public.listings;
drop policy if exists "Authenticated users can view team members" on public.team_members;
drop policy if exists "Public can insert orders." on public.orders;
drop policy if exists "Users can claim their guest orders." on public.orders;
drop policy if exists "Users view own orders" on public.orders;
drop policy if exists "Sellers can update order status." on public.orders;
drop policy if exists "Anyone can view proposals" on public.proposals;
drop policy if exists "Public can view proposals" on public.proposals;
drop policy if exists "Public can view contracts via token" on public.contracts;
drop policy if exists "Public can update contracts" on public.contracts;
drop policy if exists "Public can insert signatures" on public.contract_signatures;
drop policy if exists "Anyone can view proposal deliverables" on public.proposal_deliverables;
drop policy if exists "Public can view proposal deliverables" on public.proposal_deliverables;
drop policy if exists "Anyone can view proposal milestones" on public.proposal_milestones;
drop policy if exists "Public can view proposal milestones" on public.proposal_milestones;
drop policy if exists "Anyone can view proposal feedback" on public.proposal_feedback;
drop policy if exists "Public can view proposal feedback" on public.proposal_feedback;
drop policy if exists "Anyone can insert proposal feedback" on public.proposal_feedback;
drop policy if exists "Public can insert proposal feedback" on public.proposal_feedback;

-- Seller order updates are limited to operational shipping fields. Payment,
-- refund, fee and provider fields remain server-only.
create policy "Sellers can update shipping status" on public.orders for update to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);
revoke update on table public.orders from anon, authenticated;
grant update (shipping_status, is_archived, updated_at) on table public.orders to authenticated;

-- The existing ads tables had RLS enabled without policies. AI and the normal
-- dashboard both use the caller-scoped client, so only owners receive access.
alter table public.ads_campaigns enable row level security;
drop policy if exists ads_campaigns_owner_select on public.ads_campaigns;
create policy ads_campaigns_owner_select on public.ads_campaigns for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists ads_campaigns_owner_insert on public.ads_campaigns;
create policy ads_campaigns_owner_insert on public.ads_campaigns for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists ads_campaigns_owner_update on public.ads_campaigns;
create policy ads_campaigns_owner_update on public.ads_campaigns for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists ads_campaigns_owner_delete on public.ads_campaigns;
create policy ads_campaigns_owner_delete on public.ads_campaigns for delete to authenticated
using ((select auth.uid()) = user_id);
revoke all on table public.ads_campaigns from anon;
grant select, insert, update, delete on table public.ads_campaigns to authenticated;

create or replace function public.get_public_proposal(p_proposal_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'proposal', to_jsonb(p) - 'ai_idempotency_key',
    'business', (select jsonb_build_object('id', b.id, 'name', b.name, 'logo_url', b.logo_url) from public.businesses b where b.id = p.business_id),
    'client', (select jsonb_build_object('id', c.id, 'name', c.name, 'email', c.email, 'company', (select jsonb_build_object('name', co.name) from public.crm_companies co where co.id = c.company_id)) from public.crm_contacts c where c.id = p.client_id),
    'deliverables', coalesce((select jsonb_agg(to_jsonb(d) order by d.sort_order) from public.proposal_deliverables d where d.proposal_id = p.id), '[]'::jsonb),
    'milestones', coalesce((select jsonb_agg(to_jsonb(m) order by m.sort_order) from public.proposal_milestones m where m.proposal_id = p.id), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at desc) from public.proposal_feedback f where f.proposal_id = p.id), '[]'::jsonb)
  ) from public.proposals p
  where p.id = p_proposal_id and p.status in ('sent', 'viewed', 'accepted', 'rejected', 'expired');
$$;

create or replace function public.submit_public_proposal_feedback(p_proposal_id uuid, p_message text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_feedback public.proposal_feedback;
begin
  if char_length(trim(coalesce(p_message, ''))) not between 1 and 4000 then raise exception 'INVALID_FEEDBACK'; end if;
  if not exists (select 1 from public.proposals p where p.id = p_proposal_id and p.status in ('sent', 'viewed')) then raise exception 'PROPOSAL_NOT_AVAILABLE'; end if;
  insert into public.proposal_feedback (proposal_id, message, comment, is_from_client)
  values (p_proposal_id, trim(p_message), trim(p_message), true) returning * into v_feedback;
  return to_jsonb(v_feedback);
end;
$$;

create or replace function public.get_public_contract(p_contract_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'contract', to_jsonb(c) - 'view_token' - 'ai_idempotency_key',
    'signature', (select to_jsonb(s) - 'ip_address' - 'user_agent' - 'signature_data' from public.contract_signatures s where s.contract_id = c.id order by s.signed_at desc limit 1)
  ) from public.contracts c
  where c.id = p_contract_id and c.status in ('sent', 'viewed', 'signed', 'completed')
    and (c.expires_at is null or c.expires_at > now());
$$;

create or replace function public.mark_public_contract_viewed(p_contract_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.contracts set status = 'viewed', updated_at = now()
  where id = p_contract_id and status = 'sent' and (expires_at is null or expires_at > now());
$$;

create or replace function public.sign_public_contract(p_contract_id uuid, p_signer_name text, p_signer_email text, p_signature_data text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_contract public.contracts; v_signature public.contract_signatures;
begin
  if char_length(trim(coalesce(p_signer_name, ''))) not between 1 and 160
     or char_length(trim(coalesce(p_signer_email, ''))) not between 3 and 320
     or char_length(coalesce(p_signature_data, '')) not between 50 and 2000000 then raise exception 'INVALID_SIGNATURE_INPUT'; end if;
  select * into v_contract from public.contracts
  where id = p_contract_id and status in ('sent', 'viewed') and (expires_at is null or expires_at > now()) for update;
  if not found or exists (select 1 from public.contract_signatures where contract_id = p_contract_id) then raise exception 'CONTRACT_NOT_SIGNABLE'; end if;
  insert into public.contract_signatures (contract_id, signer_name, signer_email, signature_data, signer_type)
  values (p_contract_id, trim(p_signer_name), lower(trim(p_signer_email)), p_signature_data, 'client') returning * into v_signature;
  update public.contracts set status = 'signed', signed_at = now(), updated_at = now() where id = p_contract_id;
  return jsonb_build_object('contract_id', p_contract_id, 'status', 'signed', 'signed_at', now(), 'signature', to_jsonb(v_signature) - 'signature_data' - 'ip_address' - 'user_agent');
end;
$$;

revoke all on function public.get_public_proposal(uuid) from public;
revoke all on function public.submit_public_proposal_feedback(uuid, text) from public;
revoke all on function public.get_public_contract(uuid) from public;
revoke all on function public.mark_public_contract_viewed(uuid) from public;
revoke all on function public.sign_public_contract(uuid, text, text, text) from public;
grant execute on function public.get_public_proposal(uuid) to anon, authenticated;
grant execute on function public.submit_public_proposal_feedback(uuid, text) to anon, authenticated;
grant execute on function public.get_public_contract(uuid) to anon, authenticated;
grant execute on function public.mark_public_contract_viewed(uuid) to anon, authenticated;
grant execute on function public.sign_public_contract(uuid, text, text, text) to anon, authenticated;
