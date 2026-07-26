import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Sandbox } from '@vercel/sandbox';
import type { PreparedSiteFile, SiteRuntimeConfig } from './types.js';

export type SiteComputerAnalysis = {
  summary: string;
  findings: Array<{ severity: 'info' | 'warning' | 'blocking'; title: string; detail: string }>;
  requestedSelectors: string[];
  provider: string;
  model: string;
};

type BrowserCapture = {
  domSummary: string;
  consoleErrors: string[];
  failedRequests: string[];
  screenshots: Array<{ file: string; viewport: 'desktop' | 'mobile' | 'element'; width: number; height: number }>;
};

type RunContext = {
  service: SupabaseClient;
  config: SiteRuntimeConfig;
  token: string;
  userId: string;
  siteId: string;
  releaseId: string;
  runId: string;
};

const BROWSER_SCRIPT = String.raw`
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = "/vercel/sandbox/site";
const output = "/vercel/sandbox/output";
const selectors = JSON.parse(process.argv[2] || "[]");
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".gif":"image/gif",".ico":"image/x-icon",".woff":"font/woff",".woff2":"font/woff2"};
const safePath = (url) => {
  const decoded = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const candidate = path.resolve(root, "." + decoded);
  return candidate === root || candidate.startsWith(root + path.sep) ? candidate : null;
};
const server = createServer(async (req, res) => {
  try {
    let file = safePath(req.url || "/");
    if (!file) { res.writeHead(400); return res.end(); }
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = path.join(file, "index.html");
    let body = await readFile(file);
    res.setHeader("content-type", mime[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.setHeader("cache-control", "no-store");
    res.end(body);
  } catch {
    try {
      const body = await readFile(path.join(root, "index.html"));
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(body);
    } catch { res.writeHead(404); res.end("Not found"); }
  }
});
await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
});
const consoleErrors = [];
const failedRequests = [];
const screenshots = [];
const capture = async (name, viewport, label, selector) => {
  const context = await browser.newContext({
    viewport,
    serviceWorkers: "block",
    locale: "en-US",
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" && url.port === "4173") return route.continue();
    failedRequests.push(url.origin + url.pathname);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 500));
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message.slice(0, 500)));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}input,textarea,[contenteditable=true],[data-wersee-private]{color:transparent!important;text-shadow:0 0 10px #777!important}iframe,video{filter:blur(12px)!important}" });
  await page.evaluate(() => {
    document.querySelectorAll("input,textarea").forEach((element) => {
      element.setAttribute("value", "");
      if ("value" in element) element.value = "";
    });
    document.querySelectorAll("[contenteditable=true]").forEach((element) => { element.textContent = ""; });
  });
  await page.waitForTimeout(500);
  let target = page;
  if (selector) {
    const locator = page.locator(selector).first();
    if (await locator.count()) target = locator;
  }
  const file = path.join(output, name + ".jpg");
  await target.screenshot({ path: file, type: "jpeg", quality: 58, animations: "disabled" });
  screenshots.push({ file, viewport: label, width: viewport.width, height: viewport.height });
  const domSummary = await page.evaluate(() => {
    const text = (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 18000);
    const controls = [...document.querySelectorAll("a,button,input[type=button],input[type=submit],[role=button]")]
      .slice(0, 250)
      .map((element, index) => {
        const label = (element.getAttribute("aria-label") || element.textContent || element.getAttribute("value") || "").replace(/\s+/g, " ").trim().slice(0, 160);
        const id = element.id ? "#" + CSS.escape(element.id) : "";
        const selector = id || element.tagName.toLowerCase() + ":nth-of-type(" + (index + 1) + ")";
        const rect = element.getBoundingClientRect();
        return { selector, label, tag: element.tagName.toLowerCase(), visible: rect.width > 0 && rect.height > 0 };
      });
    return JSON.stringify({ title: document.title, lang: document.documentElement.lang || null, text, controls });
  });
  await context.close();
  return domSummary;
};

let domSummary = await capture("desktop", { width: 1280, height: 800 }, "desktop");
await capture("mobile", { width: 390, height: 844 }, "mobile");
for (let index = 0; index < selectors.slice(0, 3).length; index++) {
  await capture("element-" + (index + 1), { width: 1280, height: 800 }, "element", selectors[index]);
}
await readFile("/vercel/sandbox/site/index.html");
await import("node:fs/promises").then(({ writeFile }) => writeFile(path.join(output, "result.json"), JSON.stringify({
  domSummary,
  consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
  failedRequests: [...new Set(failedRequests)].slice(0, 30),
  screenshots,
})));
await browser.close();
await new Promise((resolve) => server.close(resolve));
`;

