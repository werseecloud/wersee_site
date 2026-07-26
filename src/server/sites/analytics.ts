import { createHash } from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';
import { safeAnalyticsPath, sanitizeElementLabel } from './security.js';

export const analyticsEventSchema = z.object({
  siteId: z.string().uuid(),
  releaseId: z.string().uuid().optional(),
  eventType: z.enum([
    'page_view', 'route_change', 'session_start', 'session_end', 'engagement',
    'outbound_click', 'download_click', 'button_click', 'form_submit',
    'conversion', 'web_vital', 'scroll_depth', 'site_error',
  ]),
  sessionId: z.string().min(12).max(160),
  visitorId: z.string().min(12).max(160).optional(),
  consentGranted: z.boolean().optional().default(false),
  path: z.string().min(1).max(4096),
  referrer: z.string().max(4096).optional(),
  outboundUrl: z.string().max(4096).optional(),
  elementLabel: z.string().max(500).optional(),
  landingPage: z.string().max(4096).optional(),
  exitPage: z.string().max(4096).optional(),
  engagedSeconds: z.number().int().min(0).max(86400).optional(),
  isBounce: z.boolean().optional(),
  eventName: z.string().max(120).optional(),
  metricName: z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']).optional(),
  metricValue: z.number().finite().min(0).max(10_000_000).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
}).superRefine((event, context) => {
  if (event.eventType === 'web_vital' && (!event.metricName || event.metricValue === undefined)) {
    context.addIssue({ code: 'custom', message: 'Web Vital events require a supported metric name and value.' });
  }
  if (['conversion', 'form_submit', 'scroll_depth', 'site_error'].includes(event.eventType) && !event.eventName) {
    context.addIssue({ code: 'custom', message: 'This event requires a safe event name.' });
  }
});

const domainOnly = (value?: string) => {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return hostname.slice(0, 253) || null;
  } catch {
    return null;
  }
};

const hashIdentifier = (value: string, siteId: string, salt: string) =>
  createHash('sha256').update(`${salt}:${siteId}:${value}`).digest('hex');

const safeOccurredAt = (value?: string) => {
  const now = Date.now();
  const timestamp = value ? Date.parse(value) : now;
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 24 * 60 * 60 * 1000) return new Date(now).toISOString();
  return new Date(timestamp).toISOString();
};

export const normalizeAnalyticsEvent = (input: unknown, context: {
  hashSalt: string;
  userAgent: string;
  countryCode?: string;
}) => {
  const event = analyticsEventSchema.parse(input);
  const parsedPath = new URL(event.path, 'https://analytics.invalid');
  const userAgent = new UAParser(context.userAgent.slice(0, 512)).getResult();
  const deviceType = userAgent.device.type || 'desktop';
  const params = parsedPath.searchParams;
  return {
    site_id: event.siteId,
    release_id: event.releaseId || null,
    event_type: event.eventType,
    session_id_hash: hashIdentifier(event.sessionId, event.siteId, context.hashSalt),
    visitor_id_hash: event.consentGranted && event.visitorId
      ? hashIdentifier(event.visitorId, event.siteId, context.hashSalt)
      : null,
    path: safeAnalyticsPath(event.path),
    referrer_domain: domainOnly(event.referrer),
    outbound_url_domain: domainOnly(event.outboundUrl),
    element_label: sanitizeElementLabel(event.elementLabel) || null,
    utm_source: sanitizeElementLabel(params.get('utm_source')) || null,
    utm_medium: sanitizeElementLabel(params.get('utm_medium')) || null,
    utm_campaign: sanitizeElementLabel(params.get('utm_campaign')) || null,
    utm_content: sanitizeElementLabel(params.get('utm_content')) || null,
    utm_term: sanitizeElementLabel(params.get('utm_term')) || null,
    landing_page: event.landingPage ? safeAnalyticsPath(event.landingPage) : null,
    exit_page: event.exitPage ? safeAnalyticsPath(event.exitPage) : null,
    country_code: /^[A-Z]{2}$/.test(context.countryCode || '') ? context.countryCode : null,
    device_type: sanitizeElementLabel(deviceType) || 'desktop',
    browser_family: sanitizeElementLabel(userAgent.browser.name) || 'Unknown',
    os_family: sanitizeElementLabel(userAgent.os.name) || 'Unknown',
    engaged_seconds: event.engagedSeconds ?? null,
    is_bounce: event.isBounce ?? null,
    event_name: sanitizeElementLabel(event.eventName) || null,
    metric_name: event.metricName || null,
    metric_value: event.metricValue ?? null,
    occurred_at: safeOccurredAt(event.occurredAt),
  };
};

export const analyticsDateRangeSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
}).superRefine((value, context) => {
  const from = Date.parse(`${value.from}T00:00:00Z`);
  const to = Date.parse(`${value.to}T23:59:59Z`);
  if (to < from) context.addIssue({ code: 'custom', message: 'The end date must not be before the start date.' });
  if ((to - from) / 86400000 > 93) context.addIssue({ code: 'custom', message: 'Analytics ranges are limited to 93 days.' });
});

export const parseAnalyticsRange = (from: unknown, to: unknown) => analyticsDateRangeSchema.parse({ from, to });
