import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Package, BookOpen, Users, ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { identifiers, routes } from '../routing/routes';

const productResultPath = (item: any) => {
  try {
    return routes.userProductBySlug({
      username: identifiers.username(String(item.profiles?.username || '')),
      productSlug: identifiers.productSlug(String(item.slug || '')),
    });
  } catch {
    return routes.productById({ productId: identifiers.productId(String(item.id)) });
  }
};

const creatorResultPath = (item: any) => {
  try {
    return routes.userProfile({ username: identifiers.username(String(item.username || '')) });
  } catch {
    return '/';
  }
};

interface SearchResults {
  products: any[];
  courses: any[];
  creators: any[];
}

interface SearchDropdownProps {
  isOpen: boolean;
  results: SearchResults;
  isLoading: boolean;
  onClose: () => void;
  searchQuery: string;
}

export const SearchDropdown = ({ isOpen, results, isLoading, onClose, searchQuery }: SearchDropdownProps) => {
  if (!isOpen) return null;

  const hasResults = results.products.length > 0 || results.courses.length > 0 || results.creators.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute right-0 top-full mt-3 hidden w-[760px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/95 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:block"
    >
      <div className="border-b border-white/5 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Search Wersee</p>
            <p className="mt-1 truncate text-sm text-gray-300">
              Results for <span className="text-white">"{searchQuery}"</span>
            </p>
          </div>
          {hasResults && !isLoading && (
            <Link
              to={`/search?q=${encodeURIComponent(searchQuery)}`}
              onClick={onClose}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-5 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
            <p className="text-sm font-medium text-gray-400">Searching Wersee...</p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
              <Search className="h-7 w-7 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">No results found</h3>
            <p className="max-w-sm text-sm text-gray-400">Try a different search term or explore the full store.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
                <Package className="h-4 w-4" />
                Products & Services
              </div>
              <div className="space-y-2">
                {results.products.length > 0 ? (
                  results.products.map((item) => (
                    <Link
                      key={item.id}
                      to={productResultPath(item)}
                      onClick={onClose}
                      className="group flex gap-3 rounded-xl p-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                        <img
                          src={item.image_url || item.image || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200'}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-indigo-400">{item.title}</h4>
                        <p className="mb-1 line-clamp-1 text-xs text-gray-400">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">EUR {item.price || 0}</span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            {item.rating || 5.0}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-600">No products found.</p>
                )}
                {results.products.length > 0 && (
                  <Link to="/search?type=digital" onClick={onClose} className="flex items-center gap-2 pt-1 text-xs text-gray-400 transition-colors hover:text-white">
                    View all products <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500">
                <BookOpen className="h-4 w-4" />
                Courses & Academy
              </div>
              <div className="space-y-2">
                {results.courses.length > 0 ? (
                  results.courses.map((item) => (
                    <Link
                      key={item.id}
                      to={productResultPath(item)}
                      onClick={onClose}
                      className="group flex gap-3 rounded-xl p-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amber-500/10">
                        <img
                          src={item.image_url || item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200'}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-amber-500">{item.title}</h4>
                        <p className="mb-1 line-clamp-1 text-xs text-gray-400">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">COURSE</span>
                          <span className="text-[10px] text-gray-500">{item.user_count || 0} students</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-600">No courses found.</p>
                )}
                {results.courses.length > 0 && (
                  <Link to="/search?type=course" onClick={onClose} className="flex items-center gap-2 pt-1 text-xs text-gray-400 transition-colors hover:text-white">
                    Explore Academy <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-500">
                <Users className="h-4 w-4" />
                Creators & Businesses
              </div>
              <div className="space-y-2">
                {results.creators.length > 0 ? (
                  results.creators.map((item) => (
                    <Link
                      key={item.id}
                      to={creatorResultPath(item)}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 transition-colors group-hover:border-purple-500">
                        <img
                          src={item.avatar_url || item.logo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-purple-400">{item.name || item.username}</h4>
                          <CheckCircle2 className="h-3 w-3 text-blue-500" />
                        </div>
                        <p className="truncate text-xs text-gray-400">@{item.username}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-[10px] text-gray-500">{item.follower_count || 0} followers</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-600">No creators found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
