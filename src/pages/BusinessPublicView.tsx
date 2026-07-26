import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PageWrapper } from '../components/PageWrapper';
import { motion } from 'motion/react';
import { Globe, ShoppingBag, Users, ArrowRight, Loader2, Star, ShieldCheck, Zap, Lock, Check } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../context/useAnalytics';
import { AllAccessDashboard } from './AllAccessDashboard';
import { LocalizedPrice } from '../components/store/LocalizedPrice';
import { LocaleCurrencyPicker } from '../components/store/LocaleCurrencyPicker';

export const BusinessPublicView = () => {
  const { slug, slugOrUsername } = useParams();
  const effectiveSlug = slug || slugOrUsername;
  const { user } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessPass, setAccessPass] = useState<any>(null);

  const { trackClick } = useAnalytics(business?.id);

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        // Fetch business by slug or ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(effectiveSlug || '');
        
        let query = supabase
          .from('businesses')
          .select('*');
          
        if (isUUID) {
          query = query.or(`slug.eq.${effectiveSlug},id.eq.${effectiveSlug}`);
        } else {
          query = query.eq('slug', effectiveSlug);
        }
        
        const { data: bData, error: bError } = await query.maybeSingle();

        if (bError) throw bError;
        if (!bData) throw new Error('Business not found');

        setBusiness(bData);

        // Fetch site content
        const { data: contentData } = await supabase
          .from('site_content')
          .select('*')
          .eq('business_id', bData.id)
          .maybeSingle();
        
        // Fetch plans
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('business_id', bData.id)
          .eq('is_active', true)
          .order('price', { ascending: true });

        // Fetch products for this business
        const { data: pData } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', bData.user_id)
          .limit(8);

        setProducts(pData || []);
        
        // Fetch reviews for this business
        const productIds = (pData || []).map(p => p.id).filter(Boolean);
        if (productIds.length > 0) {
          const { data: rData, error: rError } = await supabase
            .from('reviews')
            .select('*')
            .in('listing_id', productIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (rError) throw rError;

          const reviewsData = rData || [];
          if (reviewsData.length > 0) {
            const reviewUserIds = Array.from(new Set(reviewsData.map((r: any) => r.user_id).filter(Boolean)));
            const reviewListingIds = Array.from(new Set(reviewsData.map((r: any) => r.listing_id).filter(Boolean)));

            const [reviewProfilesRes, reviewListingsRes] = await Promise.all([
              reviewUserIds.length > 0
                ? supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', reviewUserIds)
                : Promise.resolve({ data: [], error: null } as any),
              reviewListingIds.length > 0
                ? supabase.from('listings').select('id, title').in('id', reviewListingIds)
                : Promise.resolve({ data: [], error: null } as any),
            ]);

            const profileMap = new Map((reviewProfilesRes.data || []).map((p: any) => [p.id, p]));
            const listingMap = new Map((reviewListingsRes.data || []).map((l: any) => [l.id, l]));

            setReviews(reviewsData.map((review: any) => ({
              ...review,
              profiles: profileMap.get(review.user_id) || null,
              listings: listingMap.get(review.listing_id) || null,
            })));
          } else {
            setReviews([]);
          }
        } else {
          setReviews([]);
        }
        
        // Attach content and plans to business object for easy access
        setBusiness({
          ...bData,
          siteContent: contentData || null,
          plans: plansData || []
        });

        // Check if user has an all-access pass
        if (user) {
          const { data: orders } = await supabase
            .from('orders')
            .select('listing_id')
            .eq('buyer_id', user.id)
            .eq('status', 'completed');

          if (orders && orders.length > 0) {
            const listingIds = orders.map(o => o.listing_id);
            const { data: passes } = await supabase
              .from('listings')
              .select('*')
              .in('id', listingIds)
              .eq('seller_id', bData.user_id)
              .contains('metadata', { is_all_access: true });

            if (passes && passes.length > 0) {
              setAccessPass(passes[0]);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching business:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveSlug) fetchBusiness();
  }, [effectiveSlug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If the business is private and the user doesn't have an access pass
  const isPrivate = business?.theme_config?.isPrivate || false;

  if (error || !business || (isPrivate && !accessPass)) {
    return (
      <PageWrapper>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-white dark:bg-[#050505]">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-8">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900 dark:text-white">Business Not Found</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-lg">
            The business you are looking for does not exist or you don't have access.
          </p>
          <Link to="/" className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform">
            Return Home
          </Link>
        </div>
      </PageWrapper>
    );
  }

  // If user has an access pass, show the All-Access Dashboard
  if (accessPass) {
    return <AllAccessDashboard business={business} user={user} accessPass={accessPass} />;
  }

  const theme = business.theme_config || {};
  const content = business.siteContent || {};
  const plans = business.plans || [];

  return (
    <PageWrapper>
      <SEO 
        title={business.name} 
        description={business.description || `Explore ${business.name} on Wersee.`}
        image={content.hero_image_url || business.logo_url}
        url={window.location.pathname}
      />
      <div className="fixed right-4 top-24 z-50">
        <LocaleCurrencyPicker dark={false} className="justify-end" />
      </div>

      {/* Hero Section - Premium Centered */}
      <section className="relative pt-24 pb-16 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-[#050505]">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Mobile Optimized Header (Visible only on small screens) */}
          <div className="md:hidden flex flex-col items-center justify-center gap-6 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-28 h-28 rounded-[2rem] bg-white dark:bg-[#111] shadow-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-4xl font-black text-gray-900 dark:text-white overflow-hidden relative"
            >
              {content.hero_image_url || business.logo_url ? (
                 <img src={content.hero_image_url || business.logo_url} alt={business.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                 <span className="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                   {business.name.charAt(0).toUpperCase()}
                 </span>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center w-full"
            >
              <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white mb-3 leading-tight">
                {content.hero_title || business.name}
              </h1>
              <button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-6 w-full px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-black/10 dark:shadow-white/10"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>

          {/* Desktop Header (Hidden on mobile) */}
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block mb-8"
            >
              <div className="w-32 h-32 rounded-3xl bg-white dark:bg-[#111] shadow-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-5xl font-black text-gray-900 dark:text-white mx-auto overflow-hidden relative group">
                {content.hero_image_url || business.logo_url ? (
                   <img src={content.hero_image_url || business.logo_url} alt={business.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                   <span className="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                     {business.name.charAt(0).toUpperCase()}
                   </span>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-3xl pointer-events-none" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-7xl font-black tracking-tighter text-gray-900 dark:text-white mb-6 leading-[1.1]">
                {content.hero_title || business.name}
              </h1>
              <p className="text-2xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                {content.hero_subtitle || business.description || "Building the future of digital commerce."}
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-black/10 dark:shadow-white/10"
                >
                  Explore Products <ArrowRight className="w-5 h-5" />
                </button>
                {user?.id === business.user_id && (
                  <Link 
                    to={`/portal/${business.slug}`}
                    className="px-8 py-4 bg-indigo-500 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    Team Portal <ShieldCheck className="w-5 h-5" />
                  </Link>
                )}
                {business.includes_community && (
                  <button className="px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-full font-bold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                    Join Community <Users className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Bar */}
      <section className="border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale">
            <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck className="w-6 h-6" /> Verified Seller</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Star className="w-6 h-6" /> Top Rated</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Zap className="w-6 h-6" /> Instant Delivery</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Globe className="w-6 h-6" /> Global Support</div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      {products.length > 0 && (
        <section id="products" className="py-24 bg-white dark:bg-[#050505]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">Latest Releases</h2>
                <p className="text-xl text-gray-500 dark:text-gray-400">Discover our newest digital products and services.</p>
              </div>
              <Link to="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full font-bold text-gray-900 dark:text-white transition-colors whitespace-nowrap">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link 
                    to={`/listing/${product.id}`}
                    onClick={() => trackClick(`product_${product.id}`)}
                    className="group block bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-4 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-100 dark:bg-gray-900 mb-6 relative">
                      <img 
                        src={(Array.isArray(product.images) ? product.images[0] : (typeof product.images === 'string' ? JSON.parse(product.images)[0] : null)) || product.image_url || product.image || "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=800&q=80"} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-sm text-gray-900 dark:text-white shadow-sm flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span>{(product.rating_avg || product.rating || 5.0).toFixed(1)}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-sm text-gray-900 dark:text-white shadow-sm">
                        <LocalizedPrice amount={product.price} baseCurrency={product.currency || product.base_currency || 'EUR'} showOriginal={false} />
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-sm leading-relaxed">
                        {product.description || "No description available."}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features / About */}
      <section className="py-24 bg-gray-50 dark:bg-[#0A0A0A] border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
                Why choose {business.name}?
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
                {content.about_text || business.description || "We are dedicated to providing exceptional value and quality to our customers. Our products are designed to help you succeed."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(content.features?.length > 0 ? content.features : [
                  "Premium Quality",
                  "Instant Access",
                  "Secure",
                  "Support"
                ]).slice(0, 4).map((feature: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center shrink-0 text-gray-900 dark:text-white shadow-sm">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{typeof feature === 'string' ? feature : feature.title || feature}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{typeof feature === 'string' ? 'Included with every purchase.' : feature.desc || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                <img 
                  src={content.about_image_url || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"} 
                  alt="About us"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[3rem] pointer-events-none" />
              </div>
              
              {/* Floating Stats Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="absolute -bottom-8 -left-8 bg-white dark:bg-[#111] p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 max-w-xs hidden md:block"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#111] bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + (business.id || '')}`} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {business.user_count > 0 ? (
                      <>{business.user_count >= 1000 ? (business.user_count / 1000).toFixed(1) + 'k' : business.user_count}+ Happy<br/>Customers</>
                    ) : (
                      <>No customers<br/>yet</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                  {(business.rating_avg || 0) > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${i < Math.floor(business.rating_avg) ? 'fill-current' : 'opacity-30'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-gray-900 dark:text-white font-bold ml-1">
                        {business.rating_avg.toFixed(1)}/5
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">No reviews yet</span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      {plans.length > 0 && (
        <section id="plans" className="py-24 bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Subscribe to get exclusive access to premium content and services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan: any, index: number) => (
                <motion.div
                  key={plan.id}
                  id={`plan-${plan.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-[#111] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 flex flex-col relative group hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <LocalizedPrice
                      amount={plan.price}
                      baseCurrency={plan.currency || business.currency || 'EUR'}
                      className="text-4xl font-black text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400 font-medium">/{plan.interval}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 flex-1">{plan.description}</p>
                  
                  <ul className="space-y-4 mb-8">
                    {(plan.features || []).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 font-medium">
                        <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => trackClick(`subscribe_plan_${plan.id}`)}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform"
                  >
                    Subscribe Now
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="py-24 bg-gray-50 dark:bg-[#0A0A0A] border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
              Customer Reviews
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              See what our community has to say about our products and services.
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-[#111] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full border border-gray-100 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`} 
                        alt={review.profiles?.full_name || 'User'} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{review.profiles?.full_name || review.profiles?.username || 'Anonymous'}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-700'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed italic mb-4">
                    "{review.comment}"
                  </p>
                  
                  {review.listings && (
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product</span>
                      <span className="text-[10px] font-bold text-blue-500 truncate max-w-[150px]">{review.listings.title}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#111] rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No reviews yet for this business.</p>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
};
