import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Bot,
  Boxes,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Gift,
  GraduationCap,
  LayoutTemplate,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { appToast } from '../lib/feedback';
import { trackProductConversion } from '../lib/productConversion';
import { formatProductPrice, resolveProductPricing } from '../lib/productOffers';
import {
  readRecentlyViewed,
  rememberRecentlyViewed,
  subscribeToRecentlyViewed,
} from '../lib/recentlyViewed';
import { getPersonalizedFeed } from '../services/algorithmService';
import { identifiers, routes } from '../routing/routes';

type Listing = Record<string, any>;

type CategoryKey = 'all' | 'ai' | 'digital' | 'services' | 'courses' | 'templates' | 'communities';

type CreatorSummary = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  productCount: number;
  score: number;
};

const CATEGORY_DEFINITIONS = [
  { key: 'all' as const, label: 'All products', icon: Compass },
  { key: 'ai' as const, label: 'AI tools', icon: Bot },
  { key: 'digital' as const, label: 'Digital products', icon: Boxes },
  { key: 'services' as const, label: 'Services', icon: BriefcaseBusiness },
  { key: 'courses' as const, label: 'Courses', icon: GraduationCap },
  { key: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
  { key: 'communities' as const, label: 'Communities', icon: UsersRound },
] satisfies Array<{ key: CategoryKey; label: string; icon: React.ComponentType<{ className?: string }> }>;

const listingText = (listing: Listing) => [
  listing.title,
  listing.short_description,
  listing.description,
  listing.type,
  listing.category,
  listing.creator_name,
  listing.metadata?.digitalType,
  listing.metadata?.serviceType,
  listing.metadata?.format,
].filter(Boolean).join(' ').toLowerCase();

const matchesCategory = (listing: Listing, category: CategoryKey) => {
  if (category === 'all') return true;

  const text = listingText(listing);
  const digitalType = String(listing.metadata?.digitalType || '').toLowerCase();

  if (category === 'ai') {
    return /\b(ai|artificial intelligence|gpt|prompt|agent|automation|bot)\b/i.test(text);
  }
  if (category === 'services') {
    return listing.type === 'service' || /\bservice\b/i.test(text);
  }
  if (category === 'courses') {
    return listing.type === 'course' || digitalType === 'course' || /\b(course|class|academy|learning)\b/i.test(text);
  }
  if (category === 'templates') {
    return digitalType === 'template' || /\b(template|preset|mockup|starter kit|asset pack)\b/i.test(text);
  }
  if (category === 'communities') {
    return listing.type === 'community' || /\bcommunit(y|ies)\b/i.test(text);
  }

  return ['digital', 'virtual', 'product', 'apps', 'bundle', 'music'].includes(String(listing.type))
    && !matchesCategory(listing, 'courses')
    && !matchesCategory(listing, 'templates')
    && !matchesCategory(listing, 'ai');
};

const getListingImages = (listing: Listing): string[] => {
  if (Array.isArray(listing.images)) {
    return listing.images
      .filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
      .map((image) => image.trim());
  }
  if (typeof listing.images === 'string') {
    try {
      const parsed = JSON.parse(listing.images);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
          .map((image) => image.trim());
      }
      return listing.images.trim() ? [listing.images.trim()] : [];
    } catch {
      return listing.images.trim() ? [listing.images.trim()] : [];
    }
  }
  return [];
};

const getListingImage = (listing: Listing) => {
  const candidate = [
    getListingImages(listing)[0],
    listing.image_url,
    listing.thumbnail,
  ].find((image) => typeof image === 'string' && image.trim().length > 0);

  return typeof candidate === 'string' ? candidate.trim() : null;
};

const getListingHref = (listing: Listing) => {
  try {
    if (listing.username && listing.slug) {
      return routes.userProductBySlug({
        username: identifiers.username(listing.username),
        productSlug: identifiers.productSlug(listing.slug),
      });
    }
    return routes.productById({ productId: identifiers.productId(String(listing.id)) });
  } catch {
    return '/';
  }
};

const getListingScore = (listing: Listing) => (
  Number(listing.sales || listing.total_sales || 0) * 9
  + Number(listing.views || 0) * 0.25
  + Number(listing.likes_count || 0) * 2
  + Number(listing.comments_count || 0)
  + Number(listing.rating_avg || 0) * 3
  + (listing.is_pro ? 3 : 0)
);

