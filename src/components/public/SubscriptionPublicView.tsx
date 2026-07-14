import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Loader2, AlertCircle, ShieldCheck, Zap, Star, Check, ArrowLeft, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../SEO';

import { appToast } from '@/lib/feedback';
const SubscriptionForm = ({ subscription, clientSecret, returnUrl }: { subscription: any, clientSecret: string, returnUrl: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </motion.div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="group relative w-full py-4 bg-white text-black rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        {processing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Subscribe for {subscription.currency === 'eur' ? '€' : subscription.currency === 'usd' ? '$' : '£'}{subscription.price.toFixed(2)}/{subscription.billing_period}</span>
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-widest">
        <ShieldCheck className="w-4 h-4" />
        <span>Secure payment via Stripe</span>
      </div>
    </form>
  );
};

export const SubscriptionPublicView = () => {
  const { username, slug } = useParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [initializing, setInitializing] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        // 1. Fetch Subscription
        const cleanUsername = username?.replace('@', '');
        const { data: subData, error: dbError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('username', cleanUsername)
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (dbError || !subData) throw new Error('Subscription plan not found');
        setSubscription(subData);

        // 2. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_account_id, business_name, avatar_url')
          .eq('id', subData.seller_id)
          .single();

        if (profileError || !profileData?.stripe_account_id) {
          throw new Error('Seller payment setup incomplete');
        }
        setProfile(profileData);

        // Initialize Stripe
        let pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        try {
          const config = await invokeApiRunner('stripe-config', {});
          if (config && config.publishableKey) {
            pk = config.publishableKey;
          }
        } catch (err: any) {
          console.warn('Could not fetch Stripe config', err);
          if (err.message && err.message.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
            setError(err.message);
            return;
          }
        }
        if (pk) {
          setStripePromise(loadStripe(pk, { stripeAccount: profileData.stripe_account_id }));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) fetchSubscription();
  }, [username, slug]);

  const handleStartSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setInitializing(true);
    try {
      const resData = await invokeApiRunner('create-subscription', {
        accountId: profile.stripe_account_id,
        priceId: subscription.stripe_price_id,
        email,
        name,
        metadata: {
          subscriptionId: subscription.id,
          slug: subscription.slug
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Failed to initialize subscription');
      }

      const { clientSecret } = resData;
      setClientSecret(clientSecret);
      setStep('payment');

    } catch (err: any) {
      console.error(err);
      appToast(err.message);
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Plan Not Found</h1>
        <p className="text-gray-400 text-lg max-w-md">{error}</p>
      </div>
    );
  }

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#ffffff',
      colorBackground: '#0A0A0A',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
      colorTextSecondary: '#a1a1aa',
      colorBorder: 'rgba(255,255,255,0.1)',
    },
    rules: {
      '.Input': {
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'none',
        padding: '12px 16px',
      },
      '.Input:focus': {
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
      },
      '.Label': {
        color: '#a1a1aa',
        fontWeight: '500',
        fontSize: '14px',
        marginBottom: '8px',
      },
      '.Tab': {
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'none',
      },
      '.Tab--selected': {
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      <SEO 
        title={`${subscription.name} - ${profile?.business_name}`}
        description={subscription.description}
        image={profile?.avatar_url}
        url={`/@${username}/subscriptions/${slug}`}
        type="product"
      />
      
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-5xl bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
      >
        {/* Left Side: Plan Info */}
        <div className="w-full md:w-5/12 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-4 mb-12">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.business_name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400 font-medium">Subscribe to</p>
                <h2 className="text-lg font-bold text-white leading-tight">{profile?.business_name}</h2>
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">
                <Star className="w-3 h-3" />
                {subscription.name}
              </div>
              
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-6xl sm:text-7xl font-black tracking-tighter text-white">
                  {subscription.currency === 'eur' ? '€' : subscription.currency === 'usd' ? '$' : '£'}
                  {typeof subscription.price === 'number' ? subscription.price.toFixed(2) : subscription.price}
                </span>
                <span className="text-gray-500 text-xl font-medium">/{subscription.billing_period}</span>
              </div>
              
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {subscription.description}
              </p>

              {subscription.features && Array.isArray(subscription.features) && subscription.features.length > 0 && (
                <div className="space-y-3 mb-8">
                  {subscription.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {subscription.trial_period_days > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex items-start gap-4">
                <div className="p-2 bg-white/10 rounded-xl shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{subscription.trial_period_days} days free</p>
                  <p className="text-sm text-gray-400 mt-1">You won't be charged until the trial ends. Cancel anytime.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="font-medium">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="font-medium">Secure payment processing</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="font-medium">Instant access to benefits</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 bg-[#0A0A0A] flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              {step === 'details' ? (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Your Details</h2>
                    <p className="text-gray-400 text-lg">Enter your information to continue.</p>
                  </div>

                  <form onSubmit={handleStartSubscription} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={initializing || !name || !email}
                      className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 mt-8"
                    >
                      {initializing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue to Payment'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button 
                    onClick={() => setStep('details')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to details
                  </button>

                  <h2 className="text-3xl font-bold mb-8 tracking-tight">Payment Method</h2>
                  
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: appearance as any }}>
                      <SubscriptionForm 
                        subscription={subscription} 
                        clientSecret={clientSecret} 
                        returnUrl={`${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`} 
                      />
                    </Elements>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
