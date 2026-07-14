import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PayoutScheduleModal } from '../../components/dashboard/PayoutScheduleModal';

import { appToast } from '@/lib/feedback';
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

export const MoneyPayoutsView: React.FC = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [createAmount, setCreateAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('not_started');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      if (!savedAccountId) {
        setLoading(false);
        return;
      }

      // Fetch profile to check schedule configuration and KYC status
      const { data: profile } = await supabase
        .from('profiles')
        .select('payout_schedule_configured, kyc_status')
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
        
        // Check if we should show the schedule modal
        if (resData.data.length > 0 && profile && !profile.payout_schedule_configured && profile.kyc_status === 'verified') {
          setIsScheduleModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!createAmount || isNaN(Number(createAmount))) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      if (!savedAccountId) throw new Error('Stripe account not found');

      const resData = await invokeApiRunner('payout-create', {
        accountId: savedAccountId,
        amount: Number(createAmount),
        currency: 'eur'
      });

      if (resData.error) {
        throw new Error(resData.error || 'Failed to create payout');
      }
      
      setIsCreateModalOpen(false);
      setCreateAmount('');
      fetchPayouts();
    } catch (err: any) {
      console.error('Error creating payout:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_transit': return <RefreshCcw className="w-4 h-4 animate-spin-slow" />;
      case 'canceled': return <XCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) / 100;
  const totalPending = payouts.filter(p => p.status === 'pending' || p.status === 'in_transit').reduce((sum, p) => sum + p.amount, 0) / 100;

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-2">Payouts</h1>
          <p className="text-[10px] md:text-sm text-gray-400">Track and manage your funds transfers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchPayouts}
            className="p-2 md:p-3 bg-white/5 text-gray-400 hover:text-white rounded-lg md:rounded-xl transition-colors border border-white/5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => {
              if (kycStatus !== 'verified') {
                appToast('Please complete KYC verification to create payouts.');
                navigate('/setup');
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-white text-black rounded-lg md:rounded-xl font-bold hover:bg-gray-200 transition-all text-[10px] md:text-sm"
          >
            <Plus className="w-3.5 h-3.5 md:w-5 md:h-5" />
            Manual Payout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6">
        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-3xl p-3 md:p-6">
          <p className="text-[9px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-2">Total Paid Out</p>
          <h3 className="text-lg md:text-3xl font-bold text-white">€{totalPaid.toLocaleString()}</h3>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-3xl p-3 md:p-6">
          <p className="text-[9px] md:text-sm font-medium text-gray-500 mb-0.5 md:mb-2">Pending Payouts</p>
          <h3 className="text-lg md:text-3xl font-bold text-white">€{totalPending.toLocaleString()}</h3>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-3xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-0.5 md:mb-2">
            <p className="text-[9px] md:text-sm font-medium text-gray-500">Next Payout</p>
            <Settings className="w-3 h-3 md:w-4 md:h-4 text-gray-500 cursor-pointer" onClick={() => {
              if (kycStatus !== 'verified') {
                appToast('Please complete KYC verification to configure payout schedules.');
                navigate('/setup');
              } else {
                setIsScheduleModalOpen(true);
              }
            }} />
          </div>
          <h3 className="text-lg md:text-3xl font-bold text-white">Weekly</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          <input 
            type="text"
            placeholder="Search by ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl md:rounded-2xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white/5 border border-white/5 rounded-xl md:rounded-2xl py-2.5 md:py-3 px-4 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none min-w-[120px] md:min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="canceled">Canceled</option>
            <option value="failed">Failed</option>
          </select>
          <button className="p-2.5 md:p-3 bg-white/5 text-gray-400 hover:text-white rounded-xl md:rounded-2xl border border-white/5 transition-colors">
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Arrival Date</th>
                <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Description</th>
                <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 md:px-6 py-4 md:py-6"><div className="h-4 md:h-5 bg-white/5 rounded w-16 md:w-20"></div></td>
                    <td className="px-4 md:px-6 py-4 md:py-6"><div className="h-6 md:h-8 bg-white/5 rounded-full w-20 md:w-24"></div></td>
                    <td className="px-4 md:px-6 py-4 md:py-6 hidden sm:table-cell"><div className="h-4 md:h-5 bg-white/5 rounded w-24 md:w-32"></div></td>
                    <td className="px-4 md:px-6 py-4 md:py-6 hidden lg:table-cell"><div className="h-4 md:h-5 bg-white/5 rounded w-40 md:w-48"></div></td>
                    <td className="px-4 md:px-6 py-4 md:py-6"><div className="h-6 md:h-8 bg-white/5 rounded-xl w-6 md:w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredPayouts.length > 0 ? (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 md:px-6 py-4 md:py-6">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl shrink-0 ${payout.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {payout.amount > 0 ? <ArrowDownLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs md:text-base">€{(payout.amount / 100).toFixed(2)}</p>
                          <p className="text-[8px] md:text-[10px] text-gray-500 font-mono uppercase tracking-tighter truncate max-w-[80px] md:max-w-none">{payout.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6">
                      <div className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold capitalize ${getStatusColor(payout.status)}`}>
                        <span className="shrink-0">{getStatusIcon(payout.status)}</span>
                        <span className="hidden sm:inline">{payout.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-white font-medium">
                          {new Date(payout.arrival_date * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[8px] md:text-[10px] text-gray-500">Expected arrival</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6 hidden lg:table-cell">
                      <p className="text-xs md:text-sm text-gray-400 truncate max-w-[200px]">
                        {payout.description || `Payout via ${payout.method}`}
                      </p>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6 text-right">
                      <button className="p-1.5 md:p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg md:rounded-xl transition-all">
                        <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 md:px-6 py-12 md:py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center">
                        <ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base md:text-lg">No payouts found</p>
                        <p className="text-gray-500 text-xs md:text-sm">When you receive funds from Stripe, they will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payout Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Manual Payout</h2>
                <p className="text-gray-400 text-sm">Transfer funds from your Stripe balance to your bank account immediately.</p>
              </div>

              <div className="p-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Amount (EUR)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="number"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 ml-1">Minimum payout amount is €1.00</p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Processing Fee</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-medium">€0.50 min</span>
                      <button 
                        onClick={() => navigate('/fees-plans')}
                        className="p-0.5 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Info className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5">
                    <span className="text-gray-400">Total Transfer</span>
                    <span className="text-white">€{createAmount ? (Math.max(0, Number(createAmount) - 0.5)).toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCreatePayout}
                  disabled={isSubmitting || !createAmount || Number(createAmount) < 1}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                >
                  {isSubmitting ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      Confirm Payout
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      {userId && (
        <PayoutScheduleModal 
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={() => {
            // Refresh data or show success toast
            fetchPayouts();
          }}
          userId={userId}
        />
      )}
    </div>
  );
};
