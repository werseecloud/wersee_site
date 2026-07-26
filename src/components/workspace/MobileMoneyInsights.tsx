import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  Filter,
  PieChart, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  Wallet, 
  Bot,
  ArrowLeft
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface MobileMoneyInsightsProps {
  onBack: () => void;
}

export const MobileMoneyInsights: React.FC<MobileMoneyInsightsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [prevStats, setPrevStats] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    const endDate = new Date();
    const startDate = new Date();
    const prevEndDate = new Date();
    const prevStartDate = new Date();
    
    let days = 7;
    if (timeRange === '24h') days = 1;
    if (timeRange === '7d') days = 7;
    if (timeRange === '30d') days = 30;
    if (timeRange === '90d') days = 90;
    if (timeRange === '1y') days = 365;

    startDate.setDate(endDate.getDate() - days);
    prevEndDate.setDate(startDate.getDate() - 1);
    prevStartDate.setDate(prevEndDate.getDate() - days);

    try {
      const [currentData, previousData] = await Promise.all([
        supabase.rpc('get_dashboard_stats', { 
          p_seller_id: user.id, 
          p_start_date: startDate.toISOString(), 
          p_end_date: endDate.toISOString() 
        }),
        supabase.rpc('get_dashboard_stats', { 
          p_seller_id: user.id, 
          p_start_date: prevStartDate.toISOString(), 
          p_end_date: prevEndDate.toISOString() 
        })
      ]);

      if (currentData.error) throw currentData.error;
      if (previousData.error) throw previousData.error;

      setStats(currentData.data);
      setPrevStats(previousData.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, user]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revChange = calculateChange(stats.revenue.total_revenue, prevStats?.revenue?.total_revenue || 0);
  const netRevChange = calculateChange(stats.revenue.net_revenue, prevStats?.revenue?.net_revenue || 0);

  const revenueChartData = (stats.revenue.over_time || []).map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    value: Number(item.value)
  }));

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex flex-col gap-6 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tight">Insights</h2>
          </div>
          <button className="p-2.5 bg-indigo-500/10 rounded-full border border-indigo-500/10">
            <Bot className="w-5 h-5 text-indigo-400" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['24h', '7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 min-w-[60px] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                timeRange === range ? 'bg-white text-black shadow-lg' : 'text-gray-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem]">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Revenue</p>
            <h3 className="text-lg font-black text-white">€{stats.revenue.total_revenue.toLocaleString()}</h3>
            <div className={`flex items-center gap-1 text-[10px] font-bold mt-2 ${revChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {revChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(revChange).toFixed(1)}%
            </div>
          </div>
          <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem]">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Customers</p>
            <h3 className="text-lg font-black text-white">{stats.customers.total_customers.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[10px] font-bold mt-2 text-indigo-400">
              <Users className="w-3 h-3" />
              Active
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem]">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Revenue Growth</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '16px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Marketplace Health</h3>
          <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-bold text-gray-300">Success Rate</span>
              </div>
              <span className="text-sm font-black text-white">{stats.payments.success_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-gray-300">Refund Rate</span>
              </div>
              <span className="text-sm font-black text-white">{stats.payments.refund_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
