import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PageWrapper } from '../components/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { PhysicalProductDetail } from '../components/listings/details/PhysicalProductDetail';
import { ServiceDetail } from '../components/listings/details/ServiceDetail';
import { DigitalDetail } from '../components/listings/details/DigitalDetail';
import { Asset3DDetail } from '../components/listings/details/Asset3DDetail';
import { CourseDetail } from '../components/listings/details/CourseDetail';
import { VirtualItemDetail } from '../components/listings/details/VirtualItemDetail';
import { WebsiteDetail } from '../components/listings/details/WebsiteDetail';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ChevronDown, Share2, Copy, Check, X as CloseIcon, Building2, UserRound } from 'lucide-react';
import { SEO } from '../components/SEO';
import { LocaleCurrencyPicker } from '../components/store/LocaleCurrencyPicker';
import { formatOfferTimeRemaining, formatProductPrice, resolveProductPricing } from '../lib/productOffers';
import { trackProductConversion } from '../lib/productConversion';
import { rememberRecentlyViewed } from '../lib/recentlyViewed';
import { addCartItem } from '../lib/cart';
import {
  identifiers,
  parseAccountHandle,
  routes,
  usernameFromAccountHandle,
} from '../routing/routes';

import { JobDetail } from '../components/listings/details/JobDetail';

import { appToast } from '@/lib/feedback';

const profilePathForUsername = (value: unknown) => {
  try {
    return routes.userProfile({ username: identifiers.username(String(value || '')) });
  } catch {
    return null;
  }
};

const listingPathForRecord = (record: any) => {
  try {
    if (record?.slug && record?.seller_handle) {
      return routes.userProductBySlug({
        username: identifiers.username(String(record.seller_handle)),
        productSlug: identifiers.productSlug(String(record.slug)),
      });
    }
    return routes.productById({ productId: identifiers.productId(String(record?.id)) });
  } catch {
    return '/';
  }
};

