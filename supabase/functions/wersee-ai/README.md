# Wersee AI Edge Function

This is the server-side orchestration boundary for Wersee AI. Browser clients authenticate with their Supabase access token; provider credentials never enter the browser bundle.

## Required secrets

For local serving, configure the Supabase URL/server keys and at least one provider key from `.env.example`. Deployed Supabase Edge Functions receive the standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` secrets from Supabase; do not duplicate those reserved values in the production secrets file. `WERSEE_AI_PROVIDER` sets the preferred provider. Configured providers are attempted in a deterministic fallback order, and the recorded model/provider reflect the provider that actually answered.

Never use a `VITE_*` variable for private provider credentials.

## Local validation

```powershell
npx.cmd -y deno check --config supabase/functions/wersee-ai/deno.json supabase/functions/wersee-ai/index.ts
npm.cmd run test:ai
```

## Coordinated deployment

Resolve Supabase migration-history drift before applying migrations. Then release the database migration, this function, and the matching frontend as one coordinated change:

```powershell
npx.cmd supabase secrets set --project-ref pkgwzusngqwnmdfpifnd --env-file .env.wersee-ai.production
npx.cmd supabase db push --project-ref pkgwzusngqwnmdfpifnd
npx.cmd supabase functions deploy wersee-ai --project-ref pkgwzusngqwnmdfpifnd --verify-jwt
npm.cmd run build
```

Do not commit `.env.wersee-ai.production`. After deployment, test with an authenticated non-owner, member, owner, and unauthenticated session; inspect `ai_audit_logs`, `ai_usage_events`, and provider logs without copying secrets into tickets or screenshots.
