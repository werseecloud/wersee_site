import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, ShieldCheck, TrendingUp, DollarSign, 
  CheckCircle, Loader2, ArrowRight, Star, 
  Zap, Globe, Shield, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const AffiliateJoinView = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (sellerId) {
      fetchSeller();
    } else {
      setError('Invalid invite link.');
      setLoading(false);
    }
  }, [sellerId]);

  const fetchSeller = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();
      
      if (error) throw error;
      setSeller(data);

      // Check if already joined
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myPrograms } = await supabase
          .from('affiliate_programs')
          .select('id')
          .eq('seller_id', sellerId);
        
        const programIds = myPrograms?.map(p => p.id) || [];

        if (programIds.length > 0) {
          const { data: existing } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .in('program_id', programIds)
            .maybeSingle();
          
          if (existing) setJoined(true);
        }
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
      setError('Seller not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to join the affiliate program.');
        navigate('/auth');
        return;
      }

      // 1. Get all active programs for this seller
      const { data: programs, error: programsError } = await supabase
        .from('affiliate_programs')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('is_active', true);
      
      if (programsError || !programs || programs.length === 0) {
        throw new Error('This seller has no active affiliate programs.');
      }

      // 2. Join each program
      const customCode = `${user.email?.split('@')[0]}_${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
      
      const { error: joinError } = await supabase
        .from('affiliates')
        .insert(programs.map(p => ({
          user_id: user.id,
          program_id: p.id,
          custom_code: customCode,
          status: 'active'
        })));
      
      if (joinError) throw joinError;

      setJoined(true);
      toast.success('Welcome to the team! You are now an affiliate.');
    } catch (error: any) {
      console.error('Error joining program:', error);
      toast.error(`Failed to join: ${error.message || 'Unknown error'}`);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-[#141414] border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-bold border border-indigo-500/20 mb-6"
          >
            <Star className="w-4 h-4" /> Exclusive Invitation
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
          >
            Join <span className="text-indigo-500">{seller?.name || 'the team'}</span> as an Affiliate
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Partner with one of our top sellers and start earning commissions on every sale you generate.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: <DollarSign className="w-6 h-6" />, title: 'High Commission', desc: 'Earn up to 25% on every successful referral.' },
            { icon: <Zap className="w-6 h-6" />, title: 'Instant Payouts', desc: 'Get paid automatically as soon as the order is confirmed.' },
            { icon: <Globe className="w-6 h-6" />, title: 'Global Reach', desc: 'Promote products to anyone, anywhere in the world.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-[#141414] p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10 p-12 rounded-[40px] text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            {joined ? (
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold">You're already an affiliate!</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Head over to your workspace to manage your links and track your earnings.
                </p>
                <button 
                  onClick={() => navigate('/workspace/affiliates')}
                  className="px-8 py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
                >
                  Go to Workspace <ArrowRight className="w-5 h-5" />
                </button>

                {/* Promo Materials Preview */}
                <div className="mt-12 pt-12 border-t border-white/10 text-left">
                  <h3 className="text-xl font-bold mb-6 text-center">Your Promotional Assets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#141414] p-4 rounded-2xl border border-white/5">
                      <div className="aspect-video bg-white/5 rounded-xl mb-3 flex items-center justify-center">
                        <Globe className="w-8 h-8 text-gray-600" />
                      </div>
                      <h4 className="font-bold text-sm">Standard Banner</h4>
                      <button className="text-xs text-indigo-400 mt-2 hover:underline">Download</button>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-2xl border border-white/5">
                      <div className="aspect-video bg-white/5 rounded-xl mb-3 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-600" />
                      </div>
                      <h4 className="font-bold text-sm">Email Template</h4>
                      <button className="text-xs text-indigo-400 mt-2 hover:underline">Copy Text</button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    More assets available in your <span className="text-indigo-400 cursor-pointer" onClick={() => navigate('/workspace/affiliates')}>Affiliate Dashboard</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-4xl font-bold">Ready to start earning?</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  By joining, you agree to the seller's terms of service and our affiliate guidelines.
                </p>
                <button 
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-12 py-5 bg-indigo-500 text-white rounded-2xl font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-3 mx-auto disabled:opacity-50"
                >
                  {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-6 h-6" />}
                  Join Program Now
                </button>
              </div>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] translate-x-1/2 translate-y-1/2" />
        </motion.div>
      </div>
    </div>
  );
};
