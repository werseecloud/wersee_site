#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eulaContactDetails, eulaMeta, eulaSections } from '../src/content/eulaContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const sourcePath = path.join(distDir, 'index.html');
const outputDir = path.join(distDir, 'eula');
const outputPath = path.join(outputDir, 'index.html');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

if (!fs.existsSync(sourcePath)) {
  throw new Error('dist/index.html is missing. Run the Vite build before generating the static EULA.');
}

const toc = eulaSections.map((section, index) =>
  `<li><a href="#${escapeHtml(section.id)}">${index + 1}. ${escapeHtml(section.title)}</a></li>`
).join('');

const sections = eulaSections.map((section, index) => {
  const contact = section.id === 'contact' && eulaContactDetails.length
    ? `<address>${eulaContactDetails.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</address>`
    : '';
  return `<section id="${escapeHtml(section.id)}" class="eula-section">
    <h2>${index + 1}. ${escapeHtml(section.title)}</h2>
    <div class="eula-prose">${section.html}</div>
    ${contact}
  </section>`;
}).join('');

const staticRoot = `<div id="root">
  <div class="eula-static-shell">
    <a class="eula-static-skip" href="#eula-content">Skip to legal content</a>
    <header class="eula-static-header">
      <nav aria-label="Primary navigation">
        <a class="eula-static-brand" href="/">WERSEE</a>
        <div><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/support">Support</a></div>
      </nav>
    </header>
    <main id="eula-content" tabindex="-1">
      <nav class="eula-static-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <span aria-current="page">End User License Agreement</span></nav>
      <article>
        <header class="eula-static-title">
          <p>${escapeHtml(eulaMeta.subtitle)}</p>
          <h1>${escapeHtml(eulaMeta.title)}</h1>
          <div><span>Version ${escapeHtml(eulaMeta.version)}</span><span>Last updated: ${escapeHtml(eulaMeta.lastUpdated)}</span></div>
        </header>
        <details class="eula-static-toc">
          <summary>Table of contents</summary>
          <nav aria-label="EULA table of contents"><ol>${toc}</ol></nav>
        </details>
        <p class="eula-static-intro">Please read these licence terms carefully before installing or using Wersee Desktop or related Wersee software.</p>
        ${sections}
      </article>
    </main>
    <footer><nav aria-label="Legal links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/support">Support</a></nav></footer>
  </div>
</div>`;

const staticStyles = `<style data-eula-static>
  .eula-static-shell{min-height:100vh;background:#f5f5f7;color:#334155;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.7}
  .eula-static-shell a{color:#1d4ed8;text-underline-offset:3px}
  .eula-static-shell a:focus-visible,.eula-static-shell summary:focus-visible{outline:2px solid #2563eb;outline-offset:3px}
  .eula-static-skip{position:fixed;left:1rem;top:0;z-index:10;transform:translateY(-120%);background:#fff;padding:.75rem 1rem;border-radius:.5rem;font-weight:700}
  .eula-static-skip:focus{transform:translateY(.75rem)}
  .eula-static-header{background:#050505;color:#fff;padding:1rem 1.25rem}
  .eula-static-header nav{max-width:1180px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .eula-static-header a{color:#fff;text-decoration:none}.eula-static-header nav div{display:flex;gap:1.25rem}
  .eula-static-brand{font-size:1.25rem;font-weight:900;letter-spacing:.08em}
  .eula-static-shell main{max-width:860px;margin:auto;padding:2.25rem 1rem 5rem}
  .eula-static-breadcrumb{font-size:.875rem;margin-bottom:2rem}
  .eula-static-shell article{background:#fff;border:1px solid #e2e8f0;border-radius:1.5rem;padding:clamp(1.25rem,4vw,3rem)}
  .eula-static-title{padding-bottom:2rem;border-bottom:1px solid #e2e8f0}
  .eula-static-title>p{color:#1d4ed8;font-size:.875rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
  .eula-static-title h1{color:#020617;font-size:clamp(2.25rem,7vw,3.25rem);line-height:1.08;margin:.75rem 0 1.25rem}
  .eula-static-title div{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;font-size:.875rem;font-weight:600}
  .eula-static-toc{margin:2rem 0;border:1px solid #e2e8f0;border-radius:1rem;padding:1rem 1.25rem}
  .eula-static-toc summary{cursor:pointer;color:#020617;font-weight:800}.eula-static-toc ol{padding-left:1.25rem}.eula-static-toc li{margin:.45rem 0}
  .eula-static-intro{font-size:1.125rem;margin:2rem 0}
  .eula-section{border-top:1px solid #e2e8f0;padding:2rem 0;scroll-margin-top:1rem}.eula-section h2{color:#020617;font-size:1.5rem;line-height:1.25}
  .eula-prose p+p{margin-top:1rem}.eula-prose ul{padding-left:1.4rem}.eula-prose li+li{margin-top:.45rem}
  .eula-section address{font-style:normal;margin-top:1.25rem}
  .eula-static-shell footer{background:#050505;padding:2rem 1rem}.eula-static-shell footer nav{display:flex;justify-content:center;gap:1.5rem}.eula-static-shell footer a{color:#fff}
  @media(max-width:480px){.eula-static-header nav div{gap:.75rem;font-size:.875rem}.eula-static-shell article{border-radius:1rem}}
  @media(prefers-reduced-motion:reduce){.eula-static-shell *{scroll-behavior:auto!important}}
  @media print{@page{margin:18mm 16mm}.eula-static-header,.eula-static-breadcrumb,.eula-static-toc,.eula-static-shell footer,.eula-static-skip{display:none!important}.eula-static-shell,.eula-static-shell main,.eula-static-shell article{background:#fff!important;max-width:none;padding:0;border:0;border-radius:0}.eula-section{break-inside:avoid-page}.eula-prose a[href^="/"]::after{content:" (https://www.wersee.com" attr(href) ")";font-weight:400;overflow-wrap:anywhere}}
</style>`;

const staticSeo = `
  <title data-static-seo>${escapeHtml(eulaMeta.title)} | Wersee</title>
  <meta data-static-seo name="description" content="${escapeHtml(eulaMeta.description)}">
  <link data-static-seo rel="canonical" href="https://www.wersee.com${escapeHtml(eulaMeta.canonicalPath)}">
  <meta data-static-seo property="og:type" content="website">
  <meta data-static-seo property="og:title" content="${escapeHtml(eulaMeta.title)} | Wersee">
  <meta data-static-seo property="og:description" content="${escapeHtml(eulaMeta.openGraphDescription)}">
  <meta data-static-seo property="og:url" content="https://www.wersee.com${escapeHtml(eulaMeta.canonicalPath)}">
  <meta data-static-seo property="og:image" content="https://www.wersee.com/brand/wersee-social-card.jpg">
  <meta data-static-seo property="og:site_name" content="Wersee">
  <meta data-static-seo name="twitter:card" content="summary_large_image">
  <meta data-static-seo name="twitter:title" content="${escapeHtml(eulaMeta.title)} | Wersee">
  <meta data-static-seo name="twitter:description" content="${escapeHtml(eulaMeta.openGraphDescription)}">
`;

let html = fs.readFileSync(sourcePath, 'utf8');
html = html.replace(/\s*<(?:meta|link|title)[^>]*data-static-seo[^>]*(?:>[^<]*<\/title>)?\s*/g, '\n');
html = html.replace('</head>', `${staticSeo}${staticStyles}</head>`);
html = html.replace(
  /<div id="root">[\s\S]*?<\/div>\s*(?=<script|<\/body>)/,
  `${staticRoot}\n`,
);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Static EULA generated at ${outputPath}`);
