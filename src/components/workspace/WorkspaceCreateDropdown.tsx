import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Store, Package, Users, MessageSquare, Sparkles, 
  Briefcase, ShoppingBag, Wrench, Download, Gamepad2, 
  Monitor, Link, Megaphone, Smartphone, ArrowRight, Box,
  Repeat, Zap, Receipt, Layers
} from 'lucide-react';
import { useListingWizard } from '../../context/ListingWizardContext';
import { SellerAccountSetup, useSellerDeclaration } from '../SellerAccountSetup';

interface WorkspaceCreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: string) => void;
  isAgentMode: boolean;
  setIsAgentMode: (val: boolean) => void;
  onOpenAi: () => void;
}

export const WorkspaceCreateDropdown: React.FC<WorkspaceCreateDropdownProps> = ({ 
  isOpen, onClose, setActiveView, isAgentMode, setIsAgentMode, onOpenAi 
}) => {
  const { openWizard } = useListingWizard();
  const { user, loading: declarationLoading, declared, markDeclared } = useSellerDeclaration(isOpen);

  const options = [
    {
      id: 'subscription',
      title: 'Subscription',
      description: 'Create a recurring payment plan',
      icon: Repeat,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      action: () => { setActiveView('money-subscriptions'); onClose(); }
    },
    {
      id: 'quick-pay',
      title: 'Quick Pay',
      description: 'Generate a one-time payment link',
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      action: () => { setActiveView('money-links'); onClose(); }
    },
    {
      id: 'invoice',
      title: 'Invoice',
      description: 'Send a professional invoice',
      icon: Receipt,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      action: () => { 
        setActiveView('money-invoices'); 
        onClose(); 
        // Small delay to allow view to switch before opening wizard
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-invoice-wizard'));
        }, 100);
      }
    },
    {
      id: 'startup',
      title: 'Startup',
      description: 'Launch a new startup venture',
      icon: Sparkles,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      action: () => { setActiveView('create-business'); onClose(); }
    },
    {
      id: 'business',
      title: 'Business',
      description: 'Register a new business entity',
      icon: Store,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      action: () => { setActiveView('create-business'); onClose(); }
    },
    {
      id: 'job',
      title: 'Job / Vacancy',
      description: 'Hire employees or post ads',
      icon: Briefcase,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      action: () => { openWizard('job'); onClose(); }
    },
    {
      id: 'physical',
      title: 'Physical Product',
      description: 'Sell tangible items like electronics or furniture',
      icon: ShoppingBag,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      action: () => { openWizard('product'); onClose(); }
    },
    {
      id: 'service',
      title: 'Service',
      description: 'Offer services like web design or consulting',
      icon: Wrench,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      action: () => { openWizard('service'); onClose(); }
    },
    {
      id: 'digital',
      title: 'Digital Product',
      description: 'Sell courses, e-books, or software',
      icon: Download,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      action: () => { openWizard('digital'); onClose(); }
    },
    {
      id: 'asset_3d',
      title: '3D Asset',
      description: 'Sell models, textures, rigs, animations or asset packs',
      icon: Box,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      action: () => { openWizard('asset_3d'); onClose(); }
    },
    {
      id: 'bundle',
      title: 'Bundle',
      description: 'Package multiple products into one offer',
      icon: Layers,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      action: () => { openWizard('bundle'); onClose(); }
    },
    {
      id: 'virtual',
      title: 'Virtual Item',
      description: 'Sell in-game items, skins, or currency',
      icon: Gamepad2,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      action: () => { openWizard('virtual'); onClose(); }
    },
    {
      id: 'community',
      title: 'Paid Community',
      description: 'Start a paid community or group',
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      action: () => { openWizard('community'); onClose(); }
    },
    {
      id: 'pos',
      title: 'POS Item',
      description: 'Add a product to your POS systems',
      icon: Monitor,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      action: () => { openWizard('pos_item'); onClose(); }
    },
    {
      id: 'affiliate',
      title: 'Affiliate Product',
      description: 'Promote external products via link',
      icon: Link,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      action: () => { openWizard('affiliate'); onClose(); }
    },
    {
      id: 'announcement',
      title: 'Announcement',
      description: 'Share news or updates with a link',
      icon: Megaphone,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      action: () => { openWizard('announcement'); onClose(); }
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm md:hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[200] bottom-0 left-0 right-0 md:bottom-auto md:top-20 md:right-8 md:w-[480px] md:max-w-[calc(100vw-2rem)] bg-[#141414] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            <div className="md:hidden w-full flex justify-center pt-4 pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">What do you want to post?</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Select an item type to start creating</p>
              </div>
              <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/10 text-gray-400 transition-all active:scale-90 border border-white/5">
                <X className="w-6 h-6" />
              </button>
            </div>

            {user && (declarationLoading || !declared) ? (
              declarationLoading ? (
                <div className="flex min-h-64 items-center justify-center text-sm font-bold text-gray-500">Checking your seller account…</div>
              ) : (
                <SellerAccountSetup onComplete={markDeclared} />
              )
            ) : <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/20 transition-all text-left group active:scale-[0.98] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-10 transition-opacity">
                      <option.icon className="w-12 h-12" />
                    </div>
                    <div className={`p-3 rounded-2xl ${option.bg} ${option.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl`}>
                      <option.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 relative z-10">
                      <h3 className="text-white font-black italic uppercase tracking-tight text-sm group-hover:translate-x-1 transition-transform">{option.title}</h3>
                      <p className="text-[10px] leading-tight text-gray-500 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Install App Section */}
              <div className="mt-6 p-6 rounded-[2rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <Smartphone className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-black italic uppercase tracking-tighter text-xl leading-none mb-1">Install Wersee App</h4>
                      <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.2em]">The best experience awaits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Later</button>
                    <button className="flex-1 sm:flex-none px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl active:scale-95">Install Now</button>
                  </div>
                </div>
              </div>
            </div>}

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between md:hidden">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-sm">W</div>
                 <span className="font-black text-xs tracking-tighter">WERSEE</span>
               </div>
               <button 
                 onClick={() => { setIsAgentMode(!isAgentMode); onClose(); if (!isAgentMode) onOpenAi(); }}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-bold"
               >
                 <Sparkles className="w-3 h-3" />
                 {isAgentMode ? 'Disable AI' : 'Enable AI'}
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
