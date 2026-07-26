import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Package, Sparkles, FileText, X, Users, Globe, Megaphone, Calculator, Smartphone, Box, Layers } from 'lucide-react';
import { useListingWizard } from '../context/ListingWizardContext';
import { useTheme } from '../context/ThemeContext';
import { SellerAccountSetup, useSellerDeclaration } from './SellerAccountSetup';

interface CreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDropdown = ({ isOpen, onClose }: CreateDropdownProps) => {
  const { openWizard } = useListingWizard();
  const { user, loading: declarationLoading, declared, markDeclared } = useSellerDeclaration(isOpen);

  const options = [
    {
      id: 'job',
      title: 'Job / Vacancy',
      description: 'Hire employees or post ads',
      icon: Briefcase,
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      id: 'product',
      title: 'Physical Product',
      description: 'Sell tangible items like electronics or furniture',
      icon: Package,
      color: 'bg-orange-500/20 text-orange-400',
    },
    {
      id: 'service',
      title: 'Service',
      description: 'Offer services like web design or consulting',
      icon: Sparkles,
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      id: 'digital',
      title: 'Digital Product',
      description: 'Sell courses, e-books, or software',
      icon: FileText,
      color: 'bg-green-500/20 text-green-400',
    },
    {
      id: 'asset_3d',
      title: '3D Asset',
      description: 'Sell models, textures, rigs or asset packs',
      icon: Box,
      color: 'bg-sky-500/20 text-sky-400',
    },
    {
      id: 'virtual',
      title: 'Virtual Item',
      description: 'Sell in-game items, skins, or currency',
      icon: Sparkles,
      color: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'community',
      title: 'Paid Community',
      description: 'Start a paid community or group',
      icon: Users,
      color: 'bg-pink-500/20 text-pink-400',
    },
    {
      id: 'bundle',
      title: 'Bundle',
      description: 'Sell multiple products as one offer',
      icon: Layers,
      color: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'pos_item',
      title: 'POS Item',
      description: 'Add a product to your POS systems',
      icon: Calculator,
      color: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'affiliate',
      title: 'Affiliate Product',
      description: 'Promote external products via link',
      icon: Globe,
      color: 'bg-teal-500/20 text-teal-400',
    },
    {
      id: 'announcement',
      title: 'Announcement',
      description: 'Share news or updates with a link',
      icon: Megaphone,
      color: 'bg-red-500/20 text-red-400',
    },
  ];

  const handleSelect = (id: string) => {
    onClose();
    openWizard(id as any);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm"
          />

          {/* Dropdown Menu */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[9999] bottom-0 left-0 right-0 sm:bottom-auto sm:top-[80px] sm:left-auto sm:right-8 sm:w-[520px] rounded-t-[3.5rem] sm:rounded-[3rem] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] border-t sm:border overflow-hidden origin-bottom sm:origin-top-right flex flex-col max-h-[92vh] sm:max-h-[85vh] bg-[#0A0A0B] border-white/10"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-full flex justify-center pt-5 pb-2">
              <div className="w-16 h-1.5 rounded-full bg-white/10" />
            </div>

            <div className="p-8 sm:p-10 border-b flex justify-between items-start shrink-0 bg-white/[0.02] border-white/5">
              <div>
                <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none text-white">
                  Create <span className="text-blue-500">Something</span>
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-3 text-gray-500">
                  Select your masterpiece type
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-4 rounded-[2rem] transition-all active:scale-90 border bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {user && (declarationLoading || !declared) ? (
              declarationLoading ? (
                <div className="flex min-h-64 items-center justify-center text-sm font-bold text-gray-500">Checking your seller account…</div>
              ) : (
                <SellerAccountSetup onComplete={markDeclared} />
              )
            ) : <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className="w-full flex items-center gap-5 p-5 rounded-[2.5rem] transition-all text-left group active:scale-[0.96] relative overflow-hidden border bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20 shadow-xl"
                  >
                    <div className="absolute -top-4 -right-4 p-4 opacity-0 group-hover:opacity-5 transition-all duration-500 group-hover:scale-150 text-white">
                      <option.icon className="w-20 h-20" />
                    </div>
                    
                    <div className={`relative z-10 p-4 rounded-[1.5rem] ${option.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl`}>
                      <option.icon className="w-7 h-7" />
                    </div>
                    
                    <div className="min-w-0 relative z-10">
                      <h4 className="font-black italic uppercase tracking-tight text-sm sm:text-base leading-tight break-words group-hover:translate-x-1 transition-transform text-white">
                        {option.title}
                      </h4>
                      <p className="text-[10px] leading-tight font-bold uppercase tracking-wider mt-1 opacity-60 line-clamp-1">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Install App Section */}
              <div className="p-8 rounded-[3rem] relative overflow-hidden group border transition-all hover:scale-[1.02] bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border-blue-500/20 shadow-2xl shadow-blue-500/10">
                <div className="absolute -top-10 -right-10 p-10 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000">
                  <Smartphone className="w-40 h-40" />
                </div>
                
                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black italic uppercase tracking-tighter text-2xl leading-none mb-2 text-white">
                        Wersee <span className="text-blue-500">Mobile</span>
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">
                        The ultimate experience
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={onClose} 
                      className="flex-1 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border text-gray-400 border-white/10 hover:bg-white/5"
                    >
                      Later
                    </button>
                    <button className="flex-[2] px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 bg-white text-black hover:bg-gray-200 shadow-white/10">
                      Install App
                    </button>
                  </div>
                </div>
              </div>
            </div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
