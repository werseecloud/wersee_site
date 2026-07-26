-- Wersee Trust Center
-- Central, configurable controls for compliance, privacy, safety and governance.

create schema if not exists private;

-- These account tables already exist in production but are defined here as
-- dependencies so a clean development database can apply this migration too.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_active_money_view text,
  last_active_management_view text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid,
  stripe_subscription_id text,
  status text not null default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  buyer_email text,
  buyer_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trust_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'trust_viewer', 'moderator', 'senior_moderator', 'privacy_reviewer',
    'safety_reviewer', 'tax_operator', 'security_operator',
    'ai_governance_reviewer', 'legal_administrator', 'trust_administrator'
  )),
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  jurisdiction text,
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null default 'Initial Trust Center access',
  step_up_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.platform_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null,
  enabled boolean not null default false,
  country_code text not null default '*',
  workspace_id uuid,
  user_role text not null default '*',
  product_category text not null default '*',
  seller_risk text not null default '*',
  cohort text not null default '*',
  approved_by uuid references auth.users(id) on delete set null,
  legal_approved_at timestamptz,
  security_approved_at timestamptz,
  reason text not null default 'Disabled pending review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flag_key, country_code, workspace_id, user_role, product_category, seller_risk, cohort)
);

create table public.policy_documents (
  id uuid primary key default gen_random_uuid(),
  document_code text not null unique,
  title text not null,
  owner_team text not null default 'legal',
  status text not null default 'active' check (status in ('draft', 'active', 'retired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.policy_documents(id) on delete restrict,
  version_id text not null unique,
  effective_at timestamptz not null,
  regions text[] not null default array['*']::text[],
  languages text[] not null default array['en']::text[],
  fallback_language text not null default 'en',
  change_summary text not null,
  content_uri text not null,
  content_sha256 text not null,
  translation_review_status text not null default 'pending' check (translation_review_status in ('pending', 'reviewed', 'not_required')),
  approval_status text not null default 'review_required' check (approval_status in ('review_required', 'approved', 'rejected')),
  published boolean not null default false,
  renewed_acceptance_required boolean not null default false,
  affected_user_groups text[] not null default array['all_users']::text[],
  approved_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.compliance_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'restricted', 'under_review', 'closed')),
  country_code text,
  country_source text check (country_source in ('user', 'payment', 'seller_verification', 'browser', 'unknown')),
  account_capacity text not null default 'consumer' check (account_capacity in ('consumer', 'private_seller', 'business_seller', 'creator', 'developer', 'worker', 'employer')),
  age_band text not null default 'unknown' check (age_band in ('unknown', 'under_13', '13_15', '16_17', '18_plus')),
  risk_level text not null default 'unknown' check (risk_level in ('unknown', 'low', 'standard', 'elevated', 'high', 'blocked')),
  tax_status text not null default 'unknown',
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  requirement_key text not null,
  title text not null,
  explanation text not null,
  why_needed text not null,
  action_label text not null,
  action_uri text,
  status text not null default 'required' check (status in ('not_applicable', 'required', 'in_progress', 'satisfied', 'waived', 'expired')),
  blocking boolean not null default false,
  due_at timestamptz,
  saved_progress jsonb not null default '{}'::jsonb,
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (workspace_id, user_id, requirement_key)
);

create table public.compliance_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  allowed boolean not null,
  required_actions jsonb not null default '[]'::jsonb,
  blocking_issues jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  disclosures jsonb not null default '[]'::jsonb,
  audit_reason text not null,
  policy_version text not null,
  country_code text,
  context jsonb not null default '{}'::jsonb,
  request_id text,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions(id) on delete restrict,
  acceptance_context text not null,
  exact_wording text not null,
  accepted boolean not null,
  country_code text,
  ip_hash text,
  device_hash text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe_connect',
  provider_account_reference text,
  seller_type text not null default 'private' check (seller_type in ('private', 'sole_trader', 'business', 'non_profit')),
  legal_name text,
  trading_name text,
  country_code text,
  registered_address text,
  email text,
  phone text,
  registration_number text,
  tax_id_reference text,
  vat_number text,
  authorized_representative text,
  manufacturer_role boolean not null default false,
  importer_role boolean not null default false,
  eu_responsible_person text,
  status text not null default 'draft' check (status in ('draft', 'basic_verification', 'business_verification_required', 'under_review', 'verified', 'restricted', 'payout_blocked', 'selling_blocked', 'suspended', 'closed')),
  provider_requirements jsonb not null default '[]'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.seller_licenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  license_type text not null,
  license_number text not null,
  issuer text not null,
  country_code text,
  valid_from date,
  expires_on date,
  status text not null default 'under_review' check (status in ('under_review', 'valid', 'expired', 'rejected', 'revoked')),
  document_reference text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_tax_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  legal_name text,
  address text,
  country_code text,
  tax_residence_country text,
  tin_reference text,
  vat_number text,
  business_registration_number text,
  date_of_birth_required boolean not null default false,
  date_of_birth date,
  payout_account_reference text,
  permanent_establishment_country text,
  seller_classification text,
  reportable_status text not null default 'undetermined' check (reportable_status in ('undetermined', 'reportable', 'not_reportable', 'exempt')),
  exemption_reason text,
  verification_status text not null default 'incomplete' check (verification_status in ('incomplete', 'pending', 'verified', 'invalid')),
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tax_residence_country)
);

