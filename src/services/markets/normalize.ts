import type { MarketAsset, MarketAssetType, MarketQuote, OpenFigiInstrument } from './types';

const slugPart = (value: string | null | undefined) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const validNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? String(value) : null;
};

export function canonicalSlugForAsset(input: {
  type: MarketAssetType;
  exchangeCode?: string | null;
  symbol: string;
  providerExchange?: string | null;
}) {
  if (input.type === 'crypto') {
    const [base, quote] = input.symbol.replace(/^.*:/, '').split(/[-/_]/);
    return [input.providerExchange, base, quote].map(slugPart).filter(Boolean).join('-');
  }

  return [input.exchangeCode, input.symbol].map(slugPart).filter(Boolean).join('-');
}

export function normalizeFinnhubQuote(raw: any): MarketQuote {
  const timestamp = raw?.t ? new Date(Number(raw.t) * 1000).toISOString() : null;
  return {
    price: validNumber(raw?.c),
    dailyChange: validNumber(raw?.d),
    dailyChangePercentage: validNumber(raw?.dp),
    high: validNumber(raw?.h),
    low: validNumber(raw?.l),
    open: validNumber(raw?.o),
    previousClose: validNumber(raw?.pc),
    currency: raw?.currency || null,
    providerTimestamp: timestamp,
    provider: 'finnhub',
    delayed: true,
    cached: false,
    stale: false,
    fetchedAt: new Date().toISOString(),
  };
}

export function normalizeOpenFigiInstrument(raw: any): OpenFigiInstrument | null {
  const securityType = String(raw?.securityType || raw?.securityType2 || '').toLowerCase();
  const marketSector = String(raw?.marketSector || '').toLowerCase();
  const description = String(raw?.securityDescription || '').toLowerCase();
  const excluded = ['option', 'future', 'warrant', 'bond', 'structured', 'preferred'];

  if (excluded.some((item) => securityType.includes(item) || description.includes(item))) return null;
  if (marketSector.includes('muni') || marketSector.includes('corp')) return null;

  return {
    figi: String(raw?.figi || ''),
    compositeFigi: raw?.compositeFIGI || raw?.compositeFigi || null,
    shareClassFigi: raw?.shareClassFIGI || raw?.shareClassFigi || null,
    ticker: raw?.ticker || null,
    name: raw?.name || raw?.securityDescription || null,
    exchangeCode: raw?.exchCode || raw?.exchangeCode || null,
    marketSector: raw?.marketSector || null,
    securityType: raw?.securityType || null,
    securityType2: raw?.securityType2 || null,
    securityDescription: raw?.securityDescription || null,
  };
}

export function normalizeAssetRow(row: any): MarketAsset {
  return {
    id: row.id,
    type: row.asset_type,
    canonicalSlug: row.canonical_slug,
    symbol: row.symbol,
    displaySymbol: row.display_symbol,
    name: row.name,
    exchangeCode: row.exchange_code,
    exchangeName: row.exchange_name,
    currency: row.currency,
    country: row.country,
    figi: row.figi,
    compositeFigi: row.composite_figi,
    shareClassFigi: row.share_class_figi,
    isin: row.isin,
    finnhubSymbol: row.finnhub_symbol,
    providerExchange: row.provider_exchange,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    description: row.description,
    industry: row.industry,
    isActive: row.is_active,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dedupeAssets<T extends { type: MarketAssetType; figi?: string | null; compositeFigi?: string | null; exchangeCode?: string | null; symbol: string; providerExchange?: string | null; finnhubSymbol?: string | null }>(assets: T[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key =
      asset.type === 'crypto'
        ? `crypto:${asset.providerExchange || ''}:${asset.finnhubSymbol || asset.symbol}`
        : asset.figi || asset.compositeFigi || `${asset.exchangeCode || ''}:${asset.symbol}`;
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
