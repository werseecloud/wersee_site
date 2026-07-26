import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import type { PreparedSiteFile } from './types.js';

export type SiteIntegrationCandidate = {
  id: string;
  kind: 'quick_pay' | 'wersee_oauth';
  sourcePath: string;
  sourceKind: 'html' | 'javascript';
  label: string;
  detectedAmount: number | null;
  detectedCurrency: string | null;
  confidence: number;
};

export type AppliedSiteIntegrations = {
  quickPay?: {
    candidateId: string;
    label: string;
    routePath: string;
    checkoutUrl: string;
  };
  oauth?: {
    candidateId?: string;
    label: string;
    placement: 'existing' | 'header' | 'footer' | 'selector';
    targetSelector?: string;
    callbackPath: string;
    clientId: string;
    issuerUrl: string;
  };
};

type LocatedCandidate = SiteIntegrationCandidate & {
  startTagEnd?: number;
};

const payPattern = /\b(pay|buy|checkout|purchase|order|betaal|betalen|koop|kopen|bestel|afrekenen)\b/i;
const loginPattern = /\b(log[\s-]?in|sign[\s-]?in|aanmelden|inloggen|account)\b/i;
const interactiveTags = new Set(['a', 'button', 'input']);

const nodeText = (node: any): string => {
  if (node.nodeName === '#text') return String(node.value || '');
  if (node.tagName === 'input') return String(node.attrs?.find((attribute: any) => attribute.name === 'value')?.value || '');
  return (node.childNodes || []).map(nodeText).join(' ');
};

const compactText = (value: string) => value.replace(/\s+/g, ' ').trim();

const parsePrice = (value: string) => {
  const matches = [...value.matchAll(/(?:€\s*|EUR\s*)(\d{1,7}(?:[.,]\d{1,2})?)|(?:\$\s*|USD\s*)(\d{1,7}(?:[.,]\d{1,2})?)/gi)]
    .map((match) => ({
      amount: Number(String(match[1] || match[2]).replace(',', '.')),
      currency: match[1] ? 'eur' : 'usd',
    }))
    .filter((match) => Number.isFinite(match.amount) && match.amount > 0 && match.amount <= 1_000_000);
  const unique = [...new Map(matches.map((match) => [`${match.currency}:${match.amount}`, match])).values()];
  return unique.length === 1 ? unique[0] : null;
};

const candidateId = (sourcePath: string, kind: string, locator: string, label: string) => createHash('sha256')
  .update(`${sourcePath}:${kind}:${locator}:${label}`)
  .digest('hex')
  .slice(0, 24);

const analyzeHtml = (html: string, sourcePath: string): LocatedCandidate[] => {
  const document: any = parse(html, { sourceCodeLocationInfo: true });
  const candidates: LocatedCandidate[] = [];
  const visit = (node: any, ancestors: any[]) => {
    const tag = String(node.tagName || '').toLowerCase();
    const role = String(node.attrs?.find((attribute: any) => attribute.name === 'role')?.value || '').toLowerCase();
    if (interactiveTags.has(tag) || role === 'button') {
      const label = compactText([
        nodeText(node),
        node.attrs?.find((attribute: any) => attribute.name === 'aria-label')?.value,
        node.attrs?.find((attribute: any) => attribute.name === 'title')?.value,
      ].filter(Boolean).join(' ')).slice(0, 160);
      const location = node.sourceCodeLocation?.startTag || node.sourceCodeLocation;
      if (label && location?.endOffset) {
        const context = compactText(nodeText(ancestors.at(-1) || node)).slice(0, 800);
        const price = parsePrice(context);
        const kinds: Array<'quick_pay' | 'wersee_oauth'> = [];
        if (payPattern.test(label)) kinds.push('quick_pay');
        if (loginPattern.test(label)) kinds.push('wersee_oauth');
        for (const kind of kinds) {
          candidates.push({
            id: candidateId(sourcePath, kind, String(location.startOffset), label),
            kind,
            sourcePath,
            sourceKind: 'html',
            label,
            detectedAmount: kind === 'quick_pay' ? price?.amount ?? null : null,
            detectedCurrency: kind === 'quick_pay' ? price?.currency ?? null : null,
            confidence: kind === 'quick_pay' ? (price ? 0.98 : 0.72) : 0.94,
            startTagEnd: location.endOffset,
          });
        }
      }
    }
    for (const child of node.childNodes || []) visit(child, [...ancestors, node]);
    if (node.content) visit(node.content, [...ancestors, node]);
  };
  visit(document, []);
  return candidates;
};

