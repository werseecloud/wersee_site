import { describe, expect, it } from 'vitest';
import { renderCdnViewer, shouldRenderCdnViewer } from '../src/cdn-viewer.js';

describe('CDN content negotiation', () => {
  it('renders the viewer only for browser HTML navigation to an image', () => {
    expect(shouldRenderCdnViewer('text/html,application/xhtml+xml,image/avif', 'image/jpeg', false)).toBe(true);
    expect(shouldRenderCdnViewer('image/avif,image/webp,image/*,*/*', 'image/jpeg', false)).toBe(false);
    expect(shouldRenderCdnViewer('*/*', 'image/jpeg', false)).toBe(false);
    expect(shouldRenderCdnViewer('text/html', 'application/pdf', false)).toBe(false);
    expect(shouldRenderCdnViewer('text/html', 'image/jpeg', true)).toBe(false);
  });

  it('escapes metadata and points image elements at the raw route', () => {
    const html = renderCdnViewer('7de772e1-777d-46ec-9c59-adf4c968bd30', {
      original_filename: '<img src=x onerror=alert(1)>.jpg',
      detected_mime_type: 'image/jpeg',
      original_size: 253_977,
      sha256: 'a'.repeat(64),
    }, 'test-nonce');
    expect(html).not.toContain('<img src=x onerror=alert(1)>.jpg');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;.jpg');
    expect(html).toContain('/cdn/7de772e1-777d-46ec-9c59-adf4c968bd30/raw');
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Securely delivered via STRATO');
    expect(html).toContain('Download original');
    expect(html).toContain('rel="icon" type="image/svg+xml"');
    expect(html).not.toContain('Veilig geleverd');
  });
});
