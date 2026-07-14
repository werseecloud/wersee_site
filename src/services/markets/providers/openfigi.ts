import type { OpenFigiInstrument, ProviderResult } from '../types';
import { normalizeOpenFigiInstrument } from '../normalize';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Provider returned invalid JSON');
  }
}

export async function searchOpenFigi(options: {
  query: string;
  apiKey: string;
  marketSecDes?: 'Equity' | 'Fund';
  next?: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
}): Promise<ProviderResult<{ instruments: OpenFigiInstrument[]; next: string | null; warning: string | null }>> {
  const query = options.query.trim();
  if (query.length < 1 || query.length > 120) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'Invalid OpenFIGI query' };
  }
  if (!options.apiKey) return { ok: false, code: 'UNAUTHORIZED', message: 'OpenFIGI API key is not configured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher('https://api.openfigi.com/v3/search', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-OPENFIGI-APIKEY': options.apiKey,
      },
      body: JSON.stringify({
        query,
        marketSecDes: options.marketSecDes ?? 'Equity',
        includeUnlistedEquities: false,
        ...(options.next ? { next: options.next } : {}),
      }),
    });

    const retryAfterSeconds = Number(response.headers.get('retry-after') || 0) || undefined;
    const json = await parseJson(response);
    if (response.status === 429) return { ok: false, code: 'RATE_LIMITED', message: 'OpenFIGI rate limit reached', retryAfterSeconds };
    if (response.status === 401 || response.status === 403) return { ok: false, code: 'UNAUTHORIZED', message: 'OpenFIGI authorization failed' };
    if (!response.ok) return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: String(json?.error || 'OpenFIGI request failed') };
    if (json?.error) return { ok: false, code: 'UNKNOWN', message: String(json.error) };

    const warning = json?.warning ? String(json.warning) : null;
    const instruments = Array.isArray(json?.data)
      ? json.data.map(normalizeOpenFigiInstrument).filter(Boolean) as OpenFigiInstrument[]
      : [];

    return {
      ok: true,
      data: { instruments, next: json?.next || null, warning },
      provider: 'openfigi',
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: error?.name === 'AbortError' ? 'PROVIDER_UNAVAILABLE' : 'UNKNOWN',
      message: error?.name === 'AbortError' ? 'OpenFIGI request timed out' : error?.message || 'OpenFIGI request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}
