insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'payment-link-media',
  'payment-link-media',
  true,
  536870912,
  array['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.storage_gateway_buckets (
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  enabled,
  write_provider,
  read_mode,
  fallback_to_supabase,
  updated_at
)
values (
  'payment-link-media',
  true,
  536870912,
  array['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  true,
  'strato',
  'hybrid',
  true,
  now()
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  enabled = excluded.enabled,
  write_provider = excluded.write_provider,
  read_mode = excluded.read_mode,
  fallback_to_supabase = excluded.fallback_to_supabase,
  updated_at = now();
