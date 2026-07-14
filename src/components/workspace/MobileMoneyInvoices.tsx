import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
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
  ArrowLeft,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';

interface MobileMoneyInvoicesProps {
  onBack: () => void;
}

export const MobileMoneyInvoices: React.FC<MobileMoneyInvoicesProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const handleOpenWizard = () => navigate('/builder/invoice');
    window.addEventListener('open-invoice-wizard', handleOpenWizard);
    return () => window.removeEventListener('open-invoice-wizard', handleOpenWizard);
  }, [navigate]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-emerald-400 bg-emerald-500/10';
      case 'open': return 'text-blue-400 bg-blue-500/10';
      case 'sent': return 'text-indigo-400 bg-indigo-500/10';
      case 'draft': return 'text-gray-400 bg-white/5';
      case 'void': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-white/5';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight">Invoices</h2>
        </div>
        <button 
          onClick={fetchInvoices}
          className="p-2.5 bg-white/5 rounded-full border border-white/5"
        >
          <RefreshCcw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Invoices</h3>
            <span className="text-[10px] font-bold text-gray-600">{filteredInvoices.length} total</span>
          </div>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
            ))
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map((inv, i) => (
              <motion.div 
                key={inv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/10">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{inv.customer_name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">{inv.invoice_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">
                    {inv.currency === 'eur' ? '€' : inv.currency === 'usd' ? '$' : '£'}
                    {inv.amount.toFixed(2)}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <FileText className="w-10 h-10 text-gray-700 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">No invoices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-30">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/builder/invoice')}
          className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40 border border-white/20"
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.button>
      </div>
    </div>
  );
};
