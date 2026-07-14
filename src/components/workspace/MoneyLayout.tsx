import React, { useState, useEffect } from 'react';
import { MobileMoneyDashboard } from './MobileMoneyDashboard';
import { MobileMoneyPayouts } from './MobileMoneyPayouts';
import { MobileMoneySubscriptions } from './MobileMoneySubscriptions';
import { MobileMoneyInvoices } from './MobileMoneyInvoices';
import { MobileMoneyInsights } from './MobileMoneyInsights';
import { MobileMoneyMethods } from './MobileMoneyMethods';
import { MobileMoneySetup } from './MobileMoneySetup';
import { MobileMoneyPoints } from './MobileMoneyPoints';
import { MobileMoneyBottomNav } from './MobileMoneyBottomNav';
import { MobileMoneyNav } from './MobileMoneyNav';
import { 
  DollarSign, 
  Wallet, 
  CreditCard,
  ArrowRightLeft, 
  PieChart, 
  Link as LinkIcon, 
  Repeat, 
  Tag, 
  FileText, 
  BarChart3, 
  Receipt,
  Settings,
  ChevronRight,
  Bitcoin,
  Sparkles,
  Clock,
  FileSignature,
  TrendingUp,
  Search,
  X,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseService } from '../../services/databaseService';

interface MoneyLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  isStripeComplete?: boolean;
  businessId?: string;
}

export const MoneyLayout: React.FC<MoneyLayoutProps> = ({ children, activeView, onNavigate, isStripeComplete, businessId }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Load last active view
    const loadPreferences = async () => {
      if (!businessId) return;
      try {
        const prefs = await DatabaseService.get('user_preferences', {
          eq: { user_id: (await DatabaseService.getAuthUser())?.id },
          maybeSingle: true
        });
        if (prefs?.last_active_money_view && prefs.last_active_money_view !== activeView) {
          onNavigate(prefs.last_active_money_view);
        }
      } catch (error) {
        console.error('Error loading money preferences:', error);
      }
    };
    loadPreferences();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save last active view
  useEffect(() => {
    const savePreference = async () => {
      const user = await DatabaseService.getAuthUser();
      if (!user) return;
      try {
        await DatabaseService.upsert('user_preferences', {
          user_id: user.id,
          last_active_money_view: activeView,
          updated_at: new Date().toISOString()
        }, 'user_id');
      } catch (error) {
        console.error('Error saving money preference:', error);
      }
    };
    if (activeView) savePreference();
  }, [activeView]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'banking', label: 'Banking' },
    { id: 'sales', label: 'Sales' },
    { id: 'legal', label: 'Legal' },
    { id: 'rewards', label: 'Rewards' },
  ];

  const menuItems = [
    { id: 'money-setup', label: 'Set up', icon: Settings, hideIfComplete: true, category: 'banking' },
    { id: 'money-seller', label: 'Seller Setup', icon: ShieldCheck, category: 'banking' },
    { id: 'money-methods', label: 'Payment Methods', icon: CreditCard, category: 'banking' },
    { id: 'money-balance', label: 'Balance', icon: Wallet, category: 'banking' },
    { id: 'money-investments', label: 'Investments', icon: TrendingUp, category: 'banking' },
    { id: 'money-invest', label: 'Wersee Invest', icon: TrendingUp, category: 'banking' },
    { id: 'money-points', label: 'Wersee Points', icon: Sparkles, category: 'rewards' },
    { id: 'money-payouts', label: 'Payouts', icon: ArrowRightLeft, category: 'banking' },
    { id: 'money-splits', label: 'Splits', icon: PieChart, category: 'banking' },
    { id: 'money-links', label: 'Quick Links', icon: LinkIcon, category: 'sales' },
    { id: 'money-subscriptions', label: 'Subscriptions', icon: Repeat, category: 'sales' },
    { id: 'money-proposals', label: 'Proposals', icon: FileSignature, category: 'legal' },
    { id: 'money-contracts', label: 'Contracts', icon: FileText, category: 'legal' },
    { id: 'money-coupons', label: 'Coupons & Discounts', icon: Tag, category: 'sales' },
    { id: 'money-taxes', label: 'Taxes', icon: FileText, category: 'legal' },
    { id: 'money-afterpay', label: 'Afterpay', icon: Clock, category: 'sales' },
    { id: 'money-insights', label: 'Insights', icon: BarChart3, category: 'rewards' },
    { id: 'money-invoices', label: 'Invoices', icon: Receipt, category: 'sales' },
    { id: 'money-pos', label: 'POS', icon: BarChart3, category: 'sales' },
    { id: 'money-crypto', label: 'Crypto', icon: Bitcoin, category: 'banking' },
  ].filter(item => !(item.hideIfComplete && isStripeComplete));

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isMobile) {
    let content;
    if (activeView === 'money-balance') {
      content = <MobileMoneyDashboard activeView={activeView} onNavigate={onNavigate} />;
    } else if (activeView === 'money-payouts') {
      content = <MobileMoneyPayouts onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-subscriptions') {
      content = <MobileMoneySubscriptions onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-invoices') {
      content = <MobileMoneyInvoices onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-insights') {
      content = <MobileMoneyInsights onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-methods') {
      content = <MobileMoneyMethods onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-setup') {
      content = <MobileMoneySetup onBack={() => onNavigate('money-balance')} />;
    } else if (activeView === 'money-points') {
      content = <MobileMoneyPoints onBack={() => onNavigate('money-balance')} />;
    } else {
      content = (
        <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 bg-[#0A0A0A] text-white h-full relative">
          {children}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-[#0A0A0A]">
        <MobileMoneyNav menuItems={menuItems} activeView={activeView} onNavigate={onNavigate} businessId={businessId} />
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto scrollbar-hide"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
        <MobileMoneyBottomNav activeView={activeView} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full w-full bg-[#0A0A0A] overflow-hidden">
      {/* Desktop Secondary Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0A0A0A] border-r border-white/5 flex-col shrink-0 z-10 h-full">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Money</h2>
            </div>
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className={`p-2 rounded-lg transition-all ${isSearching ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Financial overview</p>
        </div>

        {/* Search Bar (Desktop) */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 py-2 border-b border-white/5 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/50 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pills */}
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-white text-black shadow-lg shadow-white/5' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide no-scrollbar p-3 space-y-0.5">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 bg-[#0A0A0A] overflow-y-auto scrollbar-hide no-scrollbar p-4 md:p-8 relative ${isMobile ? 'pb-24' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
