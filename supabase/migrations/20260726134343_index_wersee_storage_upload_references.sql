create index if not exists storage_gateway_uploads_bucket_idx
  on public.storage_gateway_uploads (bucket_id);

create index if not exists storage_gateway_uploads_object_idx
  on public.storage_gateway_uploads (object_id)
  where object_id is not null;

create index if not exists storage_gateway_uploads_workspace_idx
  on public.storage_gateway_uploads (workspace_id)
  where workspace_id is not null;
