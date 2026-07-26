-- Replace overlapping legacy chat policies with one ownership-aware policy
-- per operation. This keeps direct messages private and avoids evaluating
-- several permissive policies for every message query.

drop policy if exists "Users view own chats" on public.chats;
drop policy if exists "Users can view chats they are in" on public.chats;
drop policy if exists "Users can view their chats" on public.chats;
drop policy if exists "Authenticated users create member chats" on public.chats;

create policy "Chat members read chats"
  on public.chats
  for select
  to authenticated
  using (
    (select auth.uid()) = any(participants)
    or public.is_chat_member(id)
  );

create policy "Chat members create chats"
  on public.chats
  for insert
  to authenticated
  with check ((select auth.uid()) = any(participants));

create policy "Chat members update chats"
  on public.chats
  for update
  to authenticated
  using (
    (select auth.uid()) = any(participants)
    or public.is_chat_member(id)
  )
  with check (
    (select auth.uid()) = any(participants)
    or public.is_chat_member(id)
  );

create policy "Chat members delete chats"
  on public.chats
  for delete
  to authenticated
  using (
    (select auth.uid()) = any(participants)
    or public.is_chat_member(id)
  );

drop policy if exists "Users can view chat participants" on public.chat_participants;
drop policy if exists "Users can view their own participation" on public.chat_participants;

create policy "Chat members read participants"
  on public.chat_participants
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_chat_member(chat_id)
  );

drop policy if exists "Users view own messages" on public.messages;
drop policy if exists "Users can insert messages in their chats" on public.messages;
drop policy if exists "Users can view messages in their chats" on public.messages;

create policy "Chat members read messages"
  on public.messages
  for select
  to authenticated
  using (public.is_chat_member(chat_id));

create policy "Chat members send messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_chat_member(chat_id)
  );

create policy "Chat members update messages"
  on public.messages
  for update
  to authenticated
  using (public.is_chat_member(chat_id))
  with check (public.is_chat_member(chat_id));

create policy "Message senders delete messages"
  on public.messages
  for delete
  to authenticated
  using (
    sender_id = (select auth.uid())
    and public.is_chat_member(chat_id)
  );
