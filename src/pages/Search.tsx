import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  CheckCircle2,
  CircleDollarSign,
  Command,
  Grid2X2,
  Layers3,
  Loader2,
  Package,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { WhatsNewModal } from '../components/WhatsNewModal';
import { MarketplaceProductCard } from '../components/ui/cards/MarketplaceProductCard';
import {
  searchWerseeStore,
  StoreSearchCategory,
  StoreSearchResult,
} from '../services/storeSearchService';

type SortMode = 'fit' | 'rating' | 'popular';

const CATEGORIES: Array<{ id: StoreSearchCategory; label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'Education', label: 'Education' },
  { id: 'Digital', label: 'Digital' },
  { id: '3D Assets', label: '3D Assets' },
  { id: 'Physical', label: 'Physical' },
  { id: 'Services', label: 'Services' },
  { id: 'Community', label: 'Community' },
  { id: 'Apps', label: 'Apps' },
  { id: 'Extensions', label: 'Extensions' },
];

const isStoreSearchCategory = (value: string | null): value is StoreSearchCategory =>
  CATEGORIES.some((category) => category.id === value);

const formatPrice = (price: number) => {
  if (!price) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
};

const CategoryIcon = ({ category, className }: { category: StoreSearchCategory; className: string }) => {
  switch (category) {
    case 'Education':
      return <BookOpen className={className} />;
    case 'Digital':
      return <Box className={className} />;
    case '3D Assets':
      return <Box className={className} />;
    case 'Physical':
      return <Package className={className} />;
    case 'Services':
      return <CircleDollarSign className={className} />;
    case 'Community':
      return <Users className={className} />;
    case 'Apps':
      return <Command className={className} />;
    case 'Extensions':
      return <Layers3 className={className} />;
    case 'All':
    default:
      return <Grid2X2 className={className} />;
  }
};

const ResultTypeIcon = ({ result, className }: { result: StoreSearchResult; className: string }) => {
  if (result.isOfficial) return <BadgeCheck className={className} />;
  if (result.kind === 'app') return <Command className={className} />;
  if (result.kind === 'extension') return <Layers3 className={className} />;
  if (result.category === 'Education' || result.type === 'community' || result.type === 'course') {
    return <BookOpen className={className} />;
  }
  if (['digital', 'virtual', 'bundle', 'asset_3d'].includes(result.type) || result.category === '3D Assets') return <Box className={className} />;
  if (['service', 'services'].includes(result.type)) return <CircleDollarSign className={className} />;
  return <Package className={className} />;
};

const SkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="h-[372px] rounded-lg border border-white/8 bg-white/[0.03] p-3"
  >
    <div className="h-44 animate-pulse rounded-md bg-white/8" />
    <div className="mt-5 h-3 w-20 animate-pulse rounded-full bg-white/8" />
    <div className="mt-4 h-5 w-4/5 animate-pulse rounded-full bg-white/8" />
    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white/8" />
    <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
    <div className="mt-8 flex justify-between">
      <div className="h-5 w-16 animate-pulse rounded-full bg-white/8" />
      <div className="h-5 w-20 animate-pulse rounded-full bg-white/8" />
    </div>
  </motion.div>
);

