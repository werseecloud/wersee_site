create policy "Service role manages public DM rate limits"
on public.public_dm_rate_limits
for all
to service_role
using (true)
with check (true);

create index if not exists public_dm_blocks_blocked_user_idx
  on public.public_dm_blocks(blocked_user_id)
  where blocked_user_id is not null;
