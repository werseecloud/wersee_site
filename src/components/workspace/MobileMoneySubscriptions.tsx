import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, 
  Plus, 
  Loader2, 
  X, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Tag, 
  ShieldCheck, 
  Monitor, 
  Smartphone, 
  ArrowLeft, 
  Image as ImageIcon, 
  Palette, 
  Layout, 
  Type, 
  MessageSquare, 
  UploadCloud, 
  ChevronRight, 
  Box, 
  Percent, 
  Clock, 
  FileText, 
  Lock, 
  ShoppingBag, 
  Gift, 
  Zap, 
  Building2, 
  Star, 
  Check, 
  Sparkles, 
  Wand2, 
  Brain, 
  Target, 
  BarChart3, 
  Lightbulb, 
  Combine, 
  Flag, 
  Users,
  Search,
  Filter
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';

interface MobileMoneySubscriptionsProps {
  onBack: () => void;
}

export const MobileMoneySubscriptions: React.FC<MobileMoneySubscriptionsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans');
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      fetchSubscriptions(user.id);
      fetchSubscribers(user.id);
    }
    setLoading(false);
  };

  const fetchSubscriptions = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const fetchSubscribers = async (uid: string) => {
    try {
      const { data: plans } = await supabase.from('subscriptions').select('id').eq('seller_id', uid);
      const planIds = plans?.map(p => p.id) || [];
      if (planIds.length === 0) {
        setSubscribers([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .in('subscription_id', planIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex flex-col gap-6 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tight">Subscriptions</h2>
          </div>
          <button className="p-2.5 bg-white/5 rounded-full border border-white/5">
            <Plus className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'plans' ? 'bg-white text-black shadow-lg' : 'text-gray-500'
            }`}
          >
            Plans
          </button>
          <button 
            onClick={() => setActiveTab('subscribers')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'subscribers' ? 'bg-white text-black shadow-lg' : 'text-gray-500'
            }`}
          >
            Subscribers
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {activeTab === 'plans' ? (
          <div className="space-y-4">
            {subscriptions.length === 0 && !loading ? (
              <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                <Repeat className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-sm text-gray-500 font-medium">No plans created yet</p>
                <button className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-full text-xs font-bold">Create First Plan</button>
              </div>
            ) : (
              subscriptions.map((sub, i) => (
                <motion.div 
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/10">
                          <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{sub.name}</h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{sub.billing_period} billing</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">
                          {sub.currency === 'eur' ? '€' : sub.currency === 'usd' ? '$' : '£'}
                          {sub.price}
                        </p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">per {sub.billing_period.replace('ly', '')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-300 border border-white/5 transition-all">
                        Copy Link
                      </button>
                      <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5">
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {subscribers.length === 0 && !loading ? (
              <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-sm text-gray-500 font-medium">No subscribers yet</p>
              </div>
            ) : (
              subscribers.map((sub, i) => (
                <motion.div 
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-xs font-black text-white border border-white/10">
                      {sub.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{sub.subscription?.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">ID: {sub.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {sub.status}
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">
                      Renews {new Date(sub.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-30">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40 border border-white/20"
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.button>
      </div>
    </div>
  );
};
