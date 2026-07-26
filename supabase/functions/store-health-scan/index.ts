import { createClient } from 'npm:@supabase/supabase-js@2';

type Strategy = 'mobile' | 'desktop';

class PageSpeedError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'PageSpeedError';
    this.code = code;
    this.retryable = retryable;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const scoreToPercent = (score: unknown) => {
  const numeric = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  return Math.max(0, Math.min(100, Math.round(numeric * 100)));
};

const stripAuditText = (value = '') =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const priorityForAudit = (score: number, savingsMs = 0, savingsBytes = 0) => {
  if (score < 0.5 || savingsMs >= 1000 || savingsBytes >= 250000) return 'high';
  if (score < 0.9 || savingsMs >= 250 || savingsBytes >= 50000) return 'medium';
  return 'low';
};

const compactRawResult = (result: any) => ({
  id: result.id,
  finalUrl: result.lighthouseResult?.finalDisplayedUrl || result.lighthouseResult?.finalUrl,
  fetchTime: result.lighthouseResult?.fetchTime,
  userAgent: result.lighthouseResult?.userAgent,
  runtimeError: result.lighthouseResult?.runtimeError || null,
  categories: result.lighthouseResult?.categories || {},
  categoryGroups: result.lighthouseResult?.categoryGroups || {},
});

const compactCategoryDetails = (categories: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(categories).map(([id, category]) => [
      id,
      {
        id,
        title: category?.title || id,
        score: scoreToPercent(category?.score),
      },
    ]),
  );

const extractDiagnostics = (audits: Record<string, any>) => {
  const metricIds = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
    'server-response-time',
  ];

  return Object.fromEntries(
    metricIds
      .map((id) => {
        const audit = audits[id];
        if (!audit) return null;
        return [
          id,
          {
            title: audit.title || id,
            value: audit.displayValue || '',
            score: scoreToPercent(audit.score),
          },
        ];
      })
      .filter(Boolean) as Array<[string, unknown]>,
  );
};

