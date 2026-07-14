import React, { useRef, useState, useEffect } from 'react';
import { LucideIcon, ChevronLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

interface MobileMoneyNavProps {
  menuItems: MenuItem[];
  activeView: string;
  onNavigate: (view: string) => void;
  businessId?: string;
}

export const MobileMoneyNav: React.FC<MobileMoneyNavProps> = ({ menuItems, activeView, onNavigate, businessId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessName, setBusinessName] = useState('Workspace');

  useEffect(() => {
    const fetchBusinessName = async () => {
      if (!businessId) return;
      const { data } = await supabase.from('businesses').select('name').eq('id', businessId).single();
      if (data) setBusinessName(data.name);
    };
    fetchBusinessName();
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
      {/* Navigation & Search Mobile */}
      <div className="px-4 py-3 flex items-center gap-2 min-h-[56px]">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="search-input"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 w-full bg-white/5 rounded-full px-4 py-2 border border-white/10"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search tabs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-500"
              />
              <button onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}>
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </motion.div>
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
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <motion.button
                        key={`money-nav-${item.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border shrink-0 ${
                          isActive 
                            ? 'bg-white/10 text-white border-white/20' 
                            : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results Overlay */}
      <AnimatePresence>
        {isSearching && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-0 top-full h-[calc(100vh-100%)] bg-[#0A0A0A] z-50 overflow-y-auto p-6"
          >
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Search Results</h3>
              {filteredItems.length > 0 ? (
                <div className="grid gap-3">
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={`money-search-${item.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsSearching(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                            <Icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                          </div>
                          <span className="font-bold text-white">{item.label}</span>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                          <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 rotate-180" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
