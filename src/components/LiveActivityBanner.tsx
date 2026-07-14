import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Tag, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ActivityEvent = {
  id: string;
  type: 'purchase' | 'listing';
  username: string;
  productName: string;
  productSlug?: string;
  sellerUsername?: string;
  timestamp: number;
};

export const LiveActivityBanner = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for new listings
    const listingsSub = supabase
      .channel('public:listings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        async (payload) => {
          const newListing = payload.new;
          if (newListing.status === 'active' || newListing.status === 'published') {
            // Fetch username if not in payload
            let username = newListing.username;
            if (!username && newListing.seller_id) {
              const { data } = await supabase.from('profiles').select('username').eq('id', newListing.seller_id).single();
              if (data) username = data.username;
            }

            addActivity({
              id: `listing-${newListing.id}`,
              type: 'listing',
              username: username || 'Someone',
              productName: newListing.title || 'a product',
              productSlug: newListing.slug || newListing.id,
              timestamp: Date.now(),
            });
          }
        }
      )
      .subscribe();

    // Listen for new orders (purchases)
    const ordersSub = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrder = payload.new;
          if (newOrder.status === 'completed' || newOrder.status === 'paid') {
            // Fetch listing details
            if (newOrder.listing_id) {
              const { data: listing } = await supabase
                .from('listings')
                .select('id, title, slug, username, seller_id')
                .eq('id', newOrder.listing_id)
                .single();

              if (listing) {
                // Fetch buyer username
                let buyerName = 'Someone';
                if (newOrder.buyer_id) {
                  const { data: buyer } = await supabase.from('profiles').select('username, full_name').eq('id', newOrder.buyer_id).single();
                  if (buyer) buyerName = buyer.username || buyer.full_name || 'Someone';
                }

                addActivity({
                  id: `order-${newOrder.id}`,
                  type: 'purchase',
                  username: buyerName,
                  productName: listing.title || 'a product',
                  productSlug: listing.slug || listing.id,
                  sellerUsername: listing.username,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(listingsSub);
      supabase.removeChannel(ordersSub);
    };
  }, []);

  const addActivity = (activity: ActivityEvent) => {
    setActivities((prev) => [...prev, activity]);
    // Auto remove after 6 seconds
    setTimeout(() => {
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
    }, 6000);
  };

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  if (activities.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl p-4 max-w-sm flex items-start gap-4 relative overflow-hidden group"
          >
            <button 
              onClick={() => removeActivity(activity.id)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              activity.type === 'purchase' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {activity.type === 'purchase' ? <ShoppingBag className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 pr-4">
              <p className="text-sm text-gray-800 leading-snug">
                <span className="font-bold text-black">@{activity.username}</span>
                {activity.type === 'purchase' ? ' just bought ' : ' just listed '}
                <span className="font-semibold text-black">{activity.productName}</span>
              </p>
              
              <button 
                onClick={() => {
                  if (activity.productSlug && activity.type === 'listing') {
                    navigate(`/${activity.username}/${activity.productSlug}`);
                  } else if (activity.productSlug && activity.type === 'purchase' && activity.sellerUsername) {
                    navigate(`/${activity.sellerUsername}/${activity.productSlug}`);
                  } else if (activity.productSlug) {
                    navigate(`/search?q=${encodeURIComponent(activity.productName)}`);
                  } else {
                    navigate('/search');
                  }
                  removeActivity(activity.id);
                }}
                className="mt-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: activity.type === 'purchase' ? '#059669' : '#4F46E5' }}
              >
                {activity.type === 'purchase' ? 'Get yours now' : 'Check it out'} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