const updateRun = async (
  context: RunContext,
  stage: string,
  progress: number,
  publicMessage: string,
  eventType: 'status' | 'snapshot' | 'finding' | 'completed' | 'failed' = 'status',
  extra: Record<string, unknown> = {},
) => {
  await context.service.from('site_ai_computer_runs').update({
    status: eventType === 'completed' ? 'completed' : eventType === 'failed' ? 'failed' : 'running',
    stage,
    progress,
    public_message: publicMessage,
    updated_at: new Date().toISOString(),
    ...(stage === 'booting' ? { started_at: new Date().toISOString() } : {}),
    ...extra,
  }).eq('id', context.runId);
  await context.service.from('site_ai_computer_events').insert({
    run_id: context.runId,
    site_id: context.siteId,
    event_type: eventType,
    stage,
    progress,
    public_message: publicMessage,
  });
};

const command = async (sandbox: Sandbox, params: Parameters<Sandbox['runCommand']>[0], code: string) => {
  const result = await sandbox.runCommand(params as any);
  if (result.exitCode !== 0) throw new Error(code);
  return result;
};

const writePreparedFiles = async (sandbox: Sandbox, files: PreparedSiteFile[]) => {
  await command(sandbox, { cmd: 'mkdir', args: ['-p', '/vercel/sandbox/site', '/vercel/sandbox/output'] }, 'SITE_COMPUTER_DIRECTORY_FAILED');
  const pending: Array<{ path: string; content: Uint8Array }> = [];
  let pendingBytes = 0;
  const flush = async () => {
    if (!pending.length) return;
    await sandbox.writeFiles(pending.splice(0));
    pendingBytes = 0;
  };
  for (const file of files) {
    const content = await readFile(file.absolutePath);
    pending.push({ path: `/vercel/sandbox/site/${file.path}`, content });
    pendingBytes += content.byteLength;
    if (pending.length >= 40 || pendingBytes >= 8 * 1024 * 1024) await flush();
  }
  await flush();
  await sandbox.writeFiles([{ path: '/vercel/sandbox/runner.mjs', content: BROWSER_SCRIPT }]);
};

const runBrowser = async (sandbox: Sandbox, selectors: string[] = []): Promise<BrowserCapture> => {
  await command(sandbox, {
    cmd: 'node',
    args: ['/vercel/sandbox/runner.mjs', JSON.stringify(selectors.slice(0, 3))],
    cwd: '/vercel/sandbox',
  }, 'SITE_COMPUTER_BROWSER_FAILED');
  const result = await sandbox.readFileToBuffer({ path: '/vercel/sandbox/output/result.json' });
  if (!result) throw new Error('SITE_COMPUTER_RESULT_MISSING');
  return JSON.parse(result.toString()) as BrowserCapture;
};

const callVision = async (
  context: RunContext,
  capture: BrowserCapture,
  phase: 'inspect' | 'review',
): Promise<SiteComputerAnalysis> => {
  const images = [];
  for (const screenshot of capture.screenshots.slice(-5)) {
    const image = await context.service.storage.from('site-ai-computer').download(
      `${context.userId}/${context.siteId}/${context.runId}/${path.posix.basename(screenshot.file)}`,
    );
    if (image.error) throw new Error('SITE_COMPUTER_SNAPSHOT_READ_FAILED');
    const bytes = new Uint8Array(await image.data.arrayBuffer());
    images.push({ viewport: screenshot.viewport, dataUrl: `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}` });
  }
  const response = await fetch(`${context.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/wersee-ai/site-computer/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${context.token}`,
      apikey: context.config.supabasePublishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      siteId: context.siteId,
      releaseId: context.releaseId,
      phase,
      domSummary: capture.domSummary,
      consoleErrors: capture.consoleErrors,
      failedRequests: capture.failedRequests,
      images,
    }),
    signal: AbortSignal.timeout(55_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.code || 'SITE_COMPUTER_AI_FAILED');
  return payload as SiteComputerAnalysis;
};

