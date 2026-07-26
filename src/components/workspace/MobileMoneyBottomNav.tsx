import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, PieChart, CreditCard, Settings, Sparkles, TrendingUp } from 'lucide-react';

interface MobileMoneyBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export const MobileMoneyBottomNav: React.FC<MobileMoneyBottomNavProps> = ({ activeView, onNavigate }) => {
  const navItems = [
    { id: 'money-balance', icon: Wallet, label: 'Wallet' },
    { id: 'money-investments', icon: TrendingUp, label: 'Invest' },
    { id: 'money-points', icon: Sparkles, label: 'Points' },
    { id: 'money-insights', icon: PieChart, label: 'Stats' },
    { id: 'money-methods', icon: CreditCard, label: 'Cards' },
    { id: 'money-setup', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-[#0A0A0A]/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between relative overflow-hidden h-16">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center flex-1 h-full relative z-10"
              >
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`} />
                </motion.div>
                
                <span className={`text-[7px] font-black uppercase tracking-widest mt-1 transition-all ${isActive ? 'text-white opacity-100' : 'text-gray-600 opacity-60'}`}>
                  {item.label}
                </span>

                <AnimatePresence>
                  {isActive && (
                    <>
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                      />
                    </>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
