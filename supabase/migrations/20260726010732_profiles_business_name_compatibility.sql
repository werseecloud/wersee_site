-- Older public checkout components read profiles.business_name. Keep the
-- canonical profile fields authoritative and expose a generated display-name
-- compatibility column rather than duplicating mutable data.
alter table public.profiles
  add column if not exists business_name text
  generated always as (
    coalesce(
      nullif(btrim(company_name), ''),
      nullif(btrim(full_name), ''),
      nullif(btrim(username), '')
    )
  ) stored;
