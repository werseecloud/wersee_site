(() => {
  'use strict';
  const script = document.currentScript;
  const siteId = script?.dataset.werseeSiteId;
  const releaseId = script?.dataset.werseeReleaseId;
  if (!siteId || !releaseId) return;

  const endpoint = `${new URL(script.src).origin}/api/site-events`;
  const sensitive = /^(token|code|key|secret|password|email|session|auth)$/i;
  const safePath = (value = location.href) => {
    try {
      const url = new URL(value, location.href);
      [...url.searchParams.keys()].forEach((key) => sensitive.test(key) && url.searchParams.delete(key));
      const query = url.searchParams.toString();
      return `${url.pathname}${query ? `?${query}` : ''}`.slice(0, 2048);
    } catch { return '/'; }
  };
  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : crypto.getRandomValues(new Uint32Array(4)).join('-');
  let sessionId = sessionStorage.getItem('wersee_sites_session');
  if (!sessionId) {
    sessionId = randomId();
    sessionStorage.setItem('wersee_sites_session', sessionId);
  }
  let persistentConsent = localStorage.getItem('wersee_sites_analytics_consent') === 'granted';
  let visitorId = persistentConsent ? localStorage.getItem('wersee_sites_visitor') : null;
  if (persistentConsent && !visitorId) {
    visitorId = randomId();
    localStorage.setItem('wersee_sites_visitor', visitorId);
  }

  let currentPath = safePath();
  const landingPage = currentPath;
  let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
  let engagedMs = 0;
  let pageCount = 1;

  const payload = (eventType, extra = {}) => ({
    siteId,
    releaseId,
    eventType,
    sessionId,
    visitorId: persistentConsent ? visitorId || undefined : undefined,
    consentGranted: persistentConsent,
    path: currentPath,
    referrer: document.referrer || undefined,
    landingPage,
    occurredAt: new Date().toISOString(),
    ...extra,
  });

  const send = (eventType, extra = {}) => {
    const body = JSON.stringify(payload(eventType, extra));
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    fetch(endpoint, { method: 'POST', body, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(() => {});
  };

  const flushEngagement = () => {
    if (visibleSince) {
      engagedMs += Date.now() - visibleSince;
      visibleSince = Date.now();
    }
    const seconds = Math.floor(engagedMs / 1000);
    if (seconds > 0) {
      engagedMs -= seconds * 1000;
      send('engagement', { engagedSeconds: seconds });
    }
  };

  const routeChanged = () => {
    const nextPath = safePath();
    if (nextPath === currentPath) return;
    flushEngagement();
    currentPath = nextPath;
    pageCount += 1;
    send('route_change');
  };

  const wrapHistory = (name) => {
    const original = history[name];
    history[name] = function (...args) {
      const value = original.apply(this, args);
      queueMicrotask(routeChanged);
      return value;
    };
  };
  wrapHistory('pushState');
  wrapHistory('replaceState');
  addEventListener('popstate', routeChanged, { passive: true });

  addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a,button,[role="button"]') : null;
    if (!target) return;
    if (target instanceof HTMLAnchorElement && target.href) {
      const url = new URL(target.href, location.href);
      const download = target.hasAttribute('download') || /\.(?:pdf|zip|docx?|xlsx?|csv|mp3|mp4|mov|png|jpe?g|webp)$/i.test(url.pathname);
      if (download) send('download_click', { path: safePath(url.href), outboundUrl: url.href });
      else if (url.origin !== location.origin) send('outbound_click', { outboundUrl: url.href });
      return;
    }
    const label = target.getAttribute('data-wersee-label') || target.getAttribute('aria-label') || target.id || target.tagName.toLowerCase();
    send('button_click', { elementLabel: label.slice(0, 120) });
  }, { capture: true, passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') visibleSince = Date.now();
    else { flushEngagement(); visibleSince = 0; }
  });
  setInterval(flushEngagement, 15000);
  addEventListener('pagehide', () => {
    flushEngagement();
    send('session_end', { exitPage: currentPath, isBounce: pageCount === 1 });
  });

  window.werseeAnalytics = Object.freeze({
    grantPersistentConsent() {
      persistentConsent = true;
      localStorage.setItem('wersee_sites_analytics_consent', 'granted');
      visitorId = localStorage.getItem('wersee_sites_visitor') || randomId();
      localStorage.setItem('wersee_sites_visitor', visitorId);
    },
    revokePersistentConsent() {
      persistentConsent = false;
      visitorId = null;
      localStorage.removeItem('wersee_sites_analytics_consent');
      localStorage.removeItem('wersee_sites_visitor');
    },
  });

  send('session_start');
  send('page_view');
})();
