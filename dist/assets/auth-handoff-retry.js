(() => {
  const trustedHosts = new Set([
    'wersee.com', 'www.wersee.com', 'app.wersee.com', 'ai.wersee.com',
    'billing.wersee.com', 'blog.wersee.com', 'cloud.wersee.com',
    'community.wersee.com', 'chat.wersee.com', 'gate.wersee.com',
    'docs.wersee.com', 'email.wersee.com', 'files.wersee.com',
    'mail.wersee.com', 'pay.wersee.com', 'lp.wersee.com',
  ]);
  const safeReturnUrl = (value) => {
    try {
      const url = new URL(value || `${location.origin}/`);
      const hostname = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || !trustedHosts.has(hostname)) return `${location.origin}/`;
      return hostname === 'lp.wersee.com' ? 'https://www.wersee.com/' : url.toString();
    } catch {
      return `${location.origin}/`;
    }
  };
  let returnUrl = `${location.origin}/`;
  try {
    const raw = sessionStorage.getItem('wersee:first-party-auth-handoff');
    const record = raw ? JSON.parse(raw) : null;
    returnUrl = safeReturnUrl(record && record.returnUrl);
  } catch {
    returnUrl = `${location.origin}/`;
  }
  const retry = document.querySelector('#retry');
  if (retry) retry.href = `/auth/begin?returnUrl=${encodeURIComponent(returnUrl)}`;
})();
