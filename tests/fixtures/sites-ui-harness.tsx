import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';

const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: '00000000-0000-4000-8000-000000000001', role: 'authenticated', aud: 'authenticated', exp: expiresAt })}.fixture`;
window.localStorage.setItem('sb-auth-token', JSON.stringify({
  access_token: accessToken,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: expiresAt,
  refresh_token: 'sites-ui-fixture',
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'sites-ui-fixture@example.invalid',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  },
}));

const now = new Date().toISOString();
const response = {
  username: 'raeven',
  businesses: [{ id: 'business-1', name: 'Wersee Studio', slug: 'wersee-studio', logo_url: null }],
  sites: [
    {
      id: 'site-1', business_id: 'business-1', owner_id: 'user-1', name: 'Creator launch', slug: 'creator-launch',
      description: 'Launch website', icon_url: null, status: 'published', site_type: 'uploaded_static', spa_fallback: true,
      analytics_enabled: true, public_url: 'https://creator-launch.wersee.com', updated_at: now, last_editor: 'raeven',
      business: { id: 'business-1', name: 'Wersee Studio', slug: 'wersee-studio' },
      active_release: { id: 'release-1', file_count: 46, total_bytes: 3849201 }, views_last_7_days: 1842,
    },
    {
      id: 'site-2', business_id: 'business-1', owner_id: 'user-1', name: 'Summer campaign', slug: 'summer-campaign',
      description: 'Campaign website', icon_url: null, status: 'draft', site_type: 'uploaded_static', spa_fallback: false,
      analytics_enabled: true, public_url: 'https://summer-campaign.wersee.com', updated_at: now, last_editor: 'raeven',
      business: { id: 'business-1', name: 'Wersee Studio', slug: 'wersee-studio' }, active_release: null,
      current_job: { id: 'job-1', status: 'processing', stage: 'uploading', progress: 64 }, views_last_7_days: 318,
    },
  ],
};

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.endsWith('/api/sites') && (!init?.method || init.method === 'GET')) {
    return new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/api/sites/slug-availability')) {
    return new Response(JSON.stringify({ available: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return nativeFetch(input, init);
};

const { SitesView } = await import('../../src/components/workspace/sites/SitesView');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="h-screen bg-[#0a0a0a]">
      <SitesView />
    </div>
  </React.StrictMode>,
);