const SearchResultCard = ({
  result,
  index,
  isBestMatch,
}: {
  result: StoreSearchResult;
  index: number;
  isBestMatch: boolean;
}) => {
  if (result.kind === 'listing') {
    return <MarketplaceProductCard listing={result.raw || result} href={result.href} surface="search" />;
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.24), duration: 0.28 }}
      className="group h-full"
    >
      <Link
        to={result.href}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-white/8 bg-[#101010] shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-[#141414]"
      >
        <div className="relative aspect-[16/11] overflow-hidden bg-[#171717]">
          <img
            src={result.image}
            alt={result.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.68),rgba(0,0,0,0.08),rgba(0,0,0,0.18))]" />

          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-white/12 bg-black/45 px-2.5 py-1.5 backdrop-blur-xl">
            <ResultTypeIcon result={result} className="h-3.5 w-3.5 text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-normal text-white">{result.category}</span>
          </div>

          {isBestMatch && (
            <div className="absolute right-3 top-3 rounded-md border border-emerald-300/20 bg-emerald-400/14 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 backdrop-blur-xl">
              Best match
            </div>
          )}

          {result.isOfficial && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-blue-300/20 bg-blue-500/16 px-2.5 py-1.5 text-[11px] font-semibold text-blue-100 backdrop-blur-xl">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-400">{result.subtitle}</p>
              <h2 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight tracking-normal text-white">
                {result.title}
              </h2>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/8 bg-white/[0.04] text-gray-300 transition group-hover:border-white/18 group-hover:text-white">
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </div>

          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-gray-400">{result.description}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {result.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-gray-300"
              >
                {reason}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-white/8 pt-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-normal text-gray-500">Score</p>
              <p className="mt-1 text-lg font-semibold text-white">{result.score}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {result.rating > 0 ? result.rating.toFixed(1) : 'New'}
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-300">{formatPrice(result.price)}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  const initialCategory = isStoreSearchCategory(categoryParam) ? categoryParam : 'All';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState<StoreSearchCategory>(initialCategory);
  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('fit');

  useEffect(() => {
    setSearchTerm(queryParam);
    setActiveCategory(initialCategory);
  }, [queryParam, initialCategory]);

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await searchWerseeStore(searchTerm, activeCategory);
        if (!cancelled) setResults(data);
      } catch (error) {
        console.error('Search failed', error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const debounce = window.setTimeout(fetchResults, 260);
    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
    };
  }, [searchTerm, activeCategory]);

  const sortedResults = useMemo(() => {
    const ordered = [...results];
    if (sortMode === 'rating') {
      return ordered.sort((a, b) => b.rating - a.rating || b.score - a.score || b.popularity - a.popularity);
    }
    if (sortMode === 'popular') {
      return ordered.sort((a, b) => b.popularity - a.popularity || b.score - a.score || b.rating - a.rating);
    }
    return ordered.sort((a, b) => b.score - a.score || b.rating - a.rating || b.popularity - a.popularity);
  }, [results, sortMode]);

  const resultSummary = useMemo(() => {
    const top = sortedResults[0];
    if (!top) return 'No matches yet';
    return `${sortedResults.length} result${sortedResults.length === 1 ? '' : 's'} sorted for ${sortMode}`;
  }, [sortedResults, sortMode]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (activeCategory !== 'All') params.set('category', activeCategory);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleCategoryChange = (category: StoreSearchCategory) => {
    setActiveCategory(category);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (category !== 'All') params.set('category', category);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
  };

  return (
    <PageWrapper className="min-h-screen bg-black">
      <SEO
        title={searchTerm ? `${searchTerm} on Wersee` : 'Search Wersee Store'}
        description="Search Wersee for courses, digital products, physical products, services, apps and extensions."
        url={searchTerm ? `/search?q=${encodeURIComponent(searchTerm)}` : '/search'}
      />
      <WhatsNewModal context="store" />

      <main className="min-h-screen bg-[#050505] pt-20 text-white">
        <section className="border-b border-white/8 bg-[#080808]/92 px-4 pb-8 pt-8 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/18 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Verified Store
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                  Search Wersee
                </h1>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Store className="h-4 w-4 text-gray-500" />
                <span>{loading ? 'Searching...' : resultSummary}</span>
              </div>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <div className="flex min-h-[64px] items-center gap-3 rounded-lg border border-white/12 bg-white/[0.06] px-4 shadow-[0_18px_60px_rgba(0,0,0,0.38)] transition focus-within:border-blue-300/40 focus-within:bg-white/[0.08]">
                <SearchIcon className="h-5 w-5 shrink-0 text-blue-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products, courses, apps..."
                  className="h-full min-w-0 flex-1 bg-transparent text-lg font-medium tracking-normal text-white outline-none placeholder:text-gray-500"
                  autoFocus
                />
                <AnimatePresence>
                  {searchTerm && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setSearchTerm('')}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/8 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/8 bg-white/[0.04] text-gray-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Toggle filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-5 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2">
                {CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold tracking-normal transition ${
                        isActive
                          ? 'border-white bg-white text-black'
                          : 'border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      <CategoryIcon category={category.id} className="h-4 w-4" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-5">
                    {[
                      { id: 'fit', label: 'Best fit' },
                      { id: 'rating', label: 'Top rated' },
                      { id: 'popular', label: 'Popular' },
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        type="button"
                        onClick={() => setSortMode(sort.id as SortMode)}
                        className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition ${
                          sortMode === sort.id
                            ? 'border-white bg-white text-black'
                            : 'border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div>
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching Wersee
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonCard key={index} index={index} />
                ))}
              </div>
            </div>
          ) : sortedResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedResults.map((result, index) => (
                <SearchResultCard
                  key={`${result.kind}-${result.id}`}
                  result={result}
                  index={index}
                  isBestMatch={sortMode === 'fit' && index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04]">
                <SearchIcon className="h-7 w-7 text-gray-500" />
              </div>
              <h2 className="text-2xl font-semibold tracking-normal text-white">No results found</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Try another search term or switch to all categories.
              </p>
              <button
                type="button"
                onClick={() => handleCategoryChange('All')}
                className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Show all
              </button>
            </div>
          )}
        </section>
      </main>
    </PageWrapper>
  );
};
