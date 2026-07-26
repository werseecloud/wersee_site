#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const sourcePath = path.join(distDir, 'index.html');
const cachePath = path.join(rootDir, 'supabase', '.temp', 'profile-seo-cache.json');
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.wersee.com').replace(/\/$/, '');

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripStaticSeo = (html) => html
  .replace(/\s*<title data-static-seo>[\s\S]*?<\/title>/i, '')
  .replace(/\s*<(?:meta|link)\s+data-static-seo\b[^>]*\/?>/gi, '');

if (!fs.existsSync(sourcePath)) {
  throw new Error('dist/index.html is missing. Run the Vite build first.');
}

if (!fs.existsSync(cachePath)) {
  console.warn('Profile SEO cache is missing; skipping static profile pages.');
  process.exit(0);
}

const baseHtml = stripStaticSeo(fs.readFileSync(sourcePath, 'utf8'));
const profiles = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
let generated = 0;

for (const profile of profiles) {
  const hasUsername = /^[a-z0-9._-]{2,64}$/i.test(profile.username || '');
  const hasId = /^[0-9a-f-]{36}$/i.test(profile.id || '');
  if (!hasUsername && !hasId) continue;
  if (!profile.is_public && !profile.is_indexable) continue;

  const displayName = profile.full_name || profile.username || 'Wersee profile';
  const title = profile.seo_title || `${displayName}${profile.username ? ` (@${profile.username})` : ''} | Wersee`;
  const description = profile.seo_description
    || profile.bio
    || `Discover ${displayName}'s profile, products, services, and communities on Wersee.`;
  const profilePath = hasUsername
    ? `/@${encodeURIComponent(profile.username)}`
    : `/profile/${encodeURIComponent(profile.id)}`;
  const canonical = `${siteUrl}${profilePath}`;
  const image = profile.seo_image_url
    || `${siteUrl}/api/profile-og?${hasUsername ? `username=${encodeURIComponent(profile.username)}` : `id=${encodeURIComponent(profile.id)}`}`;
  const robots = profile.indexable ? 'index, follow' : 'noindex, nofollow';
  const personJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    alternateName: profile.username ? `@${profile.username}` : undefined,
    description,
    image: profile.avatar_url || undefined,
    url: canonical,
  }).replace(/</g, '\\u003c');

  const tags = `
    <title data-static-seo>${escapeHtml(title)}</title>
    <meta data-static-seo name="description" content="${escapeHtml(description)}">
    <meta data-static-seo name="robots" content="${robots}">
    <link data-static-seo rel="canonical" href="${canonical}">
    <meta data-static-seo property="og:type" content="profile">
    <meta data-static-seo property="og:url" content="${canonical}">
    <meta data-static-seo property="og:title" content="${escapeHtml(title)}">
    <meta data-static-seo property="og:description" content="${escapeHtml(description)}">
    <meta data-static-seo property="og:image" content="${escapeHtml(image)}">
    <meta data-static-seo property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta data-static-seo property="og:image:type" content="image/png">
    <meta data-static-seo property="og:image:width" content="1200">
    <meta data-static-seo property="og:image:height" content="630">
    <meta data-static-seo property="og:image:alt" content="${escapeHtml(`${displayName}'s profile on Wersee`)}">
    <meta data-static-seo property="og:site_name" content="Wersee">
    <meta data-static-seo name="twitter:card" content="summary_large_image">
    <meta data-static-seo name="twitter:url" content="${canonical}">
    <meta data-static-seo name="twitter:title" content="${escapeHtml(title)}">
    <meta data-static-seo name="twitter:description" content="${escapeHtml(description)}">
    <meta data-static-seo name="twitter:image" content="${escapeHtml(image)}">
    <script data-static-seo type="application/ld+json">${personJsonLd}</script>
  `;
  const html = baseHtml.replace('</head>', `${tags}\n  </head>`);
  const outputDir = hasUsername
    ? path.join(distDir, `@${profile.username}`)
    : path.join(distDir, 'profile', profile.id);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  generated += 1;
}

console.log(`Generated ${generated} static profile SEO pages.`);
