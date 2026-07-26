import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { LoadingState } from '../ui/LoadingState';
import { useLocation, useNavigate } from 'react-router-dom';

export const MoneyBalanceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalanceAndTransactions();
  }, []);

  const fetchBalanceAndTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: functionError } = await supabase.functions.invoke('finance-api', {
        body: { action: 'overview' },
      });
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      setBalance(data?.balance || { available: [], pending: [] });
      setTransactions(data?.transactions || []);

    } catch (err: any) {
      console.error('Error fetching balance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Fetching your balance and transactions..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Could not load balance</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const available = balance?.available?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
  const pending = balance?.pending?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
  const currency = balance?.available?.[0]?.currency?.toUpperCase() || 'EUR';

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Balance</h1>
          <p className="text-xs md:text-sm text-gray-400">View your current balance and upcoming payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate({ pathname: location.pathname, search: '?tab=overview&view=money-payouts' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 text-white border border-white/10 rounded-xl md:rounded-2xl font-bold hover:bg-white/10 transition-all text-sm"
          >
            <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            View Payouts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {/* Available Balance */}
        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-[2.5rem] p-3 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-6">
            <div className="p-1.5 md:p-3 bg-emerald-500/10 rounded-lg md:rounded-2xl">
              <Wallet className="w-3.5 h-3.5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <span className="text-[9px] md:text-sm font-medium text-gray-400">Available to pay out</span>
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg md:text-4xl font-bold text-white">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(available / 100)}
            </h2>
            <p className="text-emerald-400 text-[8px] md:text-sm flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" /> Ready to be transferred
            </p>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-[2.5rem] p-3 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-6">
            <div className="p-1.5 md:p-3 bg-amber-500/10 rounded-lg md:rounded-2xl">
              <Clock className="w-3.5 h-3.5 md:w-6 md:h-6 text-amber-400" />
            </div>
            <span className="text-[9px] md:text-sm font-medium text-gray-400">Pending</span>
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg md:text-4xl font-bold text-white">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(pending / 100)}
            </h2>
            <p className="text-amber-400 text-[8px] md:text-sm flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" /> On the way to your available balance
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#141414] border border-white/5 rounded-xl md:rounded-[2.5rem] p-4 md:p-8">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-sm md:text-xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 md:w-5 md:h-5 text-indigo-400" />
            Recent Transactions
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 md:py-12 border border-white/5 rounded-xl md:rounded-2xl bg-white/[0.02]">
            <ArrowRightLeft className="w-8 h-8 md:w-12 md:h-12 text-gray-600 mx-auto mb-2 md:mb-4" />
            <h3 className="text-xs md:text-lg font-medium text-white mb-1">No transactions yet</h3>
            <p className="text-[9px] md:text-sm text-gray-500">When you make a sale, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 md:p-4 rounded-lg md:rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="p-1.5 md:p-3 bg-emerald-500/10 rounded-lg md:rounded-xl">
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-base font-bold text-white line-clamp-1">{t.listings?.title || 'Unknown Product'}</h3>
                    <p className="text-[8px] md:text-sm text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()} · Stripe + Wersee verified
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] md:text-base font-bold text-emerald-400">
                    +{new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency || 'EUR' }).format(t.net_amount ?? t.amount ?? 0)}
                  </p>
                  <p className="text-[8px] text-gray-500">Net amount</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
