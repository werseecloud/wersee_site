import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileSearchDropdownProps {
  isOpen: boolean;
  searchQuery: string;
  results: any[];
  onClose: () => void;
  onSelect: (item: any) => void;
}

type SearchCategory = 'all' | 'businesses' | 'products' | 'communities';

export const MobileSearchDropdown: React.FC<MobileSearchDropdownProps> = ({
  isOpen,
  searchQuery,
  results,
  onClose,
  onSelect
}) => {
  const [activeCategory, setActiveCategory] = React.useState<SearchCategory>('all');

  const filteredResults = results.filter(item => {
    if (activeCategory === 'all') return true;
    const type = item.name ? (item.slug ? 'businesses' : 'communities') : 'products';
    return type === activeCategory;
  });

  const categories: { id: SearchCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'businesses', label: 'Businesses' },
    { id: 'products', label: 'Products' },
    { id: 'communities', label: 'Communities' },
  ];

  return (
    <AnimatePresence>
      {isOpen && searchQuery.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-[80px] left-4 right-4 bg-[#0F0F0F]/95 backdrop-blur-3xl border border-white/10 z-[999] shadow-[0_30px_90px_rgba(0,0,0,0.9)] rounded-[2.5rem] overflow-hidden md:hidden flex flex-col"
        >
          {/* Tabs */}
          <div className="px-4 pt-4 pb-2 border-b border-white/5 overflow-x-auto flex items-center gap-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-white text-black' 
                    : 'bg-white/5 text-gray-500 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                {activeCategory === 'all' ? 'Search Results' : `${activeCategory} Results`}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{filteredResults.length} found</span>
            </div>

            {filteredResults.map((item) => {
              const label = item.name || item.title;
              const type = item.name ? (item.slug ? 'Business' : 'Community') : 'Product';
              
              return (
                <motion.button
                  key={`${type}-${item.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onSelect(item)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] active:scale-[0.98] transition-all hover:bg-white/[0.08] group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-indigo-500/50 transition-all shrink-0 overflow-hidden shadow-lg">
                    {item.image_url ? (
                      <img src={item.image_url} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-sm font-black">{label?.charAt(0)}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">{type}</span>
                      {item.price && (
                        <span className="text-[9px] text-emerald-400 font-bold">${item.price}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.button>
              );
            })}

            {filteredResults.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Search className="w-8 h-8 text-gray-700" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">No matches found</h4>
                <p className="text-[10px] text-gray-500 mt-2 max-w-[200px] mx-auto leading-relaxed">We couldn't find anything matching "{searchQuery}" in your workspace.</p>
              </div>
            )}
          </div>
          
          {/* Bottom Action */}
          <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
            <button 
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Close Search
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
