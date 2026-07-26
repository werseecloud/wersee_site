alter table public.ads_campaigns
  add column if not exists promotion_payment_id uuid
    references public.campaign_promotion_payments(id) on delete set null;

create index if not exists ads_campaigns_promotion_payment_idx
  on public.ads_campaigns(promotion_payment_id)
  where promotion_payment_id is not null;
