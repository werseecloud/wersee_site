import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Briefcase, Users, CreditCard, Truck, Clock, Download, FileText, ChevronRight, CheckCircle, AlertCircle, TrendingUp, BarChart3, Star, Calendar, Tag, Plus, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../ui/Skeleton';

import { appToast, requestInput } from '@/lib/feedback';
const StatWidget = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">This Month</span>
    </div>
    <h3 className="text-3xl font-bold text-[#1D1D1F] mb-1">{value}</h3>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </div>
);

const ActionList = ({ title, items, type, onAction }: any) => (
  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-black/5 flex justify-between items-center">
      <h3 className="font-bold text-[#1D1D1F] text-lg">{title}</h3>
      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
    </div>
    <div className="divide-y divide-black/5">
      {items.map((item: any, i: number) => (
        <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            type === 'shipping' ? 'bg-orange-50 text-orange-600' :
            type === 'job' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
          }`}>
            {type === 'shipping' ? <Truck className="w-5 h-5" /> :
             type === 'job' ? <Clock className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[#1D1D1F] truncate">{item.title}</h4>
            <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              item.status === 'shipped' || item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {item.status}
            </span>
            {onAction && item.status === 'pending' && (
              <button 
                onClick={() => onAction(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Print Label / Start Job"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <p>No active items found.</p>
        </div>
      )}
    </div>
  </div>
);

export const SellerOverview = ({ user }: { user: any }) => {
  const [stats, setStats] = useState({ balance: 0, openOrders: 0, activeJobs: 0, communityActivity: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, listing:listings(title)')
          .eq('seller_id', user.id)
          .eq('type', 'product')
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: jobsData } = await supabase
          .from('orders')
          .select('*, listing:listings(title)')
          .eq('seller_id', user.id)
          .in('type', ['service', 'job'])
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: completedOrders } = await supabase
          .from('orders')
          .select('amount')
          .eq('seller_id', user.id)
          .eq('status', 'delivered');

        // Calculate stats
        const pendingOrders = ordersData?.filter((o: any) => o.status === 'pending').length || 0;
        const activeJobsCount = jobsData?.filter((j: any) => j.status === 'pending' || j.status === 'in_progress').length || 0;
        const totalBalance = completedOrders?.reduce((sum: number, order: any) => sum + Number(order.amount), 0) || 0;

        setStats({
          balance: totalBalance,
          openOrders: pendingOrders,
          activeJobs: activeJobsCount,
          communityActivity: 0
        });

        setOrders(ordersData?.map((o: any) => ({
          id: o.id,
          title: o.listing?.title || 'Unknown Product',
          subtitle: `Order #${o.id.substring(0,8)} • €${o.amount}`,
          status: o.status
        })) || []);

        setJobs(jobsData?.map((j: any) => ({
          id: j.id,
          title: j.listing?.title || 'Unknown Job',
          subtitle: `Order #${j.id.substring(0,8)} • €${j.amount}`,
          status: j.status
        })) || []);
      } catch (error) {
        console.error('Error fetching seller overview data:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleAction = async (item: any, type: string) => {
    // Example action: mark as shipped or in_progress
    const newStatus = type === 'shipping' ? 'shipped' : 'in_progress';
    await supabase.from('orders').update({ status: newStatus }).eq('id', item.id);
    // Refresh data would go here
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget title="Total Balance" value={`€${stats.balance.toFixed(2)}`} subtext="Ready for payout via MoR" icon={CreditCard} color="bg-green-500" />
        <StatWidget title="Open Orders" value={stats.openOrders} subtext="Physical products to ship" icon={Package} color="bg-orange-500" />
        <StatWidget title="Active Jobs" value={stats.activeJobs} subtext="Deadlines approaching" icon={Briefcase} color="bg-blue-500" />
        <StatWidget title="Community Activity" value={stats.communityActivity} subtext="New questions in groups" icon={Users} color="bg-purple-500" />
      </div>

      {/* Action Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ActionList 
          title="Orders to Ship (Physical)" 
          type="shipping"
          items={orders} 
          onAction={(item: any) => handleAction(item, 'shipping')}
        />
        <ActionList 
          title="Active Jobs & Services" 
          type="job"
          items={jobs} 
          onAction={(item: any) => handleAction(item, 'job')}
        />
      </div>
    </div>
  );
};

export const SellerFinances = ({ user }: { user: any }) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">Financial Dashboard (MoR)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-[#1D1D1F]">€0.00</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">Platform Fees & VAT</p>
            <p className="text-3xl font-bold text-red-500">-€0.00</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-600 mb-1">Next Payout</p>
            <p className="text-3xl font-bold text-blue-700">€0.00</p>
            <p className="text-xs text-blue-500 mt-2">Expected: 1st of next month</p>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-[#1D1D1F] mb-4">Invoices</h3>
        <div className="border border-black/5 rounded-2xl overflow-hidden overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="p-4 bg-gray-50 border-b border-black/5 flex justify-between items-center">
              <span className="font-medium text-gray-500 flex-1">Invoice Date</span>
              <span className="font-medium text-gray-500 flex-1 text-center">Amount</span>
              <span className="font-medium text-gray-500 flex-1 text-right">Action</span>
            </div>
            <div className="p-8 text-center text-gray-400">
              No invoices generated yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SellerCommunity = ({ user }: { user: any }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch user's community listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('seller_id', user.id)
        .eq('type', 'community');

      const communityIds = listings?.map(l => l.id) || [];

      if (communityIds.length > 0) {
        // Fetch questions (posts)
        const { data: questionsData } = await supabase
          .from('community_posts')
          .select('*, author:profiles(full_name)')
          .in('community_id', communityIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setQuestions(questionsData || []);

        // Fetch events
        const { data: eventsData } = await supabase
          .from('community_events')
          .select('*')
          .in('community_id', communityIds)
          .order('start_time', { ascending: true })
          .limit(5);
        setEvents(eventsData || []);

        // Fetch insights (members count)
        const { data: membersData } = await supabase
          .from('community_members')
          .select('community_id')
          .in('community_id', communityIds);
        
        const insightsData = listings?.map(l => ({
          listing_id: l.id,
          member_count: membersData?.filter(m => m.community_id === l.id).length || 0
        })) || [];
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error fetching seller community data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const createEvent = async () => {
    if (!insights[0]?.listing_id) {
      appToast('Create a community before adding events.', 'error');
      return;
    }

    const title = await requestInput({
      title: 'Create event',
      description: 'Add the event title shown to community members.',
      label: 'Event title',
      placeholder: 'Live Q&A session',
      required: true,
    });
    if (!title) return;

    const startTime = await requestInput({
      title: 'Event start time',
      description: 'Use a date and time that can be parsed by the browser.',
      label: 'Start time',
      placeholder: '2026-07-14 19:00',
      required: true,
      validate: (value) => (Number.isNaN(new Date(value).getTime()) ? 'Enter a valid date and time.' : null),
    });
    if (!startTime) return;

    const { error } = await supabase.from('community_events').insert({
      title,
      start_time: new Date(startTime).toISOString(),
      community_id: insights[0]?.listing_id // Just for demo, pick first community
    });

    if (error) {
      appToast('Failed to create event.', 'error');
      return;
    }

    appToast('Event created.', 'success');
    fetchData();
  };

  const createPromotion = async () => {
    if (!insights[0]?.listing_id) {
      appToast('Create a community before adding promotions.', 'error');
      return;
    }

    const code = await requestInput({
      title: 'Create discount code',
      description: 'Enter the code customers will use at checkout.',
      label: 'Discount code',
      placeholder: 'SUMMER20',
      required: true,
    });
    if (!code) return;

    const percentage = await requestInput({
      title: 'Discount percentage',
      description: 'Choose a percentage between 1 and 100.',
      label: 'Percentage',
      placeholder: '20',
      inputType: 'number',
      required: true,
      validate: (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return 'Enter a percentage from 1 to 100.';
        return null;
      },
    });
    if (!percentage) return;

    const { error } = await supabase.from('community_promotions').insert({
      discount_code: code,
      discount_percentage: Number(percentage),
      community_id: insights[0]?.listing_id,
      listing_id: insights[0]?.listing_id // Promoting the community itself for demo
    });

    if (error) {
      appToast('Failed to create promotion.', 'error');
      return;
    }

    appToast('Promotion created.', 'success');
    fetchData();
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Insights Section */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">Course Insights</h2>
            <p className="text-sm text-gray-500">Real-time performance metrics for your digital products.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-black/5 w-full sm:w-auto justify-center">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold">Analytics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight) => (
            <div key={insight.id} className="p-6 border border-black/5 rounded-3xl bg-gray-50/50 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm truncate flex-1">{insight.listing?.title}</h4>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Enrollments</p>
                  <p className="text-lg font-bold">{insight.enrollments_count}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Revenue</p>
                  <p className="text-lg font-bold text-emerald-600">€{insight.revenue}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Completion</p>
                  <p className="text-lg font-bold">{insight.completion_rate}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <p className="text-lg font-bold">{insight.average_rating}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No insights available yet. Start selling to see data!</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question Queue */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold">Question Queue</h3>
          </div>
          
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="p-4 border border-black/5 rounded-2xl bg-gray-50 hover:bg-white transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <img src={q.user_avatar} className="w-8 h-8 rounded-lg" alt={q.user_name} />
                  <div className="flex-1">
                    <p className="text-xs font-bold">{q.user_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {q.listing?.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{q.content.replace('[Q&A] ', '')}</p>
                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs font-bold text-blue-600 hover:underline">Reply to Student</button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
                <p>All caught up! No unanswered questions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Community Activity */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold">Community Activity</h3>
          </div>
          
          <div className="space-y-6">
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Community engagement metrics will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events & Promotions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events Management */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Community Events</h3>
            </div>
            <button 
              onClick={createEvent}
              className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 border border-black/5 rounded-2xl bg-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">{new Date(event.start_time).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-lg font-bold">{new Date(event.start_time).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{event.title}</h4>
                  <p className="text-xs text-gray-400">{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <p>No upcoming events scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Promotions Management */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold">Product Promotions</h3>
            </div>
            <button 
              onClick={createPromotion}
              className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="p-4 border border-black/5 rounded-2xl bg-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">{promo.discount_code}</h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {promo.discount_percentage}% OFF
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Promoting: {promo.listing?.title}</p>
                </div>
                <button className="text-xs font-bold text-red-600 hover:underline">End</button>
              </div>
            ))}
            {promotions.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <p>No active promotions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SellerOrders = ({ user }: { user: any }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*, listing:listings(title)')
        .eq('seller_id', user.id)
        .eq('type', 'product')
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1D1D1F] p-6 sm:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Orders Management</h2>
          <button className="w-full sm:w-auto px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
            Export CSV
          </button>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-sm text-gray-500 dark:text-gray-400">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td className="py-4 font-mono text-gray-500 dark:text-gray-400">#{order.id.slice(0, 8)}</td>
                      <td className="py-4 font-medium text-[#1D1D1F] dark:text-white">{order.listing?.title || 'Unknown Product'}</td>
                      <td className="py-4 text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          {order.status === 'pending' ? 'Print Label' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-4 border border-black/5 dark:border-white/5 rounded-2xl bg-gray-50 dark:bg-[#2C2C2E]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</span>
                      <h3 className="font-bold text-[#1D1D1F] dark:text-white mt-1">{order.listing?.title || 'Unknown Product'}</h3>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className="w-full py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl text-sm font-medium text-[#1D1D1F] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    {order.status === 'pending' ? 'Print Label' : 'View Details'}
                  </button>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No orders found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const SellerJobs = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'team' | 'services'>('applications');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch Businesses
        const { data: bizData } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id);
        
        if (bizData) setBusinesses(bizData);

        // Fetch Applications
        const { data: appsData } = await supabase
          .from('orders')
          .select('*, listing:listings(title)')
          .eq('seller_id', user.id)
          .eq('type', 'job_application')
          .order('created_at', { ascending: false });
        
        if (appsData) setApplications(appsData);

        // Fetch Active Services/Jobs
        const { data: jobsData } = await supabase
          .from('orders')
          .select('*, listing:listings(title)')
          .eq('seller_id', user.id)
          .in('type', ['service', 'job'])
          .order('created_at', { ascending: false });
        
        if (jobsData) setJobs(jobsData);

        // Fetch Team Members if business exists
        if (bizData && bizData.length > 0) {
          const { data: membersData } = await supabase
            .from('team_members')
            .select('*')
            .in('team_id', bizData.map(b => b.id));
          if (membersData) setTeamMembers(membersData);
        }

      } catch (error) {
        console.error('Error fetching seller jobs data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      appToast('Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      {/* Business Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1D1D1F] p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Size</p>
              <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white">{teamMembers.length} Members</h3>
            </div>
          </div>
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 5).map((m, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-[#1D1D1F] flex items-center justify-center text-[10px] font-bold">
                {m.email?.[0].toUpperCase() || '?'}
              </div>
            ))}
            {teamMembers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-[#1D1D1F] flex items-center justify-center text-[10px] font-bold text-gray-500">
                +{teamMembers.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1D1D1F] p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Applications</p>
              <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white">{applications.filter(a => a.status === 'pending').length} New</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total of {applications.length} applications received</p>
        </div>

        <div className="bg-white dark:bg-[#1D1D1F] p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Jobs</p>
              <h3 className="text-2xl font-black text-[#1D1D1F] dark:text-white">{jobs.length} Active</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">Managing {jobs.filter(j => j.status === 'in_progress').length} in progress</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#1D1D1F] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 overflow-x-auto w-full sm:w-auto scrollbar-hide no-scrollbar">
            <button 
              onClick={() => setActiveTab('applications')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'applications' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Applications
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'team' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Team Portal
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'services' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Active Services
            </button>
          </div>

          {activeTab === 'team' && businesses.length > 0 && (
            <a 
              href={`/portal/${businesses[0].slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-black/10"
            >
              Open Public Portal <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="p-8">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'applications' && (
                <motion.div 
                  key="apps"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {applications.length > 0 ? applications.map((app) => (
                    <div key={app.id} className="p-6 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
                            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-[#1D1D1F] dark:text-white">{app.listing?.title || 'Unknown Job'}</h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                              <span className="text-[10px] sm:text-xs font-bold text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {app.metadata?.applicant_email || 'Anonymous'}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto mt-2 md:mt-0">
                          <div className="flex items-center justify-between w-full sm:w-auto">
                            <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                              app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                              app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                              'bg-red-500/10 text-red-600'
                            }`}>
                              {app.status}
                            </span>
                            <button className="sm:hidden p-2 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-xl text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {app.status === 'pending' && (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => updateApplicationStatus(app.id, 'declined')}
                                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          
                          <button className="hidden sm:block p-2.5 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-xl text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-black/10 dark:border-white/10">
                      <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-400">No applications yet</h3>
                      <p className="text-sm text-gray-500">When people apply for your jobs, they will appear here.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-indigo-500 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20">
                      <h3 className="text-2xl font-black mb-2">Team Portal</h3>
                      <p className="text-white/80 text-sm mb-8 leading-relaxed">
                        Share assignments, PDFs, and resources with your team members and applicants in a secure, branded environment.
                      </p>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            if (businesses.length > 0) {
                              navigate(`/portal/${businesses[0].slug}`);
                            }
                          }}
                          className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" /> Manage Resources
                        </button>
                        <button 
                          onClick={() => {
                            if (businesses.length > 0) {
                              navigate(`/portal/${businesses[0].slug}`);
                            }
                          }}
                          className="w-full py-4 bg-indigo-600 border-2 border-white/20 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-5 h-5" /> Post Announcement
                        </button>
                        <p className="text-[10px] text-white/60 text-center font-bold uppercase tracking-widest">
                          Integrated with your custom business URL
                        </p>
                      </div>
                    </div>

                    <div className="p-8 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem]">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" /> Recent Members
                      </h3>
                      <div className="space-y-4">
                        {teamMembers.length > 0 ? teamMembers.slice(0, 4).map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                                {member.email?.[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{member.email?.split('@')[0]}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{member.role || 'Member'}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase rounded-full">
                              Active
                            </span>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No team members yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold">Portal Quick Settings</h3>
                      <button className="text-sm font-bold text-indigo-500 hover:underline">View All Settings</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                        <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">Assignments</h4>
                        <p className="text-xs text-gray-500">Manage team tasks</p>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                        <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <Download className="w-5 h-5 text-gray-500" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">Shared PDFs</h4>
                        <p className="text-xs text-gray-500">Company documents</p>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                        <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <ShieldCheck className="w-5 h-5 text-gray-500" />
                        </div>
                        <h4 className="font-bold text-sm mb-1">Access Control</h4>
                        <p className="text-xs text-gray-500">Portal permissions</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'services' && (
                <motion.div 
                  key="services"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {jobs.length > 0 ? jobs.map((job) => (
                    <div key={job.id} className="p-6 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
                            <Zap className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-[#1D1D1F] dark:text-white">{job.listing?.title || 'Unknown Service'}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Ordered: {new Date(job.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                Client ID: {job.buyer_id?.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                            job.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                            job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <button className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all">
                            Manage Order
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-black/10 dark:border-white/10">
                      <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-400">No active services</h3>
                      <p className="text-sm text-gray-500">When clients order your services, they will appear here.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
