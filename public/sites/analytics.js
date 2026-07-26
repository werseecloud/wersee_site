(async () => {
  'use strict';
  const script = document.currentScript;
  const siteId = script?.dataset.werseeSiteId;
  const releaseId = script?.dataset.werseeReleaseId;
  if (!siteId || !releaseId) return;

  const endpoint = `${new URL(script.src).origin}/api/site-events`;
  const defaults = {
    enabled: true,
    respectDoNotTrack: true,
    webVitals: true,
    scrollDepth: true,
    formSubmissions: true,
    errorSignals: true,
    outboundLinks: true,
    downloads: true,
    goals: [],
  };
  let settings = defaults;
  try {
    const response = await fetch('/wersee.json', { credentials: 'omit', cache: 'no-store' });
    if (response.ok) {
      const manifest = await response.json();
      settings = { ...defaults, ...(manifest?.analytics || {}) };
    }
  } catch {
    // A missing manifest falls back to the privacy-preserving defaults.
  }
  if (!settings.enabled) return;
  if (settings.respectDoNotTrack && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) return;
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
      if (download && settings.downloads) send('download_click', { path: safePath(url.href), outboundUrl: url.href });
      else if (url.origin !== location.origin && settings.outboundLinks) send('outbound_click', { outboundUrl: url.href });
    }
    const label = target.getAttribute('data-wersee-label') || target.getAttribute('aria-label') || target.id || target.tagName.toLowerCase();
    send('button_click', { elementLabel: label.slice(0, 120) });
    for (const goal of Array.isArray(settings.goals) ? settings.goals : []) {
      if (goal?.event !== 'click' || typeof goal.selector !== 'string') continue;
      try {
        if (target.matches(goal.selector) || target.closest(goal.selector)) {
          send('conversion', { eventName: String(goal.id).slice(0, 64), metricValue: Number.isFinite(goal.value) ? goal.value : undefined });
        }
      } catch {
        // Invalid selectors are rejected during deployment; ignore defensively.
      }
    }
  }, { capture: true, passive: true });

  if (settings.formSubmissions) {
    addEventListener('submit', (event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      const formName = form.dataset.werseeForm || form.id || form.getAttribute('name') || 'form';
      send('form_submit', { eventName: formName.slice(0, 120) });
      for (const goal of Array.isArray(settings.goals) ? settings.goals : []) {
        if (goal?.event !== 'submit' || typeof goal.selector !== 'string') continue;
        try {
          if (form.matches(goal.selector)) {
            send('conversion', { eventName: String(goal.id).slice(0, 64), metricValue: Number.isFinite(goal.value) ? goal.value : undefined });
          }
        } catch {
          // Invalid selectors are rejected during deployment; ignore defensively.
        }
      }
    }, { capture: true });
  }

  if (settings.scrollDepth) {
    const reached = new Set();
    const trackScroll = () => {
      const height = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      const depth = Math.min(100, Math.round((scrollY / height) * 100));
      for (const threshold of [25, 50, 75, 90]) {
        if (depth >= threshold && !reached.has(threshold)) {
          reached.add(threshold);
          send('scroll_depth', { eventName: String(threshold) });
        }
      }
    };
    addEventListener('scroll', trackScroll, { passive: true });
  }

  if (settings.errorSignals) {
    addEventListener('error', () => send('site_error', { eventName: 'runtime_error' }), { passive: true });
    addEventListener('unhandledrejection', () => send('site_error', { eventName: 'unhandled_rejection' }), { passive: true });
  }

  const vitalValues = new Map();
  const recordVital = (metricName, metricValue) => {
    if (!Number.isFinite(metricValue) || metricValue < 0) return;
    vitalValues.set(metricName, metricValue);
  };
  if (settings.webVitals && 'PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) recordVital('LCP', last.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value || 0;
        recordVital('CLS', cls);
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      let inp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) inp = Math.max(inp, entry.duration || 0);
        recordVital('INP', inp);
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch {}
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) recordVital('TTFB', navigation.responseStart);
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcp) recordVital('FCP', fcp.startTime);
    } catch {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') visibleSince = Date.now();
    else { flushEngagement(); visibleSince = 0; }
  });
  setInterval(flushEngagement, 15000);
  addEventListener('pagehide', () => {
    flushEngagement();
    for (const [metricName, metricValue] of vitalValues) send('web_vital', { metricName, metricValue });
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
    track(goalId, value) {
      const eventName = String(goalId || '').trim().replace(/[^a-z0-9_-]/gi, '').slice(0, 64);
      if (!eventName) return;
      send('conversion', { eventName, metricValue: Number.isFinite(value) ? Math.max(0, Number(value)) : undefined });
    },
  });

  send('session_start');
  send('page_view');
})();
