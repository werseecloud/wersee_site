import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingBag, Briefcase, Bell, Wallet, 
  CreditCard, Shield, HelpCircle, Settings, LogOut,
  ChevronRight, Sparkles, Star, Zap, GraduationCap, Compass, BookOpen, School
} from 'lucide-react';

interface MobileMoreOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const MobileMoreOptions: React.FC<MobileMoreOptionsProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  onLogout
}) => {
  const menuItems = [
    { 
      id: 'joined-products', 
      label: 'Joined Listings', 
      desc: 'View your purchased items',
      icon: ShoppingBag, 
      color: 'bg-orange-500/20 text-orange-400',
      badge: 'New'
    },
    { 
      id: 'management-products', 
      label: 'Management & Growth', 
      desc: 'Manage your listings and growth',
      icon: Briefcase, 
      color: 'bg-blue-500/20 text-blue-400' 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      desc: 'View your latest alerts',
      icon: Bell, 
      color: 'bg-indigo-500/20 text-indigo-400' 
    },
    { 
      id: 'money-balance', 
      label: 'Finance', 
      desc: 'Finances and payouts',
      icon: Wallet, 
      color: 'bg-emerald-500/20 text-emerald-400' 
    },
    { 
      id: 'plans', 
      label: 'Plans', 
      desc: 'Manage your subscription',
      icon: CreditCard, 
      color: 'bg-purple-500/20 text-purple-400' 
    },
    { 
      id: 'safety-legal', 
      label: 'Safety & Legal', 
      desc: 'Help, safety and compliance',
      icon: Shield, 
      color: 'bg-amber-500/20 text-amber-400' 
    },
    { 
      id: 'help', 
      label: 'Help Center', 
      desc: 'Get support and documentation',
      icon: HelpCircle, 
      color: 'bg-cyan-500/20 text-cyan-400' 
    },
    { 
      id: 'profile', 
      label: 'Account Settings', 
      desc: 'Manage your profile',
      icon: Settings, 
      color: 'bg-gray-500/20 text-gray-400' 
    },
  ];

  const eduItems = [
    { 
      id: 'edu-student', 
      label: 'Student Discount', 
      desc: 'Get 50% off Wersee Pro',
      icon: GraduationCap, 
      color: 'bg-indigo-500/20 text-indigo-400' 
    },
    { 
      id: 'edu-campus', 
      label: 'Campus Program', 
      desc: 'Partner your school with us',
      icon: School, 
      color: 'bg-purple-500/20 text-purple-400' 
    },
    { 
      id: 'edu-paths', 
      label: 'Learning Paths', 
      desc: 'Expert roadmaps for growth',
      icon: Compass, 
      color: 'bg-emerald-500/20 text-emerald-400' 
    },
    { 
      id: 'edu-resources', 
      label: 'Edu Resources', 
      desc: 'Guides, templates & more',
      icon: BookOpen, 
      color: 'bg-amber-500/20 text-amber-400' 
    },
  ];

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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md lg:hidden"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex max-h-[92vh] flex-col overflow-hidden rounded-t-[3rem] border-t border-white/10 bg-[#0F0F0F] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:hidden"
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
              <div className="w-16 h-1.5 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="px-8 pt-10 pb-6 shrink-0">
              <h3 className="text-4xl font-black text-white tracking-tight leading-none mb-2">Management</h3>
              <p className="text-lg text-gray-400 font-medium leading-tight max-w-[280px]">Manage your digital listings, services, and courses.</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2 custom-scrollbar">
              <div className="px-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">General</span>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-8">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="group relative w-full flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] active:scale-[0.98] transition-all hover:bg-white/[0.06] hover:border-white/10"
                  >
                    <div className={`p-3.5 rounded-2xl ${item.color} shadow-lg transition-transform group-hover:scale-110`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-base tracking-tight">{item.label}</h4>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-[8px] font-black uppercase text-white tracking-tighter">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>

              <div className="px-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Education</span>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-8">
                {eduItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + menuItems.length) * 0.05 }}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="group relative w-full flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] active:scale-[0.98] transition-all hover:bg-white/[0.06] hover:border-white/10"
                  >
                    <div className={`p-3.5 rounded-2xl ${item.color} shadow-lg transition-transform group-hover:scale-110`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-base tracking-tight">{item.label}</h4>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>

              {/* Pro Feature Teaser */}
              <div className="mt-6 p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Sparkles className="w-16 h-16 text-indigo-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Premium Access</span>
                  </div>
                  <h4 className="text-lg font-black text-white mb-1">Unlock Pro Tools</h4>
                  <p className="text-xs text-indigo-200/60 mb-4 leading-relaxed">Get advanced analytics, custom branding, and priority support for your business.</p>
                  <button 
                    onClick={() => { onNavigate('plans'); onClose(); }}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>

              {/* Logout Section */}
              <div className="mt-8 px-2">
                <button 
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase tracking-widest text-xs active:scale-95 transition-all hover:bg-red-500/20"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out Account
                </button>
                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-6 pb-4">
                  Version 2.4.0 • Built with Love
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
