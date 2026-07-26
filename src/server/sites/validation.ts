import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { lookup as lookupMime } from 'mime-types';
import { parse, parseFragment, serialize } from 'parse5';
import type { AiTextRequest } from './aiText.js';
import { analyzeSiteIntegrations } from './integrations.js';
import { parseWerseeManifestText, serializeWerseeManifest, type WerseeSiteManifest } from './manifest.js';
import { blockedFileReason, normalizeArchivePath } from './security.js';
import type { PreparedSiteFile, SiteValidationReport, SourceFile, ValidationIssue, ValidationResult } from './types.js';

type ValidationOptions = {
  selectedRoot?: string | null;
  analyticsEnabled: boolean;
  analyticsScriptUrl: string;
  siteId: string;
  releaseId: string;
  siteUrl: string;
  indexingEnabled: boolean;
  aiTextEnhancementEnabled: boolean;
  indexNowKey: string;
  improveText?: (html: string, request: Omit<AiTextRequest, 'fragments'>) => Promise<{
    html: string;
    changedTextNodes: number;
    consideredTextNodes: number;
  }>;
  maxUnpackedBytes: number;
  maxFileCount: number;
  maxSingleFileBytes: number;
};

const outputFolderNames = new Set(['dist', 'build', 'out', 'public']);
const buildConfigNames = new Set([
  'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb',
  'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'tsconfig.json',
]);

export const detectWebsiteRoots = (inputPaths: string[]) => {
  const paths = inputPaths.map((value) => normalizeArchivePath(value));
  const lowerPaths = new Set(paths.map((value) => value.toLowerCase()));
  const roots: string[] = [];
  if (lowerPaths.has('index.html')) roots.push('');

  for (const folder of outputFolderNames) {
    if (lowerPaths.has(`${folder}/index.html`)) roots.push(folder);
  }

  const topSegments = new Set(paths.map((value) => value.split('/')[0]));
  if (topSegments.size === 1) {
    const only = [...topSegments][0];
    if (lowerPaths.has(`${only.toLowerCase()}/index.html`) && !roots.includes(only)) roots.push(only);
    for (const folder of outputFolderNames) {
      const nested = `${only}/${folder}`;
      if (lowerPaths.has(`${nested.toLowerCase()}/index.html`) && !roots.includes(nested)) roots.push(nested);
    }
  }

  if (!roots.length) {
    for (const filePath of paths) {
      if (filePath.toLowerCase().endsWith('/index.html')) {
        const candidate = path.posix.dirname(filePath);
        if (!roots.includes(candidate)) roots.push(candidate);
      }
    }
  }
  return roots;
};

const readSmallText = async (file: SourceFile, max = 2 * 1024 * 1024) => {
  if (file.size > max) return '';
  return readFile(file.absolutePath, 'utf8');
};

const findPackageFile = (files: SourceFile[]) => files.find((file) => path.posix.basename(file.path).toLowerCase() === 'package.json');

