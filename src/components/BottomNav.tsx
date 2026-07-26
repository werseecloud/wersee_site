import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, ShoppingBag, LayoutDashboard, Search, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { CreateDropdown } from './CreateDropdown';
import { hapticFeedback } from '../lib/haptics';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navItems = [
    { icon: ShoppingBag, label: 'Shop', path: '/' },
    { icon: Search, label: 'Explore', path: '/search' },
    { icon: user ? Plus : User, label: user ? 'Create' : 'Login', isAction: true },
    { icon: LayoutDashboard, label: 'Work', path: '/workspace/overview' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 pointer-events-none" aria-label="Main navigation">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-[#0A0A0A]/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between relative overflow-hidden" role="menubar">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {navItems.map((item, index) => {
              const isActive = item.path ? location.pathname === item.path : false;
              
              if (item.isAction) {
                return (
                  <button
                    key="action"
                    aria-label={user ? 'Create new listing' : 'Log in'}
                    onClick={() => {
                      hapticFeedback('medium');
                      if (user) {
                        setIsCreateOpen(true);
                      } else {
                        navigate('/auth');
                      }
                    }}
                    className="relative group flex items-center justify-center h-14 w-14 rounded-[1.8rem] bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <div className="absolute inset-0 rounded-[1.8rem] bg-gradient-to-br from-white to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {user ? <Plus className="h-7 w-7 relative z-10" /> : <User className="h-7 w-7 relative z-10" />}
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path!}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    if (!isActive) hapticFeedback('light');
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 h-14 transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-2xl",
                    isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <item.icon className="h-6 w-6" />
                  </motion.div>
                  
                  <AnimatePresence>
                    {isActive && (
                      <>
                        <motion.div 
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"
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
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <CreateDropdown isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
};
