import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag, ArrowUpRight, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brand?: string;
  rating?: number;
}

export const ProductCard = ({ id, title, price, image, category, brand, rating = 0 }: ProductCardProps) => {
  return (
    <Link to={`/listing/${id}`} className="block group h-full">
      <motion.div 
        whileHover={{ y: -10 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white dark:bg-[#141414] rounded-[2.5rem] overflow-hidden border border-black/5 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 h-full flex flex-col"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-[#0A0A0A]">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          
          <button className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out hidden md:block">
            <button className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </div>
        
        <div className="p-8 flex-1 flex flex-col relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <ShoppingCart className="w-20 h-20" />
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 mb-3">
            {brand || category}
          </div>
          
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white mb-6 leading-[0.9] line-clamp-2 group-hover:text-indigo-500 transition-colors">
            {title}
          </h3>
          
          <div className="mt-auto flex items-end justify-between pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rating</span>
              <div className="flex items-center gap-2">
                {rating > 0 ? (
                  <>
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                    <span className="font-black text-sm text-gray-900 dark:text-white leading-none">{rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">No reviews</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Price</span>
              <div className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white leading-none">
                €{typeof price === 'number' ? price.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
