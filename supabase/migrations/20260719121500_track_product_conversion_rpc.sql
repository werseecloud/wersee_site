create or replace function public.track_product_conversion(
  p_listing_id uuid,
  p_session_id text,
  p_event_type text,
  p_surface text default 'unknown',
  p_card_variant text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_session_id is null
    or length(p_session_id) < 8
    or length(p_session_id) > 200
    or p_event_type not in ('impression', 'click', 'view', 'add_to_cart', 'checkout_started')
    or p_surface not in ('home', 'search', 'storefront', 'feed', 'product', 'checkout', 'unknown')
    or (p_card_variant is not null and p_card_variant not in ('a', 'b'))
  then
    return false;
  end if;

  if not exists (
    select 1
    from public.listings
    where id = p_listing_id
      and status in ('active', 'published')
  ) then
    return false;
  end if;

  insert into public.product_conversion_events (
    listing_id,
    user_id,
    session_id,
    event_type,
    card_variant,
    surface
  ) values (
    p_listing_id,
    auth.uid(),
    p_session_id,
    p_event_type,
    p_card_variant,
    p_surface
  );

  return true;
end;
$$;

revoke all on function public.track_product_conversion(uuid, text, text, text, text) from public;
grant execute on function public.track_product_conversion(uuid, text, text, text, text) to anon, authenticated;
