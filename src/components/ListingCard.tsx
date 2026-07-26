import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, ShieldCheck, Heart, ShoppingCart, ArrowUpRight, Star, Clock, Box } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../lib/haptics';

export interface Listing {
  id: string | number;
  title: string;
  price: string;
  type: string;
  location: string;
  image: string;
  time: string;
  seller?: string;
  rating?: number;
  rating_avg?: number;
  rating_count?: number;
  isPro?: boolean;
}

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const { isDark } = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  
  const displayRating = listing.rating_avg || listing.rating || 0;
  const is3DAsset = listing.type === 'asset_3d' || (listing as any).category === '3D Assets';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <div className={`group relative flex flex-col rounded-[2.5rem] overflow-hidden transition-all duration-500 h-full ${
        isDark 
          ? 'bg-[#0F0F0F] border border-white/5 hover:border-indigo-500/40 shadow-2xl shadow-black/50' 
          : 'bg-white border border-black/5 hover:border-indigo-500/20 shadow-xl shadow-black/5'
      }`}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden block">
          <Link to={`/listing/${listing.id}`} className="block w-full h-full">
            <img 
              src={listing.image || (listing as any).images?.[0] || (listing as any).image_url} 
              alt={listing.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-80" />
          </Link>
          
          {/* Badges */}
          <div className="absolute top-5 right-5 flex flex-wrap gap-2 z-10">
            {is3DAsset && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl backdrop-blur-xl text-[10px] font-black uppercase tracking-widest shadow-2xl bg-sky-500/90 text-white border border-sky-300/40">
                <Box className="w-3 h-3" />
                3D
              </span>
            )}
            {(listing as any).stripe_onboarding_complete === false && listing.price !== '0' && listing.price !== 'FREE' && (
              <span className="px-4 py-1.5 rounded-2xl backdrop-blur-xl text-[10px] font-black uppercase tracking-widest shadow-2xl bg-amber-500 text-white border border-amber-400">
                Sandbox
              </span>
            )}
            <span className="px-4 py-1.5 rounded-2xl backdrop-blur-xl text-[10px] font-black uppercase tracking-widest shadow-2xl bg-black/60 text-white border border-white/10">
              {listing.type || 'Digital'}
            </span>
          </div>

          {/* Heart Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
              hapticFeedback('light');
            }}
            className={`absolute top-5 left-5 w-12 h-12 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-300 z-10 active:scale-90 ${
              isLiked 
                ? 'bg-red-500 text-white border-red-400' 
                : 'bg-black/40 text-white/80 border border-white/10 hover:bg-black/60'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 pt-0 flex flex-col flex-1 relative">
          {/* Overlapping Square Logo (Seller) */}
          <div className="relative -top-10 left-0 w-16 h-16 rounded-[1.5rem] bg-[#1A1A1A] border-4 border-[#0F0F0F] overflow-hidden flex items-center justify-center shadow-2xl group-hover:-translate-y-2 transition-transform duration-500 z-10">
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl italic tracking-tighter">
              {listing.seller?.charAt(0) || listing.title?.charAt(0) || 'W'}
            </div>
          </div>

          <div className="flex-1 flex flex-col -mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Link to={`/listing/${listing.id}`} className="flex-1">
                <h3 className={`font-black italic uppercase tracking-tighter text-2xl leading-none line-clamp-1 group-hover:text-indigo-500 transition-colors ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {listing.title}
                </h3>
              </Link>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3 h-3 text-white fill-current" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mb-8">
              <span className={`text-[11px] font-bold tracking-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                by {listing.seller || 'Wersee Seller'}
              </span>
            </div>
            
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                {displayRating > 0 ? (
                  <>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className={`font-black text-lg leading-none ${isDark ? 'text-white' : 'text-black'}`}>
                      {displayRating.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No reviews yet
                  </span>
                )}
              </div>
              
              <div className={`font-black italic tracking-tighter text-2xl leading-none ${isDark ? 'text-white' : 'text-black'}`}>
                {listing.price === '0' || !listing.price ? 'FREE' : listing.price}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