const storeSnapshots = async (
  context: RunContext,
  sandbox: Sandbox,
  capture: BrowserCapture,
  sequenceStart: number,
) => {
  let sequence = sequenceStart;
  for (const screenshot of capture.screenshots) {
    const bytes = await sandbox.readFileToBuffer({ path: screenshot.file });
    if (!bytes || bytes.byteLength > 4 * 1024 * 1024) throw new Error('SITE_COMPUTER_SNAPSHOT_INVALID');
    const storagePath = `${context.userId}/${context.siteId}/${context.runId}/${path.posix.basename(screenshot.file)}`;
    const upload = await context.service.storage.from('site-ai-computer').upload(storagePath, bytes, {
      contentType: 'image/jpeg',
      cacheControl: '60',
      upsert: true,
    });
    if (upload.error) throw new Error('SITE_COMPUTER_SNAPSHOT_UPLOAD_FAILED');
    const { data: row, error } = await context.service.from('site_ai_computer_snapshots').upsert({
      run_id: context.runId,
      site_id: context.siteId,
      storage_path: storagePath,
      viewport: screenshot.viewport,
      width: screenshot.width,
      height: screenshot.height,
      sequence,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      visibility: 'shared',
    }, { onConflict: 'run_id,sequence' }).select('id').single();
    if (error || !row) throw new Error('SITE_COMPUTER_SNAPSHOT_RECORD_FAILED');
    await context.service.from('site_ai_computer_events').insert({
      run_id: context.runId,
      site_id: context.siteId,
      event_type: 'snapshot',
      stage: screenshot.viewport,
      progress: screenshot.viewport === 'desktop' ? 44 : screenshot.viewport === 'mobile' ? 58 : 82,
      public_message: screenshot.viewport === 'desktop' ? 'Desktop view captured.' : screenshot.viewport === 'mobile' ? 'Mobile view captured.' : 'A requested detail was inspected.',
      snapshot_id: row.id,
    });
    sequence += 1;
  }
  return sequence;
};

export const runSiteAiComputer = async (
  context: RunContext,
  files: PreparedSiteFile[],
) => {
  let sandbox: (Sandbox & AsyncDisposable) | null = null;
  try {
    await updateRun(context, 'booting', 8, 'Starting an isolated computer with no site credentials.');
    sandbox = await Sandbox.create({
      runtime: 'node24',
      timeout: 5 * 60 * 1000,
      resources: { vcpus: 2 },
      networkPolicy: 'allow-all',
      persistent: false,
      teamId: context.config.vercelTeamId,
      projectId: context.config.vercelSitesProjectId,
      token: context.config.vercelToken,
      tags: { product: 'wersee-sites', run: context.runId.slice(0, 12) },
    });
    await updateRun(context, 'loading', 18, 'Preparing a private browser. Secrets are not mounted.');
    await command(sandbox, {
      cmd: 'dnf',
      args: ['install', '-y', 'https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm'],
      sudo: true,
    }, 'SITE_COMPUTER_CHROME_INSTALL_FAILED');
    await command(sandbox, {
      cmd: 'npm',
      args: ['install', '--no-save', '--ignore-scripts', 'playwright-core@1.62.0'],
      cwd: '/vercel/sandbox',
    }, 'SITE_COMPUTER_PLAYWRIGHT_INSTALL_FAILED');
    await writePreparedFiles(sandbox, files);
    await sandbox.updateNetworkPolicy('deny-all');
    await updateRun(context, 'desktop', 34, 'Opening the prepared release offline at desktop size.');
    const firstCapture = await runBrowser(sandbox);
    let nextSequence = await storeSnapshots(context, sandbox, firstCapture, 1);
    await updateRun(context, 'analyzing', 66, 'Wersee AI is comparing the pixels with the sanitized page structure.');
    let analysis = await callVision(context, firstCapture, 'inspect');
    if (analysis.requestedSelectors.length) {
      await updateRun(context, 'reviewing', 76, 'The visual agent requested a closer look at a few safe elements.');
      const detailCapture = await runBrowser(sandbox, analysis.requestedSelectors);
      nextSequence = await storeSnapshots(context, sandbox, {
        ...detailCapture,
        screenshots: detailCapture.screenshots.filter((item) => item.viewport === 'element'),
      }, nextSequence);
      analysis = await callVision(context, detailCapture, 'review');
    }
    await updateRun(context, 'complete', 100, analysis.summary, 'completed', {
      completed_at: new Date().toISOString(),
      provider: analysis.provider,
      model: analysis.model,
      result: { summary: analysis.summary, findings: analysis.findings },
      error_code: null,
    });
  } catch (error) {
    const code = String(error instanceof Error ? error.message : error)
      .split(':')[0].replace(/[^A-Z0-9_-]/gi, '_').slice(0, 80) || 'SITE_COMPUTER_FAILED';
    await updateRun(context, 'failed', 100, 'The private computer stopped safely. Your release files were not changed.', 'failed', {
      completed_at: new Date().toISOString(),
      error_code: code,
    }).catch(() => undefined);
  } finally {
    await sandbox?.stop().catch(() => undefined);
  }
};
