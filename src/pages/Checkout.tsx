import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  ChevronLeft, 
  Mail, 
  CheckCircle2, 
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Trash2,
  Store,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { LocalizedPrice } from '../components/store/LocalizedPrice';
import { LocaleCurrencyPicker } from '../components/store/LocaleCurrencyPicker';
import { useLocale } from '../context/LocaleContext';
import { resolveProductPricing } from '../lib/productOffers';
import { trackProductConversion } from '../lib/productConversion';
import { useCart } from '../lib/cart';
import { getAnonymousConsentId } from '../lib/privacyConsent';
import { trustCenterAction, TrustCenterError, type ComplianceDecision } from '../lib/trustCenter';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export const Checkout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, currency } = useLocale();
  const { items: cartItems, removeItem } = useCart();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [selected3DLicense, setSelected3DLicense] = useState<any>(null);
  const [sellerTrace, setSellerTrace] = useState<any>(null);
  const [immediateDeliveryRequested, setImmediateDeliveryRequested] = useState(false);
  const [withdrawalEffectAcknowledged, setWithdrawalEffectAcknowledged] = useState(false);
  const [complianceDecision, setComplianceDecision] = useState<ComplianceDecision | null>(null);
  const checkoutIdempotencyKey = useRef(crypto.randomUUID());

  const planIdxParam = searchParams.get('plan');
  const licenseParam = searchParams.get('license');
  
  useEffect(() => {
    if (planIdxParam !== null) {
      setSelectedPlan(parseInt(planIdxParam));
    }
  }, [planIdxParam]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, product_offers(*), profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        
        setListing(data);

        if (data?.seller_id) {
          const { data: trace } = await supabase
            .from('dsa_seller_verifications')
            .select('trader_status,country_code,status')
            .eq('seller_id', data.seller_id)
            .maybeSingle();
          setSellerTrace(trace);
        }

        if (data?.type === 'asset_3d' && licenseParam) {
          const { data: licenseData, error: licenseError } = await supabase
            .from('product_3d_licenses')
            .select('*, product_3d_license_prices(*)')
            .eq('id', licenseParam)
            .eq('listing_id', id)
            .eq('active', true)
            .maybeSingle();
          if (licenseError) throw licenseError;
          setSelected3DLicense(licenseData);
        }
        
        if (data && data.plans && data.plans.length > 0 && selectedPlan === null) {
          setSelectedPlan(0); // Default to first plan if plans exist
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    } else {
      setLoading(false);
    }
  }, [id, selectedPlan, licenseParam]);

  const getPrice = () => {
    let rawPrice = 0;
    if (selectedPlan !== null && listing?.plans?.[selectedPlan]) {
      rawPrice = listing.plans[selectedPlan].price;
    } else if (listing?.type === 'asset_3d' && selected3DLicense?.product_3d_license_prices?.[0]) {
      const licensePrice = selected3DLicense.product_3d_license_prices[0];
      rawPrice = Number(licensePrice.sale_price_minor ?? licensePrice.price_minor ?? 0) / 100;
    } else {
      rawPrice = resolveProductPricing(listing).currentPrice;
    }
    return Number(rawPrice) || 0;
  };

  const getBaseCurrency = () => {
    if (selectedPlan !== null && listing?.plans?.[selectedPlan]) {
      return (listing.plans[selectedPlan].currency || listing.currency || listing.base_currency || 'EUR').toUpperCase();
    }
    if (listing?.type === 'asset_3d' && selected3DLicense?.product_3d_license_prices?.[0]) {
      return (selected3DLicense.product_3d_license_prices[0].currency || listing.currency || listing.base_currency || 'EUR').toUpperCase();
    }
    return (listing?.currency || listing?.base_currency || 'EUR').toUpperCase();
  };

  const planName = selectedPlan !== null ? listing?.plans?.[selectedPlan]?.name : null;
  const price = getPrice();
  const baseCurrency = getBaseCurrency();
  const checkoutPricing = resolveProductPricing(listing);
  const isFree = price === 0;
  const isDigitalProduct = ['digital', 'course', 'software', 'asset_3d', 'music', 'beat', 'template', 'virtual', 'community'].includes(String(listing?.type || '').toLowerCase());
  const isSubscription = Boolean(listing?.pricing_type === 'subscription' || listing?.billing_interval || listing?.metadata?.subscription_interval);

  const handleContinueToPayment = async () => {
    setPaymentError('');
    if (!email && !user) {
      toast.error('Please enter your email address.');
      return;
    }

    if (!isFree && !stripePromise) {
      const message = 'Secure payments are temporarily unavailable. Please try again later.';
      setPaymentError(message);
      toast.error(message);
      return;
    }

    setProcessing(true);
    try {
      void trackProductConversion(String(listing.id), 'checkout_started', 'checkout');
      const resData = await trustCenterAction<{
        success: true;
        clientSecret?: string;
        free?: boolean;
        orderId?: string;
        decision: ComplianceDecision;
      }>('create-checkout', {
        listingId: listing.id,
        offerId: checkoutPricing.offer?.id,
        planIndex: selectedPlan,
        licenseId: selected3DLicense?.id || licenseParam || undefined,
        customerEmail: email || user?.email,
        anonymousId: getAnonymousConsentId(),
        countryCode: locale.split('-')[1] || undefined,
        preferredCurrency: currency,
        immediateDeliveryRequested,
        withdrawalEffectAcknowledged,
        idempotencyKey: checkoutIdempotencyKey.current,
        successUrl: `${window.location.origin}/payment-success?order_id={CHECKOUT_SESSION_ID}&listingId=${listing.id}`,
      });
      setComplianceDecision(resData.decision);

      if (resData.free && resData.orderId) {
        navigate(`/payment-success?listingId=${listing.id}&order_id=${resData.orderId}`);
        return;
      }

      if (resData.clientSecret) {
        setClientSecret(resData.clientSecret);
        setStep(2);
      } else {
        throw new Error('No client secret returned');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const code = String(err?.code || '').toUpperCase();
      const rawMessage = String(err?.message || '');
      const sellerNotReady = [
        'STRIPE_ONBOARDING_INCOMPLETE',
        'SELLER_PAYMENTS_DISABLED',
        'ACCOUNT_CHARGES_DISABLED',
        'STRIPE_ACCOUNT_INACCESSIBLE',
      ].includes(code) || /onboarding|charges.enabled|connected account|accept payments/i.test(rawMessage);
      const complianceDetails = err instanceof TrustCenterError && err.details && typeof err.details === 'object'
        ? err.details as ComplianceDecision
        : null;
      if (complianceDetails) setComplianceDecision(complianceDetails);
      const consentRequired = code === 'COMPLIANCE_BLOCKED' && isDigitalProduct && (!immediateDeliveryRequested || !withdrawalEffectAcknowledged);
      const message = consentRequired
        ? 'Confirm both digital-delivery choices before continuing.'
        : sellerNotReady
        ? 'This seller cannot accept payments yet. Their payment account still needs verification.'
        : rawMessage || 'Payment setup failed. Please try again.';
      setPaymentError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  if (!id) {
    return (
      <div className="min-h-[100dvh] bg-[#060606] text-white">
        <header className="sticky top-0 z-50 px-4 py-4 sm:px-6">
          <div className="liquid-glass-pill mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-3 sm:px-5">
            <button type="button" onClick={() => navigate(-1)} className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            <Link to="/" className="text-lg font-black italic tracking-tighter">WERSEE</Link>
            <LocaleCurrencyPicker className="justify-end" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-blue-300">Your Wersee cart</p>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Ready when you are.</h1>
            </div>
            <div className="liquid-glass-pill hidden rounded-full px-5 py-3 text-sm font-bold text-white/70 sm:block">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {cartItems.length === 0 ? (
            <section className="liquid-glass-pill flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06]">
                <ShoppingBag className="h-9 w-9 text-white/55" />
              </div>
              <h2 className="text-2xl font-black">Your cart is empty</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">Browse the storefront and add a product, course, service, or digital download to continue.</p>
              <button onClick={() => navigate('/')} className="mt-7 flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-black transition hover:scale-[1.02] hover:bg-white/90">
                <Store className="h-4 w-4" /> Explore the store
              </button>
            </section>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const checkoutPath = `/checkout/${item.listingId}${item.planIndex !== undefined ? `?plan=${item.planIndex}` : ''}`;
                return (
                  <article key={`${item.listingId}:${item.planIndex ?? ''}`} className="liquid-glass-pill grid gap-5 rounded-[2rem] p-4 sm:grid-cols-[112px_1fr_auto] sm:items-center sm:p-5">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
                      {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <ShoppingBag className="m-auto h-full w-8 text-white/25" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">{item.type.replace('_', ' ')}</p>
                      <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{item.title}</h2>
                      <LocalizedPrice amount={item.price} baseCurrency={item.currency} className="mt-3 block text-lg font-black text-white/80" showOriginal={false} />
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                      <button onClick={() => navigate(checkoutPath)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-black transition hover:bg-white/90">
                        Checkout <ArrowRight className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeItem(item.listingId, item.planIndex)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-red-500/10 hover:text-red-300" aria-label={`Remove ${item.title} from cart`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!listing && !loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white">
        <header className="bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-300">Back</span>
          </div>
          <div className="font-black text-xl tracking-tighter text-white">WERSEE</div>
          <LocaleCurrencyPicker className="justify-end" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <button onClick={() => navigate('/')} className="mt-4 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all">
            Go to Store
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Plan & Details', icon: ShoppingBag },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Confirmation', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white">
      {/* Simple Header */}
      <header className="bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5 text-gray-400" />
          <span className="font-bold text-gray-300">Back</span>
        </div>
        <div className="font-black text-xl tracking-tighter text-white">WERSEE</div>
        <LocaleCurrencyPicker className="justify-end" />
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {/* Step Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    step >= s.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-[#1A1A1A] text-gray-500'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`mt-3 text-sm font-bold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>
                  {s.name}
                </span>
                {idx < steps.length - 1 && (
                  <div className="absolute top-6 left-12 w-[calc(100vw/3)] max-w-[180px] h-[2px] bg-[#1A1A1A] -z-10">
                    <div 
                      className="h-full bg-white transition-all duration-500" 
                      style={{ width: step > s.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 items-start">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 text-white">Select Plan & Details</h2>
                  
                  {/* Product Summary */}
                  <div className="flex gap-6 p-6 bg-[#1A1A1A] rounded-[2rem] border border-white/5 mb-8">
                    <div className="w-24 h-24 bg-[#252525] rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img 
                        src={listing.images?.[0] || 'https://picsum.photos/seed/product/400/400'} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-white">{listing.title}</h3>
                      <p className="text-gray-400 capitalize">{listing.type}</p>
                      {listing.type === 'asset_3d' && selected3DLicense && (
                        <p className="mt-2 inline-flex rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-gray-300">
                          {selected3DLicense.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Plans Selection */}
                  {listing.plans && listing.plans.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-4 text-white">Choose a Plan</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {listing.plans.map((plan: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedPlan(idx)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              selectedPlan === idx ? 'border-white bg-white/5' : 'border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-white">{plan.name}</span>
                              {selectedPlan === idx && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                            <LocalizedPrice
                              amount={plan.price}
                              baseCurrency={plan.currency || listing.currency || listing.base_currency || 'EUR'}
                              className="text-2xl font-black mb-2 text-white"
                              showOriginal={false}
                            />
                            <ul className="space-y-1">
                              {plan.features?.map((f: string, i: number) => (
                                <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Display if no plans */}
                  {(!listing.plans || listing.plans.length === 0) && (
                    <div className="mb-8 flex justify-between items-center p-6 bg-[#1A1A1A] rounded-2xl border border-white/5">
                      <div><span className="font-bold text-lg text-white">Total Price</span>{checkoutPricing.isOnSale && <p className="mt-1 text-xs font-bold text-emerald-400">You save {checkoutPricing.discountPercent}%</p>}</div>
                      <div className="text-right">{checkoutPricing.isOnSale && <LocalizedPrice amount={checkoutPricing.originalPrice} baseCurrency={baseCurrency} className="mb-1 block text-sm font-bold text-gray-500 line-through" />}<LocalizedPrice amount={price} baseCurrency={baseCurrency} className="text-3xl font-black text-white" /></div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-6">
                    {!user ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-[#1A1A1A] text-white outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all placeholder-gray-600"
                          />
                        </div>
                        <p className="mt-3 text-xs leading-5 text-gray-500">Your receipt and access instructions are sent to this address. Account creation is always a separate choice.</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold">
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Logged in as</span>
                          <span className="font-bold text-white">{user.email}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isDigitalProduct && (
                    <fieldset className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/[0.08] p-4 sm:p-5">
                      <legend className="px-1 text-sm font-black text-blue-100">Digital delivery choice</legend>
                      <p className="mb-4 text-xs leading-5 text-blue-100/65">
                        These choices are never preselected. They apply only if you want access to start immediately.
                      </p>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                          <input
                            type="checkbox"
                            checked={immediateDeliveryRequested}
                            onChange={(event) => setImmediateDeliveryRequested(event.target.checked)}
                            className="mt-0.5 h-5 w-5 shrink-0 accent-blue-400"
                          />
                          <span className="text-sm leading-5 text-white/85">I request immediate access to this digital content.</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                          <input
                            type="checkbox"
                            checked={withdrawalEffectAcknowledged}
                            onChange={(event) => setWithdrawalEffectAcknowledged(event.target.checked)}
                            className="mt-0.5 h-5 w-5 shrink-0 accent-blue-400"
                          />
                          <span className="text-sm leading-5 text-white/85">I understand that once delivery begins, my statutory withdrawal right may be affected or lost where applicable.</span>
                        </label>
                      </div>
                      <details className="mt-3 text-xs text-blue-100/65">
                        <summary className="cursor-pointer font-bold text-blue-100">Why is this needed?</summary>
                        <p className="mt-2 leading-5">Digital access can begin before a normal withdrawal period ends. Wersee stores your exact choice, its wording, the product and the applicable policy version.</p>
                      </details>
                    </fieldset>
                  )}

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-white/55">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                      <div>
                        <p className="font-bold text-white/80">Purchase details</p>
                        <p className="mt-1">Sold by a {sellerTrace?.trader_status === 'business' ? 'business seller' : 'private seller'}. {isSubscription ? `Recurring ${listing.billing_interval || listing.metadata?.subscription_interval || 'monthly'} billing; cancel from your account.` : 'One-time purchase.'}</p>
                        <p>Applicable tax {String(listing.type).toLowerCase() === 'physical' ? 'and shipping ' : ''}is shown before the final Stripe payment confirmation.</p>
                      </div>
                    </div>
                  </div>

                  {complianceDecision && complianceDecision.disclosures?.length > 0 && (
                    <div className="mt-4 space-y-2" aria-label="Checkout disclosures">
                      {complianceDecision.disclosures.map((disclosure) => (
                        <div key={disclosure.code} className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/60">
                          <span className="font-bold text-white/80">{disclosure.title}.</span> {disclosure.explanation}
                        </div>
                      ))}
                    </div>
                  )}

                  {paymentError && (
                    <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                      <div>
                        <p className="font-bold">Payment could not start</p>
                        <p className="mt-1 text-red-100/70">{paymentError}</p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleContinueToPayment}
                    disabled={processing || (!user && !email) || (isDigitalProduct && (!immediateDeliveryRequested || !withdrawalEffectAcknowledged))}
                    className="w-full mt-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isFree ? (user ? 'Get access' : 'Sign in to get access') : 'Continue to secure payment'} <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && clientSecret && !isFree && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
                    <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  </div>

                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
