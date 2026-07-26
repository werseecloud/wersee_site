-- Cover Trust Center foreign keys so lifecycle deletes and joins do not scan
-- entire workflow tables as operational volume grows.
do $$
declare
  fk record;
begin
  for fk in
    select
      c.conrelid::regclass as table_ref,
      r.relname as table_name,
      c.conname as constraint_name,
      string_agg(quote_ident(a.attname), ', ' order by k.ordinality) as columns_sql
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    join pg_namespace n on n.oid = r.relnamespace
    cross join lateral unnest(c.conkey) with ordinality as k(attnum, ordinality)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and r.relname = any(array[
        'trust_roles','platform_feature_flags','policy_versions','compliance_profiles','compliance_requirements',
        'compliance_decisions','policy_acceptances','seller_verifications','seller_licenses','seller_tax_profiles',
        'seller_risk_reviews','product_safety_profiles','product_compliance_documents','product_recalls','recall_customers',
        'content_reports','moderation_cases','moderation_actions','appeals','statements_of_reasons','privacy_requests',
        'consent_records','deletion_jobs','data_exports','processing_activities','subprocessors','dpia_records',
        'security_incidents','vulnerability_reports','ai_systems','ai_evaluations','ai_decision_reviews',
        'financial_ledger_entries','payout_restrictions','tax_reporting_periods','tax_reporting_entries',
        'copyright_claims','copyright_counterclaims','accessibility_issues','authority_requests','checkout_snapshots',
        'digital_delivery_consents','consumer_rights_requests','subscription_cancellations','compliance_audit_events',
        'price_reference_history'
      ])
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and c.conkey <@ (i.indkey::smallint[])
      )
    group by c.conrelid, r.relname, c.conname
  loop
    execute format(
      'create index if not exists %I on %s (%s)',
      left('trust_fk_' || fk.table_name || '_' || fk.constraint_name, 63),
      fk.table_ref,
      fk.columns_sql
    );
  end loop;
end;
$$;
