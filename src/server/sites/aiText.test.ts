import { describe, expect, it } from 'vitest';
import { improveVisibleHtmlText } from './aiText';

describe('AI text guard', () => {
  it('shares only visible text fragments and preserves HTML structure, attributes, scripts and styles byte-for-byte', async () => {
    const html = '<!doctype html><html><head><style>.hero{color:red}</style></head><body><a href="/buy" data-price="19">koop nu</a><script>window.copy="koop nu"</script></body></html>';
    let shared: unknown = null;
    const result = await improveVisibleHtmlText(html, async (request) => {
      shared = request;
      return '{"replacements":[{"id":"text_1","text":"Koop nu"}]}';
    }, { locale: 'nl', tone: 'clear' });
    expect(shared).toEqual(expect.objectContaining({ fragments: [{ id: 'text_1', text: 'koop nu' }] }));
    expect(result.html).toBe('<!doctype html><html><head><style>.hero{color:red}</style></head><body><a href="/buy" data-price="19">Koop nu</a><script>window.copy="koop nu"</script></body></html>');
    expect(result.changedTextNodes).toBe(1);
  });

  it('ignores unknown replacement IDs', async () => {
    const html = '<p>Hello world</p>';
    const result = await improveVisibleHtmlText(html, async () => '{"replacements":[{"id":"text_999","text":"Changed"}]}', { locale: 'en', tone: 'clear' });
    expect(result.html).toBe(html);
    expect(result.changedTextNodes).toBe(0);
  });
});
