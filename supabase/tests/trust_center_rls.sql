begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

select extensions.has_table('public', 'compliance_decisions', 'compliance decisions exist');
select extensions.has_table('public', 'consent_records', 'append-only consent records exist');
select extensions.has_table('public', 'content_reports', 'content report workflow exists');
select extensions.has_table('public', 'privacy_requests', 'privacy request workflow exists');
select extensions.has_table('public', 'checkout_snapshots', 'checkout snapshots exist');
select extensions.has_table('public', 'financial_ledger_entries', 'financial ledger exists');

select extensions.ok((select relrowsecurity from pg_class where oid = 'public.compliance_decisions'::regclass), 'RLS enabled on decisions');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.consent_records'::regclass), 'RLS enabled on consent records');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.content_reports'::regclass), 'RLS enabled on reports');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.privacy_requests'::regclass), 'RLS enabled on privacy requests');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.data_exports'::regclass), 'RLS enabled on data exports');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.subscription_cancellations'::regclass), 'RLS enabled on cancellations');

select extensions.ok(exists(select 1 from pg_policies where schemaname='public' and tablename='content_reports' and cmd='INSERT' and 'authenticated'=any(roles)), 'authenticated users have scoped report insert policy');
select extensions.ok(exists(select 1 from pg_policies where schemaname='public' and tablename='privacy_requests' and cmd='SELECT' and 'authenticated'=any(roles)), 'users have scoped privacy request reads');
select extensions.ok(exists(select 1 from pg_policies where schemaname='public' and tablename='data_exports' and cmd='SELECT' and 'authenticated'=any(roles)), 'users have scoped export reads');
select extensions.ok(exists(select 1 from pg_policies where schemaname='public' and tablename='product_safety_profiles' and cmd='UPDATE' and 'authenticated'=any(roles)), 'product owners can maintain safety records');

select extensions.function_privs_are('public', 'trust_service_evaluate', array['uuid','text','jsonb'], 'service_role', array['EXECUTE'], 'service evaluator restricted to service role');
select extensions.function_privs_are('public', 'trust_evaluate_compliance', array['text','jsonb'], 'authenticated', array['EXECUTE'], 'authenticated evaluator is callable');
select extensions.ok(not has_function_privilege('anon', 'public.trust_service_evaluate(uuid,text,jsonb)', 'execute'), 'anonymous users cannot call the service evaluator');

select extensions.ok(not (select enabled from public.platform_feature_flags where flag_key='invest_transactions_enabled' and workspace_id is null order by created_at desc limit 1), 'investment transactions default off');
select extensions.ok(not (select enabled from public.platform_feature_flags where flag_key='physical_products_enabled' and workspace_id is null order by created_at desc limit 1), 'physical products default off');
select extensions.ok(not private.trust_investment_live_allowed(), 'investment live gate remains closed without all approvals');

select extensions.ok(exists(select 1 from pg_trigger where tgrelid='public.consent_records'::regclass and tgname='trust_immutable_consent_records' and not tgisinternal), 'consent records are immutable');
select extensions.ok(exists(select 1 from pg_trigger where tgrelid='public.financial_ledger_entries'::regclass and tgname='trust_immutable_financial_ledger_entries' and not tgisinternal), 'ledger entries are immutable');

select * from extensions.finish();
rollback;
