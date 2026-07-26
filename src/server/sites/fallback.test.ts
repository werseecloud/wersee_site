import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const fallbackRoot = new URL('../../../infrastructure/wersee-sites-fallback/', import.meta.url);

describe('Wersee Sites wildcard fallback', () => {
  it('renders a branded unpublished page and keeps the response non-indexable', async () => {
    const [html, vercelConfig] = await Promise.all([
      readFile(new URL('index.html', fallbackRoot), 'utf8'),
      readFile(new URL('vercel.json', fallbackRoot), 'utf8'),
    ]);

    expect(html).toContain('This site is not published yet.');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain("fetch('https://www.wersee.com/api/sites/public-directory'");
    expect(html).toContain('Verified domains managed by Wersee');
    expect(html).toContain('\\.wersee\\.com$');
    expect(html).not.toContain('image.src = site.iconUrl');
    expect(JSON.parse(vercelConfig).routes[0]).toMatchObject({ dest: '/index.html', status: 404 });
  });
});
