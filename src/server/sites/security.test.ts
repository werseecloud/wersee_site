import { describe, expect, it } from 'vitest';
import {
  blockedFileReason,
  createPreviewToken,
  isAllowedSiteOrigin,
  normalizeArchivePath,
  normalizeSiteSlug,
  safeAnalyticsPath,
  validateSiteSlug,
  verifyPreviewToken,
} from './security';

describe('Wersee Sites security boundaries', () => {
  it('normalizes user-facing slugs and rejects reserved or malformed values', () => {
    expect(normalizeSiteSlug('  Cafe Portfolio  ')).toBe('cafe-portfolio');
    expect(validateSiteSlug('portfolio-2026').valid).toBe(true);
    expect(validateSiteSlug('api').valid).toBe(false);
    expect(validateSiteSlug('bad--slug').valid).toBe(false);
  });

  it('blocks traversal, credentials, executables and deployment internals', () => {
    expect(() => normalizeArchivePath('../secret.txt')).toThrow('PATH_TRAVERSAL');
    expect(() => normalizeArchivePath('C:\\secret.txt')).toThrow('ABSOLUTE_PATH');
    expect(blockedFileReason('dist/.env.production')).toMatch(/Environment/i);
    expect(blockedFileReason('dist/run.exe')).toMatch(/Executable/i);
    expect(blockedFileReason('vercel.json')).toMatch(/generated/i);
    expect(blockedFileReason('assets/app.js')).toBeNull();
  });

  it('removes sensitive query values while retaining campaign attribution', () => {
    expect(safeAnalyticsPath('/checkout?token=secret&utm_campaign=launch&email=a%40b.com'))
      .toBe('/checkout?utm_campaign=launch');
  });

  it('signs short-lived previews and rejects tampering or wrong origins', () => {
    const secret = 'a'.repeat(48);
    const payload = { siteId: crypto.randomUUID(), releaseId: crypto.randomUUID(), expiresAt: Date.now() + 60_000 };
    const token = createPreviewToken(payload, secret);
    expect(verifyPreviewToken(token, secret)).toEqual(payload);
    expect(verifyPreviewToken(`${token}x`, secret)).toBeNull();
    expect(isAllowedSiteOrigin('https://portfolio.wersee.com/path', 'portfolio', 'wersee.com')).toBe(true);
    expect(isAllowedSiteOrigin('https://portfolio.wersee.com.evil.test', 'portfolio', 'wersee.com')).toBe(false);
  });
});
