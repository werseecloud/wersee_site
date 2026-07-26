-- Supabase project defaults can grant function execution directly to API roles.
-- The service evaluator accepts an actor id and must never be client-callable.
revoke all on function public.trust_service_evaluate(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.trust_service_evaluate(uuid,text,jsonb) to service_role;
