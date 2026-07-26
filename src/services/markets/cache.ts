export const cachePolicy = {
  symbolSearch: '24 hours',
  openFigiMapping: '30 days',
  companyProfile: '7 days',
  financialMetrics: '6 hours',
  quoteDuringMarketHours: '30-60 seconds',
  quoteOutsideMarketHours: '5 minutes',
  companyNews: '15 minutes',
  cryptoSymbolLists: '24 hours',
  stockSymbolLists: '24 hours',
  investmentVenues: '24 hours',
} as const;

const durationMs: Record<string, number> = {
  '30-60 seconds': 60_000,
  '5 minutes': 5 * 60_000,
  '15 minutes': 15 * 60_000,
  '6 hours': 6 * 60 * 60_000,
  '24 hours': 24 * 60 * 60_000,
  '7 days': 7 * 24 * 60 * 60_000,
  '30 days': 30 * 24 * 60 * 60_000,
};

export function cacheExpiresAt(policy: keyof typeof cachePolicy, now = new Date()) {
  return new Date(now.getTime() + durationMs[cachePolicy[policy]]).toISOString();
}
