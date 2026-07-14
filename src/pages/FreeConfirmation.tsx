import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Mail, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const FreeConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const listing = location.state?.listing;
  
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No listing selected</h2>
          <button onClick={() => navigate('/')} className="text-blue-600 font-bold">Back to Home</button>
        </div>
      </div>
    );
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a free order
      const { error } = await supabase.from('orders').insert({
        buyer_id: user?.id || null,
        listing_id: listing.id,
        amount: 0,
        status: 'completed',
        type: 'free',
        metadata: { email }
      });

      if (error) throw error;

      // Fire extension event
      try {
        const { ExtensionEngine } = await import('../services/extensionEngine');
        await ExtensionEngine.fireEvent(
          'course_purchased',
          {
            user_id: user?.id,
            email: email,
            listing_id: listing.id,
            amount: 0
          },
          listing.seller_id,
          'business'
        );
      } catch (extErr) {
        console.error('Failed to fire extension event:', extErr);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/access/${listing.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error claiming free product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-black/5"
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-black/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#1D1D1F]">Claim for Free</h2>
            <p className="text-gray-400 text-sm">Enter your email to get instant access to {listing.title}</p>
          </div>

          {!success ? (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Get Instant Access'} <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Shield className="w-3 h-3" /> Secure
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Zap className="w-3 h-3" /> Instant
                </div>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-600">Success!</h3>
              <p className="text-sm text-gray-500">Redirecting you to your content...</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
