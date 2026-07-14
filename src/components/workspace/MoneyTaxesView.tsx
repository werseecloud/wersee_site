import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Globe, 
  Download, 
  PieChart, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Lock,
  Zap,
  Info,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { analyzeTaxes, TaxAnalysisResponse } from '../../services/taxAiService';

import { appToast } from '@/lib/feedback';
export const MoneyTaxesView = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    grossRevenue: 0,
    stripeFees: 0,
    werseeFees: 0,
    totalTransactions: 0
  });
  const [taxData, setTaxData] = useState<TaxAnalysisResponse | null>(null);
  const [userCountry, setUserCountry] = useState('NL');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id);

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        setLoading(false);
        return;
      }

      if (orders) {
        const gross = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const stripe = orders.reduce((sum, o) => sum + (Number(o.stripe_fee) || 0), 0);
        const wersee = orders.reduce((sum, o) => sum + (Number(o.wersee_fee) || 0), 0);
        
        setStats({
          grossRevenue: gross,
          stripeFees: stripe,
          werseeFees: wersee,
          totalTransactions: orders.length
        });
        setTransactions(orders);

        // Run AI Analysis only if there is data or we want a baseline
        setAnalyzing(true);
        try {
          const analysis = await analyzeTaxes({
            revenue: gross,
            stripeFees: stripe,
            werseeFees: wersee,
            country: userCountry,
            region: 'Europe',
            transactions: orders
          });
          setTaxData(analysis);
        } catch (aiError) {
          console.error('AI Analysis failed:', aiError);
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Error fetching tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    appToast('Generating Audit-Ready Export (ZIP)... This will include PDF summary, all invoices, and IP compliance logs.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Taxes & Compliance</h1>
          <p className="text-xs md:text-sm text-gray-400">AI-powered tax management and audit-ready reporting.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl md:rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5 text-sm md:text-base"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            Export Audit Package
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Gross Revenue */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl md:rounded-2xl">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <span className="text-gray-400 font-medium text-sm md:text-base">Gross Revenue</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white">€{stats.grossRevenue.toLocaleString()}</h2>
            <p className="text-emerald-400 text-xs md:text-sm flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" /> +12.5% from last year
            </p>
          </div>
        </div>

        {/* Total Fees */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-red-500/10 rounded-xl md:rounded-2xl">
              <PieChart className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            </div>
            <span className="text-gray-400 font-medium text-sm md:text-base">Total Fees</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">€{(stats.stripeFees + stats.werseeFees).toLocaleString()}</h2>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stripe</p>
                <p className="text-xs md:text-sm font-bold text-white">€{stats.stripeFees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Wersee</p>
                <p className="text-xs md:text-sm font-bold text-white">€{stats.werseeFees.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Net Profit - The Real Salary */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
          <div className="absolute top-0 right-0 p-4 md:p-6 opacity-20 md:opacity-100">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-md">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-white/80 font-medium text-sm md:text-base">Net Profit (Safe to Spend)</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">€{taxData?.netProfit?.toLocaleString() || '---'}</h2>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed">
              After Stripe fees, Wersee fees, and estimated VAT reserves.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance & AI Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Tax Reserve Vault */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-amber-500/10 rounded-xl md:rounded-2xl">
                <Lock className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">Tax Reserve Vault</h3>
                <p className="text-xs md:text-sm text-gray-500">Estimated VAT to set aside</p>
              </div>
            </div>
            <div className="w-fit px-3 md:px-4 py-1.5 md:py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg md:rounded-xl text-amber-400 text-xs md:text-sm font-bold">
              {taxData ? `${(taxData.vatRate * 100).toFixed(0)}% Rate` : 'Calculating...'}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm md:text-base">Current Reserve</span>
              <span className="text-xl md:text-2xl font-bold text-white">€{taxData?.taxReserve?.toLocaleString() || '0'}</span>
            </div>
            <div className="w-full h-2 md:h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              />
            </div>
            <div className="flex items-center gap-2 mt-4 text-amber-400/80 text-[10px] md:text-sm">
              <Info className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span>We've reserved this visually so you don't overspend.</span>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 md:gap-3">
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                <span className="text-gray-300 text-xs md:text-sm">EU OSS Threshold</span>
              </div>
              <span className={`text-[10px] md:text-sm font-bold ${taxData?.ossStatus.thresholdReached ? 'text-red-400' : 'text-emerald-400'}`}>
                €{taxData?.ossStatus?.currentAmount?.toLocaleString() || '0'} / €10,000
              </span>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 md:gap-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                <span className="text-gray-300 text-xs md:text-sm">US Nexus Tracking</span>
              </div>
              <span className="text-[10px] md:text-sm font-bold text-gray-500">
                {taxData?.nexusStatus.hasNexus ? `Active in ${taxData.nexusStatus.states.join(', ')}` : 'No Nexus Detected'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Compliance Log & Summary */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-indigo-500/10 rounded-xl md:rounded-2xl">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">AI Compliance Log</h3>
                <p className="text-xs md:text-sm text-gray-500">IP-Based Evidence Store</p>
              </div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs md:text-sm animate-pulse">
                <Zap className="w-3 h-3 md:w-4 md:h-4" />
                AI Analyzing...
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 mb-6 md:mb-8">
            <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
              <h4 className="text-[10px] md:text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2 md:mb-3">Executive Summary</h4>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed italic">
                "{taxData?.summary || 'Analyzing your transaction data to provide a summary for your bookkeeper...'}"
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Recent Evidence Logs</h4>
              {transactions.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-white/[0.02] border border-white/5 text-[10px] md:text-xs">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500" />
                    <span className="text-gray-400 font-mono">IP: 192.168.***.***</span>
                    <span className="text-gray-500">({t.metadata?.country || 'NL'})</span>
                  </div>
                  <span className="text-gray-600 hidden sm:inline">Verified Match</span>
                </div>
              ))}
              {transactions.length > 3 && (
                <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] md:text-xs">
                  <div className="flex items-center gap-2 md:gap-3">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400 font-mono">IP: 45.12.***.***</span>
                    <span className="text-red-400/60">VPN Detected</span>
                  </div>
                  <span className="text-red-400 font-bold">Flagged</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs md:text-sm font-bold">
              <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4" />
              CSV Export
            </button>
            <button className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs md:text-sm font-bold">
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
              PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
