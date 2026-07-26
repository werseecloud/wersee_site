export type ProductOffer = {
  id?: string;
  name: string;
  sale_price: number | string;
  starts_at: string;
  ends_at: string;
  limit_type?: 'none' | 'first_customers' | 'until_sold_out' | 'weekend';
  max_redemptions?: number | null;
  redemption_count?: number;
  is_active?: boolean;
};

export type ProductPricing = {
  originalPrice: number;
  currentPrice: number;
  savings: number;
  discountPercent: number;
  isOnSale: boolean;
  offer: ProductOffer | null;
};

const asAmount = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback;
};

export const isOfferLive = (offer: ProductOffer, now = new Date()) => {
  if (offer.is_active === false) return false;
  const startsAt = new Date(offer.starts_at).getTime();
  const endsAt = new Date(offer.ends_at).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return false;
  if (now.getTime() < startsAt || now.getTime() >= endsAt) return false;
  if (offer.limit_type === 'first_customers' && offer.max_redemptions) {
    return Number(offer.redemption_count || 0) < offer.max_redemptions;
  }
  return true;
};

export const resolveProductPricing = (listing: any, now = new Date()): ProductPricing => {
  if (!listing || typeof listing !== 'object') {
    return {
      originalPrice: 0,
      currentPrice: 0,
      savings: 0,
      discountPercent: 0,
      isOnSale: false,
      offer: null,
    };
  }
  const originalPrice = asAmount(listing.original_price, asAmount(listing.price));
  const offers = Array.isArray(listing.product_offers)
    ? listing.product_offers
    : listing.product_offers ? [listing.product_offers] : [];
  const offer = offers
    .filter((candidate: ProductOffer) => isOfferLive(candidate, now))
    .sort((a: ProductOffer, b: ProductOffer) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0] || null;
  const unscheduledSale = asAmount(listing.sale_price, originalPrice);
  const proposedPrice = offer ? asAmount(offer.sale_price, originalPrice) : unscheduledSale;
  const currentPrice = proposedPrice < originalPrice ? proposedPrice : originalPrice;
  const savings = Math.max(0, originalPrice - currentPrice);
  const discountPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return {
    originalPrice,
    currentPrice,
    savings,
    discountPercent,
    isOnSale: savings > 0,
    offer,
  };
};

export const formatProductPrice = (amount: number, currency = 'EUR') =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatOfferTimeRemaining = (offer: ProductOffer | null, now = new Date()) => {
  if (!offer || !isOfferLive(offer, now)) return '';
  const remainingMs = new Date(offer.ends_at).getTime() - now.getTime();
  const hours = Math.max(1, Math.ceil(remainingMs / 3_600_000));
  if (hours < 48) return `Ends in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `Ends in ${days} days`;
};

export const getCardVariant = (listing: any, sessionId: string): 'a' | 'b' => {
  if (listing.winning_thumbnail === 'a' || listing.winning_thumbnail === 'b') return listing.winning_thumbnail;
  if (!listing.thumbnail_b_url) return 'a';
  const key = `${listing.id}:${sessionId}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
  return Math.abs(hash) % 2 === 0 ? 'a' : 'b';
};
