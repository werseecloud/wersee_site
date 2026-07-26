import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeSiteIntegrations, applySiteIntegrations } from './integrations.js';
import type { PreparedSiteFile } from './types.js';

const temporaryDirectories: string[] = [];

const htmlFile = async (html: string): Promise<PreparedSiteFile> => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wersee-integrations-'));
  temporaryDirectories.push(directory);
  const absolutePath = path.join(directory, 'index.html');
  await writeFile(absolutePath, html, 'utf8');
  return {
    path: 'index.html',
    absolutePath,
    size: Buffer.byteLength(html),
    contentType: 'text/html',
    sha1: 'test',
    isHtml: true,
  };
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('Wersee Sites integrations', () => {
  it('detects a payment button and the single nearby price without guessing', async () => {
    const file = await htmlFile('<!doctype html><html><body><article><h1>Pro plan</h1><p>€ 29,95</p><button>Buy now</button></article></body></html>');
    const candidates = await analyzeSiteIntegrations([file]);
    const pay = candidates.find((candidate) => candidate.kind === 'quick_pay');
    expect(pay).toMatchObject({
      label: 'Buy now',
      detectedAmount: 29.95,
      detectedCurrency: 'eur',
      sourcePath: 'index.html',
    });
  });

  it('leaves the amount empty when multiple prices are near the same control', async () => {
    const file = await htmlFile('<!doctype html><html><body><article><p>€ 10 or € 20</p><button>Pay</button></article></body></html>');
    const candidates = await analyzeSiteIntegrations([file]);
    expect(candidates.find((candidate) => candidate.kind === 'quick_pay')?.detectedAmount).toBeNull();
  });

  it('injects reviewed routes plus isolated Pay and OAuth runtime files', async () => {
    const file = await htmlFile('<!doctype html><html><head></head><body><button>Pay € 12</button><a href="#">Log in</a></body></html>');
    const candidates = await analyzeSiteIntegrations([file]);
    const pay = candidates.find((candidate) => candidate.kind === 'quick_pay');
    const login = candidates.find((candidate) => candidate.kind === 'wersee_oauth');
    expect(pay && login).toBeTruthy();
    const result = await applySiteIntegrations([file], {
      quickPay: {
        candidateId: pay!.id,
        label: pay!.label,
        routePath: '/buy/',
        checkoutUrl: 'https://wersee.com/example/quick-pay/test',
      },
      oauth: {
        candidateId: login!.id,
        label: login!.label,
        placement: 'existing',
        callbackPath: '/auth/wersee/callback/',
        clientId: 'public-client-id',
        issuerUrl: 'https://project.supabase.co',
      },
    });
    expect(result.files.map((item) => item.path)).toEqual(expect.arrayContaining([
      '__wersee/integrations.js',
      'buy/index.html',
      'auth/wersee/callback/index.html',
    ]));
    const transformed = await readFile(file.absolutePath, 'utf8');
    expect(transformed).toContain('data-wersee-pay="/buy/"');
    expect(transformed).toContain('data-wersee-login="oauth2.1"');
    expect(transformed).toContain('data-wersee-integrations-runtime');
    const callback = result.files.find((item) => item.path === 'auth/wersee/callback/index.html');
    expect(await readFile(callback!.absolutePath, 'utf8')).toContain('public-client-id');
  });
});
