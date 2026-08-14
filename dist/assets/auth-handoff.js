(() => {
  const script = document.currentScript;
  const SUPABASE_URL = String(script?.dataset.supabaseUrl || '').replace(/\/+$/, '');
  const PUBLISHABLE_KEY = String(script?.dataset.publishableKey || '');
  const CLIENT_ID = '076d20ee-48c7-4d83-abc5-eeb3167acf48';
  const HANDOFF_KEY = 'wersee:first-party-auth-handoff';
  const AUTH_STORAGE_KEY = 'sb-pkgwzusngqwnmdfpifnd-auth-token';
  const trustedHosts = new Set(['wersee.com', 'www.wersee.com', 'app.wersee.com', 'ai.wersee.com', 'billing.wersee.com', 'blog.wersee.com', 'cloud.wersee.com', 'community.wersee.com', 'chat.wersee.com', 'gate.wersee.com', 'docs.wersee.com', 'email.wersee.com', 'files.wersee.com', 'mail.wersee.com', 'pay.wersee.com', 'lp.wersee.com']);
  const fail = (message) => {
    document.body.classList.add('error');
    document.querySelector('h1').textContent = 'We could not finish signing you in';
    document.querySelector('#message').textContent = message;
  };
  const safeReturnUrl = (value) => {
    try {
      const url = new URL(value, 'https://www.wersee.com');
      const hostname = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || !trustedHosts.has(hostname)) return null;
      if (hostname === 'lp.wersee.com') return 'https://www.wersee.com/';
      return url.toString();
    } catch { return null; }
  };
  const validPkce = (value, minimum = 32) => typeof value === 'string' && value.length >= minimum && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);
  void (async () => {
    try {
      if (!SUPABASE_URL || !PUBLISHABLE_KEY) throw new Error('Wersee sign-in configuration is unavailable.');
      const params = new URLSearchParams(location.search);
      const oauthError = params.get('error_description') || params.get('error');
      if (oauthError) throw new Error(oauthError);
      const code = params.get('code');
      const state = params.get('state');
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      const record = raw ? JSON.parse(raw) : null;
      if (!record || !code || !validPkce(state) || state !== record.state || !validPkce(record.codeVerifier, 43) || Date.now() - Number(record.createdAt) > 600000) throw new Error('This secure sign-in handoff is invalid or has expired.');
      const returnUrl = safeReturnUrl(record.returnUrl);
      if (!returnUrl) throw new Error('The requested Wersee return address is not allowed.');
      if (record.redirectUri !== `${location.origin}/auth/handoff`) throw new Error('The secure return address does not match this Wersee service.');
      const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: CLIENT_ID, redirect_uri: record.redirectUri, code_verifier: record.codeVerifier }),
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) throw new Error(tokens.error_description || tokens.error || 'Wersee could not exchange the sign-in code.');
      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${tokens.access_token}`, apikey: PUBLISHABLE_KEY } });
      const user = await userResponse.json();
      if (!userResponse.ok || !user.id) throw new Error('Wersee could not validate the signed-in account.');
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...tokens, expires_at: tokens.expires_at || Math.floor(Date.now() / 1000) + Number(tokens.expires_in || 3600), user }));
      sessionStorage.removeItem(HANDOFF_KEY);
      history.replaceState(null, '', '/auth/handoff');
      location.replace(returnUrl);
    } catch (error) {
      sessionStorage.removeItem(HANDOFF_KEY);
      history.replaceState(null, '', '/auth/handoff');
      fail(error instanceof Error ? error.message : 'Wersee could not complete sign in.');
    }
  })();
})();
