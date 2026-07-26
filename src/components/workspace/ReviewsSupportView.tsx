import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, MessageSquare, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReviewsSupportView = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'support'>('reviews');
  const [reviews, setReviews] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get business_id from team_members
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      let bId = teamMember?.business_id;
      const sellerIds = new Set<string>([user.id]);

      // If not a team member, check if they are a business owner
      if (!bId) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        bId = business?.id;
        if (business?.user_id) sellerIds.add(business.user_id);
      } else {
        const { data: business } = await supabase
          .from('businesses')
          .select('user_id')
          .eq('id', bId)
          .maybeSingle();
        if (business?.user_id) sellerIds.add(business.user_id);
      }

      if (activeTab === 'reviews') {
        const { data: sellerListings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title')
          .in('seller_id', Array.from(sellerIds));

        if (listingsError) throw listingsError;

        const listingIds = (sellerListings || []).map((listing) => listing.id);
        if (listingIds.length === 0) {
          setReviews([]);
          return;
        }

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        if (reviewsData && reviewsData.length > 0) {
          const userIds = Array.from(new Set(reviewsData.map(r => r.user_id)));

          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, full_name, name, avatar_url')
            .in('id', userIds);

          const enrichedReviews = reviewsData.map(review => ({
            ...review,
            product: sellerListings?.find(l => l.id === review.listing_id) || { title: 'Unknown Product' },
            user: profilesData?.find(p => p.id === review.user_id) || { username: 'Anonymous', avatar_url: null }
          }));

          setReviews(enrichedReviews);
        } else {
          setReviews([]);
        }
      } else {
        if (!bId) {
          setTickets([]);
          return;
        }

        // Fetch support tickets first
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('business_id', bId)
          .order('created_at', { ascending: false });

        if (ticketsError) throw ticketsError;

        if (ticketsData && ticketsData.length > 0) {
          // Fetch related profiles
          const userIds = Array.from(new Set(ticketsData.map(t => t.user_id).filter(Boolean)));

          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          const enrichedTickets = ticketsData.map(ticket => ({
            ...ticket,
            user: profilesData?.find(p => p.id === ticket.user_id) || { username: 'Anonymous', avatar_url: null }
          }));

          setTickets(enrichedTickets);
        } else {
          setTickets([]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Reviews & Support</h2>
          <p className="text-gray-400">Manage customer feedback and support requests</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'reviews' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Product Reviews
          {activeTab === 'reviews' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'support' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Support Tickets
          {activeTab === 'support' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : activeTab === 'reviews' ? (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] rounded-2xl border border-white/5">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No reviews yet</h3>
              <p className="text-gray-400">When customers review your products, they'll appear here.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-[#111111] p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {review.user?.avatar_url ? (
                      <img src={review.user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 font-medium">
                        {review.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{review.user?.username || 'Anonymous'}</p>
                      <p className="text-sm text-gray-400">on {review.product?.title}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mb-3">{renderStars(review.rating)}</div>
                <p className="text-gray-300">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] rounded-2xl border border-white/5">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No support tickets</h3>
              <p className="text-gray-400">You're all caught up! Support requests will appear here.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-[#111111] p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-white text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-gray-400">From {ticket.user?.username || ticket.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'open' ? 'bg-yellow-500/10 text-yellow-500' :
                    ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{ticket.message}</p>
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
