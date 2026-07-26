import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Info,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';

interface Payout {
  id: string;
  amount: number;
  currency: string;
  arrival_date: number;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  created: number;
  description: string | null;
  type: string;
  method: string;
}

interface MobileMoneyPayoutsProps {
  onBack: () => void;
}

export const MobileMoneyPayouts: React.FC<MobileMoneyPayoutsProps> = ({ onBack }) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kycStatus, setKycStatus] = useState<string>('not_started');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      if (!savedAccountId) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setKycStatus(profile.kyc_status);
      }

      const resData = await invokeApiRunner('payout-list', {
        accountId: savedAccountId,
        limit: 50
      });

      if (resData.error) {
        throw new Error(resData.error || 'Failed to fetch payouts');
      }

      if (resData?.data) {
        setPayouts(resData.data);
      }
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-400 bg-emerald-500/10';
      case 'pending': return 'text-amber-400 bg-amber-500/10';
      case 'in_transit': return 'text-blue-400 bg-blue-500/10';
      case 'canceled': return 'text-gray-400 bg-white/5';
      case 'failed': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-white/5';
    }
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) / 100;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/5 rounded-full border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-black tracking-tight">Payouts</h2>
        </div>
        <button 
          onClick={fetchPayouts}
          className="p-2.5 bg-white/5 rounded-full border border-white/5"
        >
          <RefreshCcw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {/* Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Total Paid Out</p>
            <h1 className="text-4xl font-black tracking-tighter mb-4">
              €{totalPaid.toLocaleString()}
            </h1>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest">Weekly Schedule</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search payouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Payouts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">History</h3>
            <span className="text-[10px] font-bold text-gray-600">{filteredPayouts.length} total</span>
          </div>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
            ))
          ) : filteredPayouts.length > 0 ? (
            filteredPayouts.map((payout, i) => (
              <motion.div 
                key={payout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    payout.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/10' : 'bg-amber-500/10 border-amber-500/10'
                  }`}>
                    {payout.status === 'paid' ? (
                      <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">€{(payout.amount / 100).toFixed(2)}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {new Date(payout.arrival_date * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">{payout.method}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <ArrowRightLeft className="w-10 h-10 text-gray-700 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">No payouts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-30">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/40 border border-white/20"
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.button>
      </div>
    </div>
  );
};
