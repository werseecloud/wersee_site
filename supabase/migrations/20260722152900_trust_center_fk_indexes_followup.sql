create index if not exists trust_fk_policy_documents_created_by on public.policy_documents (created_by);
create index if not exists trust_fk_product_compliance_listing on public.product_compliance_documents (listing_id);
create index if not exists trust_fk_product_compliance_user on public.product_compliance_documents (user_id);
create index if not exists trust_fk_retention_rules_approved_by on public.retention_rules (approved_by);
create index if not exists trust_fk_retention_rules_created_by on public.retention_rules (created_by);
create index if not exists trust_fk_subscription_cancellations_user on public.subscription_cancellations (user_id);
create index if not exists trust_fk_subscription_cancellations_subscription on public.subscription_cancellations (user_subscription_id);