export const ListingDetail = () => {
  const { productId, accountHandle, productSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedListings, setRelatedListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAffiliateLink, setIsAffiliateLink] = useState(false);
  const [selectedShareImage, setSelectedShareImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [stats, setStats] = useState({ students: 0, lessons: 0, certificates: 0 });
  const [accessError, setAccessError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [sellerType, setSellerType] = useState<'business' | 'consumer' | null>(null);

  useEffect(() => {
    if (listing?.id) void trackProductConversion(String(listing.id), 'view', 'product');
  }, [listing?.id]);

  const getReviewAverage = (items: any[]) => {
    if (!items.length) return 0;
    const total = items.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / items.length;
  };

  const fetchReviews = async (listingId: string) => {
    try {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      
      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Then fetch profiles for these reviews
      const userIds = Array.from(new Set(reviewsData.map(r => r.user_id)));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine reviews with profiles
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        profiles: profilesData?.find(p => p.id === review.user_id) || {
          name: 'Anonymous',
          avatar_url: null,
          username: 'anonymous'
        }
      }));

      setReviews(reviewsWithProfiles);

      setListing((current: any) => {
        if (!current || current.id !== listingId) return current;
        return {
          ...current,
          rating_avg: getReviewAverage(reviewsData),
          rating_count: reviewsData.length,
        };
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleReviewAdded = () => {
    if (listing?.id) {
      fetchReviews(listing.id);
    }
  };

  useEffect(() => {
    if (location.state?.error) {
      setAccessError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setFetchError('');
      
      // Check if we are using ID or Slug
      const actualId = productId;
      const actualSlug = productSlug;

      if (actualId && !accountHandle) {
        try {
          const { data, error } = await supabase
            .from('listings')
            .select('*, product_offers(*), profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
            .eq('id', actualId)
            .maybeSingle();
          if (error) throw error;
          
          if (!data) throw new Error('Listing not found');
          
          handleListingData(data);
        } catch (error: any) {
          console.error('Error fetching listing by ID:', error);
          setFetchError(error.message || 'Failed to load listing');
          setLoading(false);
        }
      } else if (actualSlug && !accountHandle && !actualId) {
        try {
          const { data, error } = await supabase
            .from('listings')
            .select('*, product_offers(*), profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
            .eq('slug', actualSlug)
            .maybeSingle();

          if (error) throw error;
          if (!data) throw new Error('Listing not found');
          
          handleListingData(data);
        } catch (error: any) {
          console.error('Error fetching listing by slug:', error);
          setFetchError(error.message || 'Failed to load listing');
          setLoading(false);
        }
      } else if (accountHandle && (actualSlug || actualId)) {
        try {
          const parsedAccountHandle = parseAccountHandle(accountHandle);
          if (!parsedAccountHandle) throw new Error('Invalid seller account handle');
          const sellerUsername = usernameFromAccountHandle(parsedAccountHandle);
          
          // First get the user ID from username
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', sellerUsername)
            .maybeSingle();

          if (profileError) throw profileError;
          if (!profileData) {
            setFetchError('Seller not found');
            setLoading(false);
            return;
          }

          let query = supabase
            .from('listings')
            .select('*, product_offers(*), profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
            .eq('seller_id', profileData.id);

          if (actualId && actualId !== actualSlug) {
            query = query.eq('id', actualId);
          } else {
            query = query.eq('slug', actualSlug);
          }

          const { data, error } = await query.maybeSingle();

          if (error) throw error;
          if (!data) {
            setFetchError('Listing not found');
            setLoading(false);
            return;
          }
          
          handleListingData(data);
        } catch (error: any) {
          console.error('Error fetching listing by slug/username:', error);
          setFetchError(error.message || 'Failed to load listing');
          setLoading(false);
        }
      } else {
        setFetchError('Invalid listing URL');
        setLoading(false);
      }
    };

    const handleListingData = async (data: any) => {
      if (data) {
        rememberRecentlyViewed(String(data.id));
        // Ensure images is an array
        let images = data.images || [];
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
          } catch (e) {
            images = [images];
          }
        }
        
        const productPricing = resolveProductPricing(data);
        setListing({
          ...data,
          price: productPricing.currentPrice,
          images: Array.isArray(images) ? images : [images],
          seller: data.profiles?.full_name || data.profiles?.username || 'Unknown Seller',
          seller_handle: data.profiles?.username || '',
          seller_avatar: data.profiles?.avatar_url,
          rating: Number(data.rating_avg) || 0,
          rating_avg: Number(data.rating_avg) || 0,
          rating_count: Number(data.rating_count) || 0,
          image: images[0] || data.image_url || data.image
        });

        const embeddedSellerType = data.metadata?.dsa_trader_status;
        if (embeddedSellerType === 'business' || embeddedSellerType === 'consumer') {
          setSellerType(embeddedSellerType);
        } else if (data.seller_id) {
          const { data: declaration } = await supabase
            .from('dsa_seller_verifications')
            .select('trader_status')
            .eq('seller_id', data.seller_id)
            .maybeSingle();
          setSellerType(declaration?.trader_status === 'business' ? 'business' : declaration?.trader_status === 'consumer' ? 'consumer' : null);
        }
        
        const { data: related } = await supabase
          .from('listings')
          .select('*')
          .neq('id', data.id)
          .limit(4);
          
        setRelatedListings(related || []);

        // Fetch reviews
        fetchReviews(data.id);

        // Fetch real stats (mostly for courses)
        if (data.type === 'course' || data.category === 'Course') {
          const { count: studentCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', data.id);
          
          const lessonCount = data.metadata?.course?.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;
          
          setStats({
            students: studentCount || 0,
            lessons: lessonCount,
            certificates: studentCount ? Math.floor(studentCount * 0.4) : 0 
          });
        }
      }
      setLoading(false);
    };

    fetchListing();
  }, [productId, accountHandle, productSlug]);

  const handleContactSeller = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowQuestionModal(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    let shareUrl = baseUrl;
    
    const params = new URLSearchParams();
    if (selectedShareImage) params.set('img', selectedShareImage);
    if (isAffiliateLink && user) {
      const affiliateId = user.email?.split('@')[0] || user.id;
      params.set('aff', affiliateId);
    }
    
    const queryString = params.toString();
    if (queryString) {
      shareUrl += `?${queryString}`;
    }
    
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnroll = (planIndex?: number) => {
    if (!listing) return;

    const pricing = resolveProductPricing(listing);
    const selectedPlan = planIndex !== undefined ? listing.plans?.[planIndex] : null;
    addCartItem({
      listingId: String(listing.id),
      title: listing.title || 'Wersee product',
      type: listing.type || 'product',
      image: listing.images?.[0] || listing.image || listing.thumbnail_url || null,
      price: Number(selectedPlan?.price ?? pricing.currentPrice) || 0,
      originalPrice: Number(selectedPlan?.price ?? pricing.originalPrice) || 0,
      currency: String(selectedPlan?.currency || listing.currency || listing.base_currency || 'EUR').toUpperCase(),
      planIndex,
    });
    appToast('Added to your cart');
    navigate('/checkout');
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim()) return;
    setSubmittingQuestion(true);
    try {
      const { error } = await supabase.from('lesson_comments').insert({
        listing_id: listing.id,
        lesson_id: 'general_qa',
        user_id: user.id,
        user_name: user.email?.split('@')[0],
        user_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        content: `[Q&A] ${question}`
      });
      if (error) throw error;
      setQuestion('');
      setShowQuestionModal(false);
      appToast('Your question has been sent to the seller!');
    } catch (err) {
      console.error('Error sending question:', err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] p-8 text-center">
      <h2 className="text-2xl font-bold mb-2 text-white">Oops!</h2>
      <p className="text-gray-400 mb-4">{fetchError}</p>
      <button onClick={() => navigate('/')} className="px-6 py-2 bg-white text-black rounded-full font-bold">Go Home</button>
    </div>
  );

  if (!listing) return null;

  const shareImageFromUrl = new URLSearchParams(location.search).get('img');
  const productPricing = resolveProductPricing(listing);
  const hasFloatingGlobalHeader = !location.pathname.startsWith('/listing/') && !location.pathname.startsWith('/p/');
  const seoImage = shareImageFromUrl || listing.images?.[0] || listing.image;
  const parsedRouteAccountHandle = parseAccountHandle(accountHandle);
  const listingPath = parsedRouteAccountHandle && productSlug
    ? routes.accountProductBySlug({
        accountHandle: parsedRouteAccountHandle,
        productSlug: identifiers.productSlug(productSlug),
      })
    : listing.slug
      ? routes.productBySlug({ productSlug: identifiers.productSlug(listing.slug) })
      : routes.productById({ productId: identifiers.productId(String(listing.id)) });

  const renderDetailComponent = () => {
    const commonProps = {
      listing,
      reviews,
      relatedListings,
      onContactSeller: handleContactSeller,
      onShare: handleShare,
      onEnroll: (planIndex?: number) => {
        void trackProductConversion(String(listing.id), 'add_to_cart', 'product');
        handleEnroll(planIndex);
      },
      canBuy: true,
      isSandbox: false,
      listingId: listing.id,
      onReviewAdded: handleReviewAdded,
      initialIsEditing: location.pathname.endsWith('/editor')
    };

    // Determine component based on type
    let Component;
    switch (listing.type) {
      case 'product':
      case 'physical':
      case 'affiliate':
        Component = <PhysicalProductDetail {...commonProps} />;
        break;
      case 'service':
        Component = <ServiceDetail {...commonProps} />;
        break;
      case 'digital':
        Component = <DigitalDetail {...commonProps} />;
        break;
      case 'asset_3d':
        Component = <Asset3DDetail {...commonProps} />;
        break;
      case 'course':
        Component = <CourseDetail {...commonProps} stats={stats} onEnroll={(idx) => { void trackProductConversion(String(listing.id), 'add_to_cart', 'product'); handleEnroll(idx); }} />;
        break;
      case 'virtual':
        Component = <VirtualItemDetail {...commonProps} />;
        break;
      case 'website':
        Component = <WebsiteDetail listing={listing} onShare={handleShare} />;
        break;
      case 'job':
        Component = <JobDetail listing={listing} onShare={handleShare} />;
        break;
      default:
        Component = <PhysicalProductDetail {...commonProps} />;
    }

    return Component;
  };

  const presetImages = listing ? [
    // 16:9
    { url: `https://picsum.photos/seed/${listing.id}-169-1/1600/900`, ratio: '16:9' },
    { url: `https://picsum.photos/seed/${listing.id}-169-2/1600/900`, ratio: '16:9' },
    { url: `https://picsum.photos/seed/${listing.id}-169-3/1600/900`, ratio: '16:9' },
    // 9:16
    { url: `https://picsum.photos/seed/${listing.id}-916-1/900/1600`, ratio: '9:16' },
    { url: `https://picsum.photos/seed/${listing.id}-916-2/900/1600`, ratio: '9:16' },
    { url: `https://picsum.photos/seed/${listing.id}-916-3/900/1600`, ratio: '9:16' },
    // 1:1
    { url: `https://picsum.photos/seed/${listing.id}-11-1/1000/1000`, ratio: '1:1' },
    { url: `https://picsum.photos/seed/${listing.id}-11-2/1000/1000`, ratio: '1:1' },
    { url: `https://picsum.photos/seed/${listing.id}-11-3/1000/1000`, ratio: '1:1' },
  ] : [];

  return (
    <PageWrapper>
      <div className={`fixed right-4 z-50 ${hasFloatingGlobalHeader ? 'top-24' : 'top-4'}`}>
        <LocaleCurrencyPicker className="justify-end" />
      </div>
      <SEO 
        title={listing.seo_title || listing.title} 
        description={listing.seo_description || listing.description}
        image={seoImage}
        url={listingPath}
        type="product"
        noIndex={Boolean(listing.is_indexable === false || listing.deleted_at || !['active', 'published'].includes(listing.status))}
        keywords={[listing.title, listing.category, listing.type, listing.seller].filter(Boolean).join(', ')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': listing.type === 'service' ? 'Service' : 'Product',
          name: listing.title,
          description: listing.description,
          image: seoImage,
          url: `https://wersee.com${listingPath}`,
          brand: {
            '@type': 'Brand',
            name: listing.seller || 'Wersee Seller',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: (listing.base_currency || 'EUR').toUpperCase(),
            price: Number.parseFloat(String(listing.price || '0').replace(/[^0-9.]/g, '')) || 0,
            availability: 'https://schema.org/InStock',
            url: `https://wersee.com${listingPath}`,
          },
          ...(Number(listing.rating_count) > 0 ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(listing.rating_avg || 0).toFixed(1),
              reviewCount: Number(listing.rating_count),
            },
          } : {}),
        }}
      />
      {sellerType && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-gray-300">
            {sellerType === 'business' ? <Building2 className="h-4 w-4 text-indigo-300" /> : <UserRound className="h-4 w-4 text-emerald-300" />}
            {sellerType === 'business' ? 'Business seller' : 'Private seller'}
          </div>
        </div>
      )}
      {productPricing.isOnSale && (
        <div className="mx-auto max-w-5xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.08] px-4 py-3 text-sm">
            <span className="font-black text-emerald-200">{productPricing.offer?.name || 'Special offer'}</span>
            <span className="text-gray-500 line-through">{formatProductPrice(productPricing.originalPrice, listing.currency || 'EUR')}</span>
            <span className="font-black text-white">{formatProductPrice(productPricing.currentPrice, listing.currency || 'EUR')}</span>
            <span className="rounded-full bg-emerald-300 px-2.5 py-1 text-xs font-black text-emerald-950">{productPricing.discountPercent}% OFF</span>
            <span className="text-xs font-bold text-emerald-200/60">Save {formatProductPrice(productPricing.savings, listing.currency || 'EUR')}</span>
            {productPricing.offer && <span className="ml-auto text-xs font-bold text-emerald-100/70">{formatOfferTimeRemaining(productPricing.offer)}</span>}
          </div>
        </div>
      )}
      {renderDetailComponent()}

      {/* Internal linking to improve crawlability */}
      <div className="max-w-5xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-bold text-white mb-2">More from this creator</h4>
            {profilePathForUsername(listing.seller_handle) ? (
              <a href={profilePathForUsername(listing.seller_handle)!} className="text-indigo-400 hover:underline block mb-2">{listing.seller}</a>
            ) : (
              <span className="text-gray-400 block mb-2">{listing.seller}</span>
            )}
            {relatedListings.filter(r => r.seller_id === listing.seller_id).slice(0,4).map(r => (
              <div key={r.id}><a href={listingPathForRecord(r)} className="text-gray-300 hover:underline block">{r.title || r.slug || r.id}</a></div>
            ))}
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Popular in category</h4>
            <a href={`/category/${(listing.category || 'general').toLowerCase().replace(/\s+/g,'-')}`} className="text-indigo-400 hover:underline block mb-2">{listing.category || 'General'}</a>
            {relatedListings.filter(r => r.category === listing.category).slice(0,4).map(r => (
              <div key={r.id}><a href={listingPathForRecord(r)} className="text-gray-300 hover:underline block">{r.title || r.slug || r.id}</a></div>
            ))}
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Similar products</h4>
            {relatedListings.slice(0,6).map(r => (
              <div key={r.id}><a href={listingPathForRecord(r)} className="text-gray-300 hover:underline block">{r.title || r.slug || r.id}</a></div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Share Product</h3>
                  <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-400">Choose SEO Thumbnail</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Affiliate Link</span>
                      <button 
                        onClick={() => setIsAffiliateLink(!isAffiliateLink)}
                        className={`w-10 h-5 rounded-full transition-all relative ${isAffiliateLink ? 'bg-indigo-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isAffiliateLink ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Product Images */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Product Gallery</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {listing.images?.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedShareImage(img)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                              selectedShareImage === img ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {selectedShareImage === img && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedShareImage(null)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center gap-1 bg-white/5 transition-all ${
                            selectedShareImage === null ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">Default</span>
                          <span className="text-[8px] text-gray-400">Main Image</span>
                        </button>
                      </div>
                    </div>

                    {/* Preset Generated Images */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Generated Presets</h4>
                      
                      {/* 16:9 */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-gray-600 font-medium">Landscape (16:9)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {presetImages.filter(p => p.ratio === '16:9').map((p, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedShareImage(p.url)}
                              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                                selectedShareImage === p.url ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={p.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 1:1 */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-gray-600 font-medium">Square (1:1)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {presetImages.filter(p => p.ratio === '1:1').map((p, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedShareImage(p.url)}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                selectedShareImage === p.url ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={p.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 9:16 */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-gray-600 font-medium">Portrait (9:16)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {presetImages.filter(p => p.ratio === '9:16').map((p, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedShareImage(p.url)}
                              className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all ${
                                selectedShareImage === p.url ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={p.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-400">Share Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-300 truncate font-mono">
                      {window.location.origin + window.location.pathname}
                      {selectedShareImage || isAffiliateLink ? '?' : ''}
                      {selectedShareImage ? `img=${encodeURIComponent(selectedShareImage).substring(0, 10)}...` : ''}
                      {selectedShareImage && isAffiliateLink ? '&' : ''}
                      {isAffiliateLink ? `aff=${user?.email?.split('@')[0] || 'user'}` : ''}
                    </div>
                    <button 
                      onClick={copyShareLink}
                      className="bg-white text-black px-6 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">
                    The selected image will be used as the preview thumbnail when you share this link on social media.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shared Question Modal */}
      <AnimatePresence>
        {showQuestionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuestionModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Ask a Question</h3>
                  <button onClick={() => setShowQuestionModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
                    <ChevronDown className="w-6 h-6 rotate-180" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">
                  Have a question about {listing.title}? Ask the seller directly.
                </p>
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <textarea 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full p-4 bg-[#0A0A0A] border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white min-h-[150px]"
                    required
                  />
                  <button 
                    type="submit"
                    disabled={submittingQuestion}
                    className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingQuestion ? 'Sending...' : 'Send Question'} <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
