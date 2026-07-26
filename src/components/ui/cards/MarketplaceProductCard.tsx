import React, { memo, useEffect, useMemo, useRef } from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getSessionId } from '../../../services/algorithmService';
import { trackProductConversion, ProductSurface } from '../../../lib/productConversion';
import { formatProductPrice, getCardVariant, resolveProductPricing } from '../../../lib/productOffers';

type MarketplaceProductCardProps = {
  listing: any;
  href?: string;
  surface?: ProductSurface;
};

export const MarketplaceProductCard = memo(function MarketplaceProductCard({
  listing,
  href,
  surface = 'unknown',
}: MarketplaceProductCardProps) {
  const variant = useMemo(() => getCardVariant(listing, getSessionId()), [listing]);
  const pricing = resolveProductPricing(listing);
  let primaryImage = listing.images?.[0];
  if (typeof listing.images === 'string') {
    try {
      const parsed = JSON.parse(listing.images);
      primaryImage = Array.isArray(parsed) ? parsed[0] : listing.images;
    } catch {
      primaryImage = listing.images;
    }
  }
  const image = variant === 'b' && listing.thumbnail_b_url
    ? listing.thumbnail_b_url
    : primaryImage || listing.image || listing.image_url;
  const logo = listing.logo_url || listing.creator_avatar || listing.profiles?.avatar_url;
  const rating = Number(listing.rating_avg || listing.rating || 0);
  const reviewCount = Number(listing.rating_count || 0);
  const destination = href || `/listing/${listing.id}`;
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void trackProductConversion(String(listing.id), 'impression', surface, variant);
    }, { rootMargin: '160px 0px', threshold: 0.1 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [listing.id, surface, variant]);

  return (
    <motion.article ref={cardRef} whileHover={{ y: -8 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="h-full min-h-[430px] w-full">
      <Link
        to={destination}
        onClick={() => void trackProductConversion(String(listing.id), 'click', surface, variant)}
        className="group relative block h-full min-h-[430px] w-full overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.42)] transition duration-500 hover:border-white/25 hover:shadow-[0_32px_100px_rgba(79,70,229,0.2)]"
      >
        <img src={image || 'https://picsum.photos/seed/wersee-product/900/1100'} alt={listing.title || 'Wersee marketplace product'} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-1000 ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/90" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">
            {listing.card_badge || listing.type || 'Product'}
          </span>
          {pricing.isOnSale && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-black">-{pricing.discountPercent}%</span>}
        </div>

        <div className="absolute inset-x-3 bottom-3 rounded-[1.65rem] border border-white/15 bg-black/58 p-3.5 backdrop-blur-2xl transition duration-500 group-hover:bg-black/72">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-xl">
              {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : listing.title?.charAt(0) || 'W'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-black tracking-tight text-white">{listing.title}</h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-white/60">{listing.short_description || listing.description || `by ${listing.creator_name || listing.seller || 'Wersee seller'}`}</p>
            </div>
            <div className="shrink-0 text-right">
              {pricing.isOnSale && <p className="text-[11px] font-bold text-white/45 line-through">{formatProductPrice(pricing.originalPrice, listing.currency || 'EUR')}</p>}
              <p className="text-lg font-black text-white">{pricing.currentPrice === 0 ? 'Free' : formatProductPrice(pricing.currentPrice, listing.currency || 'EUR')}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating > 0 ? rating.toFixed(1) : 'New'}{reviewCount > 0 && <span className="font-medium text-white/40">· {reviewCount} reviews</span>}
            </div>
            <span className="flex translate-y-2 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-black opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              View product <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
});