const isDiscoverableListing = (listing: Listing) => (
  listing
  && listing.status === 'published'
  && listing.is_sandbox !== true
  && !listing.deleted_at
  && typeof listing.title === 'string'
  && listing.title.trim().length > 0
  && Boolean(getListingImage(listing))
  && !['job', 'announcement'].includes(String(listing.type))
);

const dedupeListings = (items: Listing[]) => (
  Array.from(new Map(items.filter(Boolean).map((item) => [String(item.id), item])).values())
);

const byNewest = (a: Listing, b: Listing) => (
  new Date(b.published_at || b.created_at || 0).getTime()
  - new Date(a.published_at || a.created_at || 0).getTime()
);

const byPopularity = (a: Listing, b: Listing) => (
  getListingScore(b) - getListingScore(a) || byNewest(a, b)
);

const useHorizontalRail = (itemCount: number) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateBounds = () => {
      const nextState = {
        canScrollLeft: rail.scrollLeft > 2,
        canScrollRight: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2,
      };
      setScrollState((currentState) => (
        currentState.canScrollLeft === nextState.canScrollLeft
        && currentState.canScrollRight === nextState.canScrollRight
          ? currentState
          : nextState
      ));
    };

    const frame = window.requestAnimationFrame(updateBounds);
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(rail);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [itemCount]);

  const updateBounds = () => {
    const rail = railRef.current;
    if (!rail) return;
    const nextState = {
      canScrollLeft: rail.scrollLeft > 2,
      canScrollRight: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2,
    };
    setScrollState((currentState) => (
      currentState.canScrollLeft === nextState.canScrollLeft
      && currentState.canScrollRight === nextState.canScrollRight
        ? currentState
        : nextState
    ));
  };

  const shift = (direction: 'left' | 'right') => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: (direction === 'left' ? -1 : 1) * Math.max(280, rail.clientWidth * 0.78),
      behavior: 'smooth',
    });
  };

  return { railRef, updateBounds, shift, ...scrollState };
};

