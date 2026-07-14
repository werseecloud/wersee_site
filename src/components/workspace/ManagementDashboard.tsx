import React, { useState, useEffect } from 'react';
import { 
  Package, Users, MessageSquare, Activity, ArrowUpRight, ArrowDownRight, 
  Plus, Search, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle,
  BarChart3, Store, Zap, ArrowRight, ShieldCheck, TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { motion } from 'framer-motion';

export const ManagementDashboard = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeCustomers: 0,
    pendingTasks: 0,
    communityMembers: 0,
    totalDeals: 0,
    pipelineValue: 0
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [teamActivity, setTeamActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchManagementData();
    }
  }, [user]);

  const fetchManagementData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [productsRes, customersRes, tasksRes, communityRes] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user?.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }), // Mocking customers as all profiles for now
        supabase.from('team_tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo'),
        supabase.from('community_members').select('*', { count: 'exact', head: true })
      ]);

      // Fetch CRM stats
      const { data: deals } = await supabase
        .from('crm_deals')
        .select('value');
      
      const totalDeals = deals?.length || 0;
      const pipelineValue = deals?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0;

      setStats({
        totalProducts: productsRes.count || 0,
        activeCustomers: customersRes.count || 0,
        pendingTasks: tasksRes.count || 0,
        communityMembers: communityRes.count || 0,
        totalDeals,
        pipelineValue
      });

      // Fetch recent products
      const { data: products } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (products) setRecentProducts(products);

      // Fetch recent tasks
      const { data: tasks } = await supabase
        .from('team_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (tasks) setRecentTasks(tasks);

      // Mock team activity
      setTeamActivity([
        { id: 1, user: 'Sarah', action: 'updated product', target: 'Digital Art Pack', time: '2h ago' },
        { id: 2, user: 'Mike', action: 'completed task', target: 'Update SEO tags', time: '4h ago' },
        { id: 3, user: 'Alex', action: 'joined community', target: 'Creator Hub', time: '5h ago' },
      ]);

    } catch (error) {
      console.error('Error fetching management dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden pb-24">
      {/* Mobile Header */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none">Management</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">Your business at a glance</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onNavigate('create-product')}
            className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-sm shadow-xl shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Listing
          </button>
          <button 
            onClick={() => onNavigate('management-team')}
            className="flex-1 py-4 bg-[#141414] text-white rounded-2xl font-black text-sm border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Team
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#141414] border border-white/5 p-5 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-12 h-12 text-indigo-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Products</p>
            <p className="text-3xl font-black text-white">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 p-5 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Customers</p>
            <p className="text-3xl font-black text-white">{stats.activeCustomers}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 p-5 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-12 h-12 text-amber-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Tasks</p>
            <p className="text-3xl font-black text-white">{stats.pendingTasks}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-white/5 p-5 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-12 h-12 text-blue-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Members</p>
            <p className="text-3xl font-black text-white">{stats.communityMembers}</p>
          </div>
        </div>
      </div>

      {/* Pipeline Value (Mobile Highlight) */}
      <div className="md:hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl border border-white/20">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Pipeline</span>
              <span className="text-xs text-white font-bold">Value</span>
            </div>
          </div>
          <h3 className="text-5xl font-black text-white tracking-tighter">€{stats.pipelineValue.toLocaleString()}</h3>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-white/70 text-sm font-medium">Potential revenue from active deals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Management */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-400" /> Recent Products
            </h3>
            <button onClick={() => onNavigate('management-products')} className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/5">
                    {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-600 m-auto h-full" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{product.title}</h4>
                    <p className="text-xs text-gray-500">€{product.price} • {product.type || 'Digital'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    product.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {product.status || 'Active'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('create-product')} className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>

        {/* Team & Tasks */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> Team Tasks
            </h3>
            <button onClick={() => onNavigate('management-team')} className="text-sm text-gray-400 hover:text-white transition-colors">Manage Team</button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <h4 className="text-sm font-medium text-white">{task.title}</h4>
                    <p className="text-xs text-gray-500">Assigned to Team</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  task.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                  task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {task.status?.replace('_', ' ') || 'Todo'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Recent Activity</h4>
            <div className="space-y-4">
              {teamActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                    {act.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300">
                      <span className="font-bold text-white">{act.user}</span> {act.action} <span className="text-indigo-400">{act.target}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business Health & Security */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-white">Business Health</h3>
            <p className="text-sm text-gray-500">Operational status and security overview</p>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> All Systems Operational
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Store Status</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">Public Store</span>
              <span className="text-xs text-emerald-400 font-bold">Online</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Security</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">2FA Protection</span>
              <span className="text-xs text-emerald-400 font-bold">Enabled</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Compliance</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">KYC Status</span>
              <span className="text-xs text-emerald-400 font-bold">Verified</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onNavigate('management-crm')}>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">CRM Status</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{stats.totalDeals} Active Deals</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
