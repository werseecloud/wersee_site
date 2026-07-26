import { describe, expect, it } from 'vitest';
import { parseWerseeManifestText } from './manifest';

const defaults = {
  siteId: '00000000-0000-4000-8000-000000000101',
  releaseId: '00000000-0000-4000-8000-000000000102',
  publicUrl: 'https://example.wersee.com',
  indexingEnabled: true,
  analyticsEnabled: true,
  aiTextEnhancementEnabled: false,
};

describe('wersee.json', () => {
  it('normalizes safe SEO, AI and analytics configuration with managed runtime identity', () => {
    const manifest = parseWerseeManifestText(JSON.stringify({
      $schema: 'https://example.com/custom-schema.json',
      version: 1,
      seo: { language: 'nl', title: 'Voorbeeld' },
      ai: { improveText: true, locale: 'nl', tone: 'clear' },
      analytics: { goals: [{ id: 'contact', selector: '#contact', event: 'click' }] },
    }), defaults);
    expect(manifest.runtime).toMatchObject({ siteId: defaults.siteId, releaseId: defaults.releaseId, publicUrl: defaults.publicUrl });
    expect(manifest.$schema).toBe('https://wersee.com/schemas/sites/wersee.v1.schema.json');
    expect(manifest.seo).toMatchObject({ index: true, sitemap: true, language: 'nl' });
    expect(manifest.ai.improveText).toBe(true);
    expect(manifest.analytics.goals[0]).toEqual({ id: 'contact', selector: '#contact', event: 'click' });
  });

  it('lets platform settings disable indexing and analytics authoritatively', () => {
    const manifest = parseWerseeManifestText('{"version":1}', { ...defaults, indexingEnabled: false, analyticsEnabled: false });
    expect(manifest.seo.index).toBe(false);
    expect(manifest.seo.sitemap).toBe(false);
    expect(manifest.analytics.enabled).toBe(false);
  });

  it('rejects unknown fields and unsafe oversized goals', () => {
    expect(() => parseWerseeManifestText('{"version":1,"secret":"value"}', defaults)).toThrow(/WERSEE_MANIFEST_INVALID/);
    expect(() => parseWerseeManifestText(JSON.stringify({ version: 1, analytics: { goals: [{ id: 'bad goal', selector: 'a' }] } }), defaults)).toThrow(/WERSEE_MANIFEST_INVALID/);
  });
});
