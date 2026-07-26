-- Explicit service-only policies keep server-managed attribution and webhook tables
-- closed to browser roles while making their intended access model auditable.
create policy affiliate_attributions_service_only
on public.affiliate_attributions
for all to service_role
using (true)
with check (true);

create policy creator_webhook_events_service_only
on public.creator_webhook_events
for all to service_role
using (true)
with check (true);
