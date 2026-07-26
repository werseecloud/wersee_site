import React, { useRef, useState, useEffect } from 'react';
import { LucideIcon, ChevronLeft, Search, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

interface MobileManagementNavProps {
  menuItems: MenuItem[];
  activeView: string;
  onNavigate: (view: string) => void;
  businessId?: string;
}

export const MobileManagementNav: React.FC<MobileManagementNavProps> = ({ menuItems, activeView, onNavigate, businessId }) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessName, setBusinessName] = useState('Workspace');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) return;
      
      // Fetch current business name
      const { data: currentBiz } = await supabase.from('businesses').select('name').eq('id', businessId).single();
      if (currentBiz) setBusinessName(currentBiz.name);

      // Fetch all user businesses
      const { data: userBizs } = await supabase.from('businesses').select('*').order('name');
      if (userBizs) setBusinesses(userBizs);
    };
    fetchData();
  }, [businessId]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="md:hidden sticky top-0 z-20 w-full max-w-full flex-shrink-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 overflow-x-hidden">
      {/* Top Bar */}
      <div className="relative border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 text-white transition-colors group"
          >
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight truncate max-w-[200px]">{businessName}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Business Selector Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full bg-[#141414] border-b border-white/10 z-[200] shadow-2xl overflow-hidden"
              >
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        window.location.href = `/workspace/${biz.id}${user ? `?user=${user.id}` : ''}`;
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors rounded-lg ${
                        biz.id === businessId ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white font-black text-lg shadow-inner">
                        {biz.name.charAt(0)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`font-black text-sm ${biz.id === businessId ? 'text-white' : 'text-gray-400'}`}>
                          {biz.name}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {biz.id === businessId ? 'Current Workspace' : 'Switch to Workspace'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation & Search Mobile */}
      <div className="px-4 py-3 flex flex-col gap-2 min-h-[56px] relative">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <div className="w-full">
              <motion.div 
                key="search-input"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 w-full bg-white/5 rounded-2xl px-4 py-3 border border-white/10 shadow-inner group focus-within:border-indigo-500/50 transition-all"
              >
                <Search className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search tools & tabs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600 font-medium"
                />
                <button 
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-white" />
                </button>
              </motion.div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchQuery.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 mx-4 bg-[#141414]/95 backdrop-blur-2xl border border-white/10 z-[200] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
                  >
                    <div className="max-h-[60vh] overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => {
                          const Icon = item.icon;
                          const isActive = activeView === item.id;
                          return (
                            <motion.button
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => {
                                onNavigate(item.id);
                                setIsSearching(false);
                                setSearchQuery('');
                              }}
                              className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all text-left group ${
                                isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl transition-colors ${
                                isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-500 group-hover:text-white group-hover:bg-white/10'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</span>
                                {item.category && (
                                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black mt-0.5">{item.category}</span>
                                )}
                              </div>
                            </motion.button>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center">
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-gray-700" />
                          </div>
                          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No results found</p>
                          <p className="text-[10px] text-gray-600 mt-1">Try searching for something else</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              key="tabs-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 w-full overflow-hidden"
            >
              <button 
                onClick={() => setIsSearching(true)}
                className="p-2.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 border border-white/5"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <div 
                ref={scrollRef}
                className="overflow-x-auto scrollbar-hide flex items-center gap-2 cursor-grab active:cursor-grabbing no-scrollbar w-full"
                onMouseDown={(e) => handleMouseDown(e, scrollRef)}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={(e) => handleMouseMove(e, scrollRef)}
                onTouchStart={(e) => handleTouchStart(e, scrollRef)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={(e) => handleTouchMove(e, scrollRef)}
              >
                <div className="flex items-center gap-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all border shrink-0 group relative overflow-hidden ${
                          isActive 
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                            : 'text-gray-400 border-white/5 bg-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="active-tab-glow"
                            className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-50"
                          />
                        )}
                        <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-white'}`} />
                        <span className="text-xs font-black uppercase tracking-widest relative z-10">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
