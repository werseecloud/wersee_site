create or replace function private.after_chat_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preview text;
begin
  v_preview := case
    when new.type = 'voice' or new.audio_url is not null then 'Voice message'
    when new.type = 'image' or new.image_url is not null then 'Image attachment'
    when new.type in ('file', 'pdf', 'spreadsheet', 'document', 'video') then 'File attachment'
    when new.type in ('invoice', 'payment_link', 'quick_link') then 'Shared link'
    when new.is_encrypted then 'Encrypted message'
    else left(coalesce(new.content, 'New message'), 120)
  end;

  insert into public.chat_message_receipts(message_id, chat_id, user_id)
  select new.id, new.chat_id, participant.user_id
  from public.chat_participants participant
  where participant.chat_id = new.chat_id
    and participant.user_id <> new.sender_id
  on conflict (message_id, user_id) do nothing;

  update public.chats
  set
    updated_at = now(),
    last_message_at = new.created_at,
    last_message = v_preview,
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('last_message_encrypted', coalesce(new.is_encrypted, false))
  where id = new.chat_id;

  if jsonb_typeof(new.attachments) = 'array' then
    insert into public.chat_message_attachments(
      message_id,
      chat_id,
      uploader_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes,
      kind,
      duration_seconds,
      width,
      height,
      metadata
    )
    select
      new.id,
      new.chat_id,
      new.sender_id,
      attachment ->> 'path',
      coalesce(attachment ->> 'name', 'Attachment'),
      coalesce(attachment ->> 'mimeType', 'application/octet-stream'),
      case
        when coalesce(attachment ->> 'size', '') ~ '^[0-9]+$'
          then (attachment ->> 'size')::bigint
        else 0
      end,
      case
        when attachment ->> 'kind' in ('image', 'audio', 'video', 'pdf', 'spreadsheet', 'document', 'file')
          then attachment ->> 'kind'
        else 'file'
      end,
      case
        when coalesce(attachment ->> 'duration', '') ~ '^[0-9]+([.][0-9]+)?$'
          then (attachment ->> 'duration')::numeric
        else null
      end,
      case
        when coalesce(attachment ->> 'width', '') ~ '^[0-9]+$'
          then (attachment ->> 'width')::integer
        else null
      end,
      case
        when coalesce(attachment ->> 'height', '') ~ '^[0-9]+$'
          then (attachment ->> 'height')::integer
        else null
      end,
      attachment - array['path', 'name', 'mimeType', 'size', 'kind', 'duration', 'width', 'height']
    from jsonb_array_elements(new.attachments) attachment
    where nullif(attachment ->> 'path', '') is not null
    on conflict (message_id, storage_path) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.after_chat_message_insert() from public, anon, authenticated;