const ProductArtwork = ({
  listing,
  className,
  priority = false,
}: {
  listing: Listing;
  className: string;
  priority?: boolean;
}) => {
  const image = getListingImage(listing);
  if (!image) return null;

  return (
    <img
      src={image}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
};

const ProductCard = ({
  listing,
  surface = 'home',
}: {
  listing: Listing;
  surface?: 'home' | 'feed';
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const pricing = resolveProductPricing(listing);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void trackProductConversion(String(listing.id), 'impression', surface);
    }, { rootMargin: '120px 0px', threshold: 0.12 });

    observer.observe(card);
    return () => observer.disconnect();
  }, [listing.id, surface]);

  const openProduct = () => {
    rememberRecentlyViewed(String(listing.id));
    void trackProductConversion(String(listing.id), 'click', surface);
  };

  return (
    <motion.article
      ref={cardRef}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="h-[190px] w-[300px] shrink-0 sm:h-[208px] sm:w-[340px]"
    >
      <Link
        to={getListingHref(listing)}
        onClick={openProduct}
        className="group relative block h-full w-full overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#111116] shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition duration-300 hover:border-violet-400/40 hover:shadow-[0_22px_65px_rgba(72,45,140,0.24)]"
      >
        <ProductArtwork listing={listing} className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
            <span className="truncate">{listing.category || listing.type || 'Product'}</span>
            {pricing.isOnSale && <span className="shrink-0 text-violet-200">-{pricing.discountPercent}%</span>}
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-bold tracking-tight text-white">{listing.title}</h3>
              <p className="mt-1 truncate text-xs text-white/55">{listing.creator_name || listing.username || 'Wersee creator'}</p>
            </div>
            <div className="shrink-0 text-right">
              {pricing.isOnSale && (
                <p className="text-[10px] font-semibold text-white/40 line-through">
                  {formatProductPrice(pricing.originalPrice, listing.base_currency || 'EUR')}
                </p>
              )}
              <p className="text-sm font-extrabold text-white">
                {pricing.currentPrice === 0
                  ? 'Free'
                  : formatProductPrice(pricing.currentPrice, listing.base_currency || 'EUR')}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

const HeroProduct = ({ listing, compact = false }: { listing: Listing; compact?: boolean }) => {
  const pricing = resolveProductPricing(listing);
  const openProduct = () => {
    rememberRecentlyViewed(String(listing.id));
    void trackProductConversion(String(listing.id), 'click', 'home');
  };

  return (
    <Link
      to={getListingHref(listing)}
      onClick={openProduct}
      className={`group relative block h-full w-full overflow-hidden border border-white/10 bg-[#111116] shadow-[0_30px_90px_rgba(0,0,0,0.4)] transition duration-500 hover:border-violet-300/40 ${
        compact ? 'rounded-[1.1rem]' : 'rounded-[1.35rem]'
      }`}
    >
      <ProductArtwork
        listing={listing}
        priority={!compact}
        className="absolute inset-0 h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.045]"
      />
      <div className={`absolute inset-0 ${compact ? 'bg-gradient-to-t from-black via-black/20 to-transparent' : 'bg-gradient-to-t from-black via-black/15 to-black/5'}`} />
      <div className={`absolute inset-x-0 bottom-0 ${compact ? 'p-4' : 'p-5 sm:p-7 lg:p-9'}`}>
        {!compact && (
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-violet-200">
            <span>{listing.category || listing.type || 'Product'}</span>
            {Number(listing.rating_avg || 0) > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-white/70">{Number(listing.rating_avg).toFixed(1)}</span>
              </>
            )}
          </div>
        )}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className={`font-black tracking-[-0.035em] text-white ${compact ? 'truncate text-base sm:text-lg' : 'line-clamp-2 text-3xl sm:text-4xl lg:text-[3.2rem]'}`}>
              {listing.title}
            </h2>
            {!compact && (
              <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                {listing.short_description || listing.description || `Created by ${listing.creator_name || listing.username || 'a Wersee creator'}`}
              </p>
            )}
          </div>
          <div className={`flex shrink-0 items-center bg-white font-extrabold text-black shadow-xl ${compact ? 'rounded-full px-3 py-2 text-xs' : 'rounded-full px-4 py-3 text-sm sm:px-5'}`}>
            {pricing.currentPrice === 0
              ? 'Free'
              : formatProductPrice(pricing.currentPrice, listing.base_currency || 'EUR')}
            {!compact && <ArrowUpRight className="ml-2 h-4 w-4" />}
          </div>
        </div>
      </div>
    </Link>
  );
};

