import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Users, CreditCard, 
  ArrowUpRight, ArrowDownRight, Calendar, Download, Filter,
  PieChart, Activity, AlertCircle, ShieldCheck, RefreshCw, Wallet, Bot
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { fixOklchColors } from '../../lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { appToast } from '@/lib/feedback';
// --- Types ---

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

const MetricCard = ({ title, value, change, icon, trend, description }: MetricCardProps) => {
  const Icon = icon as any;
  return (
    <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
          trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <div className="text-2xl font-bold text-white">{value}</div>
    {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
  </div>
  );
};

export const MoneyInsightsView = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [prevStats, setPrevStats] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrend = (change: number) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          fixOklchColors(clonedDoc);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Wersee_Insights_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      appToast('Failed to generate PDF report.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate percentage changes
  const revChange = calculateChange(stats.revenue.total_revenue, prevStats?.revenue?.total_revenue || 0);
  const netRevChange = calculateChange(stats.revenue.net_revenue, prevStats?.revenue?.net_revenue || 0);
  const mrrChange = calculateChange(stats.subscriptions.mrr, prevStats?.subscriptions?.mrr || 0);
  const customersChange = calculateChange(stats.customers.total_customers, prevStats?.customers?.total_customers || 0);

  // Calculate estimated fees
  const gmv = stats.revenue.gmv || 0;
  const transactions = stats.payments.total_transactions || 0;
  const stripeFee = (gmv * 0.029) + (transactions * 0.30);
  const werseeFee = Math.max(gmv * 0.05, transactions * 0.50);
  const totalEstimatedFees = stripeFee + werseeFee;

  // Process payment methods for chart
  const paymentMethodsChartData = Object.entries(stats.payments.methods || {}).map(([name, value], index) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: Number(value),
    color: ['#10B981', '#3B82F6', '#F59E0B', '#000000', '#EC4899'][index % 5]
  }));

  // Process revenue over time for chart
  const revenueChartData = (stats.revenue.over_time || []).map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    value: Number(item.value)
  }));

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Insights</h1>
          <p className="text-xs md:text-sm text-gray-400">Overview of your financial performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3" data-html2canvas-ignore>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-ai-sidebar', { 
                detail: { 
                  context: { 
                    financialStats: stats, 
                    previousFinancialStats: prevStats,
                    estimatedStripeFee: stripeFee,
                    estimatedWerseeFee: werseeFee,
                    totalEstimatedFees: totalEstimatedFees
                  } 
                } 
              }));
            }}
            className="flex-1 md:flex-none px-3 py-2 md:px-4 md:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-indigo-500/20"
          >
            <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
            AI Adviser
          </button>

          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 md:flex-none px-3 py-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/5"
          >
            {isDownloading ? <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            Export PDF
          </button>
          
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            {['24h', '7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors whitespace-nowrap ${
                  timeRange === range 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={`€${stats.revenue.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          change={revChange} 
          trend={getTrend(revChange)} 
          icon={DollarSign}
          description="Gross revenue before fees"
        />
        <MetricCard 
          title="Net Revenue" 
          value={`€${stats.revenue.net_revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          change={netRevChange} 
          trend={getTrend(netRevChange)} 
          icon={Wallet}
          description="Earnings after platform fees"
        />
        <MetricCard 
          title="MRR" 
          value={`€${stats.subscriptions.mrr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          change={mrrChange} 
          trend={getTrend(mrrChange)} 
          icon={RefreshCw}
          description="Monthly Recurring Revenue"
        />
        <MetricCard 
          title="Active Customers" 
          value={stats.customers.total_customers.toLocaleString()} 
          change={customersChange} 
          trend={getTrend(customersChange)} 
          icon={Users}
          description="Total active buyers"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white">Revenue Growth</h3>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
              <AreaChart data={revenueChartData.length > 0 ? revenueChartData : [{ name: 'No Data', value: 0 }]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">Payment Methods</h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
              <RePieChart>
                <Pie
                  data={paymentMethodsChartData.length > 0 ? paymentMethodsChartData : [{ name: 'No Data', value: 1, color: '#333' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(paymentMethodsChartData.length > 0 ? paymentMethodsChartData : [{ name: 'No Data', value: 1, color: '#333' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Marketplace Health & Fees */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Marketplace Health & Fees
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">GMV</span>
              <span className="text-xs md:text-sm text-white font-medium">€{gmv.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Avg Order Value</span>
              <span className="text-xs md:text-sm text-white font-medium">€{stats.revenue.average_order_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-gray-400">Stripe Fees (Est.)</span>
                <span className="text-[8px] md:text-xs text-gray-500">2.9% + €0.30/txn</span>
              </div>
              <span className="text-xs md:text-sm text-white font-medium">€{stripeFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-gray-400">Wersee Fees (Est.)</span>
                <span className="text-[8px] md:text-xs text-gray-500">5% (Min €0.50)</span>
              </div>
              <span className="text-xs md:text-sm text-white font-medium">€{werseeFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs md:text-sm text-gray-400">Total Est. Fees</span>
              <span className="text-xs md:text-sm text-white font-medium">€{totalEstimatedFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-400" /> Customer Insights
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">New Customers</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.customers.new_customers}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Returning</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.customers.total_customers - stats.customers.new_customers}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Lifetime Value (CLV)</span>
              <span className="text-xs md:text-sm text-white font-medium">
                €{stats.customers.total_customers > 0 ? (stats.revenue.total_revenue / stats.customers.total_customers).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs md:text-sm text-gray-400">Refund Rate</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.payments.refund_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Risk & Finance */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-red-400" /> Risk & Finance
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Total Transactions</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.payments.total_transactions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Success Rate</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.payments.success_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs md:text-sm text-gray-400">Failed Payments</span>
              <span className="text-xs md:text-sm text-white font-medium">{stats.payments.failed_payments}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs md:text-sm text-gray-400">Disputes / Fraud</span>
              <span className="text-emerald-400 font-medium text-xs md:text-sm">0 (Healthy)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

