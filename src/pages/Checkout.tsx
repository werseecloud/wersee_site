import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  User,
  Zap
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export const Checkout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selected3DLicense, setSelected3DLicense] = useState<any>(null);

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
        let { data, error } = await supabase
          .from('listings')
          .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url, stripe_onboarding_complete)')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          // Fallback if stripe_onboarding_complete is missing
          if (error.code === '42703') {
            console.warn('stripe_onboarding_complete column missing, falling back to basic profile fetch');
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('listings')
              .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
              .eq('id', id)
              .maybeSingle();
            
            if (fallbackError) throw fallbackError;
            data = fallbackData;
            if (data && data.profiles) {
              data.profiles.stripe_onboarding_complete = true; // Assume complete if column missing
            }
          } else {
            throw error;
          }
        }
        
        setListing(data);

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
      rawPrice = listing?.price || 0;
    }
    return Number(rawPrice) || 0;
  };

  const planName = selectedPlan !== null ? listing?.plans?.[selectedPlan]?.name : null;
  const price = getPrice();
  const isFree = price === 0;
  const isSandbox = !isFree && listing?.profiles?.stripe_onboarding_complete === false;

  const handleSandboxCheckout = async () => {
    toast.error('Sandbox payment simulation is disabled. Complete Stripe onboarding before accepting paid orders.');
  };

  const handleContinueToPayment = async () => {
    if (!email && !user) {
      toast.error('Please enter your email address.');
      return;
    }

    if (isFree) {
      // Handle free product checkout
      setProcessing(true);
      try {
        if (listing.type === 'asset_3d') {
          if (!selected3DLicense?.id) {
            throw new Error('Select a license before checkout.');
          }
          const freeOrder = await invokeApiRunner('3d/create-free-order', {
            listingId: listing.id,
            licenseId: selected3DLicense.id,
          });
          if (freeOrder.error) throw new Error(freeOrder.error);
          navigate(`/payment-success?listingId=${listing.id}&order_id=${freeOrder.orderId}`);
          return;
        }

        // Create order directly for free product
        const { error } = await supabase.from('orders').insert({
          buyer_id: user?.id || null,
          seller_id: listing.seller_id,
          listing_id: listing.id,
          amount: 0,
          currency: 'eur',
          status: 'completed',
          net_amount: 0,
          metadata: {
            email: email || user?.email
          }
        });
        
        if (error) throw error;
        navigate(`/payment-success?listingId=${listing.id}`);
      } catch (err: any) {
        console.error('Free checkout error:', err);
        toast.error('Failed to process free checkout.');
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (isSandbox) {
      await handleSandboxCheckout();
      return;
    }

    setProcessing(true);
    try {
      const resData = await invokeApiRunner('create-listing-checkout', {
        listingId: id,
        planIndex: selectedPlan,
        licenseId: selected3DLicense?.id || licenseParam || undefined,
        userId: user?.id,
        successUrl: `${window.location.origin}/payment-success?order_id={CHECKOUT_SESSION_ID}&listingId=${listing.id}`,
        cancelUrl: window.location.href,
        uiMode: 'embedded'
      });

      if (resData.error) {
        throw new Error(resData.error || 'Checkout failed');
      }

      if (resData.clientSecret) {
        setClientSecret(resData.clientSecret);
        setStep(2);
      } else {
        throw new Error('No client secret returned');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment setup failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  if (!listing && !loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white">
        <header className="bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-300">Back</span>
          </div>
          <div className="font-black text-xl tracking-tighter text-white">WERSEE</div>
          <div className="w-16"></div>
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
        <div className="w-16"></div> {/* Spacer for centering */}
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
                  
                  {/* Sandbox Notice */}
                  {isSandbox && (
                    <div className="mb-8 p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-amber-500">Sandbox Mode</h3>
                      </div>
                      <p className="text-sm text-amber-500/80 leading-relaxed">
                        This seller hasn't completed Stripe onboarding yet. You are currently in <strong>Sandbox Mode</strong>. 
                        Payments are simulated and no real money will be charged. 
                        <br /><br />
                        <span className="text-xs opacity-75 italic">
                          Note: Since this is a sandbox listing, it is only visible to the seller and for testing purposes.
                        </span>
                      </p>
                    </div>
                  )}

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
                            <div className="text-2xl font-black mb-2 text-white">€{plan.price}</div>
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
                      <span className="font-bold text-lg text-white">Total Price</span>
                      <span className="text-3xl font-black text-white">{isFree ? 'Free' : `€${price.toFixed(2)}`}</span>
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
                        <div className="flex items-center gap-3 mt-4 p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                          <input 
                            type="checkbox" 
                            id="createAccount"
                            checked={createAccount}
                            onChange={(e) => setCreateAccount(e.target.checked)}
                            className="w-5 h-5 accent-white rounded"
                          />
                          <label htmlFor="createAccount" className="text-sm text-gray-400 cursor-pointer select-none">
                            Create an account for me (we'll send you a magic link)
                          </label>
                        </div>
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

                  <button 
                    onClick={handleContinueToPayment}
                    disabled={processing || (!user && !email)}
                    className="w-full mt-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isFree ? (user ? 'Continue with Wersee account' : 'Get for Free') : 'Continue to Payment'} <ArrowRight className="w-5 h-5" />
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