create table public.seller_risk_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  risk_level text not null check (risk_level in ('low', 'standard', 'elevated', 'high', 'blocked')),
  reason text not null,
  source text not null check (source in ('rules', 'provider', 'human', 'authority')),
  model_version text,
  human_review_status text not null default 'not_required' check (human_review_status in ('not_required', 'required', 'pending', 'completed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'monitoring', 'resolved')),
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_safety_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  manufacturer_name text,
  manufacturer_address text,
  manufacturer_email text,
  eu_responsible_person_name text,
  eu_responsible_person_contact text,
  product_identifier text,
  model text,
  batch_number text,
  serial_number text,
  country_of_origin text,
  safety_warnings text,
  intended_use text,
  minimum_age integer,
  instructions_uri text,
  ce_marking text,
  recall_contact_email text,
  sold_countries text[] not null default '{}'::text[],
  status text not null default 'incomplete' check (status in ('incomplete', 'review_required', 'complete', 'blocked', 'recalled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id)
);

create table public.product_compliance_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  document_type text not null,
  storage_reference text not null,
  issuer text,
  certificate_number text,
  valid_from date,
  expires_on date,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'valid', 'invalid', 'expired', 'suspicious')),
  document_sha256 text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_recalls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid not null references public.listings(id) on delete restrict,
  recall_reference text not null unique,
  affected_batches text[] not null default '{}'::text[],
  severity text not null check (severity in ('precautionary', 'serious', 'critical')),
  reason text not null,
  customer_instructions text not null,
  authority_reference text,
  sales_stopped_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'active', 'monitoring', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recall_customers (
  id uuid primary key default gen_random_uuid(),
  recall_id uuid not null references public.product_recalls(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'delivered', 'failed')),
  acknowledged_at timestamptz,
  resolution_status text not null default 'pending' check (resolution_status in ('pending', 'refund_requested', 'returned', 'refunded', 'declined', 'complete')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  case_id text not null unique default ('WR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null,
  content_id text not null,
  reported_user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('illegal_product', 'scam_or_fraud', 'ip_infringement', 'unsafe_product', 'hate_or_harassment', 'child_safety', 'misleading_information', 'privacy_violation', 'prohibited_goods', 'other_legal_concern')),
  explanation text not null,
  evidence_references text[] not null default '{}'::text[],
  content_snapshot jsonb not null default '{}'::jsonb,
  trusted_flagger boolean not null default false,
  status text not null default 'received' check (status in ('received', 'triaged', 'under_review', 'action_taken', 'no_action', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  report_id uuid references public.content_reports(id) on delete set null,
  content_type text not null,
  content_id text not null,
  applicable_rule text not null,
  applicable_law text,
  decision text,
  automation_used boolean not null default false,
  model_version text,
  human_review_status text not null default 'pending' check (human_review_status in ('not_required', 'pending', 'completed')),
  action_taken text,
  geographic_scope text[] not null default array['*']::text[],
  appeal_deadline timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'investigating', 'decision_ready', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  action_type text not null,
  scope text not null,
  reason text not null,
  reversible boolean not null default true,
  reversed_by_action_id uuid references public.moderation_actions(id) on delete set null,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.moderation_cases(id) on delete set null,
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  appellant_id uuid not null references auth.users(id) on delete cascade,
  appeal_type text not null,
  explanation text not null,
  evidence_references text[] not null default '{}'::text[],
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'upheld', 'partially_upheld', 'rejected', 'closed')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_is_different boolean,
  decision_reason text,
  decided_at timestamptz,
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.statements_of_reasons (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  affected_user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  facts text not null,
  rule_basis text not null,
  legal_basis text,
  automated_means_used boolean not null default false,
  human_review_available boolean not null default true,
  appeal_uri text,
  appeal_deadline timestamptz,
  sensitive_details_withheld boolean not null default false,
  delivered_at timestamptz,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  case_id text not null unique default ('PR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('access', 'correction', 'export', 'deletion', 'object', 'restrict', 'withdraw_consent', 'automated_decision_review')),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'identity_verification', 'in_progress', 'waiting_for_user', 'completed', 'partially_completed', 'rejected', 'cancelled')),
  identity_verification_status text not null default 'session_verified' check (identity_verification_status in ('required', 'session_verified', 'verified', 'failed')),
  submitted_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '30 days'),
  assigned_to uuid references auth.users(id) on delete set null,
  exception_reason text,
  completion_summary text,
  completed_at timestamptz,
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  consent_version text not null,
  region text,
  necessary boolean not null default true,
  preferences boolean not null default false,
  analytics boolean not null default false,
  marketing boolean not null default false,
  personalization boolean not null default false,
  privacy_signal text,
  source text not null check (source in ('consent_sheet', 'account_settings', 'footer', 'browser_signal', 'migration')),
  event_type text not null default 'set' check (event_type in ('set', 'withdrawn')),
  ip_hash text,
  device_hash text,
  country_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create table public.retention_rules (
  id uuid primary key default gen_random_uuid(),
  data_category text not null,
  country_code text not null default '*',
  retention_days integer not null check (retention_days >= 0),
  action text not null check (action in ('delete', 'anonymize', 'archive', 'review')),
  legal_basis text not null,
  active boolean not null default true,
  policy_version text,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (data_category, country_code)
);

create table public.deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  privacy_request_id uuid references public.privacy_requests(id) on delete set null,
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('account_delete', 'category_delete', 'anonymize', 'retention')),
  status text not null default 'queued' check (status in ('queued', 'scheduled', 'due', 'running', 'waiting_review', 'completed', 'partially_completed', 'failed', 'cancelled')),
  scheduled_for timestamptz not null,
  attempts integer not null default 0,
  last_error text,
  exception_summary text,
  idempotency_key text not null unique,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_exports (
  id uuid primary key default gen_random_uuid(),
  privacy_request_id uuid references public.privacy_requests(id) on delete set null,
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  export_type text not null default 'full' check (export_type in ('full', 'files', 'marketplace', 'developer', 'configuration')),
  format text not null default 'zip' check (format in ('zip', 'json', 'csv')),
  status text not null default 'queued' check (status in ('queued', 'running', 'ready', 'expired', 'failed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  object_path text,
  package_manifest jsonb not null default '{}'::jsonb,
  file_size bigint,
  expires_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  idempotency_key text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.processing_activities (
  id uuid primary key default gen_random_uuid(),
  activity_code text not null unique,
  purpose text not null,
  data_categories text[] not null,
  data_subjects text[] not null,
  legal_basis text not null,
  recipients text[] not null default '{}'::text[],
  transfers_outside_region boolean not null default false,
  transfer_safeguard text,
  retention_rule_id uuid references public.retention_rules(id) on delete set null,
  owner text not null,
  status text not null default 'review_required' check (status in ('review_required', 'active', 'suspended', 'retired')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subprocessors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  countries text[] not null,
  data_categories text[] not null,
  transfer_mechanism text,
  dpa_status text not null default 'review_required',
  security_review_status text not null default 'review_required',
  effective_at date,
  ended_at date,
  status text not null default 'active' check (status in ('planned', 'active', 'ended', 'blocked')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dpia_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  system_owner text not null,
  processing_description text not null,
  necessity_assessment text not null,
  risk_summary text not null,
  mitigations text not null,
  residual_risk text not null,
  dpo_review_status text not null default 'review_required',
  approval_status text not null default 'review_required',
  next_review_at timestamptz,
  status text not null default 'open' check (status in ('open', 'approved', 'changes_required', 'retired')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.security_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_reference text not null unique default ('SEC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  initial_alert_at timestamptz not null,
  containment_at timestamptz,
  evidence_preserved_at timestamptz,
  user_impact text,
  authority_notification_decision text,
  customer_notification_decision text,
  recovery_at timestamptz,
  post_incident_review_at timestamptz,
  legal_deadline_at timestamptz,
  status text not null default 'open' check (status in ('open', 'contained', 'recovering', 'resolved', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vulnerability_reports (
  id uuid primary key default gen_random_uuid(),
  report_reference text not null unique default ('VULN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  component text not null,
  summary text not null,
  reproduction_steps text not null,
  severity text not null default 'untriaged' check (severity in ('untriaged', 'low', 'medium', 'high', 'critical')),
  cve_id text,
  embargo_until timestamptz,
  status text not null default 'received' check (status in ('received', 'triaged', 'confirmed', 'fixing', 'resolved', 'duplicate', 'invalid')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_systems (
  id uuid primary key default gen_random_uuid(),
  feature_name text not null unique,
  purpose text not null,
  owner text not null,
  model_provider text not null,
  model_name text not null,
  model_version text not null,
  hosting_location text,
  input_data_categories text[] not null default '{}'::text[],
  output_data_categories text[] not null default '{}'::text[],
  user_groups text[] not null default '{}'::text[],
  risk_classification text not null default 'unclassified' check (risk_classification in ('unclassified', 'minimal', 'limited', 'high', 'prohibited')),
  legal_review_status text not null default 'review_required',
  human_oversight_requirements text not null,
  retention_days integer,
  known_limitations text not null,
  launch_date date,
  last_review_date date,
  status text not null default 'inventory' check (status in ('inventory', 'review_required', 'approved', 'restricted', 'disabled', 'retired')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  ai_system_id uuid not null references public.ai_systems(id) on delete cascade,
  evaluation_type text not null check (evaluation_type in ('hallucination', 'bias', 'discrimination', 'prompt_injection', 'data_leakage', 'unauthorized_tool_use', 'harmful_output', 'fraud', 'security', 'reliability', 'accessibility')),
  dataset_version text,
  evaluator text not null,
  model_version text not null,
  score numeric,
  threshold numeric,
  passed boolean not null,
  findings text not null,
  remediation text,
  evaluated_at timestamptz not null default now(),
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.ai_decision_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_system_id uuid references public.ai_systems(id) on delete set null,
  decision_type text not null,
  target_type text not null,
  target_id text not null,
  model_version text,
  decision_summary text not null,
  challenge_reason text,
  human_review_required boolean not null default true,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_outcome text,
  status text not null default 'review_requested' check (status in ('review_requested', 'under_review', 'upheld', 'changed', 'withdrawn', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  account_reference text not null,
  entry_type text not null,
  direction text not null check (direction in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null,
  provider text not null,
  provider_reference text not null,
  source_type text not null,
  source_id text not null,
  idempotency_key text not null unique,
  correction_of uuid references public.financial_ledger_entries(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payout_restrictions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  restriction_type text not null,
  reason text not null,
  provider_reference text,
  status text not null default 'active' check (status in ('active', 'released', 'expired')),
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  released_at timestamptz,
  released_by uuid references auth.users(id) on delete set null,
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tax_reporting_periods (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('dac7', 'vat', 'oss', 'ioss', 'other')),
  country_code text not null,
  period_start date not null,
  period_end date not null,
  filing_due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'calculating', 'review_required', 'ready', 'filed', 'corrected', 'closed')),
  authority_reference text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_type, country_code, period_start, period_end)
);

create table public.tax_reporting_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.tax_reporting_periods(id) on delete cascade,
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete restrict,
  gross_amount_minor bigint not null default 0,
  refund_amount_minor bigint not null default 0,
  fee_amount_minor bigint not null default 0,
  tax_amount_minor bigint not null default 0,
  transaction_count integer not null default 0,
  payout_amount_minor bigint not null default 0,
  withheld_amount_minor bigint not null default 0,
  currency text not null,
  property_information text,
  verification_status text not null default 'incomplete',
  reportable_status text not null,
  classification_basis text not null,
  correction_of uuid references public.tax_reporting_entries(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'review_required', 'ready', 'reported', 'corrected')),
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.copyright_claims (
  id uuid primary key default gen_random_uuid(),
  case_id text not null unique default ('IP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  claimant_id uuid references auth.users(id) on delete set null,
  rights_holder_name text not null,
  rights_holder_verified boolean not null default false,
  content_type text not null,
  content_id text not null,
  work_description text not null,
  ownership_basis text not null,
  territory_restrictions text[] not null default '{}'::text[],
  evidence_references text[] not null default '{}'::text[],
  good_faith_statement boolean not null,
  status text not null default 'received' check (status in ('received', 'verification', 'under_review', 'action_taken', 'rejected', 'counterclaimed', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.copyright_counterclaims (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.copyright_claims(id) on delete cascade,
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimant_name text not null,
  explanation text not null,
  evidence_references text[] not null default '{}'::text[],
  consent_to_jurisdiction boolean not null,
  good_faith_statement boolean not null,
  status text not null default 'received' check (status in ('received', 'under_review', 'forwarded', 'restored', 'rejected', 'closed')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accessibility_issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  reporter_id uuid references auth.users(id) on delete set null,
  route text not null,
  component text,
  wcag_criterion text,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  assistive_technology text,
  description text not null,
  reproduction_steps text not null,
  status text not null default 'open' check (status in ('open', 'triaged', 'fixing', 'verification', 'resolved', 'accepted_risk')),
  assigned_to uuid references auth.users(id) on delete set null,
  target_date date,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.authority_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  authority_name text not null,
  country_code text not null,
  request_type text not null,
  legal_basis text not null,
  scope text not null,
  received_at timestamptz not null,
  due_at timestamptz,
  validity_status text not null default 'review_required',
  response_summary text,
  disclosed_record_count integer not null default 0,
  status text not null default 'received' check (status in ('received', 'validating', 'responding', 'challenged', 'completed', 'rejected')),
  jurisdiction text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkout_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  order_id uuid references public.orders(id) on delete set null,
  listing_id uuid not null references public.listings(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  buyer_country text,
  seller_country text,
  seller_capacity text not null,
  product_type text not null,
  price_minor bigint not null,
  tax_minor bigint not null default 0,
  fee_minor bigint not null default 0,
  shipping_minor bigint not null default 0,
  total_minor bigint not null,
  currency text not null,
  billing_frequency text,
  offer_reference text,
  reference_price_minor bigint,
  checkout_copy jsonb not null,
  policy_versions jsonb not null,
  provider text not null default 'stripe',
  provider_session_id text,
  status text not null default 'prepared' check (status in ('prepared', 'session_created', 'completed', 'cancelled', 'expired')),
  idempotency_key text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create table public.digital_delivery_consents (
  id uuid primary key default gen_random_uuid(),
  checkout_snapshot_id uuid not null references public.checkout_snapshots(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  listing_id uuid not null references public.listings(id) on delete restrict,
  immediate_delivery_requested boolean not null,
  withdrawal_effect_acknowledged boolean not null,
  exact_wording text not null,
  policy_version text not null,
  ip_hash text,
  device_hash text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (immediate_delivery_requested and withdrawal_effect_acknowledged),
  check (user_id is not null or anonymous_id is not null)
);

create table public.consumer_rights_requests (
  id uuid primary key default gen_random_uuid(),
  case_id text not null unique default ('CR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  request_type text not null check (request_type in ('withdrawal', 'refund', 'return', 'complaint', 'warranty')),
  reason text,
  country_code text,
  withdrawal_deadline timestamptz,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'rejected', 'return_in_transit', 'refunded', 'resolved', 'closed')),
  resolution_summary text,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_cancellations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subscription_id uuid not null references public.user_subscriptions(id) on delete restrict,
  provider text not null default 'stripe',
  provider_subscription_id text,
  status text not null default 'requested' check (status in ('requested', 'provider_pending', 'scheduled', 'effective', 'failed', 'reversed')),
  requested_at timestamptz not null default now(),
  effective_at timestamptz,
  reason_category text,
  confirmation_sent_at timestamptz,
  idempotency_key text not null unique,
  policy_version text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compliance_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'administrator', 'service', 'automation', 'authority')),
  action text not null,
  target_type text not null,
  target_id text not null,
  previous_state_hash text,
  new_state_hash text,
  reason text not null,
  request_id text,
  session_id text,
  ip_hash text,
  device_hash text,
  source text not null default 'human' check (source in ('human', 'automation', 'ai_assisted')),
  model_version text,
  visibility text not null default 'restricted' check (visibility in ('user', 'operator', 'restricted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.price_reference_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  price_minor bigint not null check (price_minor >= 0),
  currency text not null,
  price_type text not null check (price_type in ('regular', 'sale', 'offer')),
  effective_at timestamptz not null default now(),
  source_id uuid,
  created_at timestamptz not null default now()
);

-- Accessibility preferences are normal account settings, not a separate experience.
alter table public.user_preferences
  add column if not exists reduced_motion boolean not null default false,
  add column if not exists increased_contrast boolean not null default false,
  add column if not exists interface_text_scale numeric(3,2) not null default 1.00 check (interface_text_scale between 1 and 1.35),
  add column if not exists captions_enabled boolean not null default false;

alter table public.user_preferences enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "Trust users read preferences" on public.user_preferences;
create policy "Trust users read preferences" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Trust users create preferences" on public.user_preferences;
create policy "Trust users create preferences" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Trust users update preferences" on public.user_preferences;
create policy "Trust users update preferences" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Trust users read subscriptions" on public.user_subscriptions;
create policy "Trust users read subscriptions" on public.user_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update on public.user_preferences to authenticated;
grant select on public.user_subscriptions to authenticated;

create or replace function private.trust_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'trust_roles','platform_feature_flags','policy_documents','compliance_profiles','compliance_requirements',
    'seller_verifications','seller_licenses','seller_tax_profiles','seller_risk_reviews','product_safety_profiles',
    'product_compliance_documents','product_recalls','recall_customers','content_reports','moderation_cases',
    'appeals','privacy_requests','retention_rules','deletion_jobs','data_exports','processing_activities','subprocessors',
    'dpia_records','security_incidents','vulnerability_reports','ai_systems','ai_decision_reviews','payout_restrictions',
    'tax_reporting_periods','tax_reporting_entries','copyright_claims','copyright_counterclaims','accessibility_issues',
    'authority_requests','checkout_snapshots','consumer_rights_requests','subscription_cancellations'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.trust_set_updated_at()', 'trust_touch_' || table_name, table_name);
  end loop;
end;
$$;

create or replace function private.trust_has_role(required_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.trust_roles r
    where r.user_id = (select auth.uid())
      and r.status = 'active'
      and (required_roles is null or r.role = any(required_roles) or r.role = 'trust_administrator')
  ) or exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.status = 'active'
      and a.role in ('owner', 'admin')
  );
$$;

create or replace function private.trust_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select target_workspace_id is null
    or exists (
      select 1 from public.businesses b
      where b.id = target_workspace_id and b.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.business_members bm
      where bm.business_id = target_workspace_id and bm.user_id = (select auth.uid())
    );
$$;

revoke all on function private.trust_has_role(text[]) from public;
revoke all on function private.trust_workspace_member(uuid) from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.trust_has_role(text[]) to authenticated, service_role;
grant execute on function private.trust_workspace_member(uuid) to authenticated, service_role;

-- Bootstrap existing Wersee owners/admins without relying on editable user metadata.
insert into public.trust_roles (user_id, role, status, reason)
select a.user_id, 'trust_administrator', 'active', 'Existing Wersee administrator bootstrap'
from public.admin_users a
where a.user_id is not null and a.status = 'active' and a.role in ('owner', 'admin')
on conflict (user_id, role) do nothing;

-- All exposed Trust Center tables use RLS. Internal mutations are limited to explicit policies or service-role APIs.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'trust_roles','platform_feature_flags','policy_documents','policy_versions','compliance_profiles','compliance_requirements',
    'compliance_decisions','policy_acceptances','seller_verifications','seller_licenses','seller_tax_profiles','seller_risk_reviews',
    'product_safety_profiles','product_compliance_documents','product_recalls','recall_customers','content_reports',
    'moderation_cases','moderation_actions','appeals','statements_of_reasons','privacy_requests','consent_records',
    'retention_rules','deletion_jobs','data_exports','processing_activities','subprocessors','dpia_records','security_incidents',
    'vulnerability_reports','ai_systems','ai_evaluations','ai_decision_reviews','financial_ledger_entries','payout_restrictions',
    'tax_reporting_periods','tax_reporting_entries','copyright_claims','copyright_counterclaims','accessibility_issues',
    'authority_requests','checkout_snapshots','digital_delivery_consents','consumer_rights_requests','subscription_cancellations',
    'compliance_audit_events','price_reference_history'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy "Trust operators can manage %1$s" on public.%1$I for all to authenticated using ((select private.trust_has_role(null))) with check ((select private.trust_has_role(null)))',
      table_name
    );
  end loop;
end;
$$;

create policy "Published policies are public"
  on public.policy_documents for select to anon, authenticated
  using (status = 'active');
create policy "Published policy versions are public"
  on public.policy_versions for select to anon, authenticated
  using (published and effective_at <= now());

create policy "Users manage their compliance profile"
  on public.compliance_profiles for all to authenticated
  using ((select auth.uid()) = user_id and (select private.trust_workspace_member(workspace_id)))
  with check ((select auth.uid()) = user_id and (select private.trust_workspace_member(workspace_id)));
create policy "Users read their requirements"
  on public.compliance_requirements for select to authenticated
  using ((select auth.uid()) = user_id and (select private.trust_workspace_member(workspace_id)));
create policy "Users read their decisions"
  on public.compliance_decisions for select to authenticated
  using ((select auth.uid()) = user_id and (select private.trust_workspace_member(workspace_id)));
create policy "Users read their policy acceptances"
  on public.policy_acceptances for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users record their policy acceptances"
  on public.policy_acceptances for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Sellers read their verification"
  on public.seller_verifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Sellers create their verification"
  on public.seller_verifications for insert to authenticated with check ((select auth.uid()) = user_id and status in ('draft','basic_verification','business_verification_required','under_review'));
create policy "Sellers update incomplete verification"
  on public.seller_verifications for update to authenticated
  using ((select auth.uid()) = user_id and status in ('draft','basic_verification','business_verification_required','under_review'))
  with check ((select auth.uid()) = user_id and status in ('draft','basic_verification','business_verification_required','under_review'));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['seller_licenses','seller_tax_profiles','product_safety_profiles','product_compliance_documents'] loop
    execute format('create policy "Owners read %1$s" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "Owners create %1$s" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "Owners update %1$s" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
  end loop;
end;
$$;

create policy "Reporters read their reports"
  on public.content_reports for select to authenticated using ((select auth.uid()) = reporter_id);
create policy "Users submit reports"
  on public.content_reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "Appellants read their appeals"
  on public.appeals for select to authenticated using ((select auth.uid()) = appellant_id);
create policy "Appellants submit appeals"
  on public.appeals for insert to authenticated with check ((select auth.uid()) = appellant_id and (select auth.uid()) = user_id);
create policy "Affected users read statements of reasons"
  on public.statements_of_reasons for select to authenticated using ((select auth.uid()) = affected_user_id);

create policy "Users read their privacy requests"
  on public.privacy_requests for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users submit privacy requests"
  on public.privacy_requests for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read their consent history"
  on public.consent_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users append consent events"
  on public.consent_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read their deletion jobs"
  on public.deletion_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read their data exports"
  on public.data_exports for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users request AI decision review"
  on public.ai_decision_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read AI decision reviews"
  on public.ai_decision_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read payout restrictions"
  on public.payout_restrictions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Sellers read tax entries"
  on public.tax_reporting_entries for select to authenticated using ((select auth.uid()) = user_id);

create policy "Claimants read copyright claims"
  on public.copyright_claims for select to authenticated using ((select auth.uid()) = claimant_id);
create policy "Claimants submit copyright claims"
  on public.copyright_claims for insert to authenticated with check ((select auth.uid()) = claimant_id);
create policy "Users read copyright counterclaims"
  on public.copyright_counterclaims for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users submit copyright counterclaims"
  on public.copyright_counterclaims for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users submit accessibility issues"
  on public.accessibility_issues for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "Users read their accessibility issues"
  on public.accessibility_issues for select to authenticated using ((select auth.uid()) = reporter_id);
create policy "Researchers submit vulnerability reports"
  on public.vulnerability_reports for insert to authenticated with check ((select auth.uid()) = reporter_user_id);
create policy "Researchers read vulnerability reports"
  on public.vulnerability_reports for select to authenticated using ((select auth.uid()) = reporter_user_id);

create policy "Buyers read checkout snapshots"
  on public.checkout_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "Buyers read digital consents"
  on public.digital_delivery_consents for select to authenticated using ((select auth.uid()) = user_id);
create policy "Buyers read consumer rights cases"
  on public.consumer_rights_requests for select to authenticated using ((select auth.uid()) = user_id);
create policy "Buyers submit consumer rights cases"
  on public.consumer_rights_requests for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Subscribers read cancellations"
  on public.subscription_cancellations for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read visible audit events"
  on public.compliance_audit_events for select to authenticated using ((select auth.uid()) = actor_id and visibility = 'user');

-- Explicit Data API privileges are separate from RLS.
grant select on public.policy_documents, public.policy_versions to anon, authenticated;
grant select, insert, update on public.compliance_profiles to authenticated;
grant select on public.compliance_requirements, public.compliance_decisions to authenticated;
grant select, insert on public.policy_acceptances, public.content_reports, public.appeals, public.privacy_requests,
  public.consent_records, public.ai_decision_reviews, public.copyright_claims, public.copyright_counterclaims,
  public.accessibility_issues, public.vulnerability_reports, public.consumer_rights_requests to authenticated;
grant select, insert, update on public.seller_verifications, public.seller_licenses, public.seller_tax_profiles,
  public.product_safety_profiles, public.product_compliance_documents to authenticated;
grant select on public.statements_of_reasons, public.deletion_jobs, public.data_exports, public.payout_restrictions,
  public.tax_reporting_entries, public.checkout_snapshots, public.digital_delivery_consents,
  public.subscription_cancellations, public.compliance_audit_events to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

create index trust_roles_user_status_idx on public.trust_roles (user_id, status);
create index feature_flags_lookup_idx on public.platform_feature_flags (flag_key, enabled, country_code);
create index policy_versions_document_effective_idx on public.policy_versions (document_id, published, effective_at desc);
create index compliance_profiles_user_idx on public.compliance_profiles (user_id, status);
create index compliance_requirements_user_status_idx on public.compliance_requirements (user_id, status, due_at);
create index compliance_decisions_user_action_idx on public.compliance_decisions (user_id, action, created_at desc);
create index policy_acceptances_user_created_idx on public.policy_acceptances (user_id, created_at desc);
create index product_safety_listing_status_idx on public.product_safety_profiles (listing_id, status);
create index content_reports_status_created_idx on public.content_reports (status, created_at);
create index moderation_cases_status_created_idx on public.moderation_cases (status, created_at);
create index appeals_user_status_idx on public.appeals (appellant_id, status, created_at desc);
create index privacy_requests_user_status_idx on public.privacy_requests (user_id, status, created_at desc);
create index consent_records_user_created_idx on public.consent_records (user_id, created_at desc);
create index consent_records_anon_created_idx on public.consent_records (anonymous_id, created_at desc);
create index deletion_jobs_due_idx on public.deletion_jobs (status, scheduled_for);
create index data_exports_user_status_idx on public.data_exports (user_id, status, created_at desc);
create index audit_events_target_created_idx on public.compliance_audit_events (target_type, target_id, created_at desc);
create index audit_events_actor_created_idx on public.compliance_audit_events (actor_id, created_at desc);
create index checkout_snapshots_listing_created_idx on public.checkout_snapshots (listing_id, created_at desc);
create index digital_consents_snapshot_idx on public.digital_delivery_consents (checkout_snapshot_id);
create index price_reference_listing_effective_idx on public.price_reference_history (listing_id, effective_at desc);

create or replace function private.trust_block_immutable_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception '% is append-only; create a compensating or withdrawal record instead', tg_table_name;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['policy_versions','policy_acceptances','consent_records','financial_ledger_entries','digital_delivery_consents','compliance_audit_events'] loop
    execute format('create trigger %I before update or delete on public.%I for each row execute function private.trust_block_immutable_mutation()', 'trust_immutable_' || table_name, table_name);
  end loop;
end;
$$;

create or replace function private.trust_state_hash(state jsonb)
returns text
language sql
immutable
security invoker
set search_path = extensions, pg_catalog
as $$
  select encode(extensions.digest(coalesce(state, '{}'::jsonb)::text, 'sha256'), 'hex');
$$;

create or replace function private.trust_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  row_id text;
  old_state jsonb;
  new_state jsonb;
  actor uuid := (select auth.uid());
begin
  old_state := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_state := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  row_id := coalesce(new_state->>'id', old_state->>'id', 'unknown');
  insert into public.compliance_audit_events (
    workspace_id, actor_id, actor_type, action, target_type, target_id,
    previous_state_hash, new_state_hash, reason, request_id, session_id, source, visibility
  ) values (
    coalesce((new_state->>'workspace_id')::uuid, (old_state->>'workspace_id')::uuid),
    actor,
    case when actor is null then 'service' else 'user' end,
    lower(tg_op), tg_table_name, row_id,
    case when old_state is null then null else private.trust_state_hash(old_state) end,
    case when new_state is null then null else private.trust_state_hash(new_state) end,
    coalesce(current_setting('request.headers', true)::jsonb->>'x-audit-reason', tg_table_name || ' ' || lower(tg_op)),
    current_setting('request.headers', true)::jsonb->>'x-request-id',
    current_setting('request.jwt.claims', true)::jsonb->>'session_id',
    case when actor is null then 'automation' else 'human' end,
    case when tg_table_name in ('consent_records','policy_acceptances','privacy_requests','data_exports','deletion_jobs') then 'user' else 'restricted' end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'compliance_decisions','policy_acceptances','consent_records','seller_verifications','product_safety_profiles',
    'content_reports','moderation_cases','moderation_actions','appeals','privacy_requests','data_exports','deletion_jobs',
    'ai_decision_reviews','payout_restrictions','product_recalls','subscription_cancellations'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.trust_audit_row_change()', 'trust_audit_' || table_name, table_name);
  end loop;
end;
$$;

-- Seed the legal-document inventory without overwriting or pretending the documents are legally approved.
insert into public.policy_documents (document_code, title, owner_team, status)
values
  ('terms', 'Terms of Service', 'legal', 'active'),
  ('seller_terms', 'Seller Terms', 'legal', 'active'),
  ('buyer_terms', 'Buyer Terms', 'legal', 'active'),
  ('privacy', 'Privacy Policy', 'privacy', 'active'),
  ('cookies', 'Cookie Policy', 'privacy', 'active'),
  ('acceptable_use', 'Acceptable Use Policy', 'trust', 'active'),
  ('community_guidelines', 'Community Guidelines', 'trust', 'active'),
  ('refund', 'Refund Policy', 'legal', 'active'),
  ('subscription', 'Subscription Terms', 'legal', 'active'),
  ('copyright', 'Copyright Policy', 'trust', 'active'),
  ('product_safety', 'Product Safety Policy', 'safety', 'active'),
  ('ai', 'AI Policy', 'ai_governance', 'active'),
  ('developer', 'Developer Terms', 'developer', 'active'),
  ('api', 'API Terms', 'developer', 'active'),
  ('security', 'Security Policy', 'security', 'active'),
  ('accessibility', 'Accessibility Statement', 'accessibility', 'active'),
  ('investment', 'Investment Disclosures', 'legal', 'active'),
  ('creator', 'Creator Program Terms', 'legal', 'active'),
  ('affiliate', 'Affiliate Terms', 'legal', 'active')
on conflict (document_code) do nothing;

insert into public.policy_versions (
  document_id, version_id, effective_at, regions, languages, fallback_language, change_summary,
  content_uri, content_sha256, translation_review_status, approval_status, published,
  renewed_acceptance_required, affected_user_groups, published_at
)
select d.id,
  '2026-07-22-' || d.document_code,
  '2026-07-22 00:00:00+00'::timestamptz,
  array['*']::text[], array['en']::text[], 'en',
  'Imported into immutable Trust Center versioning; qualified review required before renewed acceptance.',
  case d.document_code
    when 'terms' then '/terms'
    when 'privacy' then '/privacy'
    when 'cookies' then '/cookies'
    when 'security' then '/.well-known/security.txt'
    else '/trust/policies/' || d.document_code
  end,
  encode(extensions.digest(('2026-07-22-' || d.document_code)::bytea, 'sha256'), 'hex'),
  'pending', 'review_required', d.document_code in ('terms','privacy','cookies'), false,
  case when d.document_code = 'seller_terms' then array['business_sellers']::text[] else array['all_users']::text[] end,
  case when d.document_code in ('terms','privacy','cookies') then now() else null end
from public.policy_documents d
on conflict (version_id) do nothing;

insert into public.platform_feature_flags (flag_key, enabled, reason)
values
  ('invest_transactions_enabled', false, 'Requires licensed partner, Stripe approval and legal approval'),
  ('internal_wallet_enabled', false, 'Requires payment and e-money licensing review'),
  ('seller_payouts_enabled', false, 'Requires provider verification and payout controls'),
  ('ai_autonomous_actions_enabled', false, 'Consequential autonomous actions require governance approval'),
  ('minor_accounts_enabled', false, 'Requires country-specific age and guardian controls'),
  ('physical_products_enabled', false, 'Requires product-safety operations and recall readiness'),
  ('regulated_products_enabled', false, 'Requires category-specific professional review'),
  ('cross_border_sales_enabled', false, 'Requires country, tax and product rule configuration')
on conflict (flag_key, country_code, workspace_id, user_role, product_category, seller_risk, cohort) do nothing;

insert into public.retention_rules (data_category, retention_days, action, legal_basis, policy_version)
values
  ('accounts', 30, 'review', 'Contract closure and legal-claim assessment', '2026-07-22-privacy'),
  ('deleted_accounts', 30, 'anonymize', 'Deletion request completion subject to exceptions', '2026-07-22-privacy'),
  ('payments', 2555, 'archive', 'Accounting and legal obligations', '2026-07-22-privacy'),
  ('invoices', 2555, 'archive', 'Tax recordkeeping', '2026-07-22-privacy'),
  ('security_logs', 365, 'delete', 'Security and abuse prevention', '2026-07-22-privacy'),
  ('ai_conversations', 90, 'delete', 'Service operation and user control', '2026-07-22-ai'),
  ('uploaded_files', 30, 'delete', 'Account closure transition period', '2026-07-22-privacy'),
  ('moderation_evidence', 1095, 'review', 'Platform integrity and legal claims', '2026-07-22-acceptable_use'),
  ('kyc_references', 1825, 'review', 'Provider and financial obligations', '2026-07-22-seller_terms'),
  ('marketing_events', 180, 'delete', 'Consent-based analytics minimization', '2026-07-22-cookies'),
  ('support_conversations', 730, 'review', 'Support and legal claims', '2026-07-22-privacy'),
  ('tax_records', 2555, 'archive', 'Tax recordkeeping', '2026-07-22-privacy'),
  ('backups', 35, 'delete', 'Rolling disaster-recovery window', '2026-07-22-security')
on conflict (data_category, country_code) do nothing;

create or replace function private.trust_flag_enabled(
  requested_flag text,
  requested_country text default '*',
  requested_workspace uuid default null,
  requested_role text default '*',
  requested_category text default '*',
  requested_risk text default '*',
  requested_cohort text default '*'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce((
    select f.enabled
    from public.platform_feature_flags f
    where f.flag_key = requested_flag
      and f.country_code in ('*', coalesce(nullif(upper(requested_country), ''), '*'))
      and (f.workspace_id is null or f.workspace_id = requested_workspace)
      and f.user_role in ('*', coalesce(requested_role, '*'))
      and f.product_category in ('*', coalesce(requested_category, '*'))
      and f.seller_risk in ('*', coalesce(requested_risk, '*'))
      and f.cohort in ('*', coalesce(requested_cohort, '*'))
    order by
      (f.workspace_id is not null) desc,
      (f.country_code <> '*') desc,
      (f.user_role <> '*') desc,
      (f.product_category <> '*') desc,
      f.updated_at desc
    limit 1
  ), false);
$$;

-- Keep a fresh database portable while still requiring every pre-existing
-- investment-platform approval gate when that module is installed.
create or replace function private.trust_investment_live_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  allowed boolean := false;
begin
  if to_regprocedure('public.investment_live_payments_allowed()') is null then
    return false;
  end if;
  execute 'select public.investment_live_payments_allowed()' into allowed;
  return coalesce(allowed, false);
end;
$$;

create or replace function private.trust_evaluate_action(actor_id uuid, requested_action text, supplied_context jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  ctx jsonb := coalesce(supplied_context, '{}'::jsonb) - array['email','ip','phone','address'];
  profile public.compliance_profiles%rowtype;
  listing public.listings%rowtype;
  seller_check public.dsa_seller_verifications%rowtype;
  required_actions jsonb := '[]'::jsonb;
  blocking_issues jsonb := '[]'::jsonb;
  warnings jsonb := '[]'::jsonb;
  disclosures jsonb := '[]'::jsonb;
  country text;
  policy_version text := 'trust-core-2026-07-22';
  audit_reason text := 'No additional controls were required for this action.';
  decision_allowed boolean := true;
  decision_id uuid;
  listing_id uuid;
  seller_id uuid;
  is_digital boolean := false;
  is_physical boolean := false;
begin
  if requested_action not in ('checkout','seller_publish','payout','invest_transaction','ai_consequential_action','data_export','account_delete','subscription_cancel') then
    raise exception 'Unsupported Trust Center action';
  end if;

  select * into profile from public.compliance_profiles p
  where p.user_id = actor_id and (p.workspace_id is null or p.workspace_id = nullif(ctx->>'workspace_id','')::uuid)
  order by (p.workspace_id is not null) desc limit 1;
  country := upper(coalesce(nullif(profile.country_code,''), nullif(ctx->>'country_code',''), ''));

  if nullif(ctx->>'listing_id','') is not null then
    listing_id := (ctx->>'listing_id')::uuid;
    select * into listing from public.listings l where l.id = listing_id;
    if not found then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','listing_not_found','title','This item is unavailable','explanation','The requested listing could not be found.'));
    else
      seller_id := listing.seller_id;
      is_digital := lower(listing.type) = any(array['digital','course','software','asset_3d','music','beat','template','virtual','community']);
      is_physical := lower(listing.type) = any(array['physical','pos']);
    end if;
  end if;

  if profile.age_band in ('under_13','13_15','16_17') and requested_action in ('invest_transaction','ai_consequential_action','payout') then
    blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','age_restricted','title','This feature is age-restricted','explanation','A verified adult or guardian flow is required for this action.'));
  end if;

  if requested_action = 'checkout' then
    if listing.id is not null and coalesce(listing.status,'draft') not in ('active','published') then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','listing_not_published','title','This item is not for sale','explanation','The seller has not published this item.'));
    end if;
    disclosures := disclosures || jsonb_build_array(
      jsonb_build_object('code','seller_capacity','title','Who you are buying from','explanation','The checkout identifies whether the seller is a business or a private seller.'),
      jsonb_build_object('code','payment_provider','title','Secure payment','explanation','Stripe processes the payment. Wersee does not hold funds as a bank or escrow provider.')
    );
    if is_digital then
      required_actions := required_actions || jsonb_build_array(jsonb_build_object(
        'code','digital_delivery_consent','title','Start digital delivery now','explanation','Choose whether delivery should start immediately and acknowledge the effect on withdrawal rights.','action','Confirm both unchecked choices before paying.'
      ));
      if coalesce((ctx->>'immediate_delivery_requested')::boolean, false) is not true
        or coalesce((ctx->>'withdrawal_effect_acknowledged')::boolean, false) is not true then
        blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','digital_delivery_consent_required','title','Your choice is required','explanation','Immediate digital delivery cannot start until both choices are explicitly confirmed.'));
      end if;
    end if;
    if is_physical and not private.trust_flag_enabled('physical_products_enabled', country, nullif(ctx->>'workspace_id','')::uuid, '*', coalesce(listing.category,'*'), coalesce(profile.risk_level,'*'), '*') then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','physical_products_disabled','title','Physical-product sales are not enabled','explanation','Product-safety and recall controls require review before this category can be sold.'));
    end if;
    audit_reason := 'Checkout price, seller capacity, product type and required consent were evaluated server-side.';
  elsif requested_action = 'seller_publish' then
    seller_id := coalesce(seller_id, actor_id);
    select * into seller_check from public.dsa_seller_verifications d where d.seller_id = seller_id;
    if seller_check.trader_status = 'business' and upper(seller_check.country_code) = any(array['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])
      and (seller_check.status not in ('pending','verified') or nullif(seller_check.legal_name,'') is null or nullif(seller_check.registered_address,'') is null) then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','seller_traceability_required','title','Complete seller details','explanation','EU business sellers must provide traceability details before publishing.'));
    end if;
    if is_physical then
      if not private.trust_flag_enabled('physical_products_enabled', country, nullif(ctx->>'workspace_id','')::uuid, '*', coalesce(listing.category,'*'), coalesce(profile.risk_level,'*'), '*') then
        blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','physical_products_disabled','title','Physical products need review','explanation','This category is disabled until safety and recall controls are active.'));
      end if;
      if not exists (select 1 from public.product_safety_profiles s where s.listing_id = listing_id and s.status = 'complete') then
        blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','product_safety_incomplete','title','Add product-safety details','explanation','Manufacturer, identification, warnings and recall contact details are required for this product.'));
      end if;
    end if;
    audit_reason := 'Seller traceability and category-specific publication controls were evaluated server-side.';
  elsif requested_action = 'payout' then
    if not private.trust_flag_enabled('seller_payouts_enabled', country, nullif(ctx->>'workspace_id','')::uuid, '*', '*', coalesce(profile.risk_level,'*'), '*') then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','payouts_disabled','title','Payouts require review','explanation','Payouts remain with the regulated provider until verification and risk controls are active.'));
    end if;
    if not exists (select 1 from public.seller_verifications s where s.user_id = actor_id and s.status = 'verified') then
      required_actions := required_actions || jsonb_build_array(jsonb_build_object('code','seller_verification','title','Verify before payout','explanation','Stripe securely verifies identity and payout details.','action','Continue with Stripe verification.'));
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','seller_not_verified','title','Verification is incomplete','explanation','Payouts cannot start until provider verification is complete.'));
    end if;
    audit_reason := 'Payout feature flags, provider verification and risk restrictions were evaluated.';
  elsif requested_action = 'invest_transaction' then
    disclosures := disclosures || jsonb_build_array(jsonb_build_object('code','education_only','title','Information, not investment advice','explanation','Wersee market pages are educational and link to licensed providers where available.'));
    if not private.trust_flag_enabled('invest_transactions_enabled', country, nullif(ctx->>'workspace_id','')::uuid, '*', '*', coalesce(profile.risk_level,'*'), '*')
      or not private.trust_investment_live_allowed() then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','invest_transactions_disabled','title','Transactions are not available','explanation','Wersee cannot accept or pool investment funds until a licensed structure and required approvals are active.'));
    end if;
    audit_reason := 'Investment transactions require both the Trust Center flag and the existing licensed-provider gate.';
  elsif requested_action = 'ai_consequential_action' then
    disclosures := disclosures || jsonb_build_array(jsonb_build_object('code','ai_involved','title','AI is assisting this action','explanation','Review the proposed action, requested permissions and agent history before approval.'));
    if not private.trust_flag_enabled('ai_autonomous_actions_enabled', country, nullif(ctx->>'workspace_id','')::uuid, '*', '*', coalesce(profile.risk_level,'*'), '*')
      or coalesce((ctx->>'human_approved')::boolean, false) is not true then
      required_actions := required_actions || jsonb_build_array(jsonb_build_object('code','human_confirmation','title','Your approval is required','explanation','AI cannot complete an irreversible high-impact action alone.','action','Review and confirm the action.'));
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','human_review_required','title','Human review required','explanation','This action stays paused until an authorized person confirms it.'));
    end if;
    audit_reason := 'Consequential AI actions require an enabled governance flag and explicit human approval.';
  elsif requested_action in ('data_export','account_delete','subscription_cancel') then
    required_actions := required_actions || jsonb_build_array(jsonb_build_object('code','verified_session','title','Confirm with your signed-in session','explanation','This protects account data and consequential account changes.','action','Continue while signed in.'));
    if actor_id is null then
      blocking_issues := blocking_issues || jsonb_build_array(jsonb_build_object('code','authentication_required','title','Sign in to continue','explanation','A verified account session is required.'));
    end if;
    audit_reason := 'The request requires an authenticated session and an auditable background workflow.';
  end if;

  decision_allowed := jsonb_array_length(blocking_issues) = 0;
  select pv.version_id into policy_version
  from public.policy_versions pv join public.policy_documents pd on pd.id = pv.document_id
  where pd.document_code = case
    when requested_action in ('data_export','account_delete') then 'privacy'
    when requested_action = 'invest_transaction' then 'investment'
    when requested_action = 'seller_publish' then 'seller_terms'
    when requested_action = 'ai_consequential_action' then 'ai'
    when requested_action = 'subscription_cancel' then 'subscription'
    else 'buyer_terms'
  end and pv.published and pv.effective_at <= now()
  order by pv.effective_at desc limit 1;
  policy_version := coalesce(policy_version, 'trust-core-2026-07-22');

  insert into public.compliance_decisions (
    workspace_id,user_id,action,allowed,required_actions,blocking_issues,warnings,disclosures,
    audit_reason,policy_version,country_code,context,request_id,expires_at,created_by
  ) values (
    nullif(ctx->>'workspace_id','')::uuid,actor_id,requested_action,decision_allowed,required_actions,blocking_issues,warnings,disclosures,
    audit_reason,policy_version,nullif(country,''),ctx,ctx->>'request_id',now() + interval '15 minutes',actor_id
  ) returning id into decision_id;

  return jsonb_build_object(
    'id',decision_id,'allowed',decision_allowed,'requiredActions',required_actions,'blockingIssues',blocking_issues,
    'warnings',warnings,'disclosures',disclosures,'auditReason',audit_reason,'policyVersion',policy_version
  );
end;
$$;

create or replace function public.trust_evaluate_compliance(requested_action text, supplied_context jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path = private, public, pg_catalog
as $$
  select private.trust_evaluate_action((select auth.uid()), requested_action, supplied_context);
$$;

create or replace function public.trust_service_evaluate(actor_id uuid, requested_action text, supplied_context jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path = private, public, pg_catalog
as $$
  select private.trust_evaluate_action(actor_id, requested_action, supplied_context);
$$;

revoke all on function public.trust_evaluate_compliance(text,jsonb) from public;
revoke all on function public.trust_service_evaluate(uuid,text,jsonb) from public;
revoke all on function public.trust_service_evaluate(uuid,text,jsonb) from anon, authenticated;
grant execute on function public.trust_evaluate_compliance(text,jsonb) to anon, authenticated;
grant execute on function public.trust_service_evaluate(uuid,text,jsonb) to service_role;

-- Server-side publication enforcement: direct Data API calls cannot bypass the UI.
create or replace function private.trust_enforce_listing_publication()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  decision jsonb;
begin
  if coalesce(new.status,'draft') in ('published','active')
    and (tg_op = 'INSERT' or coalesce(old.status,'draft') not in ('published','active')) then
    decision := private.trust_evaluate_action(new.seller_id, 'seller_publish', jsonb_build_object(
      'listing_id', new.id, 'country_code', coalesce(new.metadata->>'dsa_seller_country',''), 'request_id', gen_random_uuid()::text
    ));
    if not coalesce((decision->>'allowed')::boolean, false) then
      raise exception using
        message = 'Listing publication blocked by Trust Center',
        detail = (decision->'blockingIssues')::text,
        hint = 'Complete the listed requirements and try again.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trust_enforce_listing_publication
before insert or update of status on public.listings
for each row execute function private.trust_enforce_listing_publication();

-- The prior investment reservation checked only the coarse kill switch. Require every approval gate.
create or replace function private.trust_require_investment_live_gate()
returns trigger
language plpgsql
security invoker
set search_path = private, public, pg_catalog
as $$
begin
  if not private.trust_investment_live_allowed() then
    raise exception 'Investment transactions are disabled pending licensed-provider and compliance approval';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.investment_orders') is not null then
    execute 'create trigger trust_enforce_investment_order_gate before insert on public.investment_orders for each row execute function private.trust_require_investment_live_gate()';
  end if;
end;
$$;

create or replace function private.trust_record_listing_price()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  regular_price numeric;
  sale_price_value numeric;
begin
  regular_price := coalesce(new.original_price, nullif(new.price,'')::numeric, 0);
  sale_price_value := new.sale_price;
  if tg_op = 'INSERT' or old.price is distinct from new.price or old.original_price is distinct from new.original_price then
    insert into public.price_reference_history (listing_id,seller_id,price_minor,currency,price_type)
    values (new.id,new.seller_id,round(regular_price * 100),coalesce(new.base_currency,'EUR'),'regular');
  end if;
  if sale_price_value is not null and (tg_op = 'INSERT' or old.sale_price is distinct from new.sale_price) then
    if sale_price_value >= regular_price then
      raise exception 'Sale price must be lower than the verifiable reference price';
    end if;
    insert into public.price_reference_history (listing_id,seller_id,price_minor,currency,price_type)
    values (new.id,new.seller_id,round(sale_price_value * 100),coalesce(new.base_currency,'EUR'),'sale');
  end if;
  return new;
end;
$$;

create trigger trust_record_listing_price
after insert or update of price, original_price, sale_price on public.listings
for each row execute function private.trust_record_listing_price();

-- Daily database-side lifecycle processing. File creation itself is handled by the Edge background worker.
create or replace function private.trust_process_due_jobs()
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.data_exports set status = 'expired', updated_at = now()
  where status = 'ready' and expires_at <= now();
  update public.deletion_jobs set status = 'due', updated_at = now()
  where status in ('queued','scheduled') and scheduled_for <= now();
  update public.product_compliance_documents set verification_status = 'expired', updated_at = now()
  where verification_status = 'valid' and expires_on < current_date;
  update public.seller_licenses set status = 'expired', updated_at = now()
  where status = 'valid' and expires_on < current_date;
end;
$$;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'wersee-trust-center-lifecycle';
  perform cron.schedule('wersee-trust-center-lifecycle', '17 2 * * *', 'select private.trust_process_due_jobs()');
end;
$$;

-- Private export bucket; signed downloads are issued only by the authenticated Trust Center API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trust-exports', 'trust-exports', false, 536870912, array['application/zip','application/json'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trust-evidence', 'trust-evidence', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf','text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload their own trust evidence"
on storage.objects for insert to authenticated
with check (bucket_id = 'trust-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users read their own trust evidence"
on storage.objects for select to authenticated
using (bucket_id = 'trust-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
