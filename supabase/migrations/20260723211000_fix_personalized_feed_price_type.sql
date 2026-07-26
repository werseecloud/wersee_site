create or replace function public.get_personalized_feed(
  p_session_id text,
  p_user_id uuid,
  p_limit integer default 20
)
returns table(
  id uuid,
  title text,
  category text,
  price numeric,
  personal_score double precision
)
language plpgsql
security invoker
as $function$
declare
  v_affinities jsonb;
begin
  select category_affinities
  into v_affinities
  from public.wersee_shadow_profiles
  where session_id = p_session_id
     or (p_user_id is not null and user_id = p_user_id)
  order by last_active desc
  limit 1;

  return query
  select
    l.id,
    l.title,
    l.category,
    case
      when btrim(l.price) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$'
        then btrim(l.price)::numeric
      else null::numeric
    end as price,
    (
      coalesce(s.global_score, 0)
      + coalesce((v_affinities ->> l.category)::double precision, 0) * 0.05
    )::double precision as personal_score
  from public.listings as l
  left join public.wersee_listing_stats as s
    on l.id = s.listing_id
  where l.status = 'active'
  order by personal_score desc
  limit greatest(coalesce(p_limit, 20), 0);
end;
$function$;
