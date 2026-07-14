import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Home, ShoppingBag, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const listingId = searchParams.get('listingId');
  const [countdown, setCountdown] = useState(10);
  const [recommendedListings, setRecommendedListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!listingId) return;
      
      try {
        // 1. Fetch the purchased listing to get its category/seller
        const { data: purchasedListing } = await supabase
          .from('listings')
          .select('category, seller_id')
          .eq('id', listingId)
          .single();

        if (purchasedListing) {
          // 2. Simple algorithm: fetch other listings from the same seller OR same category
          const { data: recommendations } = await supabase
            .from('listings')
            .select('*, profiles(username, avatar_url)')
            .neq('id', listingId)
            .or(`seller_id.eq.${purchasedListing.seller_id},category.eq.${purchasedListing.category}`)
            .limit(3);
            
          if (recommendations) {
            setRecommendedListings(recommendations);
          }
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [listingId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/workspace');
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center overflow-y-auto py-20">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 mx-auto relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Payment Successful!</h1>
        <p className="text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
          Thank you for your purchase. Your order has been processed successfully. 
          {orderId && <span className="block mt-2 font-mono text-xs text-emerald-500/60 uppercase tracking-widest">Order ID: {orderId}</span>}
        </p>

        <div className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            <span>Redirecting to workspace</span>
            <span>{countdown}s</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-16">
          <button 
            onClick={() => navigate('/workspace')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all group"
          >
            <Home className="w-4 h-4" />
            <span>Go to Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black hover:bg-white/10 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
        </div>

        {/* Recommended Products */}
        {recommendedListings.length > 0 && (
          <div className="text-left mt-12 pt-12 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              You might also like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedListings.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/@${item.profiles?.username || 'user'}/${item.slug || item.id}`)}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all group"
                >
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    <img 
                      src={item.images?.[0] || 'https://picsum.photos/seed/product/400/300'} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm capitalize">{item.type}</span>
                      <span className="font-bold text-emerald-400">
                        {item.price === 0 ? 'Free' : `€${item.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};