const analyzeJavascript = (source: string, sourcePath: string): LocatedCandidate[] => {
  const candidates: LocatedCandidate[] = [];
  const quoted = [...source.matchAll(/(["'`])([^"'`\r\n]{2,120})\1/g)].map((match) => compactText(match[2]));
  const price = parsePrice(source.slice(0, 1_000_000));
  for (const kind of ['quick_pay', 'wersee_oauth'] as const) {
    const pattern = kind === 'quick_pay' ? payPattern : loginPattern;
    const label = quoted.find((value) => pattern.test(value));
    if (!label) continue;
    candidates.push({
      id: candidateId(sourcePath, kind, 'runtime', label),
      kind,
      sourcePath,
      sourceKind: 'javascript',
      label,
      detectedAmount: kind === 'quick_pay' ? price?.amount ?? null : null,
      detectedCurrency: kind === 'quick_pay' ? price?.currency ?? null : null,
      confidence: kind === 'quick_pay' ? (price ? 0.78 : 0.55) : 0.72,
    });
  }
  return candidates;
};

export const analyzeSiteIntegrations = async (files: PreparedSiteFile[]): Promise<SiteIntegrationCandidate[]> => {
  const candidates: LocatedCandidate[] = [];
  for (const file of files) {
    if (file.size > 2 * 1024 * 1024) continue;
    if (file.isHtml) candidates.push(...analyzeHtml(await readFile(file.absolutePath, 'utf8'), file.path));
    else if (/\.(?:mjs|cjs|js)$/i.test(file.path)) candidates.push(...analyzeJavascript(await readFile(file.absolutePath, 'utf8'), file.path));
  }
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 40)
    .map(({ startTagEnd: _startTagEnd, ...candidate }) => candidate);
};

const escapeAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const injectAtStartTag = (html: string, candidate: LocatedCandidate, attribute: string, value: string) => {
  if (!candidate.startTagEnd) return html;
  const insertion = ` ${attribute}="${escapeAttribute(value)}"`;
  return `${html.slice(0, candidate.startTagEnd - 1)}${insertion}${html.slice(candidate.startTagEnd - 1)}`;
};

const injectRuntimeConfig = (html: string, config: AppliedSiteIntegrations) => {
  if (html.includes('data-wersee-integrations-runtime')) return html;
  const serialized = JSON.stringify(config).replaceAll('<', '\\u003c');
  const block = `<script>window.__WERSEE_SITE_INTEGRATIONS__=${serialized}</script><script defer src="/__wersee/integrations.js" data-wersee-integrations-runtime></script>`;
  const index = html.search(/<\/head\s*>/i);
  return index >= 0 ? `${html.slice(0, index)}${block}${html.slice(index)}` : html;
};

const runtimeSource = `(()=>{"use strict";
const c=window.__WERSEE_SITE_INTEGRATIONS__||{},q=(s,r=document)=>{try{return r.querySelector(s)}catch{return null}},
txt=e=>(e?.innerText||e?.textContent||e?.value||e?.getAttribute?.("aria-label")||"").replace(/\\s+/g," ").trim().toLowerCase(),
find=l=>[...document.querySelectorAll("a,button,input,[role=button]")].find(e=>txt(e).includes(String(l||"").toLowerCase()));
const make=(where,label)=>{const e=document.createElement("button");e.type="button";e.textContent=label;e.setAttribute("data-wersee-generated","true");e.style.cssText="appearance:none;border:1px solid rgba(127,127,127,.35);border-radius:999px;padding:.7rem 1rem;background:#111;color:#fff;font:600 14px system-ui;cursor:pointer";(where||document.body).appendChild(e);return e};
const bind=(kind,x)=>{if(!x)return;let e=q("[data-wersee-"+kind+"]");
if(!e&&x.candidateId)e=q('[data-wersee-candidate="'+CSS.escape(x.candidateId)+'"]');
if(!e&&x.label)e=find(x.label);
if(!e&&x.placement&&x.placement!=="existing"){const host=x.placement==="selector"?q(x.targetSelector):q(x.placement)||document.body;e=make(host,x.label||"Log in with Wersee")}
if(!e)return;
if(kind==="pay")e.addEventListener("click",v=>{v.preventDefault();location.assign(x.routePath)});
else e.addEventListener("click",async v=>{v.preventDefault();const a=new Uint8Array(32);crypto.getRandomValues(a);const ver=btoa(String.fromCharCode(...a)).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,""),digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ver)),challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,""),state=crypto.randomUUID();sessionStorage.setItem("wersee_oauth_pkce",JSON.stringify({ver,state}));const u=new URL(x.issuerUrl+"/auth/v1/oauth/authorize");u.search=new URLSearchParams({client_id:x.clientId,redirect_uri:location.origin+x.callbackPath,response_type:"code",scope:"openid email profile",state,code_challenge:challenge,code_challenge_method:"S256"});location.assign(u)})};
const callback=async()=>{if(!c.oauth||location.pathname.replace(/\\/+$/,"")!==c.oauth.callbackPath.replace(/\\/+$/,""))return false;const p=new URLSearchParams(location.search),code=p.get("code"),state=p.get("state"),saved=JSON.parse(sessionStorage.getItem("wersee_oauth_pkce")||"null");if(!code||!saved||state!==saved.state){document.body.textContent="Wersee login could not be verified.";return true}const body=new URLSearchParams({grant_type:"authorization_code",client_id:c.oauth.clientId,code,redirect_uri:location.origin+c.oauth.callbackPath,code_verifier:saved.ver});const r=await fetch(c.oauth.issuerUrl+"/auth/v1/oauth/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});if(!r.ok){document.body.textContent="Wersee login failed.";return true}const tokens=await r.json();sessionStorage.setItem("wersee_oauth_session",JSON.stringify(tokens));sessionStorage.removeItem("wersee_oauth_pkce");location.replace("/");return true};
document.addEventListener("DOMContentLoaded",async()=>{if(await callback())return;bind("pay",c.quickPay);bind("login",c.oauth)})})();`;

const redirectDocument = (url: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${escapeAttribute(url)}"><title>Opening secure payment…</title></head><body><p>Opening <a href="${escapeAttribute(url)}">secure Wersee Pay</a>…</p><script>location.replace(${JSON.stringify(url).replaceAll('<', '\\u003c')})</script></body></html>`;

const oauthCallbackDocument = () => '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signing in with Wersee…</title></head><body><p>Signing in with Wersee…</p></body></html>';

const writeGenerated = async (root: string, relativePath: string, contents: string, contentType: string): Promise<PreparedSiteFile> => {
  const absolutePath = path.join(root, ...relativePath.split('/'));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, 'utf8');
  const buffer = Buffer.from(contents);
  return {
    path: relativePath,
    absolutePath,
    size: buffer.byteLength,
    contentType,
    sha1: createHash('sha1').update(buffer).digest('hex'),
    isHtml: contentType === 'text/html',
  };
};

export const applySiteIntegrations = async (
  files: PreparedSiteFile[],
  config: AppliedSiteIntegrations,
): Promise<{ files: PreparedSiteFile[]; candidates: SiteIntegrationCandidate[] }> => {
  const located = new Map<string, LocatedCandidate>();
  for (const file of files) {
    if (!file.isHtml || file.size > 2 * 1024 * 1024) continue;
    for (const candidate of analyzeHtml(await readFile(file.absolutePath, 'utf8'), file.path)) located.set(candidate.id, candidate);
  }
  const output = [...files];
  for (let index = 0; index < output.length; index += 1) {
    const file = output[index];
    if (!file.isHtml) continue;
    let html = await readFile(file.absolutePath, 'utf8');
    const insertions: Array<{ candidate: LocatedCandidate; attribute: string; value: string }> = [];
    if (config.quickPay) {
      const candidate = located.get(config.quickPay.candidateId);
      if (candidate?.sourcePath === file.path) {
        insertions.push({ candidate, attribute: 'data-wersee-candidate', value: candidate.id });
        insertions.push({ candidate, attribute: 'data-wersee-pay', value: config.quickPay.routePath });
      }
    }
    if (config.oauth?.candidateId) {
      const candidate = located.get(config.oauth.candidateId);
      if (candidate?.sourcePath === file.path) {
        insertions.push({ candidate, attribute: 'data-wersee-candidate', value: candidate.id });
        insertions.push({ candidate, attribute: 'data-wersee-login', value: 'oauth2.1' });
      }
    }
    for (const insertion of insertions.sort((a, b) => (b.candidate.startTagEnd || 0) - (a.candidate.startTagEnd || 0))) {
      html = injectAtStartTag(html, insertion.candidate, insertion.attribute, insertion.value);
    }
    html = injectRuntimeConfig(html, config);
    await writeFile(file.absolutePath, html, 'utf8');
    const buffer = Buffer.from(html);
    output[index] = { ...file, size: buffer.byteLength, sha1: createHash('sha1').update(buffer).digest('hex') };
  }
  const root = path.dirname(output.find((file) => file.path === 'index.html')?.absolutePath || output[0].absolutePath);
  output.push(await writeGenerated(root, '__wersee/integrations.js', runtimeSource, 'application/javascript'));
  if (config.quickPay) output.push(await writeGenerated(root, `${config.quickPay.routePath.replace(/^\/|\/$/g, '')}/index.html`, redirectDocument(config.quickPay.checkoutUrl), 'text/html'));
  if (config.oauth) output.push(await writeGenerated(root, `${config.oauth.callbackPath.replace(/^\/|\/$/g, '')}/index.html`, injectRuntimeConfig(oauthCallbackDocument(), config), 'text/html'));
  return { files: output, candidates: [...located.values()].map(({ startTagEnd: _startTagEnd, ...candidate }) => candidate) };
};
