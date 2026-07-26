import React from 'react';
import { Calendar, FileText, Layout, CheckSquare, MessageSquare, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface PortalSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  business: any;
  userRole: string;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({ activeTab, setActiveTab, business, userRole }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calls', label: 'Calls', icon: MessageSquare },
  ];

  return (
    <aside className="w-20 md:w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col h-full shrink-0 z-50">
      {/* Wersee Logo */}
      <div className="p-6 border-b border-white/5 flex items-center justify-center md:justify-start gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-black text-xl">W</span>
        </div>
        <span className="hidden md:block text-white font-black text-xl tracking-tighter uppercase">Wersee</span>
      </div>

      {/* Business Logo Section */}
      <div className="p-6 flex flex-col items-center md:items-start gap-4">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-500/10">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-black text-2xl">
              {business?.name?.charAt(0)}
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <h3 className="text-sm font-bold text-white truncate w-40">{business?.name}</h3>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{userRole}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'group-hover:text-white'}`} />
              <span className="hidden md:block text-sm font-bold">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-5 h-5" />
          <span className="hidden md:block text-sm font-bold">Settings</span>
        </button>
        <button className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="hidden md:block text-sm font-bold">Exit Portal</span>
        </button>
      </div>
    </aside>
  );
};
