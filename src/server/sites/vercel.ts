import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { PreparedSiteFile, SiteRuntimeConfig } from './types.js';

type VercelDeployment = {
  id: string;
  url: string;
  readyState?: string;
  state?: string;
  errorCode?: string;
  errorMessage?: string;
};

const sanitizedVercelError = (payload: any, fallback: string) => {
  const code = String(payload?.error?.code || payload?.code || 'VERCEL_REQUEST_FAILED').replace(/[^A-Z0-9_-]/gi, '_').slice(0, 80);
  const raw = String(payload?.error?.message || payload?.message || fallback)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/(?:token|secret|key)=[^&\s]+/gi, '$1=[redacted]')
    .slice(0, 500);
  return new Error(`${code}:${raw}`);
};

const vercelFetch = async (config: SiteRuntimeConfig, endpoint: string, init: RequestInit = {}) => {
  const url = new URL(`https://api.vercel.com${endpoint}`);
  if (!url.searchParams.has('teamId')) url.searchParams.set('teamId', config.vercelTeamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.vercelToken}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let payload: any = {};
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 500) }; }
  }
  if (!response.ok) throw sanitizedVercelError(payload, `Vercel returned HTTP ${response.status}.`);
  return payload;
};

export const makeStaticVercelConfig = (options: {
  spaFallback: boolean;
  defaultDocument: string;
  custom404Behavior: 'file' | 'spa' | 'default';
  strictSecurityMode: boolean;
}) => {
  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ];
  if (options.strictSecurityMode) {
    headers.push({
      key: 'Content-Security-Policy',
      value: "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; img-src 'self' https: data: blob:; font-src 'self' https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://wersee.com",
    });
  }
  const routes: Array<Record<string, unknown>> = [
    { src: '/(.*)', headers: Object.fromEntries(headers.map((header) => [header.key, header.value])), continue: true },
  ];
  if (options.defaultDocument !== 'index.html') routes.push({ src: '^/$', dest: `/${options.defaultDocument}` });
  routes.push({ handle: 'filesystem' });
  if (options.spaFallback || options.custom404Behavior === 'spa') {
    routes.push({ src: '/.*', dest: '/index.html' });
  } else if (options.custom404Behavior === 'file') {
    routes.push({ src: '/.*', dest: '/404.html', status: 404 });
  }
  const generated: Record<string, unknown> = {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: null,
    routes,
  };
  return Buffer.from(JSON.stringify(generated));
};

export const uploadVercelFiles = async (
  config: SiteRuntimeConfig,
  files: PreparedSiteFile[],
  settings: { spaFallback: boolean; defaultDocument: string; custom404Behavior: 'file' | 'spa' | 'default'; strictSecurityMode: boolean },
  onProgress?: (completed: number, total: number) => Promise<void> | void,
) => {
  const generatedConfig = makeStaticVercelConfig(settings);
  const deploymentFiles: Array<{ file: string; sha: string; size: number }> = [];
  const allFiles = [
    ...files.map((file) => ({ path: file.path, absolutePath: file.absolutePath, buffer: null as Buffer | null, sha: file.sha1, size: file.size })),
    {
      path: 'vercel.json',
      absolutePath: '',
      buffer: generatedConfig,
      sha: createHash('sha1').update(generatedConfig).digest('hex'),
      size: generatedConfig.byteLength,
    },
  ];
  let completed = 0;
  for (const file of allFiles) {
    const buffer = file.buffer || await readFile(file.absolutePath);
    const response = await fetch(`https://api.vercel.com/v2/files?teamId=${encodeURIComponent(config.vercelTeamId)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(buffer.byteLength),
        'x-vercel-digest': file.sha,
      },
      body: buffer,
    });
    if (!response.ok && response.status !== 409) {
      let payload: any = {};
      try { payload = await response.json(); } catch { /* sanitized fallback below */ }
      throw sanitizedVercelError(payload, `A deployment file could not be uploaded (${response.status}).`);
    }
    deploymentFiles.push({ file: file.path, sha: file.sha, size: file.size });
    completed += 1;
    await onProgress?.(completed, allFiles.length);
  }
  return deploymentFiles;
};

export const createVercelDeployment = async (
  config: SiteRuntimeConfig,
  files: Array<{ file: string; sha: string; size: number }>,
  metadata: { siteId: string; releaseId: string; version: number },
) => vercelFetch(config, '/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: config.vercelSitesProjectSlug,
    files,
    projectSettings: { framework: null },
    meta: {
      werseeSiteId: metadata.siteId,
      werseeReleaseId: metadata.releaseId,
      werseeReleaseVersion: String(metadata.version),
    },
  }),
}) as Promise<VercelDeployment>;

export const getVercelDeployment = async (config: SiteRuntimeConfig, deploymentId: string) =>
  vercelFetch(config, `/v13/deployments/${encodeURIComponent(deploymentId)}`) as Promise<VercelDeployment>;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const waitForVercelDeployment = async (
  config: SiteRuntimeConfig,
  deploymentId: string,
  onState?: (state: string) => Promise<void> | void,
) => {
  const deadline = Date.now() + config.deploymentTimeoutMs;
  let lastState = '';
  while (Date.now() < deadline) {
    const deployment = await getVercelDeployment(config, deploymentId);
    const state = String(deployment.readyState || deployment.state || 'UNKNOWN').toUpperCase();
    if (state !== lastState) {
      lastState = state;
      await onState?.(state);
    }
    if (state === 'READY') return deployment;
    if (['ERROR', 'CANCELED', 'CANCELLED'].includes(state)) {
      throw sanitizedVercelError(deployment, 'The Vercel deployment did not become ready.');
    }
    await sleep(2500);
  }
  throw new Error('VERCEL_DEPLOYMENT_TIMEOUT:The deployment did not become ready before the configured timeout.');
};

export const assignVercelAlias = async (config: SiteRuntimeConfig, deploymentId: string, alias: string) =>
  vercelFetch(config, `/v2/deployments/${encodeURIComponent(deploymentId)}/aliases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, redirect: null }),
  });

export const removeVercelAlias = async (config: SiteRuntimeConfig, alias: string) => {
  try {
    const existing = await vercelFetch(config, `/v4/aliases/${encodeURIComponent(alias)}`) as { id?: string };
    if (existing.id) await vercelFetch(config, `/v2/aliases/${encodeURIComponent(existing.id)}`, { method: 'DELETE' });
  } catch (error) {
    if (!String(error).includes('not_found') && !String(error).includes('404')) throw error;
  }
};

export const verifyVercelAlias = async (config: SiteRuntimeConfig, alias: string, expectedDeploymentId: string) => {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const aliasRecord = await vercelFetch(config, `/v4/aliases/${encodeURIComponent(alias)}`) as {
        deploymentId?: string;
        deployment?: { id?: string };
      };
      const targetId = aliasRecord.deploymentId || aliasRecord.deployment?.id;
      if (targetId && targetId !== expectedDeploymentId) throw new Error('Alias still points to another deployment.');
      const response = await fetch(`https://${alias}/`, {
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(7000),
        headers: { 'User-Agent': 'Wersee-Sites-Alias-Check/1.0' },
      });
      const deploymentHeader = response.headers.get('x-vercel-id');
      if (response.status >= 200 && response.status < 500 && deploymentHeader && (!targetId || targetId === expectedDeploymentId)) return true;
    } catch {
      // DNS and certificate propagation can take a few seconds.
    }
    await sleep(2500);
  }
  return false;
};
