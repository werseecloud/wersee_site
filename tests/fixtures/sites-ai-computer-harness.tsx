import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { CreateSiteWizard } from '../../src/components/workspace/sites/CreateSiteWizard';

const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: '00000000-0000-4000-8000-000000000001', role: 'authenticated', aud: 'authenticated', exp: expiresAt })}.fixture`;
window.localStorage.setItem('sb-auth-token', JSON.stringify({
  access_token: accessToken,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: expiresAt,
  refresh_token: 'sites-ai-computer-fixture',
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'fixture@example.invalid',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  },
}));

const originalFetch = window.fetch.bind(window);
let computerPoll = 0;
const site = {
  id: '00000000-0000-4000-8000-000000000101',
  business_id: '00000000-0000-4000-8000-000000000201',
  name: 'Private computer demo',
  slug: 'private-computer-demo',
  description: 'Visual review fixture',
  spa_fallback: true,
  analytics_enabled: true,
  indexing_enabled: true,
  ai_text_enhancement_enabled: true,
  directory_listed: false,
  site_type: 'uploaded_static',
};
const snapshot = (sequence: number, viewport: 'desktop' | 'mobile') => ({
  id: `00000000-0000-4000-8000-00000000030${sequence}`,
  viewport,
  sequence,
  width: viewport === 'desktop' ? 1280 : 390,
  height: viewport === 'desktop' ? 800 : 844,
  createdAt: new Date().toISOString(),
  url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800"><defs><linearGradient id="g"><stop stop-color="#08080b"/><stop offset="1" stop-color="#172554"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="120" y="120" width="1040" height="560" rx="34" fill="#11131a" stroke="#334155"/><circle cx="180" cy="170" r="8" fill="#60a5fa"/><text x="180" y="290" fill="white" font-size="54" font-family="Arial">Wersee private browser</text><text x="180" y="355" fill="#93c5fd" font-size="24" font-family="Arial">${viewport === 'desktop' ? 'Desktop layout captured safely' : 'Mobile layout captured safely'}</text><rect x="180" y="430" width="280" height="74" rx="37" fill="#2563eb"/><text x="250" y="478" fill="white" font-size="22" font-family="Arial">Review site</text></svg>`)}`,
});

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/storage-zips')) return json({ files: [{ path: 'user/demo.zip', name: 'demo.zip', size: 2048 }] });
  if (url.endsWith(`/${site.id}`) && init?.method === 'PATCH') return json({ site });
  if (url.endsWith(`/${site.id}/uploads`) && init?.method === 'POST') return json({ upload: { id: '00000000-0000-4000-8000-000000000401' }, destination: { bucket: 'unused', prefix: 'unused', tusEndpoint: 'unused', chunkSize: 6291456 } }, 201);
  if (url.endsWith(`/${site.id}/releases`) && init?.method === 'POST') return json({ release: { id: '00000000-0000-4000-8000-000000000501', status: 'created' } }, 201);
  if (url.endsWith(`/${site.id}/validate`) && init?.method === 'POST') return json({
    release: { id: '00000000-0000-4000-8000-000000000501', status: 'ready' },
    report: {
      detectedRoot: '', validRoots: [''], totalFiles: 8, totalSize: 12040, htmlPages: 2, javascriptFiles: 2, cssFiles: 1, imageFiles: 3,
      missingReferencedAssets: [], blockedFiles: [], warnings: [], errors: [], detectedSpa: false, detectedFramework: 'HTML5',
      faviconStatus: 'present', analyticsInjectionStatus: 'injected', werseeManifestStatus: 'generated',
      seo: { indexingEnabled: true, sitemapGenerated: true, robotsGenerated: true, indexNowPrepared: true, indexedPages: 2 },
      aiTextEnhancement: { status: 'completed', changedTextNodes: 3, consideredTextNodes: 3, filesChanged: 1 },
      integrations: { candidates: [], codeFilesScanned: 2, visualDomReviewRequired: true },
      publishable: true,
    },
  });
  if (url.endsWith(`/${site.id}/ai-computer/runs`) && init?.method === 'POST') return json({ run: { id: '00000000-0000-4000-8000-000000000601', status: 'running', stage: 'booting', progress: 8, public_message: 'Starting an isolated computer with no site credentials.' } }, 202);
  if (url.includes('/ai-computer/runs/')) {
    computerPoll += 1;
    const done = computerPoll > 5;
    const progress = done ? 100 : Math.min(86, 18 + computerPoll * 14);
    return json({
      run: {
        id: '00000000-0000-4000-8000-000000000601',
        status: done ? 'completed' : 'running',
        stage: done ? 'complete' : computerPoll > 3 ? 'analyzing' : computerPoll > 1 ? 'mobile' : 'loading',
        progress,
        message: done ? 'The visual review is complete.' : computerPoll > 3 ? 'Wersee AI is comparing the pixels with the sanitized page structure.' : 'Opening the prepared release in an offline browser.',
        result: done ? { summary: 'Desktop and mobile layouts are visually readable.', findings: [{ severity: 'info', title: 'Primary action is visible', detail: 'The main call to action is visible in both captured layouts.' }] } : {},
      },
      events: [
        { id: 1, event_type: 'status', stage: 'booting', progress: 8, public_message: 'Starting an isolated computer with no site credentials.' },
        { id: 2, event_type: 'status', stage: 'loading', progress: 18, public_message: 'Preparing a private browser. Secrets are not mounted.' },
        ...(computerPoll > 2 ? [{ id: 3, event_type: 'status', stage: 'desktop', progress: 44, public_message: 'Desktop view captured.' }] : []),
        ...(computerPoll > 3 ? [{ id: 4, event_type: 'status', stage: 'analyzing', progress: 66, public_message: 'Comparing pixels with the sanitized page structure.' }] : []),
      ],
      snapshots: computerPoll > 2 ? [snapshot(1, 'desktop'), ...(computerPoll > 4 ? [snapshot(2, 'mobile')] : [])] : [],
    });
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <CreateSiteWizard
    businesses={[{ id: site.business_id, name: 'Wersee Studio' }]}
    existingSite={site}
    onClose={() => undefined}
    onComplete={() => undefined}
  />,
);
