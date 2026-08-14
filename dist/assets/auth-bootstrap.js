(() => {
  const HANDOFF_KEY = 'wersee:first-party-auth-handoff';
  const trustedHosts = new Set(['wersee.com', 'www.wersee.com', 'app.wersee.com', 'id.wersee.com', 'auth.wersee.com', 'ai.wersee.com', 'billing.wersee.com', 'blog.wersee.com', 'cloud.wersee.com', 'community.wersee.com', 'chat.wersee.com', 'gate.wersee.com', 'docs.wersee.com', 'email.wersee.com', 'files.wersee.com', 'mail.wersee.com', 'pay.wersee.com', 'lp.wersee.com']);
  const fail = (message) => {
    document.body.classList.add('error');
    document.querySelector('h1').textContent = 'Secure sign in could not start';
    document.querySelector('#message').textContent = message;
  };
  const encode = (bytes) => {
    let value = '';
    bytes.forEach((byte) => { value += String.fromCharCode(byte); });
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };
  const random = (length) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return encode(bytes);
  };
  const safeReturnUrl = (raw) => {
    try {
      const url = new URL(raw || '/workspace', 'https://www.wersee.com');
      const hostname = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || !trustedHosts.has(hostname) || ['id.wersee.com', 'auth.wersee.com'].includes(hostname)) return 'https://www.wersee.com/workspace';
      if (hostname === 'lp.wersee.com') return 'https://www.wersee.com/';
      return url.toString();
    } catch { return 'https://www.wersee.com/workspace'; }
  };
  void (async () => {
    try {
      const source = new URLSearchParams(location.search);
      const returnUrl = safeReturnUrl(source.get('returnUrl') || source.get('returnTo') || source.get('redirect'));
      const verifier = random(64);
      const state = random(32);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const redirectUri = `${location.origin}/auth/handoff`;
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ codeVerifier: verifier, createdAt: Date.now(), redirectUri, returnUrl, state }));
      const path = source.get('authPath') || (location.pathname === '/auth/begin' ? '/auth' : location.pathname);
      source.delete('authPath');
      source.delete('redirect');
      source.delete('returnTo');
      source.set('returnUrl', returnUrl);
      source.set('handoff', '1');
      source.set('handoff_state', state);
      source.set('code_challenge', encode(new Uint8Array(digest)));
      source.set('handoff_redirect', redirectUri);
      location.replace(`https://id.wersee.com${path}?${source.toString()}`);
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Wersee could not start secure sign in.');
    }
  })();
})();
