import { supabase } from './supabase';
import { getSessionId } from '../services/algorithmService';

export type ProductConversionEvent = 'impression' | 'click' | 'view' | 'add_to_cart' | 'checkout_started';
export type ProductSurface = 'home' | 'search' | 'storefront' | 'feed' | 'product' | 'checkout' | 'unknown';

const trackedImpressions = new Set<string>();

export const trackProductConversion = async (
  listingId: string,
  eventType: ProductConversionEvent,
  surface: ProductSurface,
  cardVariant?: 'a' | 'b',
) => {
  if (eventType === 'impression') {
    const impressionKey = `${listingId}:${surface}:${cardVariant || 'default'}`;
    if (trackedImpressions.has(impressionKey)) return;
    trackedImpressions.add(impressionKey);
  }
  try {
    const { error } = await supabase.rpc('track_product_conversion', {
      p_listing_id: listingId,
      p_session_id: getSessionId(),
      p_event_type: eventType,
      p_card_variant: cardVariant || null,
      p_surface: surface,
    });
    if (error && import.meta.env.DEV) console.warn('Product conversion tracking unavailable', error);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Product conversion tracking unavailable', error);
  }
};
