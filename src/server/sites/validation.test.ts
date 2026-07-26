import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SourceFile } from './types';
import { detectWebsiteRoots, validatePreparedSite } from './validation';

const temporaryDirectories: string[] = [];

const fixture = async (files: Record<string, string>): Promise<SourceFile[]> => {
  const directory = await mkdtemp(path.join(tmpdir(), 'wersee-sites-test-'));
  temporaryDirectories.push(directory);
  const result: SourceFile[] = [];
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(directory, ...filePath.split('/'));
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
    result.push({ path: filePath, absolutePath, size: Buffer.byteLength(content) });
  }
  return result;
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const options = () => ({
  analyticsEnabled: true,
  analyticsScriptUrl: 'https://wersee.com/sites/analytics.js',
  siteId: crypto.randomUUID(),
  releaseId: crypto.randomUUID(),
  siteUrl: 'https://fixture.wersee.com',
  indexingEnabled: true,
  aiTextEnhancementEnabled: false,
  indexNowKey: '1234567890abcdef1234567890abcdef',
  maxUnpackedBytes: 10 * 1024 * 1024,
  maxFileCount: 100,
  maxSingleFileBytes: 2 * 1024 * 1024,
});

describe('static site validation', () => {
  it('detects conventional static output roots', () => {
    expect(detectWebsiteRoots(['package.json', 'dist/index.html', 'dist/assets/app.js'])).toEqual(['dist']);
    expect(detectWebsiteRoots(['project/build/index.html', 'project/build/app.js'])).toContain('project/build');
  });

  it('prepares a valid site, validates references and injects analytics', async () => {
    const files = await fixture({
      'dist/index.html': '<!doctype html><html><head><link rel="icon" href="/favicon.ico"></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>',
      'dist/assets/app.js': 'document.querySelector("#root").textContent = "Hello";',
      'dist/favicon.ico': 'icon',
    });
    const result = await validatePreparedSite(files, { ...options(), selectedRoot: 'dist' });
    expect(result.report.publishable).toBe(true);
    expect(result.report.detectedRoot).toBe('dist');
    expect(result.report.detectedSpa).toBe(true);
    expect(result.report.missingReferencedAssets).toEqual([]);
    expect(result.report.analyticsInjectionStatus).toBe('injected');
    expect(result.report.seo).toMatchObject({ indexingEnabled: true, sitemapGenerated: true, robotsGenerated: true, indexNowPrepared: true });
    expect(result.report.werseeManifestStatus).toBe('generated');
    const index = result.files.find((file) => file.path === 'index.html');
    expect(index).toBeDefined();
    expect(await readFile(index!.absolutePath, 'utf8')).toContain('data-wersee-site-id');
  });

  it('publishes one standalone HTML5 file as a complete website', async () => {
    const files = await fixture({
      'index.html': '<!doctype html><html><head><style>body{font-family:sans-serif}</style></head><body><main>Hello</main><script>document.body.dataset.ready="true"</script></body></html>',
    });
    const result = await validatePreparedSite(files, { ...options(), selectedRoot: '' });
    expect(result.report.publishable).toBe(true);
    expect(result.report.detectedRoot).toBe('');
    expect(result.report.totalFiles).toBe(5);
    expect(result.files.map((file) => file.path)).toEqual(expect.arrayContaining(['index.html', 'wersee.json', 'robots.txt', 'sitemap.xml', '1234567890abcdef1234567890abcdef.txt']));
  });

  it('persists managed SEO metadata when analytics is disabled', async () => {
    const files = await fixture({
      'index.html': '<!doctype html><html><head></head><body><h1>Hello</h1></body></html>',
      'wersee.json': JSON.stringify({ version: 1, analytics: { enabled: false } }),
    });
    const result = await validatePreparedSite(files, { ...options(), analyticsEnabled: false, selectedRoot: '' });
    const index = result.files.find((file) => file.path === 'index.html');
    const html = await readFile(index!.absolutePath, 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://fixture.wersee.com/">');
    expect(html).not.toContain('data-wersee-site-id');
  });

  it('requires explicit selection when more than one publish root exists', async () => {
    const files = await fixture({ 'dist/index.html': '<html></html>', 'build/index.html': '<html></html>' });
    const result = await validatePreparedSite(files, options());
    expect(result.report.publishable).toBe(false);
    expect(result.report.validRoots.sort()).toEqual(['build', 'dist']);
    expect(result.report.errors.map((issue) => issue.code)).toContain('MULTIPLE_SITE_ROOTS');
  });

  it('rejects secrets even when a static index is present', async () => {
    const files = await fixture({ 'index.html': '<html></html>', '.env': 'SECRET=value' });
    const result = await validatePreparedSite(files, { ...options(), selectedRoot: '' });
    expect(result.report.publishable).toBe(false);
    expect(result.report.errors.map((issue) => issue.code)).toContain('BLOCKED_FILE');
  });

  it('rejects static files whose MIME type cannot be determined safely', async () => {
    const files = await fixture({ 'index.html': '<html></html>', 'payload.werseeunknown': 'opaque' });
    const result = await validatePreparedSite(files, { ...options(), selectedRoot: '' });
    expect(result.report.publishable).toBe(false);
    expect(result.report.errors.map((issue) => issue.code)).toContain('MIME_UNKNOWN');
  });

  it('uses wersee.json to configure safe AI text enhancement without changing scripts', async () => {
    const files = await fixture({
      'index.html': '<!doctype html><html><head></head><body><h1>welkom bij ons</h1><script>const label = "do not change";</script></body></html>',
      'wersee.json': JSON.stringify({ version: 1, ai: { improveText: true, locale: 'nl', tone: 'professional' } }),
    });
    const result = await validatePreparedSite(files, {
      ...options(),
      selectedRoot: '',
      improveText: async (html) => ({
        html: html.replace('welkom bij ons', 'Welkom bij ons'),
        changedTextNodes: 1,
        consideredTextNodes: 1,
      }),
    });
    const index = result.files.find((file) => file.path === 'index.html');
    const html = await readFile(index!.absolutePath, 'utf8');
    expect(html).toContain('Welkom bij ons');
    expect(html).toContain('const label = "do not change";');
    expect(result.report.aiTextEnhancement).toMatchObject({ status: 'completed', changedTextNodes: 1, filesChanged: 1 });
  });
});
