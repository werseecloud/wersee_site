create index if not exists chat_message_receipts_chat_message_idx
  on public.chat_message_receipts(chat_id, message_id);
