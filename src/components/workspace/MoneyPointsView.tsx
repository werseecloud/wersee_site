import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ArrowUpRight, ArrowDownLeft, History, 
  Gift, CreditCard, ShieldCheck, AlertCircle, TrendingUp,
  ChevronRight, Wallet, Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingState } from '../ui/LoadingState';
import { hapticFeedback } from '../../lib/haptics';

import { appToast } from '@/lib/feedback';
export const MoneyPointsView = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch real points activity
      const { data: activityData } = await supabase
        .from('points_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (activityData) {
        setTransactions(activityData.map(a => ({
          id: a.id,
          type: a.amount >= 0 ? 'earn' : 'redeem',
          amount: Math.abs(a.amount),
          description: a.description,
          date: a.created_at
        })));
      }

    } catch (error) {
      console.error('Error fetching points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (type: 'payout' | 'store') => {
    if (!profile || !redeemAmount) return;
    const amount = parseInt(redeemAmount);
    if (amount > profile.wersee_points) {
      appToast('Insufficient points');
      return;
    }

    if (type === 'payout' && profile.kyc_status !== 'verified') {
      appToast('Please complete KYC verification before cashing out points.');
      return;
    }

    try {
      setIsRedeeming(true);
      hapticFeedback('medium');
      
      // In a real app, this would call an API to process the redemption
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use the RPC to ensure activity is logged
      const { error } = await supabase.rpc('increment_points', {
        user_id: profile.id,
        amount: -amount,
        description: type === 'payout' ? 'Cash out to bank' : 'Store purchase'
      });

      if (error) throw error;

      setProfile({ ...profile, wersee_points: profile.wersee_points - amount });
      setRedeemAmount('');
      
      // Refresh activity
      fetchPointsData();
      
      appToast(`Successfully redeemed ${amount} points!`);
      
    } catch (error) {
      console.error('Redemption error:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) return <LoadingState message="Loading your Wersee Points..." />;

  const euroValue = (profile?.wersee_points || 0) / 100;

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-yellow-500/20"
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Total Balance</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-mono font-black tracking-tighter mb-2">
                {profile?.wersee_points?.toLocaleString() || 0}
              </h1>
              <p className="text-lg md:text-xl opacity-90 font-medium">
                ≈ €{euroValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} EUR
              </p>
            </div>

            <div className="mt-8 md:mt-12 flex flex-wrap gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-bold">100 Pts = €1.00</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-bold">Secure Wallet</span>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A1A] border border-white/5 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">KYC Verification</h3>
            <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed">
              Verify your identity to unlock cash payouts directly to your bank account.
            </p>
            
            <div className={`flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6 ${
              profile?.kyc_status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
            }`}>
              {profile?.kyc_status === 'verified' ? (
                <>
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base font-bold">Verified Seller</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base font-bold">Verification Required</span>
                </>
              )}
            </div>
          </div>

          {profile?.kyc_status !== 'verified' && (
            <button 
              onClick={() => {
                hapticFeedback('light');
                navigate('/setup');
              }}
              className="w-full py-3 md:py-4 bg-white text-black rounded-xl md:rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Start Verification <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Redeem Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#1A1A1A] border border-white/5 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Cash Out</h2>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Amount to Redeem</label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                <input 
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter points amount..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-4 text-lg md:text-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              {redeemAmount && (
                <p className="mt-2 text-xs md:text-sm text-gray-500 ml-1">
                  You will receive ≈ €{(parseInt(redeemAmount) / 100).toFixed(2)} EUR
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button 
                disabled={isRedeeming || !redeemAmount}
                onClick={() => handleRedeem('payout')}
                className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl hover:bg-white/10 transition-all disabled:opacity-50 group"
              >
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-base font-bold">To Bank</span>
              </button>
              <button 
                disabled={isRedeeming || !redeemAmount}
                onClick={() => handleRedeem('store')}
                className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl hover:bg-white/10 transition-all disabled:opacity-50 group"
              >
                <Store className="w-6 h-6 md:w-8 md:h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-base font-bold">In Store</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#1A1A1A] border border-white/5 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <History className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Recent Activity</h2>
            </div>
            <button className="text-xs md:text-sm font-bold text-gray-500 hover:text-white transition-colors">View All</button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.type === 'earn' ? <ArrowDownLeft className="w-4 h-4 md:w-5 h-5" /> : <ArrowUpRight className="w-4 h-4 md:w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs md:text-sm line-clamp-1">{tx.description}</p>
                    <p className="text-[10px] md:text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`text-sm md:text-base font-mono font-bold shrink-0 ${
                  tx.type === 'earn' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
          <Gift className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg md:text-xl font-bold mb-2">How Wersee Points Work</h3>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
            Every time you make a sale on Wersee, your earnings are added to your balance as <span className="text-white font-bold">Wersee Points</span>. 
            For example: if you sell something for <span className="text-blue-400 font-bold">€10.00</span>, you receive <span className="text-yellow-500 font-bold">1,000 points</span>. 
            These points represent the <span className="text-white font-bold">full value</span> of your sale.
          </p>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed mt-3 md:mt-4">
            Once you complete KYC, you can convert these points 1-to-1 back to EUR (€1.00 for every 100 points) and withdraw them to your bank account. 
            This system ensures secure processing while your account is being verified.
          </p>
        </div>
      </div>
    </div>
  );
};
