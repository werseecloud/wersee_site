import { useEffect, useRef } from 'react';
import { trackInteraction } from '../services/algorithmService';

// ⚙️ 13. BACKEND TRACKING (ESSENTIEEL)
// Deze hook maakt het super makkelijk om watch time en clicks te tracken op elke listing.
export const useListingTracking = (listingId: string) => {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Reset timer als listingId verandert
    startTime.current = Date.now();
    
    // Track impression (user ziet de listing)
    trackInteraction(listingId, 'impression');

    return () => {
      // Track view duration (watch time / dwell time) als component unmount (user scrollt weg)
      const durationSeconds = Math.floor((Date.now() - startTime.current) / 1000);
      if (durationSeconds > 1) { // Alleen tracken als ze langer dan 1 sec keken
        trackInteraction(listingId, 'view', durationSeconds);
      }
    };
  }, [listingId]);

  // Helper functies voor knoppen
  const trackClick = () => trackInteraction(listingId, 'click');
  const trackPurchase = () => trackInteraction(listingId, 'purchase');
  const trackSave = () => trackInteraction(listingId, 'save');
  const trackShare = () => trackInteraction(listingId, 'share');

  return { trackClick, trackPurchase, trackSave, trackShare };
};
