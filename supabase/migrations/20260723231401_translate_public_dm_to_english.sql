alter table public.public_dm_settings
  alter column consent_message set default
    'I agree that my personal data may be processed to respond to this message.',
  alter column title set default 'Send me a message',
  alter column description set default 'Contact me directly through Wersee.',
  alter column preset_topics set default
    array['Collaboration', 'Support', 'Question']::text[],
  alter column thank_you_message set default
    'Thank you. Your message was sent securely.';

update public.public_dm_settings
set consent_message =
  'I agree that my personal data may be processed to respond to this message.'
where consent_message =
  'Ik ga ermee akkoord dat mijn gegevens worden verwerkt om op dit bericht te reageren.';

update public.public_dm_settings
set title = 'Send me a message'
where title = 'Stuur mij een bericht';

update public.public_dm_settings
set description = 'Contact me directly through Wersee.'
where description = 'Neem rechtstreeks contact op via Wersee.';

update public.public_dm_settings
set preset_topics = array['Collaboration', 'Support', 'Question']::text[]
where preset_topics = array['Samenwerking', 'Support', 'Vraag']::text[];

update public.public_dm_settings
set thank_you_message = 'Thank you. Your message was sent securely.'
where thank_you_message = 'Bedankt. Je bericht is veilig verstuurd.';

create or replace function private.notify_public_dm_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings_row public.public_dm_settings%rowtype;
  sender_label text;
begin
  select * into settings_row
  from public.public_dm_settings
  where user_id = new.owner_id;

  sender_label := coalesce(nullif(new.guest_name, ''), 'New sender');

  insert into public.notifications (
    user_id, type, category, title, message, data, read
  )
  values (
    new.owner_id,
    'public_dm',
    'messages',
    'New public DM',
    sender_label || ' sent you a message.',
    jsonb_build_object(
      'url', '/workspace/chats?section=dms&public_dm=' || new.id,
      'submission_id', new.id,
      'label', new.label,
      'push_enabled', coalesce(settings_row.push_notifications, true),
      'quiet_hours_enabled', coalesce(settings_row.quiet_hours_enabled, false)
    ),
    false
  );

  return new;
end;
$$;