export const detectFramework = async (files: SourceFile[], indexHtml = '') => {
  const packageFile = findPackageFile(files);
  if (packageFile) {
    try {
      const pkg = JSON.parse(await readSmallText(packageFile)) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) return 'Next.js';
      if (deps['@angular/core']) return 'Angular';
      if (deps.vue) return deps.vite ? 'Vue + Vite' : 'Vue';
      if (deps.svelte) return deps.vite ? 'Svelte + Vite' : 'Svelte';
      if (deps.react) return deps.vite ? 'React + Vite' : 'React';
      if (deps.vite) return 'Vite';
      if (deps.astro) return 'Astro';
    } catch {
      // Invalid package metadata becomes a validation warning elsewhere, not executable input.
    }
  }
  if (/type=["']module["'][^>]+src=["'][^"']*\/assets\//i.test(indexHtml) || /\/assets\/index[-.][a-z0-9_-]+\.js/i.test(indexHtml)) return 'Vite';
  if (/__next|_next\/static/i.test(indexHtml)) return 'Next.js static export';
  if (/ng-version|<app-root/i.test(indexHtml)) return 'Angular';
  if (/data-v-[a-f0-9]+|__VUE__/i.test(indexHtml)) return 'Vue';
  if (/id=["']root["']/i.test(indexHtml) && /\.js/i.test(indexHtml)) return 'React';
  return null;
};

const buildGuidance = (framework: string | null) => {
  if (!framework) return 'Upload a static output folder containing index.html.';
  if (framework.includes('Vite')) return 'This appears to be a Vite project. Run npm run build and upload the generated dist folder.';
  if (framework === 'Angular') return 'This appears to be an Angular project. Run the production build and upload its dist output folder.';
  if (framework.startsWith('Next.js')) return 'Configure a static export, build it, and upload the generated out folder.';
  if (framework.includes('React')) return 'Build the project and upload its generated build or dist folder.';
  return `Build the ${framework} project locally and upload its static output folder.`;
};

const getAttribute = (node: any, name: string) => node.attrs?.find((attribute: any) => attribute.name === name)?.value as string | undefined;

const walk = (node: any, callback: (current: any) => void) => {
  callback(node);
  for (const child of node.childNodes || []) walk(child, callback);
  if (node.content) walk(node.content, callback);
};

const collectHtmlReferences = (html: string, htmlPath: string) => {
  const document = parse(html);
  const references: string[] = [];
  let favicon: string | null = null;
  walk(document, (node) => {
    const tag = String(node.tagName || '').toLowerCase();
    const attributes: string[] = [];
    if (['script', 'img', 'source', 'video', 'audio', 'iframe', 'embed'].includes(tag)) attributes.push('src');
    if (tag === 'link') attributes.push('href');
    if (['video', 'object'].includes(tag)) attributes.push(tag === 'video' ? 'poster' : 'data');
    for (const attributeName of attributes) {
      const value = getAttribute(node, attributeName);
      if (value) references.push(value);
    }
    const srcset = getAttribute(node, 'srcset');
    if (srcset) references.push(...srcset.split(',').map((item) => item.trim().split(/\s+/)[0]).filter(Boolean));
    if (tag === 'link' && /(?:^|\s)(?:shortcut\s+)?icon(?:\s|$)/i.test(getAttribute(node, 'rel') || '')) favicon = getAttribute(node, 'href') || null;
  });

  const normalized = references.flatMap((reference) => {
    if (!reference || /^(?:[a-z]+:|\/\/|#|data:|blob:)/i.test(reference)) return [];
    const clean = reference.split(/[?#]/)[0];
    if (!clean) return [];
    try {
      return [normalizeArchivePath(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(htmlPath), decodeURIComponent(clean)))];
    } catch {
      return [clean];
    }
  });
  return { document, references: normalized, favicon };
};

const injectAnalytics = (html: string, scriptUrl: string, siteId: string, releaseId: string) => {
  const document = parse(html);
  let head: any = null;
  let alreadyInjected = false;
  walk(document, (node) => {
    if (node.tagName === 'head') head = node;
    if (node.tagName === 'script' && getAttribute(node, 'data-wersee-site-id')) alreadyInjected = true;
  });
  if (!head || alreadyInjected) return { html, injected: alreadyInjected };
  const fragment: any = parseFragment(`<script defer src="${scriptUrl}" data-wersee-site-id="${siteId}" data-wersee-release-id="${releaseId}"></script>`);
  for (const child of fragment.childNodes || []) {
    child.parentNode = head;
    head.childNodes.push(child);
  }
  return { html: serialize(document), injected: true };
};

const escapeHtmlAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const publicPathForHtml = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.toLowerCase() === 'index.html') return '/';
  if (normalized.toLowerCase().endsWith('/index.html')) return `/${normalized.slice(0, -'index.html'.length)}`;
  return `/${normalized}`;
};

const injectSeoMetadata = (html: string, manifest: WerseeSiteManifest, pagePath: string) => {
  const headClose = html.search(/<\/head\s*>/i);
  if (headClose < 0) return { html, injected: false };
  const canonical = new URL(pagePath, `${manifest.runtime.publicUrl.replace(/\/$/, '')}/`).href;
  const additions: string[] = [];
  if (!/<meta\b[^>]*\bname=["']robots["']/i.test(html)) {
    additions.push(`<meta name="robots" content="${manifest.seo.index ? 'index, follow' : 'noindex, nofollow'}">`);
  }
  if (manifest.seo.index && !/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    additions.push(`<link rel="canonical" href="${escapeHtmlAttribute(canonical)}">`);
  }
  if (pagePath === '/' && manifest.seo.title && !/<title\b/i.test(html)) {
    additions.push(`<title>${escapeHtmlAttribute(manifest.seo.title)}</title>`);
  }
  if (pagePath === '/' && manifest.seo.description && !/<meta\b[^>]*\bname=["']description["']/i.test(html)) {
    additions.push(`<meta name="description" content="${escapeHtmlAttribute(manifest.seo.description)}">`);
  }
  if (manifest.seo.structuredData && pagePath === '/' && !/<script\b[^>]*\btype=["']application\/ld\+json["']/i.test(html)) {
    const structuredData = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: manifest.seo.title || undefined,
      description: manifest.seo.description || undefined,
      url: manifest.runtime.publicUrl,
      inLanguage: manifest.seo.language,
    }).replaceAll('<', '\\u003c');
    additions.push(`<script type="application/ld+json">${structuredData}</script>`);
  }
  if (!additions.length) return { html, injected: true };
  const block = `\n    <!-- Managed by Wersee Sites -->\n    ${additions.join('\n    ')}\n  `;
  return { html: `${html.slice(0, headClose)}${block}${html.slice(headClose)}`, injected: true };
};

const safeOutputRelativePath = (filePath: string, root: string) => {
  if (!root) return filePath;
  const prefix = `${root.replace(/\/$/, '')}/`;
  if (!filePath.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  return filePath.slice(prefix.length);
};

const previewAttributeNames: Record<string, string[]> = {
  script: ['src'], img: ['src', 'srcset'], source: ['src', 'srcset'], video: ['src', 'poster'], audio: ['src'],
  link: ['href'], iframe: ['src'], embed: ['src'], object: ['data'],
};

export const rewriteHtmlForPreview = (html: string, previewPrefix: string) => {
  const document = parse(html);
  walk(document, (node) => {
    const names = previewAttributeNames[String(node.tagName || '').toLowerCase()] || [];
    for (const attribute of node.attrs || []) {
      if (!names.includes(attribute.name)) continue;
      if (attribute.name === 'srcset') {
        attribute.value = attribute.value.split(',').map((entry: string) => {
          const [url, descriptor] = entry.trim().split(/\s+/, 2);
          const rewritten = url.startsWith('/') && !url.startsWith('//') ? `${previewPrefix}${url}` : url;
          return `${rewritten}${descriptor ? ` ${descriptor}` : ''}`;
        }).join(', ');
      } else if (attribute.value.startsWith('/') && !attribute.value.startsWith('//')) {
        attribute.value = `${previewPrefix}${attribute.value}`;
      }
    }
  });
  return serialize(document);
};

export const validatePreparedSite = async (sourceFiles: SourceFile[], options: ValidationOptions): Promise<ValidationResult> => {
  const warnings: ValidationIssue[] = [];
  const errors: ValidationIssue[] = [];
  const blockedFiles: string[] = [];
  const missingReferencedAssets = new Set<string>();
  let totalSourceBytes = 0;
  const normalizedFiles: SourceFile[] = [];
  const seenSourcePaths = new Set<string>();

  for (const sourceFile of sourceFiles) {
    let normalized: string;
    try { normalized = normalizeArchivePath(sourceFile.path); }
    catch (error) {
      errors.push({ code: 'UNSAFE_PATH', message: 'A file contains an unsafe or absolute path.', path: sourceFile.path });
      continue;
    }
    const dedupeKey = normalized.normalize('NFC').toLowerCase();
    if (seenSourcePaths.has(dedupeKey)) {
      errors.push({ code: 'DUPLICATE_PATH', message: 'Two files normalize to the same path.', path: normalized });
      continue;
    }
    seenSourcePaths.add(dedupeKey);
    const blocked = blockedFileReason(normalized);
    if (blocked) {
      blockedFiles.push(normalized);
      errors.push({ code: 'BLOCKED_FILE', message: blocked, path: normalized });
    }
    if (sourceFile.symlink) errors.push({ code: 'SYMLINK_BLOCKED', message: 'Symbolic links are not allowed.', path: normalized });
    if (sourceFile.size > options.maxSingleFileBytes) errors.push({ code: 'SINGLE_FILE_LIMIT', message: 'This file exceeds the configured per-file limit.', path: normalized });
    totalSourceBytes += sourceFile.size;
    normalizedFiles.push({ ...sourceFile, path: normalized });
  }

  if (normalizedFiles.length > options.maxFileCount) errors.push({ code: 'FILE_COUNT_LIMIT', message: `The site contains more than ${options.maxFileCount.toLocaleString()} files.` });
  if (totalSourceBytes > options.maxUnpackedBytes) errors.push({ code: 'UNPACKED_SIZE_LIMIT', message: 'The extracted site exceeds the configured size limit.' });

  const roots = detectWebsiteRoots(normalizedFiles.map((file) => file.path));
  const packageFramework = await detectFramework(normalizedFiles);
  if (!roots.length) {
    errors.push({ code: 'INDEX_HTML_MISSING', message: 'No usable index.html was found.' });
    const report: SiteValidationReport = {
      detectedRoot: null, validRoots: [], totalFiles: normalizedFiles.length, totalSize: totalSourceBytes,
      htmlPages: 0, javascriptFiles: 0, cssFiles: 0, imageFiles: 0, missingReferencedAssets: [], blockedFiles,
      warnings, errors, detectedSpa: false, detectedFramework: packageFramework, faviconStatus: 'missing',
      analyticsInjectionStatus: 'blocked', werseeManifestStatus: 'blocked',
      seo: { indexingEnabled: false, sitemapGenerated: false, robotsGenerated: false, indexNowPrepared: false, indexedPages: 0 },
      aiTextEnhancement: { status: 'disabled', changedTextNodes: 0, consideredTextNodes: 0, filesChanged: 0 },
      integrations: { candidates: [], codeFilesScanned: 0, visualDomReviewRequired: false },
      publishable: false, guidance: buildGuidance(packageFramework),
    };
    return { report, files: [] };
  }

  const selectedRoot = options.selectedRoot == null ? (roots.length === 1 ? roots[0] : null) : options.selectedRoot;
  if (selectedRoot == null) errors.push({ code: 'MULTIPLE_SITE_ROOTS', message: 'Multiple publishable roots were detected. Choose the directory to publish.' });
  if (selectedRoot != null && !roots.some((root) => root.toLowerCase() === selectedRoot.toLowerCase())) {
    errors.push({ code: 'SITE_ROOT_INVALID', message: 'The selected publishing directory is not valid.' });
  }

  const outputFiles = selectedRoot == null ? [] : normalizedFiles.flatMap((file) => {
    const relative = safeOutputRelativePath(file.path, selectedRoot);
    return relative ? [{ ...file, path: relative }] : [];
  });
  const hadWerseeManifest = outputFiles.some((file) => file.path.toLowerCase() === 'wersee.json');
  const manifestFile = outputFiles.find((file) => file.path.toLowerCase() === 'wersee.json');
  let manifest: WerseeSiteManifest | null = null;
  if (selectedRoot != null) {
    try {
      manifest = parseWerseeManifestText(manifestFile ? await readSmallText(manifestFile, 128 * 1024) : '', {
        siteId: options.siteId,
        releaseId: options.releaseId,
        publicUrl: options.siteUrl,
        indexingEnabled: options.indexingEnabled,
        analyticsEnabled: options.analyticsEnabled,
        aiTextEnhancementEnabled: options.aiTextEnhancementEnabled,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WERSEE_MANIFEST_INVALID';
      errors.push({ code: message.split(':')[0], message: 'wersee.json is invalid. Check its JSON structure and supported fields.', path: 'wersee.json' });
    }
  }

  const indexFile = outputFiles.find((file) => file.path.toLowerCase() === 'index.html');
  const outputDirectory = indexFile ? path.dirname(indexFile.absolutePath) : null;
  const upsertManagedTextFile = async (filePath: string, contents: string) => {
    if (!outputDirectory) return false;
    const absolutePath = path.join(outputDirectory, ...filePath.split('/'));
    await writeFile(absolutePath, contents, 'utf8');
    const size = Buffer.byteLength(contents);
    const existingIndex = outputFiles.findIndex((file) => file.path.toLowerCase() === filePath.toLowerCase());
    const next = { path: filePath, absolutePath, size };
    if (existingIndex >= 0) outputFiles[existingIndex] = { ...outputFiles[existingIndex], ...next };
    else outputFiles.push(next);
    return true;
  };

  const htmlPaths = outputFiles
    .map((file) => file.path)
    .filter((filePath) => /\.html?$/i.test(filePath) && !/(?:^|\/)404\.html?$/i.test(filePath));
  let sitemapGenerated = false;
  let robotsGenerated = false;
  let indexNowPrepared = false;
  if (manifest && outputDirectory) {
    const pageUrls = htmlPaths.map((filePath) => new URL(publicPathForHtml(filePath), `${options.siteUrl.replace(/\/$/, '')}/`).href);
    if (manifest.seo.sitemap) {
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...pageUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
        '</urlset>',
        '',
      ].join('\n');
      sitemapGenerated = await upsertManagedTextFile('sitemap.xml', sitemap);
    }
    const robots = manifest.seo.index
      ? `User-agent: *\nAllow: /\n${manifest.seo.sitemap ? `Sitemap: ${options.siteUrl.replace(/\/$/, '')}/sitemap.xml\n` : ''}`
      : 'User-agent: *\nDisallow: /\n';
    robotsGenerated = await upsertManagedTextFile('robots.txt', robots);
    if (manifest.seo.index && options.indexNowKey) {
      indexNowPrepared = await upsertManagedTextFile(`${options.indexNowKey}.txt`, `${options.indexNowKey}\n`);
    }
    await upsertManagedTextFile('wersee.json', serializeWerseeManifest(manifest));
  }
  const outputPathSet = new Set(outputFiles.map((file) => file.path.toLowerCase()));
  const preparedFiles: PreparedSiteFile[] = [];
  let htmlPages = 0;
  let javascriptFiles = 0;
  let cssFiles = 0;
  let imageFiles = 0;
  let indexHtml = '';
  let faviconReference: string | null = null;
  let analyticsInjected = !options.analyticsEnabled;
  let seoInjected = !manifest?.seo.index;
  let aiStatus: SiteValidationReport['aiTextEnhancement']['status'] = manifest?.ai.improveText ? 'completed' : 'disabled';
  let aiChangedTextNodes = 0;
  let aiConsideredTextNodes = 0;
  let aiFilesChanged = 0;

  for (const file of outputFiles) {
    const lower = file.path.toLowerCase();
    if (buildConfigNames.has(lower)) {
      warnings.push({ code: 'PROJECT_CONFIG_IGNORED', message: 'Build and package configuration is not included in a static deployment.', path: file.path });
      continue;
    }
    const mime = lookupMime(file.path);
    if (!mime) {
      errors.push({ code: 'MIME_UNKNOWN', message: 'Wersee could not determine a safe content type.', path: file.path });
      continue;
    }
    const contentType = String(mime);
    const isHtml = contentType === 'text/html' || lower.endsWith('.html');
    if (isHtml) {
      htmlPages += 1;
      let html = await readSmallText(file);
      if (!html) {
        errors.push({ code: 'HTML_TOO_LARGE', message: 'An HTML page is too large to validate safely.', path: file.path });
        continue;
      }
      if (manifest?.ai.improveText && options.improveText) {
        try {
          const improved = await options.improveText(html, {
            locale: manifest.ai.locale,
            tone: manifest.ai.tone,
            instructions: manifest.ai.instructions,
          });
          html = improved.html;
          aiChangedTextNodes += improved.changedTextNodes;
          aiConsideredTextNodes += improved.consideredTextNodes;
          if (improved.changedTextNodes > 0) aiFilesChanged += 1;
        } catch {
          aiStatus = 'failed';
          warnings.push({ code: 'AI_TEXT_ENHANCEMENT_FAILED', message: 'Wersee AI could not improve this page. The original text was preserved.', path: file.path });
        }
      } else if (manifest?.ai.improveText) {
        aiStatus = 'failed';
        warnings.push({ code: 'AI_TEXT_ENHANCEMENT_UNAVAILABLE', message: 'Wersee AI is unavailable. The original text was preserved.', path: file.path });
      }
      if (manifest) {
        const seo = injectSeoMetadata(html, manifest, publicPathForHtml(file.path));
        html = seo.html;
        seoInjected ||= seo.injected;
      }
      if (lower === 'index.html') indexHtml = html;
      const references = collectHtmlReferences(html, file.path);
      if (lower === 'index.html') faviconReference = references.favicon;
      for (const reference of references.references) {
        if (!outputPathSet.has(reference.toLowerCase())) missingReferencedAssets.add(`${file.path} → ${reference}`);
      }
      if (manifest?.analytics.enabled) {
        const injected = injectAnalytics(html, options.analyticsScriptUrl, options.siteId, options.releaseId);
        html = injected.html;
        analyticsInjected ||= injected.injected;
      }
      await writeFile(file.absolutePath, html, 'utf8');
    } else if (/javascript|ecmascript/.test(contentType) || /\.(mjs|cjs|js)$/i.test(lower)) javascriptFiles += 1;
    else if (contentType === 'text/css') cssFiles += 1;
    else if (contentType.startsWith('image/')) imageFiles += 1;

    const buffer = await readFile(file.absolutePath);
    preparedFiles.push({
      ...file,
      contentType,
      sha1: createHash('sha1').update(buffer).digest('hex'),
      size: buffer.byteLength,
      isHtml,
    });
  }

  if (missingReferencedAssets.size) {
    warnings.push({ code: 'MISSING_REFERENCED_ASSETS', message: `${missingReferencedAssets.size} referenced asset${missingReferencedAssets.size === 1 ? ' is' : 's are'} missing.` });
  }
  const detectedFramework = await detectFramework(normalizedFiles, indexHtml);
  const detectedSpa = Boolean(indexHtml && htmlPages === 1 && /<script\b/i.test(indexHtml) && (detectedFramework || /id=["'](?:root|app)["']/i.test(indexHtml)));
  const faviconClean = faviconReference?.split(/[?#]/)[0] || null;
  const faviconPath = faviconClean
    ? (faviconClean.startsWith('/') ? faviconClean.slice(1) : path.posix.join('', faviconClean))
    : null;
  const faviconStatus: SiteValidationReport['faviconStatus'] = faviconPath
    ? (outputPathSet.has(faviconPath.toLowerCase()) ? 'present' : 'invalid')
    : (outputPathSet.has('favicon.ico') ? 'present' : 'missing');
  if (faviconStatus === 'missing') warnings.push({ code: 'FAVICON_MISSING', message: 'No favicon was detected.' });
  if (detectedSpa) warnings.push({ code: 'SPA_DETECTED', message: 'This looks like a single-page application. SPA fallback is recommended.' });

  const integrationCandidates = errors.length ? [] : await analyzeSiteIntegrations(preparedFiles);
  const report: SiteValidationReport = {
    detectedRoot: selectedRoot,
    validRoots: roots,
    totalFiles: preparedFiles.length,
    totalSize: preparedFiles.reduce((sum, file) => sum + file.size, 0),
    htmlPages,
    javascriptFiles,
    cssFiles,
    imageFiles,
    missingReferencedAssets: [...missingReferencedAssets].slice(0, 200),
    blockedFiles,
    warnings,
    errors,
    detectedSpa,
    detectedFramework,
    faviconStatus,
    analyticsInjectionStatus: errors.length ? 'blocked' : manifest?.analytics.enabled ? (analyticsInjected ? 'injected' : 'blocked') : 'disabled',
    werseeManifestStatus: errors.some((issue) => issue.code.startsWith('WERSEE_MANIFEST')) ? 'blocked' : hadWerseeManifest ? 'validated' : 'generated',
    seo: {
      indexingEnabled: Boolean(manifest?.seo.index),
      sitemapGenerated,
      robotsGenerated,
      indexNowPrepared,
      indexedPages: manifest?.seo.index ? htmlPaths.length : 0,
    },
    aiTextEnhancement: {
      status: aiStatus,
      changedTextNodes: aiChangedTextNodes,
      consideredTextNodes: aiConsideredTextNodes,
      filesChanged: aiFilesChanged,
    },
    integrations: {
      candidates: integrationCandidates,
      codeFilesScanned: preparedFiles.filter((file) => file.isHtml || /\.(?:mjs|cjs|js)$/i.test(file.path)).length,
      visualDomReviewRequired: integrationCandidates.some((candidate) => candidate.sourceKind === 'javascript'),
    },
    publishable: errors.length === 0 && preparedFiles.some((file) => file.path.toLowerCase() === 'index.html'),
  };
  if (manifest?.analytics.enabled && !analyticsInjected) {
    report.errors.push({ code: 'ANALYTICS_INJECTION_FAILED', message: 'Wersee Analytics could not be injected safely.' });
    report.publishable = false;
  }
  if (manifest?.seo.index && !seoInjected) {
    report.warnings.push({ code: 'SEO_METADATA_INJECTION_FAILED', message: 'SEO metadata could not be inserted into one or more HTML pages.' });
  }
  return { report, files: report.publishable ? preparedFiles : [] };
};