const ProductRail = ({ title, items }: { title: string; items: Listing[] }) => {
  const uniqueItems = useMemo(() => dedupeListings(items).slice(0, 18), [items]);
  const { railRef, updateBounds, shift, canScrollLeft, canScrollRight } = useHorizontalRail(uniqueItems.length);

  if (uniqueItems.length === 0) return null;

  return (
    <section className="group/rail relative py-6 sm:py-8" aria-labelledby={`rail-${title.replace(/\W+/g, '-').toLowerCase()}`}>
      <div className="mx-auto mb-4 flex max-w-[1700px] items-end justify-center px-4 text-center sm:px-7 lg:px-10">
        <h2 id={`rail-${title.replace(/\W+/g, '-').toLowerCase()}`} className="text-xl font-bold tracking-[-0.025em] text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          onClick={() => shift('left')}
          disabled={!canScrollLeft}
          className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white opacity-0 shadow-xl backdrop-blur-xl transition hover:bg-white hover:text-black group-hover/rail:opacity-100 focus:opacity-100 disabled:pointer-events-none disabled:opacity-0 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={railRef}
          onScroll={updateBounds}
          className="scrollbar-hide overflow-x-auto pb-4 pt-1"
        >
          <div className="mx-auto flex w-max min-w-full justify-center gap-3 px-4 sm:gap-4 sm:px-7 lg:px-10">
            {uniqueItems.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          onClick={() => shift('right')}
          disabled={!canScrollRight}
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white shadow-xl backdrop-blur-xl transition hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-0 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

const CategoryRail = ({
  activeCategory,
  onSelect,
  availableCounts,
}: {
  activeCategory: CategoryKey;
  onSelect: (category: CategoryKey) => void;
  availableCounts: Record<CategoryKey, number>;
}) => {
  const { railRef, updateBounds, shift, canScrollLeft, canScrollRight } = useHorizontalRail(CATEGORY_DEFINITIONS.length);

  return (
    <section className="group/categories relative py-7 sm:py-9" aria-labelledby="explore-categories">
      <div className="mx-auto mb-4 max-w-[1700px] px-4 text-center sm:px-7 lg:px-10">
        <h2 id="explore-categories" className="text-xl font-bold tracking-[-0.025em] text-white sm:text-2xl">Explore categories</h2>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => shift('left')}
          disabled={!canScrollLeft}
          className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white opacity-0 backdrop-blur-xl transition hover:bg-white hover:text-black group-hover/categories:opacity-100 focus:opacity-100 disabled:pointer-events-none disabled:opacity-0 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={railRef}
          onScroll={updateBounds}
          className="scrollbar-hide overflow-x-auto pb-3"
        >
          <div className="mx-auto flex w-max min-w-full justify-center gap-3 px-4 sm:gap-4 sm:px-7 lg:px-10">
          {CATEGORY_DEFINITIONS.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeCategory;
            const isAvailable = key === 'all' || availableCounts[key] > 0;
            return (
              <button
                key={key}
                type="button"
                title={isAvailable ? label : `${label} — coming soon`}
                aria-label={isAvailable ? label : `${label}, no products yet`}
                aria-pressed={isActive}
                onClick={() => onSelect(key)}
                className={`relative flex aspect-square w-[94px] shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] border transition duration-300 sm:w-[112px] ${
                  isActive
                    ? 'border-violet-300/65 bg-violet-500 text-white shadow-[0_14px_45px_rgba(124,58,237,0.35)]'
                    : 'border-white/10 bg-[#141419] text-white/65 hover:-translate-y-1 hover:border-white/25 hover:bg-[#191921] hover:text-white'
                } ${!isAvailable ? 'opacity-45' : ''}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.15),transparent_34%)]" />
                <Icon className="relative h-8 w-8 sm:h-9 sm:w-9" />
              </button>
            );
          })}
          </div>
        </div>
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => shift('right')}
          disabled={!canScrollRight}
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white backdrop-blur-xl transition hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-0 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

const CreatorRail = ({ creators }: { creators: CreatorSummary[] }) => {
  const uniqueCreators = creators.slice(0, 16);
  const { railRef, updateBounds, shift, canScrollLeft, canScrollRight } = useHorizontalRail(uniqueCreators.length);

  if (uniqueCreators.length === 0) return null;

  return (
    <section className="group/creators relative py-6 sm:py-8" aria-labelledby="popular-creators">
      <div className="mx-auto mb-4 max-w-[1700px] px-4 text-center sm:px-7 lg:px-10">
        <h2 id="popular-creators" className="text-xl font-bold tracking-[-0.025em] text-white sm:text-2xl">Popular creators</h2>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll popular creators left"
          onClick={() => shift('left')}
          disabled={!canScrollLeft}
          className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white opacity-0 backdrop-blur-xl transition hover:bg-white hover:text-black group-hover/creators:opacity-100 focus:opacity-100 disabled:pointer-events-none disabled:opacity-0 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={railRef}
          onScroll={updateBounds}
          className="scrollbar-hide overflow-x-auto pb-4"
        >
          <div className="mx-auto flex w-max min-w-full justify-center gap-3 px-4 sm:gap-4 sm:px-7 lg:px-10">
          {uniqueCreators.map((creator) => (
            <motion.div
              key={creator.id}
              whileHover={{ y: -6 }}
              className="h-[190px] w-[230px] shrink-0 sm:w-[250px]"
            >
              <Link
                to={`/creator/${creator.username}`}
                className="group flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_75%_10%,rgba(124,58,237,0.2),transparent_40%),#141419] p-5 transition hover:border-violet-400/40"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-violet-600 text-xl font-black text-white shadow-xl">
                  {creator.avatar
                    ? <img src={creator.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                    : creator.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-white">{creator.name}</h3>
                    <p className="mt-1 text-xs text-white/50">{creator.productCount} {creator.productCount === 1 ? 'product' : 'products'}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:text-violet-300" />
                </div>
              </Link>
            </motion.div>
          ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Scroll popular creators right"
          onClick={() => shift('right')}
          disabled={!canScrollRight}
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white backdrop-blur-xl transition hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-0 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

const PurchaseActivityPill = ({ userId, listings }: { userId?: string; listings: Listing[] }) => {
  const [notice, setNotice] = useState<{ id: string; buyer: string; product: string } | null>(null);
  const latestOrderIdRef = useRef<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) {
      latestOrderIdRef.current = null;
      setNotice(null);
      return;
    }

    let active = true;
    let initialized = false;

    const checkForPurchase = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, buyer_id, seller_id, listing_id, created_at')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .in('status', ['paid', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active || error || !data) return;
      if (!initialized) {
        initialized = true;
        latestOrderIdRef.current = data.id;
        return;
      }
      if (latestOrderIdRef.current === data.id) return;
      latestOrderIdRef.current = data.id;

      const knownListing = listings.find((listing) => String(listing.id) === String(data.listing_id));
      const [{ data: profile }, listingResult] = await Promise.all([
        data.buyer_id
          ? supabase.from('profiles').select('username, full_name').eq('id', data.buyer_id).maybeSingle()
          : Promise.resolve({ data: null } as any),
        knownListing
          ? Promise.resolve({ data: knownListing } as any)
          : supabase.from('listings').select('id, title').eq('id', data.listing_id).maybeSingle(),
      ]);

      if (!active || !listingResult.data?.title) return;
      const buyer = profile?.full_name || profile?.username || (data.buyer_id === userId ? 'You' : 'A Wersee member');
      setNotice({ id: data.id, buyer, product: listingResult.data.title });

      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = window.setTimeout(() => setNotice(null), 5600);
    };

    void checkForPurchase();
    const interval = window.setInterval(() => void checkForPurchase(), 15_000);

    return () => {
      active = false;
      window.clearInterval(interval);
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    };
  }, [listings, userId]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 right-4 z-[70] sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, x: 42, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-white/15 bg-[#17171d]/95 py-2 pl-2 pr-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="min-w-0 truncate text-sm">
              <span className="font-bold">{notice.buyer}</span>
              <span className="text-white/55"> bought </span>
              <span className="font-semibold">{notice.product}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    if (ios && !sessionStorage.getItem('ios_pwa_prompt')) setVisible(true);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (isIOS) sessionStorage.setItem('ios_pwa_prompt', 'true');
  };

  const install = async () => {
    if (isIOS) {
      appToast('On Safari, tap Share and choose “Add to Home Screen”.');
      dismiss();
      return;
    }
    if (!deferredPrompt) {
      appToast('Install is not available in this browser, or Wersee is already installed.');
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-5 left-4 z-[65] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-white/15 bg-[#17171d]/95 p-2 pl-3 text-white shadow-2xl backdrop-blur-2xl sm:left-6"
        >
          <Download className="h-4 w-4 text-violet-300" />
          <button type="button" onClick={install} className="text-sm font-bold">Install Wersee</button>
          <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="flex h-9 w-9 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LoadingHome = () => (
  <div className="mx-auto max-w-[1700px] animate-pulse px-4 pb-24 pt-28 sm:px-7 lg:px-10 lg:pt-32">
    <div className="grid gap-3 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.7fr)]">
      <div className="order-2 grid grid-cols-2 gap-3 lg:order-1 lg:grid-cols-1 lg:pt-[76px]">
        <div className="h-44 rounded-[1.1rem] bg-white/[0.055] lg:h-auto" />
        <div className="h-44 rounded-[1.1rem] bg-white/[0.055] lg:h-auto" />
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-3 h-16 rounded-full bg-white/[0.055]" />
        <div className="h-[430px] rounded-[1.35rem] bg-white/[0.055] sm:h-[540px] lg:h-[610px]" />
      </div>
    </div>
  </div>
);

export const Home = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [recentEntries, setRecentEntries] = useState(() => readRecentlyViewed());
  const [personalizedIds, setPersonalizedIds] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);

  useEffect(() => subscribeToRecentlyViewed(() => setRecentEntries(readRecentlyViewed())), []);

  useEffect(() => {
    let active = true;

    const loadListings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, product_offers(*), profiles!listings_seller_id_fkey(id, username, full_name, avatar_url)')
        .eq('status', 'published')
        .eq('is_sandbox', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(80);

      if (!active) return;
      if (error) {
        setLoadError('Products are temporarily unavailable.');
        setListings([]);
      } else {
        const processed = (data || [])
          .filter(isDiscoverableListing)
          .map((listing: Listing) => ({
            ...listing,
            username: listing.profiles?.username,
            creator_name: listing.profiles?.full_name || listing.profiles?.username,
            creator_avatar: listing.profiles?.avatar_url,
          }));
        setListings(dedupeListings(processed));
        setLoadError('');
      }
      setLoading(false);
    };

    void loadListings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPersonalizedIds([]);
      setPurchasedIds([]);
      setFollowedCreatorIds([]);
      return;
    }

    let active = true;
    const loadPersonalization = async () => {
      const [feed, ordersResult, followsResult] = await Promise.all([
        getPersonalizedFeed(30),
        supabase
          .from('orders')
          .select('listing_id, created_at')
          .eq('buyer_id', user.id)
          .in('status', ['paid', 'completed'])
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('follows').select('following_id').eq('follower_id', user.id).limit(100),
      ]);

      if (!active) return;
      setPersonalizedIds((Array.isArray(feed) ? feed : []).map((item: any) => String(item.id)));
      setPurchasedIds((ordersResult.data || []).map((order: any) => String(order.listing_id)).filter(Boolean));
      setFollowedCreatorIds((followsResult.data || []).map((follow: any) => String(follow.following_id)));
    };

    void loadPersonalization();
    return () => {
      active = false;
    };
  }, [user]);

  const listingById = useMemo(() => new Map(listings.map((listing) => [String(listing.id), listing])), [listings]);
  const newest = useMemo(() => [...listings].sort(byNewest), [listings]);
  const trending = useMemo(() => [...listings].sort(byPopularity), [listings]);
  const featured = useMemo(() => [...listings].sort((a, b) => {
    const imageDifference = Number(Boolean(getListingImage(b))) - Number(Boolean(getListingImage(a)));
    return imageDifference || byPopularity(a, b);
  }), [listings]);

  const recentListings = useMemo(() => (
    recentEntries.map((entry) => listingById.get(entry.id)).filter(Boolean) as Listing[]
  ), [listingById, recentEntries]);
  const purchasedListings = useMemo(() => (
    purchasedIds.map((id) => listingById.get(id)).filter(Boolean) as Listing[]
  ), [listingById, purchasedIds]);

  const recommended = useMemo(() => {
    const fromFeed = personalizedIds.map((id) => listingById.get(id)).filter(Boolean) as Listing[];
    if (fromFeed.length > 0) return dedupeListings(fromFeed);

    const affinityCategories = new Set([...recentListings, ...purchasedListings].map((listing) => listing.category).filter(Boolean));
    const affinityMatches = trending.filter((listing) => affinityCategories.has(listing.category));
    return dedupeListings([...affinityMatches, ...trending]);
  }, [listingById, personalizedIds, purchasedListings, recentListings, trending]);

  const lastViewed = recentListings[0] || null;
  const becauseYouViewed = useMemo(() => {
    if (!lastViewed) return [];
    const recentIds = new Set(recentListings.map((listing) => String(listing.id)));
    const viewedCategory = CATEGORY_DEFINITIONS.find((item) => (
      item.key !== 'all' && matchesCategory(lastViewed, item.key)
    ))?.key;
    return trending.filter((listing) => (
      !recentIds.has(String(listing.id))
      && (
        listing.category === lastViewed.category
        || (viewedCategory ? matchesCategory(listing, viewedCategory) : false)
      )
    ));
  }, [lastViewed, recentListings, trending]);

  const fromFollowedCreators = useMemo(() => {
    const followed = new Set(followedCreatorIds);
    return newest.filter((listing) => followed.has(String(listing.seller_id)));
  }, [followedCreatorIds, newest]);

  const newInYourCategories = useMemo(() => {
    const categories = new Set([...recentListings, ...purchasedListings].map((listing) => listing.category).filter(Boolean));
    return newest.filter((listing) => categories.has(listing.category));
  }, [newest, purchasedListings, recentListings]);

  const aiTools = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'ai')), [listings]);
  const digitalProducts = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'digital')), [listings]);
  const services = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'services')), [listings]);
  const courses = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'courses')), [listings]);
  const templates = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'templates')), [listings]);
  const communities = useMemo(() => listings.filter((listing) => matchesCategory(listing, 'communities')), [listings]);
  const freeProducts = useMemo(() => listings.filter((listing) => resolveProductPricing(listing).currentPrice === 0), [listings]);
  const deals = useMemo(() => listings.filter((listing) => resolveProductPricing(listing).isOnSale), [listings]);

  const creatorSummaries = useMemo(() => {
    const creators = new Map<string, CreatorSummary>();
    listings.forEach((listing) => {
      if (!listing.seller_id || !listing.username) return;
      const id = String(listing.seller_id);
      const current = creators.get(id) || {
        id,
        username: listing.username,
        name: listing.creator_name || listing.username,
        avatar: listing.creator_avatar || null,
        productCount: 0,
        score: 0,
      };
      current.productCount += 1;
      current.score += getListingScore(listing);
      creators.set(id, current);
    });
    return [...creators.values()].sort((a, b) => b.score - a.score || b.productCount - a.productCount);
  }, [listings]);

  const availableCounts = useMemo(() => CATEGORY_DEFINITIONS.reduce((counts, category) => ({
    ...counts,
    [category.key]: listings.filter((listing) => matchesCategory(listing, category.key)).length,
  }), {} as Record<CategoryKey, number>), [listings]);

  const selectedCategoryItems = useMemo(() => (
    activeCategory === 'all' ? [] : featured.filter((listing) => matchesCategory(listing, activeCategory))
  ), [activeCategory, featured]);

  const normalizedQuery = query.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!normalizedQuery) return featured;
    return [...listings]
      .filter((listing) => listingText(listing).includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = String(a.title).toLowerCase().startsWith(normalizedQuery) ? 1 : 0;
        const bStarts = String(b.title).toLowerCase().startsWith(normalizedQuery) ? 1 : 0;
        return bStarts - aStarts || byPopularity(a, b);
      });
  }, [featured, listings, normalizedQuery]);

  const heroBase = normalizedQuery
    ? searchMatches
    : activeCategory === 'all'
      ? featured
      : selectedCategoryItems;
  const heroItems = heroBase.slice(0, 3);
  const mainHero = heroItems[0] || null;
  const sideHeroes = heroItems.slice(1, 3);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (normalizedQuery) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  if (loading) {
    return (
      <div className="home-page min-h-screen bg-[#09090c] text-white">
        <SEO
          title="Discover Products, Services & Courses | Wersee"
          description="Discover digital products, services, courses, templates and communities from creators on Wersee."
          image="/brand/wersee-social-card.jpg"
          imageAlt="Discover products on Wersee"
          url="/"
        />
        <LoadingHome />
      </div>
    );
  }

  return (
    <div className="home-page min-h-screen overflow-x-hidden bg-[#09090c] pb-24 text-white selection:bg-violet-500/35">
      <SEO
        title="Discover Products, Services & Courses | Wersee"
        description="Discover digital products, services, courses, templates and communities from creators on Wersee."
        image="/brand/wersee-social-card.jpg"
        imageAlt="Discover products on Wersee"
        url="/"
      />
      <PWAInstallBanner />
      <PurchaseActivityPill userId={user?.id} listings={listings} />

      <main>
        <section className="relative mx-auto max-w-[1700px] px-4 pb-10 pt-28 sm:px-7 sm:pb-14 lg:px-10 lg:pt-32">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[140px]" />
          <div className="relative mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">Wersee marketplace</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">Find your next thing.</h1>
          </div>

          {loadError ? (
            <div className="flex min-h-[430px] items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#121217] px-6 text-center text-white/60">
              {loadError}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#121217] px-6 text-center">
              <ShoppingBag className="mb-4 h-8 w-8 text-violet-300" />
              <h2 className="text-xl font-bold">The marketplace is getting ready.</h2>
              <p className="mt-2 text-sm text-white/50">New products will appear here as creators publish them.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.7fr)]">
              <div className="order-2 grid grid-cols-2 gap-3 lg:order-1 lg:grid-cols-1 lg:grid-rows-2 lg:pt-[76px]">
                <AnimatePresence mode="popLayout">
                  {sideHeroes.map((listing) => (
                    <motion.div
                      key={listing.id}
                      layout={!reduceMotion}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.32 }}
                      className="h-44 min-w-0 lg:h-auto"
                    >
                      <HeroProduct listing={listing} compact />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sideHeroes.length < 2 && normalizedQuery && Array.from({ length: 2 - sideHeroes.length }).map((_, index) => (
                  <div key={`empty-side-${index}`} className="flex h-44 items-center justify-center rounded-[1.1rem] border border-dashed border-white/10 bg-white/[0.025] px-5 text-center text-xs text-white/30 lg:h-auto">
                    No more exact matches
                  </div>
                ))}
              </div>

              <div className="order-1 min-w-0 lg:order-2">
                <form onSubmit={submitSearch} role="search" className="relative mb-3">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products..."
                    aria-label="Search the Wersee marketplace"
                    className="h-16 w-full rounded-full border border-white/12 bg-[#15151a]/92 pl-14 pr-24 text-base font-medium text-white shadow-[0_18px_60px_rgba(0,0,0,0.3)] outline-none backdrop-blur-2xl transition placeholder:text-white/32 focus:border-violet-400/65 focus:ring-4 focus:ring-violet-500/10"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-14 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label="View all search results"
                    className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-violet-100"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                </form>

                <AnimatePresence mode="wait">
                  {mainHero ? (
                    <motion.div
                      key={mainHero.id}
                      initial={{ opacity: 0, y: 12, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.99 }}
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      className="h-[430px] sm:h-[540px] lg:h-[610px]"
                    >
                      <HeroProduct listing={mainHero} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-search-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-[430px] flex-col items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#121217] px-6 text-center sm:h-[540px] lg:h-[610px]"
                    >
                      <Search className="mb-4 h-8 w-8 text-violet-300" />
                      <h2 className="text-xl font-bold">No products found</h2>
                      <p className="mt-2 text-sm text-white/45">Try a different product, creator or category.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>

        {user ? (
          <>
            <ProductRail title="Continue browsing" items={recentListings.slice(0, 4)} />
            <ProductRail title="Recommended for you" items={recommended} />
            <ProductRail title={lastViewed ? `Because you viewed ${lastViewed.title}` : 'Because you viewed'} items={becauseYouViewed} />
            <ProductRail title="From creators you follow" items={fromFollowedCreators} />
          </>
        ) : (
          <>
            <ProductRail title="Featured this week" items={featured} />
            <ProductRail title="Trending on Wersee" items={trending} />
          </>
        )}

        <CategoryRail
          activeCategory={activeCategory}
          availableCounts={availableCounts}
          onSelect={(category) => {
            setActiveCategory(category);
            setQuery('');
          }}
        />

        {activeCategory !== 'all' && (
          selectedCategoryItems.length > 0
            ? <ProductRail title={CATEGORY_DEFINITIONS.find((item) => item.key === activeCategory)?.label || 'Explore'} items={selectedCategoryItems} />
            : (
              <div className="mx-auto max-w-[1700px] px-4 pb-8 sm:px-7 lg:px-10">
                <div className="rounded-[1.15rem] border border-dashed border-white/10 bg-white/[0.025] px-6 py-10 text-center text-sm text-white/45">
                  No published products in this category yet.
                </div>
              </div>
            )
        )}

        {user ? (
          <>
            <ProductRail title="New in your categories" items={newInYourCategories} />
            <ProductRail title="Deals for you" items={deals} />
            {recentListings.length > 4 && <ProductRail title="Recently viewed" items={recentListings} />}
            <ProductRail title="Trending on Wersee" items={trending} />
            <ProductRail title="New releases" items={newest} />
          </>
        ) : (
          <>
            <ProductRail title="New on Wersee" items={newest} />
            <ProductRail title="Popular services" items={[...services].sort(byPopularity)} />
            <ProductRail title="Popular digital products" items={[...digitalProducts].sort(byPopularity)} />
            <ProductRail title="Free products" items={freeProducts} />
          </>
        )}

        <ProductRail title="AI tools" items={aiTools} />
        {user && <ProductRail title="Digital products" items={digitalProducts} />}
        {user && <ProductRail title="Services" items={services} />}
        <ProductRail title="Courses" items={courses} />
        <ProductRail title="Templates" items={templates} />
        <ProductRail title="Communities" items={communities} />
        {user && <ProductRail title="Free products" items={freeProducts} />}
        <CreatorRail creators={creatorSummaries} />

        <section className="mx-auto mt-12 max-w-[1700px] px-4 sm:px-7 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-5 border-t border-white/10 py-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Made something worth discovering?</h2>
              <p className="mt-1 text-sm text-white/45">Publish it on Wersee.</p>
            </div>
            <Link
              to={user ? '/workspace/products' : '/signin'}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-black transition hover:bg-violet-100"
            >
              Start selling <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};
