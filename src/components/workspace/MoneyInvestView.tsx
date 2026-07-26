import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Shield, Zap, Scale, Info, ChevronRight, X,
  ArrowUpRight, ArrowDownRight, Wallet, Lock, Unlock, 
  PieChart, BarChart3, Activity, Globe, Rocket, Target,
  CheckCircle2, AlertCircle, Sparkles, RefreshCcw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { StockMarketView } from './StockMarketView';
import { RaiseCapitalView } from './RaiseCapitalView';
import { appToast } from '@/lib/feedback';

const performanceData = [
  { date: 'Mar 26', balance: 10000, profit: 200 },
  { date: 'Mar 27', balance: 10200, profit: 150 },
  { date: 'Mar 28', balance: 10350, profit: 300 },
  { date: 'Mar 29', balance: 10650, profit: 450 },
  { date: 'Mar 30', balance: 11100, profit: 400 },
  { date: 'Mar 31', balance: 11500, profit: 600 },
  { date: 'Apr 01', balance: 12100, profit: 350 },
  { date: 'Apr 02', balance: 12450, profit: 1240 },
];

const dailyProfitData = [
  { date: 'Mon', profit: 120 },
  { date: 'Tue', profit: 150 },
  { date: 'Wed', profit: 90 },
  { date: 'Thu', profit: 210 },
  { date: 'Fri', profit: 180 },
  { date: 'Sat', profit: 250 },
  { date: 'Sun', profit: 240 },
];

const activeInvestments = [
  { id: 1, name: 'Crypto Pool', type: 'Crypto', amount: 4500, roi: '+12.5%', status: 'Active', icon: Globe },
  { id: 2, name: 'SaaS Deals', type: 'Equity', amount: 3200, roi: '+8.2%', status: 'Active', icon: Rocket },
  { id: 3, name: 'Creator Funds', type: 'Revenue Share', amount: 2800, roi: '+15.4%', status: 'Active', icon: Target },
  { id: 4, name: 'Ads Arbitrage', type: 'Marketing', amount: 1950, roi: '+22.1%', status: 'Active', icon: Zap },
];

const strategies = [
  { 
    id: 'safe', 
    name: 'Safe', 
    roi: '3-5%', 
    risk: 'Low', 
    desc: 'Conservative approach focusing on capital preservation.', 
    icon: Shield,
    color: 'emerald'
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    roi: '8-12%', 
    risk: 'Medium', 
    desc: 'A mix of stability and growth potential.', 
    icon: Scale,
    color: 'blue'
  },
  { 
    id: 'aggressive', 
    name: 'Aggressive', 
    roi: '20-35%', 
    risk: 'High', 
    desc: 'High-risk, high-reward strategy for maximum growth.', 
    icon: Zap,
    color: 'purple'
  },
];

