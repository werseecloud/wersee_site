import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Bell,
  TrendingUp,
  CreditCard,
  PieChart,
  Settings,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Repeat,
  Sparkles
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface MobileMoneyDashboardProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export const MobileMoneyDashboard: React.FC<MobileMoneyDashboardProps> = ({ activeView, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      if (profileData?.stripe_account_id) {
        const data = await invokeApiRunner('stripe-balance-get', { accountId: profileData.stripe_account_id });
        setBalance(data);
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('*, listings(title)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (orders) setTransactions(orders);
    } catch (err) {
      console.error('Error fetching mobile money data:', err);
    } finally {
      setLoading(false);
    }
  };

  const available = balance?.available?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
  const currency = balance?.available?.[0]?.currency?.toUpperCase() || 'EUR';

  // Mock data for chart
  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 1100 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white pb-24 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white border border-white/10">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Welcome back,</p>
            <h2 className="text-sm font-black">{profile?.full_name || 'User'}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-white/5 rounded-full border border-white/5">
            <Search className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2.5 bg-white/5 rounded-full border border-white/5 relative">
            <Bell className="w-5 h-5 text-gray-400" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0A0A0A]" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 py-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <Wallet className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Balance</span>
              </div>
              <TrendingUp className="w-5 h-5 text-white/50" />
            </div>

            <h1 className="text-5xl font-black tracking-tighter mb-2">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(available / 100)}
            </h1>
            
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
              <div className="flex items-center gap-1 text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5%</span>
              </div>
              <span>vs last month</span>
            </div>

            {/* Mini Chart */}
            <div className="h-24 mt-8 -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ffffff" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Points Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onNavigate('money-points')}
          className="mt-6 p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest">Wersee Points</p>
              <h3 className="text-xl font-black text-white">{(balance * 100).toLocaleString()}</h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-yellow-500/40 group-hover:translate-x-1 transition-transform" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-6 grid grid-cols-4 gap-4">
        {[
          { icon: ArrowUpRight, label: 'Payout', color: 'bg-indigo-500', view: 'money-payouts' },
          { icon: FileText, label: 'Invoices', color: 'bg-emerald-500', view: 'money-invoices' },
          { icon: Repeat, label: 'Subs', color: 'bg-purple-500', view: 'money-subscriptions' },
          { icon: MoreHorizontal, label: 'More', color: 'bg-gray-700', view: 'money-setup' },
        ].map((action, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(action.view)}
            className="flex flex-col items-center gap-2"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 border border-white/10`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="px-6 py-4 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black tracking-tight">Recent Activity</h3>
          <button className="text-xs font-bold text-indigo-400 uppercase tracking-widest">See All</button>
        </div>

        <div className="space-y-4">
          {transactions.map((t, i) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-3xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/10">
                  <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{t.listings?.title || 'Payment'}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-400">
                  +{new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency || 'EUR' }).format(t.net_amount || t.amount)}
                </p>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Received</p>
              </div>
            </motion.div>
          ))}

          {transactions.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <ArrowRightLeft className="w-10 h-10 text-gray-700 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
