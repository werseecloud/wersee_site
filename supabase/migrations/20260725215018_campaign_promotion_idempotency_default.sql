alter table public.campaign_promotion_payments
  alter column idempotency_key set default gen_random_uuid()::text;
