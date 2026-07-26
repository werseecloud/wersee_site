import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, Package, Globe, Download, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageWrapper } from '../components/PageWrapper';

export const Success = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, listing:listings(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setOrder(data);

        // Fire extension event
        try {
          const { ExtensionEngine } = await import('../services/extensionEngine');
          await ExtensionEngine.fireEvent(
            'course_purchased',
            {
              user_id: data.buyer_id,
              email: data.metadata?.email,
              listing_id: data.listing_id,
              amount: data.amount
            },
            data.listing?.seller_id,
            'business'
          );
        } catch (extErr) {
          console.error('Failed to fire extension event:', extErr);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id, navigate]);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <h1 className="text-4xl font-bold text-[#1D1D1F] mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-500 mb-12">
          Your order <span className="font-mono text-black">#{order.id.slice(0, 8)}</span> has been confirmed.
        </p>

        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl mb-12 text-left">
          <div className="flex gap-6 mb-8 pb-8 border-b border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
              <img 
                src={order.listing?.images?.[0] || 'https://picsum.photos/seed/product/400/400'} 
                alt={order.listing?.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#1D1D1F]">{order.listing?.title}</h3>
              <p className="text-gray-500">€{order.amount}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[#1D1D1F]">What's next?</h4>
            
            {order.listing?.type === 'community' ? (
              <Link 
                to={`/community/${order.listing_id}`}
                className="w-full p-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
              >
                Enter Community <ArrowRight className="w-5 h-5" />
              </Link>
            ) : order.listing?.type === 'digital' || order.listing?.type === 'virtual' ? (
              <Link 
                to={`/access/${order.listing_id}`}
                className="w-full p-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
              >
                Access Content <ArrowRight className="w-5 h-5" />
              </Link>
            ) : order.listing?.type === 'service' || order.listing?.type === 'job' ? (
              <Link 
                to="/chat"
                className="w-full p-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
              >
                Contact Seller <MessageSquare className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                to="/dashboard"
                className="w-full p-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
              >
                View Order Status <Package className="w-5 h-5" />
              </Link>
            )}
            
            <button 
              onClick={() => window.print()}
              className="w-full p-4 bg-gray-50 text-gray-600 rounded-2xl font-medium hover:bg-gray-100 transition-all"
            >
              Download Invoice
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Available Worldwide</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
