import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, 
  Wallet, RefreshCw, PieChart, Activity, ArrowRight, Download,
  Calendar, ShieldCheck, Landmark, History
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, change, icon, color }: StatCardProps) => {
  const Icon = icon as any;
  return (
    <div className="bg-[#141414] border border-white/5 p-3 md:p-5 rounded-xl md:rounded-2xl hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className={`p-1 md:p-2 rounded-lg md:rounded-xl bg-${color}-500/10 text-${color}-400`}>
          <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
        </div>
      {change !== undefined && (
        <div className={`flex items-center gap-0.5 text-[9px] md:text-xs font-medium px-1 py-0.5 md:px-2 md:py-1 rounded-lg ${
          change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {change >= 0 ? <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 md:w-3 md:h-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-gray-400 text-[9px] md:text-xs font-medium mb-0.5">{title}</p>
    <h3 className="text-sm md:text-xl font-bold text-white">{value}</h3>
  </div>
  );
};

export const MoneyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMoneyData();
    }
  }, [user]);

  const fetchMoneyData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_seller_id: user?.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) throw error;
      setStats(data);

      // Process chart data
      if (data.revenue.over_time) {
        setRevenueData(data.revenue.over_time.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          revenue: Number(item.value)
        })));
      }

      // Fetch recent payouts (mocking for now as we might not have a payouts table yet, 
      // but let's check if it exists or use a placeholder)
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (payouts) setRecentPayouts(payouts);

    } catch (error) {
      console.error('Error fetching money dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          title="Available Balance" 
          value={`€${(stats?.revenue?.net_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={Wallet} 
          color="emerald"
        />
        <StatCard 
          title="Pending Payouts" 
          value="€0.00" 
          icon={Landmark} 
          color="blue"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`€${(stats?.revenue?.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={TrendingUp} 
          color="indigo"
        />
        <StatCard 
          title="Active Subscriptions" 
          value={stats?.subscriptions?.active_subscriptions || 0} 
          icon={RefreshCw} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-xl md:rounded-3xl p-3 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-8">
            <div>
              <h3 className="text-sm md:text-lg font-bold text-white">Revenue Overview</h3>
              <p className="text-[10px] md:text-sm text-gray-500">Last 30 days performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] md:text-xs text-gray-400">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                Last 30 Days
              </div>
            </div>
          </div>
          <div className="h-[200px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
              <AreaChart data={revenueData.length > 0 ? revenueData : [{ date: 'No Data', revenue: 0 }]}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h3 className="text-sm md:text-lg font-bold text-white">Recent Payouts</h3>
            <History className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="space-y-2 md:space-y-4">
            {recentPayouts.length > 0 ? recentPayouts.map((payout, i) => (
              <div key={i} className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Landmark className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-sm font-medium text-white">Bank Transfer</p>
                    <p className="text-[9px] md:text-xs text-gray-500">{new Date(payout.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] md:text-sm font-bold text-white">€{payout.amount.toFixed(2)}</p>
                  <p className="text-[8px] md:text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Completed</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Landmark className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-gray-500 text-xs">No payouts yet</p>
              </div>
            )}
            <button className="w-full py-2 text-[10px] md:text-sm font-medium text-gray-400 hover:text-white transition-colors border-t border-white/5 mt-2">
              View All History
            </button>
          </div>
        </div>
      </div>

      {/* Activity Breakdown Section */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Activity Breakdown</h3>
            </div>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
              View your financial report data from summary totals to individual transaction details in the Stripe Dashboard. Filter and analyse transactions instead of downloading CSV files.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-gray-300 font-medium">Transaction reconciliation:</span> Understand the specific transactions that contribute to summary totals.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-gray-300 font-medium">Audit preparation:</span> Provide detailed transaction history for accounting periods.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-gray-300 font-medium">Customer analysis:</span> Analyse payment patterns and activity for specific customers.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-gray-300 font-medium">Financial reporting:</span> Support detailed financial analysis and reporting requirements.
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-400">
              <span className="font-bold text-gray-300">Before you begin:</span> Activity breakdown is only available for platform account reports. Access activity breakdown by clicking amounts in the following reports to audit the underlying transactions.
            </div>
          </div>
          <a 
            href="https://dashboard.stripe.com/reports/overview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            View in Stripe <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payment Health */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-red-400" /> Payment Health
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center p-2.5 md:p-3 rounded-xl bg-white/[0.02]">
              <span className="text-xs md:text-sm text-gray-400">Success Rate</span>
              <span className="text-xs md:text-sm font-bold text-emerald-400">{(stats?.payments?.success_rate || 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 md:p-3 rounded-xl bg-white/[0.02]">
              <span className="text-xs md:text-sm text-gray-400">Refund Rate</span>
              <span className="text-xs md:text-sm font-bold text-yellow-400">{(stats?.payments?.refund_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-2.5 md:p-3 rounded-xl bg-white/[0.02]">
              <span className="text-xs md:text-sm text-gray-400">Dispute Rate</span>
              <span className="text-xs md:text-sm font-bold text-emerald-400">0.0%</span>
            </div>
          </div>
        </div>

        {/* Fees Breakdown */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" /> Fees Breakdown
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500" />
                <span className="text-xs md:text-sm text-gray-400">Stripe Fees</span>
              </div>
              <span className="text-xs md:text-sm font-bold text-white">2.9% + €0.30</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500" />
                <span className="text-xs md:text-sm text-gray-400">Wersee Fee</span>
              </div>
              <span className="text-xs md:text-sm font-bold text-white">5.0%</span>
            </div>
            <div className="pt-3 md:pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm font-medium text-white">Effective Rate</span>
                <span className="text-xs md:text-sm font-bold text-indigo-400">~8.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">Money Actions</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <button className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center group">
              <Landmark className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-medium text-gray-300">Payout</span>
            </button>
            <button className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center group">
              <Download className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-medium text-gray-300">Reports</span>
            </button>
            <button className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center group">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-medium text-gray-300">Methods</span>
            </button>
            <button className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center group">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-medium text-gray-300">Insights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
