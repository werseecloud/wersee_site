create or replace function public.enforce_paid_campaign_promotion_activation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.promote_on_wersee = true
    and (new.promotion_status = 'active' or new.status = 'active')
    and (
      new.promotion_payment_id is null
      or not exists (
        select 1
        from public.campaign_promotion_payments p
        where p.id = new.promotion_payment_id
          and p.campaign_id = new.id
          and p.user_id = new.user_id
          and p.status = 'paid'
      )
    )
  then
    raise exception 'A verified paid promotion is required before activation'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists ads_campaigns_require_paid_promotion on public.ads_campaigns;
create trigger ads_campaigns_require_paid_promotion
before insert or update of promote_on_wersee, promotion_status, promotion_payment_id, status
on public.ads_campaigns
for each row execute function public.enforce_paid_campaign_promotion_activation();
