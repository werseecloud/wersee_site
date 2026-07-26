import { useCallback, useEffect } from 'react';
import { getStoredPrivacyConsent } from '../lib/privacyConsent';
import { createBrowserId, safeSessionStorage } from '../lib/browserStorage';

const SESSION_KEY = 'wersee:sites-session:v1';

const sessionId = () => {
  const existing = safeSessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = createBrowserId();
  safeSessionStorage.setItem(SESSION_KEY, created);
  return created;
};

const sendEvent = (businessId: string, eventType: string, details: Record<string, unknown> = {}, beacon = false) => {
  const consent = getStoredPrivacyConsent();
  const payload = JSON.stringify({
    businessId,
    eventType,
    sessionId: sessionId(),
    visitorId: consent?.categories.analytics ? consent.anonymousId : undefined,
    consentGranted: consent?.categories.analytics === true,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || undefined,
    occurredAt: new Date().toISOString(),
    ...details,
  });
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/site-events', new Blob([payload], { type: 'application/json' }));
    return;
  }
  void fetch('/api/site-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
};

export const useAnalytics = (businessId: string | undefined) => {
  useEffect(() => {
    if (!businessId) return;
    const startedAt = Date.now();
    const sessionMarker = `wersee:sites-session-started:${businessId}`;
    if (!safeSessionStorage.getItem(sessionMarker)) {
      safeSessionStorage.setItem(sessionMarker, '1');
      sendEvent(businessId, 'session_start', { landingPage: `${window.location.pathname}${window.location.search}` });
    }
    sendEvent(businessId, 'page_view', { landingPage: `${window.location.pathname}${window.location.search}` });
    return () => {
      const engagedSeconds = Math.max(0, Math.min(86400, Math.round((Date.now() - startedAt) / 1000)));
      sendEvent(businessId, 'engagement', { engagedSeconds }, true);
    };
  }, [businessId]);

  const trackClick = useCallback((elementId: string) => {
    if (!businessId) return Promise.resolve();
    sendEvent(businessId, 'button_click', { elementLabel: elementId });
    return Promise.resolve();
  }, [businessId]);

  return { trackClick };
};
