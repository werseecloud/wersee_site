# Wersee Sites operations

Wersee Sites publishes validated static website releases from the existing Wersee workspace. The control plane runs in the main `wersee` Vercel project, metadata and private staging assets live in Supabase project `pkgwzusngqwnmdfpifnd`, and public releases are immutable deployments in the dedicated `wersee-sites` Vercel project.

## `wersee.json`

Add an optional `wersee.json` to the publishing root to configure search discovery, guarded AI copy improvement, and first-party analytics. Wersee validates it, overrides runtime identity fields, and publishes a normalized public copy.

```json
{
  "$schema": "https://wersee.com/schemas/sites/wersee.v1.schema.json",
  "version": 1,
  "seo": {
    "index": true,
    "title": "Example studio",
    "description": "Clear, useful description of this website.",
    "language": "en"
  },
  "ai": {
    "improveText": false,
    "locale": "en",
    "tone": "clear"
  },
  "analytics": {
    "enabled": true,
    "respectDoNotTrack": true,
    "webVitals": true,
    "scrollDepth": true,
    "formSubmissions": true,
    "errorSignals": true,
    "goals": [
      { "id": "contact", "selector": "#contact", "event": "click" },
      { "id": "lead", "selector": "form[data-lead]", "event": "submit", "value": 25 }
    ]
  }
}
```

Custom conversions can also be recorded without sending arbitrary properties:

```html
<script>
  window.werseeAnalytics?.track('signup_complete', 25);
</script>
```

Analytics never sends form values or full page HTML. The AI copy guard receives only isolated visible text fragments and the server applies accepted replacements at the original text offsets, leaving tags, attributes, scripts, styles, assets, and file paths untouched.

When indexing is enabled, Wersee generates canonical hints, `robots.txt`, `sitemap.xml`, and an IndexNow verification file. A successful discovery submission does not guarantee that a search engine will crawl, index, or rank a URL.

## Public lifecycle

1. An owner or authorized business team member creates a site and reserves a normalized `*.wersee.com` slug transactionally.
2. The browser uploads a ZIP or folder to the private `site-upload-staging` bucket with TUS, or selects a ZIP already in Wersee Files.
3. The server materializes the source in a temporary directory, rejects traversal, links, secrets, executables, server code, unsafe MIME types, duplicate paths, and configured size/count violations.
4. Validation detects the publish root and framework, reports missing assets, optionally injects first-party analytics, and copies only the validated release to `site-preview-assets`.
5. Preview URLs contain a short-lived HMAC token and serve private release assets with restrictive security headers.
6. Publish uploads immutable file hashes to Vercel, creates a deployment in `wersee-sites`, waits for `READY`, atomically moves `<slug>.wersee.com`, verifies the alias and HTTPS response, and only then commits the release in Postgres.
7. Rollback moves the alias to a previous ready deployment and records an audit event. Deleting a release removes its private preview assets; it never silently reuses a mutable build.

## Required control-plane environment

Configure these for both Preview and Production on the main `wersee` project. Never expose the server-only values with a `VITE_` prefix.

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VERCEL_TOKEN
VERCEL_TEAM_ID
VERCEL_TEAM_SLUG
VERCEL_SITES_PROJECT_ID
VERCEL_SITES_PROJECT_SLUG
WERSEE_ROOT_DOMAIN
WERSEE_ANALYTICS_SCRIPT_URL
SITE_PREVIEW_TOKEN_SECRET
SITE_ANALYTICS_HASH_SALT
CRON_SECRET
```

The Vercel token must be allowed to upload files, create/read deployments, and assign/read aliases for project `wersee-sites` in team `raevens-projects-e99d93b2`. `SUPABASE_SERVICE_ROLE_KEY` may contain the project's current server-side Supabase secret key; it must never be shipped to the browser.

Resource and timeout limits are documented in `.env.example`. The production defaults are 100 MiB compressed, 500 MiB unpacked, 10,000 entries, 50 MiB per file, 48-hour staging retention, and an eight-minute deployment readiness timeout.

## Live resources

- Supabase migrations: `20260722144631_wersee_sites_platform.sql`, `20260722174000_wersee_sites_grants_and_storage_hardening.sql`, and `20260722174500_wersee_sites_advisor_cleanup.sql`.
- Private buckets: `site-upload-staging` and `site-preview-assets`.
- Public icon bucket: `site-icons`.
- Vercel static hosting project: `wersee-sites` (`prj_wxz9bW2odf7QdCJm9y1Y8ncPNh96`).
- Wildcard domain: `*.wersee.com`.
- Daily cleanup endpoint: `/api/sites/maintenance/cleanup`, authenticated by Vercel Cron or `CRON_SECRET`.

An unused wildcard hostname intentionally returns the branded 404 stored under `infrastructure/wersee-sites-fallback/`. A published slug only becomes authoritative after deployment and alias verification complete.

## Security and privacy notes

- Site management always authenticates the Supabase bearer token and applies owner/business role checks server-side.
- Browser clients have no direct grants to privileged Sites RPCs or analytics tables. Public events enter through the rate-limited ingestion endpoint.
- Anonymous analytics use a daily salted visitor hash. Persistent visitor identity is opt-in and only created after the site exposes explicit consent through the analytics runtime API.
- Event paths discard common sensitive query parameters; raw IP addresses are not stored.
- Legacy direct inserts into `page_views` and `clicks` are revoked. Builder-origin events are mapped to their migrated Sites record before ingestion.
- Storage policies exclude all three Sites buckets from legacy broad read policies. Preview and staging objects remain private.

## Release checks

Run from the repository root:

```powershell
npm.cmd run test:sites
npx.cmd tsc --noEmit --pretty false
npm.cmd run build
npx.cmd esbuild api/sites.ts --bundle --platform=node --format=esm --target=node20 --outfile="$env:TEMP\wersee-sites-api.mjs"
```

The repository currently has two unrelated TypeScript failures in `MoneyPosView.tsx` and `storeSearchService.ts`; report them separately from Sites validation. Do not deploy the control plane until `/api/sites/configuration` reports `configured: true`. Then verify the full workflow with a harmless fixture ZIP: upload, validation, tokenized preview, publish, HTTPS/custom headers, analytics ingestion, rollback, and deletion.

## Incident response

- If deployment creation fails, the previous alias remains active; inspect the failed publish job and its support reference.
- If alias verification fails, do not mark the release active. Retry after checking project/domain ownership and token scope.
- If suspicious upload activity appears, rotate `SITE_PREVIEW_TOKEN_SECRET`, `SITE_ANALYTICS_HASH_SALT`, `VERCEL_TOKEN`, and the Supabase server secret, then expire staging objects and review `site_audit_events`.
- To restore the wildcard fallback, deploy `infrastructure/wersee-sites-fallback` to the dedicated project and reassign `*.wersee.com`.
