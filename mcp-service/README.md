# Wersee Business MCP

This directory is the standalone Vercel deployment root for `https://mcp.wersee.com/v1`.

- OAuth 2.1 identity is provided by Wersee's Supabase Auth server.
- Wersee RLS and the user's `mcp_servers.capabilities` allowlist authorize every call.
- Mutations require an exact, expiring, one-time confirmation.
- The service excludes secrets, arbitrary SQL, and shell access.
- `api/mcp.js` is a deployment bundle generated from `src/server/mcp/app.ts` and the shared Wersee tool registry.

Required production environment variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The Git branch and Vercel project are intentionally separate from the Wersee storefront release path.