const extractOpportunities = (lighthouseResult: any) => {
  const audits = lighthouseResult?.audits || {};
  const categories = lighthouseResult?.categories || {};
  const categoryByAuditId = new Map<string, string>();

  Object.values(categories).forEach((category: any) => {
    (category.auditRefs || []).forEach((ref: any) => {
      if (ref?.id) categoryByAuditId.set(ref.id, category.title || category.id || 'General');
    });
  });

  return Object.values(audits)
    .filter((audit: any) => {
      if (!audit || audit.scoreDisplayMode === 'not_applicable' || audit.scoreDisplayMode === 'manual') return false;
      const detailsType = audit.details?.type;
      const score = typeof audit.score === 'number' ? audit.score : 1;
      return detailsType === 'opportunity' || score < 0.9;
    })
    .map((audit: any) => {
      const savingsMs = Math.round(audit.details?.overallSavingsMs || 0);
      const savingsBytes = Math.round(audit.details?.overallSavingsBytes || 0);
      const impact = audit.displayValue || (savingsMs > 0 ? `${savingsMs} ms te winnen` : undefined);

      return {
        id: audit.id,
        title: audit.title || audit.id,
        description: stripAuditText(audit.description || audit.explanation || ''),
        category: categoryByAuditId.get(audit.id) || 'General',
        priority: priorityForAudit(typeof audit.score === 'number' ? audit.score : 1, savingsMs, savingsBytes),
        impact,
        score: scoreToPercent(audit.score),
        savingsMs,
        savingsBytes,
      };
    })
    .sort((a: any, b: any) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority as keyof typeof rank] - rank[b.priority as keyof typeof rank]
        || (b.savingsMs + b.savingsBytes / 1000) - (a.savingsMs + a.savingsBytes / 1000)
        || a.score - b.score;
    })
    .slice(0, 12);
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const runPageSpeedScan = async (storeUrl: string, strategy: Strategy, apiKey: string) => {
  const params = new URLSearchParams({
    url: storeUrl,
    strategy,
    locale: 'nl',
    utm_source: 'wersee',
    utm_campaign: 'store_health',
  });

  ['performance', 'accessibility', 'best-practices', 'seo'].forEach((category) => {
    params.append('category', category);
  });

  params.set('key', apiKey);

  let result: any;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`);
    const responseText = await response.text();
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {};
    }

    if (response.ok) break;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < 2) {
      await wait(1000 * (attempt + 1));
      continue;
    }

    const googleMessage = String(result?.error?.message || '').trim();
    const code = response.status === 429
      ? 'PAGESPEED_RATE_LIMITED'
      : response.status === 403
        ? 'PAGESPEED_FORBIDDEN'
        : 'PAGESPEED_REQUEST_FAILED';
    const message = response.status === 429
      ? 'Google PageSpeed heeft tijdelijk te veel verzoeken ontvangen. Probeer het over enkele minuten opnieuw.'
      : response.status === 403
        ? 'De Google PageSpeed API-key is niet geldig of heeft geen toegang tot de PageSpeed Insights API.'
        : googleMessage || `Google PageSpeed kon de store niet scannen (${response.status}).`;
    throw new PageSpeedError(message, code, retryable);
  }

  const lighthouseResult = result.lighthouseResult;
  const categories = lighthouseResult?.categories || {};
  const performanceScore = scoreToPercent(categories.performance?.score);
  const accessibilityScore = scoreToPercent(categories.accessibility?.score);
  const seoScore = scoreToPercent(categories.seo?.score);
  const bestPracticesScore = scoreToPercent(categories['best-practices']?.score);
  const totalScore = Math.round((performanceScore + accessibilityScore + seoScore + bestPracticesScore) / 4);

  return {
    strategy,
    total_score: totalScore,
    performance_score: performanceScore,
    accessibility_score: accessibilityScore,
    seo_score: seoScore,
    best_practices_score: bestPracticesScore,
    opportunities: extractOpportunities(lighthouseResult),
    diagnostics: extractDiagnostics(lighthouseResult?.audits || {}),
    category_details: compactCategoryDetails(categories),
    raw_summary: compactRawResult(result),
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ success: false, error: 'Supabase function secrets are not configured.' }, 500);
    }

    const authorization = req.headers.get('Authorization') || '';
    const token = authorization.replace(/^Bearer\s+/i, '');

    if (!token) return jsonResponse({ success: false, error: 'Missing authorization token.' }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ success: false, error: 'Log opnieuw in om Store Health te scannen.' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'scan');
    const businessId = String(body.businessId || '');
    const requestedStrategy = String(body.strategy || 'both');
    const strategies: Strategy[] = requestedStrategy === 'mobile' || requestedStrategy === 'desktop'
      ? [requestedStrategy]
      : ['mobile', 'desktop'];

    const pageSpeedApiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY') || Deno.env.get('PAGESPEED_API_KEY') || '';
    if (action === 'status') {
      return jsonResponse({
        success: true,
        available: Boolean(pageSpeedApiKey),
        code: pageSpeedApiKey ? null : 'PAGESPEED_NOT_CONFIGURED',
        message: pageSpeedApiKey
          ? null
          : 'Store Health is tijdelijk uitgeschakeld totdat GOOGLE_PAGESPEED_API_KEY als Supabase secret is ingesteld.',
      });
    }

    if (!pageSpeedApiKey) {
      return jsonResponse({
        success: false,
        available: false,
        code: 'PAGESPEED_NOT_CONFIGURED',
        error: 'Store Health is tijdelijk uitgeschakeld totdat GOOGLE_PAGESPEED_API_KEY als Supabase secret is ingesteld.',
      });
    }

    if (!businessId) return jsonResponse({ success: false, error: 'Missing businessId.' }, 400);

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, user_id, slug, name')
      .eq('id', businessId)
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business) return jsonResponse({ success: false, error: 'Wersee Store niet gevonden.' }, 404);

    const appBaseUrl = (Deno.env.get('WERSEE_PUBLIC_SITE_URL')
      || Deno.env.get('SITE_URL')
      || Deno.env.get('APP_BASE_URL')
      || 'https://wersee.com').replace(/\/+$/, '');
    const storeSlug = business.slug || business.id;
    const storeUrl = `${appBaseUrl}/${encodeURIComponent(storeSlug)}`;
    const scannedAt = new Date().toISOString();

    const scanRows = [];
    for (const strategy of strategies) {
      scanRows.push({
        business_id: business.id,
        user_id: userData.user.id,
        store_url: storeUrl,
        scanned_at: scannedAt,
        ...(await runPageSpeedScan(storeUrl, strategy, pageSpeedApiKey)),
      });
    }

    const { data: insertedScans, error: insertError } = await supabase
      .from('store_health_scans')
      .insert(scanRows)
      .select('*');

    if (insertError) throw insertError;

    return jsonResponse({ success: true, scans: insertedScans });
  } catch (error) {
    if (error instanceof PageSpeedError) {
      console.warn('store-health-scan PageSpeed unavailable', error.code);
      return jsonResponse({
        success: false,
        available: true,
        retryable: error.retryable,
        code: error.code,
        error: error.message,
      });
    }

    console.error('store-health-scan failed', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'PageSpeed scan is mislukt.',
    }, 500);
  }
});
