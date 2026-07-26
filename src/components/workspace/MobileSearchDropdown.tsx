import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';

interface MobileSearchDropdownProps {
  isOpen: boolean;
  searchQuery: string;
  results: any[];
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (item: any) => void;
  onSubmit: () => void;
}

type SearchCategory = 'all' | 'businesses' | 'products' | 'communities';

export const MobileSearchDropdown: React.FC<MobileSearchDropdownProps> = ({
  isOpen,
  searchQuery,
  results,
  onClose,
  onQueryChange,
  onSelect,
  onSubmit,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<SearchCategory>('all');

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const filteredResults = results.filter((item) => {
    if (activeCategory === 'all') return true;
    return item._workspaceSearchType === activeCategory;
  });

  const categories: { id: SearchCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'businesses', label: 'Businesses' },
    { id: 'products', label: 'Products' },
    { id: 'communities', label: 'Communities' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-search-title"
          className="fixed inset-0 z-[999] flex flex-col bg-[#0A0A0A]/98 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-3xl lg:hidden"
        >
          <div className="flex min-h-[68px] items-center gap-3 border-b border-white/[0.07] px-4">
            <Search className="h-5 w-5 shrink-0 text-indigo-300" aria-hidden="true" />
            <label id="workspace-search-title" className="sr-only" htmlFor="workspace-mobile-search">Search workspace</label>
            <input
              id="workspace-mobile-search"
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchQuery.trim()) onSubmit();
              }}
              placeholder="Search your workspace"
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl px-2 text-sm font-semibold text-white/65 transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="no-scrollbar flex shrink-0 snap-x gap-2 overflow-x-auto border-b border-white/[0.05] px-4 py-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                className={`h-11 shrink-0 snap-start rounded-full px-5 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-white text-black'
                    : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {!searchQuery.trim() ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-white">Find anything in your workspace</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/45">Search businesses, products, communities and workspace tools.</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="mx-auto max-w-2xl space-y-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Matches</span>
                  <span className="text-xs text-white/35">{filteredResults.length} found</span>
                </div>
                {filteredResults.map((item) => {
                  const label = item.name || item.title;
                  const type = item._workspaceSearchType === 'businesses'
                    ? 'Business'
                    : item._workspaceSearchType === 'communities'
                      ? 'Community'
                      : 'Product';
                  return (
                    <button
                      key={`${type}-${item.id}`}
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex min-h-[68px] w-full items-center gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.99]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/65">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          label?.charAt(0)?.toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{label}</span>
                        <span className="mt-1 block text-xs text-white/40">{type}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onSubmit}
                  className="mt-4 flex min-h-12 w-full items-center justify-center rounded-[18px] bg-white text-sm font-semibold text-black"
                >
                  Search all workspace results
                </button>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-white">No matches found</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/45">Try another name, or search all workspace tools.</p>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="mt-5 min-h-12 rounded-xl bg-white px-5 text-sm font-semibold text-black"
                >
                  Search workspace
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
