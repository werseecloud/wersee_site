create index if not exists public_dm_messages_sender_user_idx
  on public.public_dm_messages(sender_user_id)
  where sender_user_id is not null;
