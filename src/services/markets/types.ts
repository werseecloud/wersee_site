export type MarketAssetType = 'stock' | 'etf' | 'crypto';
export type ProviderName = 'finnhub' | 'openfigi' | 'wersee';

export type ProviderResult<T> =
  | {
      ok: true;
      data: T;
      provider: ProviderName;
      fetchedAt: string;
      cached: boolean;
      stale: boolean;
    }
  | {
      ok: false;
      code:
        | 'INVALID_REQUEST'
        | 'NOT_FOUND'
        | 'RATE_LIMITED'
        | 'PROVIDER_UNAVAILABLE'
        | 'PREMIUM_ENDPOINT'
        | 'UNAUTHORIZED'
        | 'UNKNOWN';
      message: string;
      retryAfterSeconds?: number;
    };

export type MarketAsset = {
  id: string;
  type: MarketAssetType;
  canonicalSlug: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  exchangeCode: string | null;
  exchangeName: string | null;
  currency: string | null;
  country: string | null;
  figi: string | null;
  compositeFigi: string | null;
  shareClassFigi: string | null;
  isin: string | null;
  finnhubSymbol: string | null;
  providerExchange: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  industry: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketQuote = {
  price: string | null;
  dailyChange: string | null;
  dailyChangePercentage: string | null;
  high: string | null;
  low: string | null;
  open: string | null;
  previousClose: string | null;
  currency: string | null;
  providerTimestamp: string | null;
  provider: ProviderName;
  delayed: boolean;
  cached: boolean;
  stale: boolean;
  fetchedAt: string;
};

export type OpenFigiInstrument = {
  figi: string;
  compositeFigi: string | null;
  shareClassFigi: string | null;
  ticker: string | null;
  name: string | null;
  exchangeCode: string | null;
  marketSector: string | null;
  securityType: string | null;
  securityType2: string | null;
  securityDescription: string | null;
};

export type WerseeFundingMode = 'support' | 'reward' | 'preorder' | 'regulated_investment';

export type InvestmentFeatureConfig = {
  publicMarketDiscoveryEnabled: boolean;
  virtualPortfolioEnabled: boolean;
  werseeListingsEnabled: boolean;
  supportPaymentsEnabled: boolean;
  regulatedInvestmentEnabled: boolean;
};

export const defaultInvestmentFeatureConfig: InvestmentFeatureConfig = {
  publicMarketDiscoveryEnabled: true,
  virtualPortfolioEnabled: true,
  werseeListingsEnabled: true,
  supportPaymentsEnabled: true,
  regulatedInvestmentEnabled: false,
};
