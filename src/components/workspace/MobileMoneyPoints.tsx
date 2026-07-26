import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Gift, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp,
  ChevronRight, 
  Wallet, 
  Store,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MobileMoneyPointsProps {
  onBack: () => void;
}

export const MobileMoneyPoints: React.FC<MobileMoneyPointsProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState('');

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

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const euroValue = (profile?.wersee_points || 0) / 100;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight">Wersee Points</h2>
        </div>
        <div className="p-2.5 bg-yellow-500/10 rounded-full border border-yellow-500/10">
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-yellow-500/20"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Balance</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">
              {profile?.wersee_points?.toLocaleString() || 0}
            </h1>
            <p className="text-lg opacity-90 font-bold">
              ≈ €{euroValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} EUR
            </p>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Cash Out</span>
          </button>
          <button className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">In Store</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Recent Activity</h3>
            <button className="text-[10px] font-black text-gray-600 uppercase tracking-widest">View All</button>
          </div>
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-white/[0.03] border border-white/5 rounded-[1.5rem] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {tx.type === 'earn' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{tx.description}</p>
                    <p className="text-[9px] text-gray-500 font-medium">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`text-sm font-black ${tx.type === 'earn' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