export const MoneyInvestView = () => {
  const [activeTab, setActiveTab] = useState<'invest' | 'market' | 'raise'>('invest');
  const [isStarted, setIsStarted] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [profitPercentage, setProfitPercentage] = useState(20);
  const [agreedToMargin, setAgreedToMargin] = useState(false);
  
  const [werseeControl, setWerseeControl] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');
  const [allocation, setAllocation] = useState(75);
  const [reinvest, setReinvest] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [performance, setPerformance] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [minProfitRequired] = useState(500);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchInvestData();
  }, []);

  const fetchInvestData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only Stripe + Supabase reconciled sales count as eligible profit.
      const { data: overview } = await supabase.functions.invoke('finance-api', {
        body: { action: 'overview' },
      });
      const profit = (overview?.transactions || []).reduce(
        (sum: number, order: any) => sum + Number(order.net_amount ?? order.amount ?? 0),
        0,
      );
      setTotalProfit(profit);

      // 2. Fetch Settings
      const { data: settings } = await supabase
        .from('wersee_invest_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        setIsStarted(settings.is_active);
        setProfitPercentage(settings.profit_percentage);
        setWerseeControl(settings.wersee_control ?? true);
        setSelectedStrategy(settings.strategy);
        setAllocation(settings.allocation);
        setReinvest(settings.reinvest);
        setIsLocked(settings.is_locked);
      }

      // 3. Fetch Performance
      const { data: perfData } = await supabase
        .from('wersee_invest_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (perfData && perfData.length > 0) {
        setPerformance(perfData.map(p => ({
          date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          balance: p.balance,
          profit: p.profit
        })));
      } else {
        setPerformance([]);
      }

      // 4. Fetch Pools
      const { data: poolsData } = await supabase
        .from('wersee_invest_pools')
        .select('*')
        .eq('status', 'Active');

      if (poolsData && poolsData.length > 0) {
        setPools(poolsData);
      } else {
        setPools([]);
      }

    } catch (error) {
      console.error('Error fetching invest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActivating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        user_id: user.id,
        is_active: true,
        profit_percentage: profitPercentage,
        wersee_control: werseeControl,
        strategy: selectedStrategy,
        allocation,
        reinvest,
        is_locked: false,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('wersee_invest_settings')
        .upsert(settingsData);

      if (error) throw error;

      setIsStarted(true);
      setShowWizard(false);
    } catch (error) {
      console.error('Error activating Wersee Invest:', error);
      appToast(error instanceof Error ? error.message : 'Wersee Invest could not be activated');
    } finally {
      setActivating(false);
    }
  };

  const handleToggleControl = async (val: boolean) => {
    setWerseeControl(val);
    if (isStarted) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('wersee_invest_settings')
          .update({ wersee_control: val })
          .eq('user_id', user.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <AnimatePresence mode="wait">
          {!showWizard ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                  <TrendingUp className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Wersee Invest</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Let your money work for you automatically. Our AI-driven strategies allocate your funds to high-yield opportunities in real-time.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { step: 1, title: 'Create Account', desc: 'Set up your dedicated investment sub-account.', icon: Wallet },
                  { step: 2, title: 'Grant Control', desc: 'Enable Wersee AI to manage and allocate funds.', icon: Shield },
                  { step: 3, title: 'Choose Strategy', desc: 'Select a risk profile that matches your goals.', icon: Target },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group"
                  >
                    <div className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                      0{item.step}
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                      <item.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center">
                {totalProfit < minProfitRequired ? (
                  <div className="w-full max-w-md p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-center space-y-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Minimum Profit Required</h3>
                    <p className="text-sm text-amber-200/60 leading-relaxed">
                      To apply for Wersee Invest, you must have earned at least <span className="text-white font-bold">€{minProfitRequired}</span> in total profit. 
                      Your current profit is <span className="text-white font-bold">€{totalProfit.toFixed(2)}</span>.
                    </p>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (totalProfit / minProfitRequired) * 100)}%` }}
                        className="h-full bg-amber-500"
                      />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">
                      {Math.floor((totalProfit / minProfitRequired) * 100)}% Complete
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWizard(true)}
                    className="px-12 py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center gap-3"
                  >
                    Start Investing
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                
                <div className="mt-8 flex items-center gap-2 text-gray-500 text-xs uppercase tracking-widest font-bold">
                  <Shield className="w-4 h-4" />
                  Secured by Wersee Risk Engine
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        s <= wizardStep ? 'w-8 bg-blue-500' : 'w-4 bg-white/10'
                      }`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setShowWizard(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {wizardStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-3xl font-black mb-4">Profit Allocation</h2>
                      <p className="text-gray-400">Choose what percentage of your future profits should be automatically moved to your investment account.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Allocation Amount</span>
                        <span className="text-4xl font-black text-blue-400">{profitPercentage}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        step="5"
                        value={profitPercentage}
                        onChange={(e) => setProfitPercentage(parseInt(e.target.value))}
                        className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>Conservative (5%)</span>
                        <span>Aggressive (100%)</span>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                      <Info className="w-6 h-6 text-blue-400 shrink-0" />
                      <p className="text-sm text-blue-200/60 leading-relaxed">
                        This only applies to new profits earned through the platform. Your existing balance remains untouched unless you manually transfer it.
                      </p>
                    </div>

                    <button
                      onClick={() => setWizardStep(2)}
                      className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-100 transition-all active:scale-95"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {wizardStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-3xl font-black mb-4">Legal Agreement</h2>
                      <p className="text-gray-400">Please review and accept our investment terms and fee structure.</p>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <h4 className="font-bold text-white">1. Service Fee (Margin)</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Wersee charges a performance-based margin of 1-2% on successful investment returns. This fee is used to maintain the AI infrastructure and risk engine. No fees are charged on your principal capital.
                        </p>
                        
                        <h4 className="font-bold text-white">2. Automated Management</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          By clicking "I Agree", you grant Wersee the authority to automatically allocate your funds into various investment pools based on your selected strategy.
                        </p>

                        <h4 className="font-bold text-white">3. Risk Disclosure</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Investments carry inherent risks. While our AI aims to maximize returns and minimize losses, capital loss is possible. Past performance does not guarantee future results.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div 
                        onClick={() => setAgreedToMargin(!agreedToMargin)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          agreedToMargin ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'
                        }`}
                      >
                        {agreedToMargin && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-sm text-gray-400 leading-relaxed">
                        I agree to the 1-2% performance margin and understand the risks associated with automated investing.
                      </span>
                    </label>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="flex-1 py-5 bg-white/5 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all"
                      >
                        Back
                      </button>
                      <button
                        disabled={!agreedToMargin}
                        onClick={() => setWizardStep(3)}
                        className={`flex-[2] py-5 rounded-2xl font-black text-lg transition-all ${
                          agreedToMargin ? 'bg-white text-black hover:bg-gray-100 active:scale-95' : 'bg-white/10 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        Accept & Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {wizardStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 text-center"
                  >
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-12 h-12 text-emerald-400" />
                    </div>
                    
                    <div>
                      <h2 className="text-3xl font-black mb-4">Ready to Grow?</h2>
                      <p className="text-gray-400">Your account is ready. We will start allocating {profitPercentage}% of your future profits into the "Balanced" strategy by default.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Allocation</div>
                        <div className="text-xl font-black text-white">{profitPercentage}%</div>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Margin Fee</div>
                        <div className="text-xl font-black text-white">1-2%</div>
                      </div>
                    </div>

                    <button
                      onClick={handleActivate}
                      disabled={activating}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                    >
                      {activating ? 'Activating…' : 'Activate Wersee Invest'}
                    </button>
                    
                    <button
                      onClick={() => setWizardStep(2)}
                      className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
                    >
                      Review Terms Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-24 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-gray-500 leading-relaxed">
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Legal Notice
          </h4>
          <p>
            By activating Wersee Invest, you grant Wersee permission to automatically manage and allocate your funds across various investment vehicles. 
            Investing involves risk, including the possible loss of principal. Past performance is not indicative of future results. 
            Wersee uses AI-driven strategies to mitigate risk, but does not guarantee specific returns. 
            You maintain full control and can disable "Wersee Control" at any time to stop new allocations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Investment Hub</h1>
          </div>
          <div className="flex items-center gap-2 mt-4 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
            {[
              { id: 'invest', label: 'Wersee Invest', icon: Zap },
              { id: 'market', label: 'Stock Market', icon: Globe },
              { id: 'raise', label: 'Raise Capital', icon: Rocket },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-lg shadow-white/5' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'invest' && (
          <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl">
            <div className="text-right">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Balance</div>
              <div className="text-3xl font-black text-white">€12,450.23</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Monthly Growth</div>
              <div className="text-xl font-black text-emerald-400 flex items-center justify-end gap-1">
                +€1,240
                <span className="text-xs font-bold">(+10%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'invest' ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Control Panel */}
              <div className="lg:col-span-2 space-y-8">
                {/* Wersee Control Toggle */}
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-xl font-black mb-2">Wersee Control</h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        When enabled, Wersee automatically allocates and manages your funds across the ecosystem.
                      </p>
                    </div>
                    <button
                      onClick={() => setWerseeControl(!werseeControl)}
                      className={`w-20 h-10 rounded-full p-1 transition-all duration-300 ${werseeControl ? 'bg-blue-600' : 'bg-white/10'}`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-white shadow-lg transition-transform duration-300 flex items-center justify-center ${werseeControl ? 'translate-x-10' : 'translate-x-0'}`}>
                        {werseeControl ? <Zap className="w-4 h-4 text-blue-600" /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                      </div>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-8 relative z-10">
                    {strategies.map((strat) => (
                      <button
                        key={strat.id}
                        onClick={() => setSelectedStrategy(strat.id)}
                        className={`p-5 rounded-3xl border transition-all text-left group ${
                          selectedStrategy === strat.id 
                            ? `bg-${strat.color}-500/10 border-${strat.color}-500/50` 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${
                          selectedStrategy === strat.id ? `bg-${strat.color}-500 text-white` : 'bg-white/5 text-gray-400'
                        }`}>
                          <strat.icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black uppercase tracking-widest text-[10px]">{strat.name}</span>
                          <span className={`text-xs font-bold ${selectedStrategy === strat.id ? `text-${strat.color}-400` : 'text-gray-500'}`}>
                            {strat.roi} ROI
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 mb-3">{strat.risk} Risk</div>
                        <p className="text-[10px] text-gray-400 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                          {strat.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Auto Allocation</span>
                      </div>
                      <span className="text-xl font-black text-white">{allocation}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      value={allocation}
                      onChange={(e) => setAllocation(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      <span>10% Balance</span>
                      <span>100% Balance</span>
                    </div>
                  </div>
                </div>

                {/* Performance Dashboard */}
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-black">Performance</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                      {['1W', '1M', '3M', '1Y', 'ALL'].map((t) => (
                        <button key={t} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${t === '1M' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performance}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#4B5563" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#4B5563" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `€${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff', fontSize: '12px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorBalance)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {[
                      { label: 'Total Invested', value: '€10,000.00', icon: Wallet, color: 'blue' },
                      { label: 'Total Profit', value: '€2,450.23', icon: TrendingUp, color: 'emerald' },
                      { label: 'Active Deals', value: '12', icon: Rocket, color: 'purple' },
                      { label: 'Avg. ROI', value: '14.2%', icon: BarChart3, color: 'orange' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className={`w-8 h-8 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center mb-3`}>
                          <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-lg font-black text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Active Investments & Actions */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <h3 className="text-xl font-black mb-6">Manage Funds</h3>
                  <div className="space-y-4">
                    <button className="w-full py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95">
                      <Unlock className="w-5 h-5" />
                      Withdraw Funds
                    </button>
                    <button 
                      onClick={() => setIsLocked(!isLocked)}
                      className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 border ${
                        isLocked ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      {isLocked ? 'Funds Locked (12% Yield)' : 'Lock Funds for Yield Boost'}
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <RefreshCcw className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Auto Re-invest</span>
                      </div>
                      <button
                        onClick={() => setReinvest(!reinvest)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${reinvest ? 'bg-blue-600' : 'bg-white/10'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${reinvest ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      {reinvest ? 'Profits are automatically added back to your principal for compound growth.' : 'Profits are moved to your main balance for withdrawal.'}
                    </p>
                  </div>
                </div>

                {/* Active Investments */}
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black">Active Pools</h3>
                    <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">View All</button>
                  </div>
                  <div className="space-y-4">
                    {pools.map((pool) => {
                      const Icon = pool.icon || Globe;
                      return (
                        <div key={pool.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{pool.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{pool.type}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-emerald-400">{pool.roi || '+0.0%'}</div>
                              <div className="text-[10px] text-gray-500 font-bold">ROI</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="text-[10px] font-bold text-gray-400">€{(pool.amount || 0).toLocaleString()}</div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{pool.status || 'Active'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights Card */}
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Sparkles className="w-8 h-8 text-white/50 mb-4" />
                  <h4 className="text-lg font-black text-white mb-2">Smart Allocation Active</h4>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    Wersee AI just rebalanced your portfolio to capitalize on a SaaS deal surge. Expected ROI boost: +1.2%.
                  </p>
                  <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all">
                    View AI Logs
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'market' ? (
            <StockMarketView />
          ) : (
            <RaiseCapitalView />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-24 left-4 right-4 z-50">
        <button className="w-full py-4 bg-white text-black rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95">
          <TrendingUp className="w-5 h-5" />
          Manage Wersee Invest
        </button>
      </div>
    </div>
  );
};
