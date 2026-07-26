import type { ProviderResult } from '../types';
import { normalizeFinnhubQuote } from '../normalize';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const premiumMessage = (message: string) =>
  /premium|upgrade|subscription|not available for your plan/i.test(message);

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Provider returned invalid JSON');
  }
}

export async function fetchFinnhubQuote(options: {
  symbol: string;
  apiKey: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
}): Promise<ProviderResult<ReturnType<typeof normalizeFinnhubQuote>>> {
  const symbol = options.symbol.trim().toUpperCase();
  if (!symbol || !/^[A-Z0-9:._/-]{1,40}$/.test(symbol)) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'Invalid Finnhub symbol' };
  }
  if (!options.apiKey) return { ok: false, code: 'UNAUTHORIZED', message: 'Finnhub API key is not configured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const fetcher = options.fetcher ?? fetch;
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(options.apiKey)}`;
    const response = await fetcher(url, { signal: controller.signal });
    const retryAfterSeconds = Number(response.headers.get('retry-after') || 0) || undefined;
    const json = await parseJson(response);

    if (response.status === 429) {
      return { ok: false, code: 'RATE_LIMITED', message: 'Finnhub rate limit reached', retryAfterSeconds };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'Finnhub authorization failed' };
    }
    if (!response.ok) {
      const message = String(json?.error || json?.message || 'Finnhub request failed');
      return { ok: false, code: premiumMessage(message) ? 'PREMIUM_ENDPOINT' : 'PROVIDER_UNAVAILABLE', message };
    }
    if (json?.error) {
      const message = String(json.error);
      return { ok: false, code: premiumMessage(message) ? 'PREMIUM_ENDPOINT' : 'UNKNOWN', message };
    }
    if (!json || Object.values(json).every((value) => value === 0 || value === null || value === undefined)) {
      return { ok: false, code: 'NOT_FOUND', message: 'Finnhub quote not found' };
    }

    return {
      ok: true,
      data: normalizeFinnhubQuote(json),
      provider: 'finnhub',
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: error?.name === 'AbortError' ? 'PROVIDER_UNAVAILABLE' : 'UNKNOWN',
      message: error?.name === 'AbortError' ? 'Finnhub request timed out' : error?.message || 'Finnhub request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}
