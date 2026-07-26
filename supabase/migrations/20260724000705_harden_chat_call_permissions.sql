revoke insert on table public.chat_calls from authenticated;
grant insert (chat_id, initiated_by, type, name)
  on table public.chat_calls
  to authenticated;

revoke all on function private.close_stale_chat_calls() from public;
