import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

let migration = '';
let intelligenceMigration = '';

beforeAll(async () => {
  const migrationPath = fileURLToPath(new URL('../../../supabase/migrations/20260722144631_wersee_sites_platform.sql', import.meta.url));
  migration = await readFile(migrationPath, 'utf8');
  const intelligencePath = fileURLToPath(new URL('../../../supabase/migrations/20260725223100_wersee_sites_intelligence_and_advanced_analytics.sql', import.meta.url));
  intelligenceMigration = await readFile(intelligencePath, 'utf8');
});

describe('Wersee Sites migration contracts', () => {
  it('serializes and transactionally claims site slugs', () => {
    expect(migration).toContain("pg_advisory_xact_lock(hashtextextended('wersee-site-slug:'");
    expect(migration).toMatch(/insert into public\.site_slug_claims[\s\S]+on conflict \(slug\) do update/);
    expect(migration).toContain("message = 'SITE_SLUG_UNAVAILABLE'");
  });

  it('returns an existing publish job for the same idempotency key and blocks concurrent jobs', () => {
    expect(migration).toContain('unique (release_id, idempotency_key)');
    expect(migration).toContain('if existing_job.id is not null then return existing_job; end if;');
    expect(migration).toContain("message = 'SITE_PUBLISH_IN_PROGRESS'");
    expect(migration).toMatch(/create unique index site_one_active_deployment_job[\s\S]+where status in \('created', 'running'\)/);
  });

  it('rolls back by switching the active immutable release without rebuilding', () => {
    expect(migration).toContain('create or replace function public.complete_site_rollback');
    expect(migration).toContain('set active_release_id = target_release_id');
    expect(migration).toContain("'rollback', jsonb_build_object('release_id', target_release_id)");
  });

  it('keeps advanced events server-ingested and manager-scoped', () => {
    expect(intelligenceMigration).toContain("'conversion','form_submit','web_vital','scroll_depth','site_error'");
    expect(intelligenceMigration).toContain('alter table public.site_analytics_metrics_daily enable row level security');
    expect(intelligenceMigration).toContain('create policy site_metrics_managers_read');
    expect(intelligenceMigration).toContain('revoke all on function public.ingest_site_analytics_event(jsonb) from public');
    expect(intelligenceMigration).toContain('grant execute on function public.ingest_site_analytics_event(jsonb) to service_role');
  });
});
