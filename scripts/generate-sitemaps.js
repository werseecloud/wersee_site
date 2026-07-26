#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.wersee.com').replace(/\/$/, '');
const defaultSupabaseUrl = 'https://pkgwzusngqwnmdfpifnd.supabase.co';
const defaultSupabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ3d6dXNuZ3F3bm1kZnBpZm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDY2NjIsImV4cCI6MjA4ODEyMjY2Mn0.HOYqIqXBHK7lTeOm73QAgkXvgy6uQ7dMfly-ouPpflI';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY ||
  defaultSupabasePublishableKey;

const xmlEscape = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const listingUrl = (listing, profileById = new Map()) => {
  const profile = profileById.get(listing.seller_id);
  if (profile?.username && listing.slug) return `${siteUrl}/@${encodeURIComponent(profile.username)}/${encodeURIComponent(listing.slug)}`;
  if (listing.seller_handle && listing.slug) return `${siteUrl}/@${encodeURIComponent(listing.seller_handle)}/${encodeURIComponent(listing.slug)}`;
  if (listing.slug) return `${siteUrl}/p/${encodeURIComponent(listing.slug)}`;
  return `${siteUrl}/listing/${listing.id}`;
};

const dateOnly = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const moneyPages = [
    '/product/how-to-make-money-online',
    '/course/ai-agency-blueprint',
    '/template/notion-business-system',
    '/creator/iman-gadzhi-style'
  ];

  const programmatic = [
    'best-ai-tools-for-agencies',
    'how-to-start-smma',
    'top-notion-templates'
  ];

  let products = [];
  let creators = [];
  let categories = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    try {
      const { data: listings } = await supabase
        .from('listings')
        .select('id,slug,title,created_at,published_at,category,seller_id,seller_handle,status,is_sandbox,approval_status,is_indexable,deleted_at')
        .in('status', ['active','published'])
        .limit(50000);
      products = listings || [];
    } catch (err) {
      console.error('Supabase listings fetch failed, falling back to sample data', err?.message || err);
    }

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,username,full_name,bio,avatar_url,seo_title,seo_description,seo_image_url,is_public,is_indexable,created_at')
        .limit(50000);
      creators = profiles || [];
    } catch (err) {
      console.warn('Supabase profiles fetch failed', err?.message || err);
    }
  } else {
    console.warn('No Supabase config found; generating sample sitemaps with static money pages.');
  }

  const profileById = new Map(creators.map(c => [c.id, c]));

  const looksLikeTestContent = (value) => /^(test|testing|demo|draft|untitled)([\s_-]|$|[a-z0-9])/i.test(String(value || '').trim());
  products = products.filter(p => {
    const title = String(p.title || '').trim();
    const slug = String(p.slug || '').trim();
    const hasCleanSlug = /^[a-z0-9][a-z0-9-]{2,}[a-z0-9]$/i.test(slug);

    return !p.is_sandbox &&
      !p.deleted_at &&
      p.is_indexable !== false &&
      p.approval_status !== 'rejected' &&
      title.length >= 3 &&
      hasCleanSlug &&
      !looksLikeTestContent(title) &&
      !looksLikeTestContent(slug);
  });

  const categorySet = new Set();
  products.forEach(p => { if (p.category) categorySet.add(String(p.category).trim()); });
  categories = Array.from(categorySet);

  const productUrls = products.map(p => {
    const loc = listingUrl(p, profileById);
    const lastmod = dateOnly(p.published_at || p.created_at);
    return `<url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  });

  const productXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${productUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-products.xml'), productXml);

  const sellerIdsWithPublishedProducts = new Set(products.map(product => product.seller_id).filter(Boolean));
  const creatorUrls = (creators.length ? creators : [])
    .filter(c => /^[a-z0-9._-]{2,64}$/i.test(c.username || ''))
    .filter(c => c.is_public && c.is_indexable)
    .map(c => `<url><loc>${xmlEscape(`${siteUrl}/@${c.username}`)}</loc><lastmod>${dateOnly(c.created_at)}</lastmod></url>`);
  const creatorXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${creatorUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-creators.xml'), creatorXml);

  const categoryUrls = categories.map(cat => `<url><loc>${xmlEscape(`${siteUrl}/category/${encodeURIComponent(String(cat).trim().toLowerCase().replace(/\s+/g,'-'))}`)}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>`);
  const categoryXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${categoryUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-categories.xml'), categoryXml);

  const today = new Date().toISOString().split('T')[0];
  const legalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/eula</loc>\n    <lastmod>2026-07-23</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap-legal.xml'), legalXml);

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${siteUrl}/sitemap-products.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${siteUrl}/sitemap-creators.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${siteUrl}/sitemap-categories.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${siteUrl}/sitemap-legal.xml</loc>\n    <lastmod>2026-07-23</lastmod>\n  </sitemap>\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml);

  const profileCacheDir = path.join(__dirname, '..', 'supabase', '.temp');
  fs.mkdirSync(profileCacheDir, { recursive: true });
  fs.writeFileSync(
    path.join(profileCacheDir, 'profile-seo-cache.json'),
    JSON.stringify(creators
      .filter(profile => profile.is_public || profile.is_indexable)
      .map(profile => ({
        ...profile,
        indexable: Boolean(profile.is_indexable && (profile.bio || sellerIdsWithPublishedProducts.has(profile.id))),
      }))),
  );

  const programmaticKeywords = programmatic;
  for (const kw of programmaticKeywords) {
    const dir = path.join(publicDir, kw);
    const matches = products.filter(p => (p.title && p.title.toLowerCase().includes(kw.split('-').join(' '))) || (p.category && String(p.category).toLowerCase().includes(kw.split('-').join(' ')))).slice(0,8);
    if (matches.length === 0) {
      fs.rmSync(dir, { recursive: true, force: true });
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    const linksHtml = matches.map(m => `<li><a href="${xmlEscape(listingUrl(m, profileById))}">${xmlEscape(m.title || m.slug)}</a></li>`).join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${kw.replace(/-/g,' ')} - Wersee</title><meta name="description" content="Resources and products for ${kw.replace(/-/g,' ')} on Wersee"><link rel="canonical" href="${siteUrl}/${kw}"></head><body><h1>${kw.replace(/-/g,' ')}</h1><p>Top products & resources:</p><ul>${linksHtml}</ul></body></html>`;
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }

  for (const mp of moneyPages) {
    const localPath = mp.startsWith('/') ? mp.slice(1) : mp;
    const dir = path.join(publicDir, localPath);
    const slug = localPath.split('/').pop();
    const matches = products.filter(p => (p.title && p.title.toLowerCase().includes(slug.replace(/-/g,' '))) || (p.category && String(p.category).toLowerCase().includes(slug.replace(/-/g,' ')))).slice(0,6);
    if (matches.length === 0) {
      fs.rmSync(dir, { recursive: true, force: true });
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    const links = matches.map(m => `<li><a href="${xmlEscape(listingUrl(m, profileById))}">${xmlEscape(m.title || m.slug)}</a></li>`).join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${slug.replace(/-/g,' ')} - Wersee</title><meta name="description" content="Resources and products related to ${slug.replace(/-/g,' ')}"><link rel="canonical" href="${siteUrl}${mp}"></head><body><h1>${slug.replace(/-/g,' ')}</h1><p>Find products and courses:</p><ul>${links}</ul></body></html>`;
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }

  console.log('Sitemaps and programmatic SEO pages generated in public/');
}

run().catch(err => {
  console.error('Error generating sitemaps:', err);
  process.exit(1);
});
