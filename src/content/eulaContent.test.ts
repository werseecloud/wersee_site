import { describe, expect, it } from 'vitest';
import { eulaContactDetails, eulaMeta, eulaSections } from './eulaContent.js';

describe('EULA content', () => {
  it('contains the complete, uniquely addressable agreement', () => {
    expect(eulaSections).toHaveLength(24);
    expect(new Set(eulaSections.map((section) => section.id)).size).toBe(24);
    expect(eulaSections[0].title).toBe('Introduction and acceptance');
    expect(eulaSections.at(-1)?.title).toBe('Store-specific terms');
  });

  it('publishes fixed metadata and the required legal links', () => {
    const html = eulaSections.map((section) => section.html).join(' ');

    expect(eulaMeta.lastUpdated).toBe('July 23, 2026');
    expect(eulaMeta.canonicalPath).toBe('/eula');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/support"');
  });

  it('does not expose unverified public placeholders or known Imprint sample data', () => {
    const publicContent = JSON.stringify({ eulaMeta, eulaSections, eulaContactDetails });

    expect(publicContent).not.toMatch(
      /\[(?:OFFICIAL|REGISTERED|REGISTRATION|LEGAL_CONTACT)|12345678|Strawinskylaan|Director Name/,
    );
    expect(eulaContactDetails).toEqual(['Legal email: legal@wersee.com']);
  });
});

