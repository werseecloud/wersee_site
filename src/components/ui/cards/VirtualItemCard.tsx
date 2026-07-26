import React from 'react';
import { motion } from 'motion/react';
import { Download, Zap, ShieldCheck, Box, ArrowUpRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VirtualItemCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  rarity?: string;
  game?: string;
  type: string;
  rating?: number;
}

export const VirtualItemCard = ({ id, title, price, image, rarity = 'Common', game, type, rating = 0 }: VirtualItemCardProps) => {
  const rarityColors: Record<string, string> = {
    Common: 'from-gray-500 to-gray-700',
    Uncommon: 'from-green-500 to-green-700',
    Rare: 'from-blue-500 to-blue-700',
    Epic: 'from-purple-500 to-purple-700',
    Legendary: 'from-orange-500 to-orange-700',
    Mythic: 'from-red-500 to-red-700',
  };

  const rarityGlow: Record<string, string> = {
    Common: 'shadow-gray-500/20',
    Uncommon: 'shadow-green-500/20',
    Rare: 'shadow-blue-500/20',
    Epic: 'shadow-purple-500/20',
    Legendary: 'shadow-orange-500/20',
    Mythic: 'shadow-red-500/20',
  };

  const colorGradient = rarityColors[rarity] || rarityColors.Common;
  const glowClass = rarityGlow[rarity] || rarityGlow.Common;

  return (
    <Link to={`/listing/${id}`} className="block group h-full">
      <motion.div 
        whileHover={{ y: -12, scale: 1.02 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={`relative bg-[#141414] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl ${glowClass} hover:border-white/20 transition-all duration-500 h-full flex flex-col`}
      >
        {/* Rarity Glow Background */}
        <div className={`absolute -inset-20 bg-gradient-to-br ${colorGradient} opacity-0 group-hover:opacity-10 blur-[100px] transition-opacity duration-1000`} />
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="relative aspect-square p-10 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent scale-150 animate-pulse" />
            </div>

            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000 ease-out"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute top-5 right-5">
              <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${colorGradient} backdrop-blur-xl shadow-2xl border border-white/20`}>
                {rarity}
              </div>
            </div>

            {game && (
              <div className="absolute top-5 left-5">
                <div className="px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {game}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 flex-1 flex flex-col relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <Box className="w-24 h-24" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Box className="w-3.5 h-3.5" /> {type}
              </span>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2 bg-green-400/10 px-3 py-1 rounded-xl border border-green-400/20">
                <Zap className="w-3.5 h-3.5" /> Instant
              </span>
            </div>
            
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6 leading-[0.9] line-clamp-2 group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
            
            <div className="mt-auto flex items-end justify-between pt-6 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rating</span>
                <div className="flex items-center gap-2">
                  {rating > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      <span className="font-black text-sm text-white leading-none">{rating.toFixed(1)}</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">No reviews</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Price</span>
                <div className="text-3xl font-black italic tracking-tighter text-white leading-none">
                  €{price}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
