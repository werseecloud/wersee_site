import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const rateCache = new Map<string, { rate: number; date?: string; fetchedAt: number }>();
const pendingRateFetches = new Map<string, Promise<{ rate: number; date?: string; fetchedAt: number }>>();

const normalizeCurrency = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

const getRate = async (base: string, target: string) => {
  if (base === target) return { rate: 1, date: new Date().toISOString().slice(0, 10), cached: true };

  const key = `${base}_${target}`;
  const cached = rateCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, cached: true };
  }

  const pending = pendingRateFetches.get(key);
  if (pending) {
    const result = await pending;
    return { ...result, cached: true };
  }

  const fetchRate = (async () => {
    const endpoint = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(target)}`;
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Frankfurter kon ${base}/${target} niet ophalen.`);
    }

    const payload = await response.json();
    const rate = Number(payload?.rate ?? payload?.rates?.[target]);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Frankfurter gaf geen geldige ${base}/${target} koers terug.`);
    }

    const next = { rate, date: payload?.date, fetchedAt: Date.now() };
    rateCache.set(key, next);
    return next;
  })();

  pendingRateFetches.set(key, fetchRate);
  try {
    const next = await fetchRate;
    return { ...next, cached: false };
  } finally {
    pendingRateFetches.delete(key);
  }
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'exchange-rate') {
      return new Response(JSON.stringify({ error: 'Unknown localization action.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base = normalizeCurrency(body.base);
    const target = normalizeCurrency(body.target);
    if (!base || !target) {
      return new Response(JSON.stringify({ error: 'Use geldige ISO 4217-valutacodes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rate = await getRate(base, target);
    return new Response(JSON.stringify({ base, target, ...rate }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Lokalisatie is tijdelijk niet beschikbaar.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
