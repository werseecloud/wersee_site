import { describe, expect, it } from 'vitest';
import { normalizeAnalyticsEvent, parseAnalyticsRange } from './analytics';

const siteId = '00000000-0000-4000-8000-000000000101';
const releaseId = '00000000-0000-4000-8000-000000000102';
const context = {
  hashSalt: 'server-only-test-salt-that-is-long-enough',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  countryCode: 'NL',
};

describe('site analytics normalization', () => {
  it('validates events, strips sensitive query values, and keeps safe attribution', () => {
    const event = normalizeAnalyticsEvent({
      siteId,
      releaseId,
      eventType: 'page_view',
      sessionId: 'session-fixture-12345',
      visitorId: 'visitor-fixture-12345',
      path: '/checkout?token=secret&email=user%40example.com&utm_source=launch&utm_campaign=summer',
      referrer: 'https://www.example.com/private/path',
      elementLabel: '  Safe\nlabel  ',
    }, context);

    expect(event.path).toBe('/checkout?utm_source=launch&utm_campaign=summer');
    expect(event.utm_source).toBe('launch');
    expect(event.utm_campaign).toBe('summer');
    expect(event.referrer_domain).toBe('example.com');
    expect(event.element_label).toBe('Safe label');
    expect(event.visitor_id_hash).toBeNull();
    expect(event.session_id_hash).not.toContain('session-fixture');
    expect(event.country_code).toBe('NL');
  });

  it('only creates a persistent visitor hash after explicit consent', () => {
    const event = normalizeAnalyticsEvent({
      siteId,
      eventType: 'session_start',
      sessionId: 'session-fixture-12345',
      visitorId: 'visitor-fixture-12345',
      consentGranted: true,
      path: '/',
    }, context);
    expect(event.visitor_id_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(event.visitor_id_hash).not.toContain('visitor-fixture');
  });

  it('rejects unsupported event types and oversized analytics windows', () => {
    expect(() => normalizeAnalyticsEvent({ siteId, eventType: 'form_contents', sessionId: 'session-fixture-12345', path: '/' }, context)).toThrow();
    expect(() => parseAnalyticsRange('2026-01-01', '2026-05-01')).toThrow(/93 days/);
  });

  it('accepts bounded conversion and Web Vital signals without arbitrary payloads', () => {
    const conversion = normalizeAnalyticsEvent({
      siteId,
      eventType: 'conversion',
      eventName: 'contact_submit',
      metricValue: 25,
      sessionId: 'session-fixture-12345',
      path: '/contact',
    }, context);
    expect(conversion).toMatchObject({ event_name: 'contact_submit', metric_value: 25 });

    const vital = normalizeAnalyticsEvent({
      siteId,
      eventType: 'web_vital',
      metricName: 'LCP',
      metricValue: 1800.5,
      sessionId: 'session-fixture-12345',
      path: '/',
    }, context);
    expect(vital).toMatchObject({ metric_name: 'LCP', metric_value: 1800.5 });
    expect(() => normalizeAnalyticsEvent({ siteId, eventType: 'web_vital', sessionId: 'session-fixture-12345', path: '/' }, context)).toThrow();
  });
});
