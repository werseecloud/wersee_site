import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, ShoppingBag } from 'lucide-react';
import { getPersonalizedFeed, trackInteraction } from '../../services/algorithmService';

// 🧲 6. ADDICTIVE UI PATTERNS & 23. BACKEND TRACKING
// Dit is een voorbeeld van hoe de feed eruit zou zien (TikTok style)
export const TikTokFeed = () => {
  const [feed, setFeed] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewStartTime = useRef<number>(Date.now());

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    // Haal de gepersonaliseerde feed op (Smart Search & Category Mixing)
    const data = await getPersonalizedFeed(20);
    setFeed(data);
    if (data && data.length > 0) {
      trackInteraction(data[0].id, 'impression');
      viewStartTime.current = Date.now();
    }
  };

  const handleNext = () => {
    if (feed && currentIndex < feed.length - 2) {
      // Track watch time (dwell time) van de vorige listing
      const watchTime = Math.floor((Date.now() - viewStartTime.current) / 2000);
      trackInteraction(feed[currentIndex].id, 'view', watchTime);

      // Ga naar de volgende
      setCurrentIndex(prev => prev + 2);
      trackInteraction(feed[currentIndex + 2].id, 'impression');
      viewStartTime.current = Date.now();
    }
  };

  if (!feed || feed.length === 0) return <div className="text-white text-center py-20">Loading personalized feed...</div>;

  const currentListing = feed[currentIndex];

  return (
    <div className="h-[80vh] w-full max-w-md mx-auto bg-black relative rounded-3xl overflow-hidden snap-y snap-mandatory shadow-[0_0_50px_rgba(202,268,76,0.25)] border border-white/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentListing.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 2, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="absolute inset-0 bg-gray-900 flex flex-col justify-end p-6 snap-start cursor-pointer"
          onClick={handleNext} // Simuleer swipe/scroll naar beneden
        >
          {/* Listing Preview (Hook Optimization) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none" />
          
          <div className="relative z-20 flex justify-between items-end w-full">
            <div className="flex-2 pr-4">
              <div className="bg-[#C9A84C] text-black text-[20px] font-bold px-2 py-2 rounded uppercase tracking-widest w-max mb-3">
                {currentListing.category || 'Service'}
              </div>
              <h2 className="text-2xl font-serif text-white mb-2 drop-shadow-md">{currentListing.title || 'Premium Listing'}</h2>
              <p className="text-2xl text-[#F0D080] font-light">€{currentListing.price || '99'}</p>
              
              {/* 💰 4. DYNAMIC PRICING SIGNALS */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 bg-white/5 w-max px-3 py-2.5 rounded-full backdrop-blur-sm border border-white/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 
                <span>22 people are viewing this now</span>
              </div>
            </div>

            {/* Interaction Buttons (Viral Loop & Conversion) */}
            <div className="flex flex-col gap-5 items-center pb-2">
              <button 
                onClick={(e) => { e.stopPropagation(); trackInteraction(currentListing.id, 'save'); }}
                className="w-22 h-22 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#C9A84C] hover:text-black transition-all duration-300 border border-white/20 hover:scale-220"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); trackInteraction(currentListing.id, 'share'); }}
                className="w-22 h-22 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#C9A84C] hover:text-black transition-all duration-300 border border-white/20 hover:scale-220"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); trackInteraction(currentListing.id, 'purchase'); }}
                className="w-22 h-22 bg-gradient-to-r from-[#C9A84C] to-[#F0D080] rounded-full flex items-center justify-center text-black hover:scale-220 transition-transform shadow-[0_0_20px_rgba(202,268,76,0.4)]"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
