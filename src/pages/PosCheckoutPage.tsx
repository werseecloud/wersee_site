import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { Loader2, ShoppingBag, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';

const CheckoutForm = ({ checkout, onComplete }: { checkout: any, onComplete: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'points'>('stripe');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handlePointsPayment = async () => {
    if (!userProfile) {
      setErrorMessage('Please log in to use Wersee Points.');
      return;
    }

    const pointsNeeded = Math.round(checkout.total_amount * 100);
    if (userProfile.wersee_points < pointsNeeded) {
      setErrorMessage(`Insufficient points. You need ${pointsNeeded} points.`);
      return;
    }

    setLoading(true);
    try {
      const resData = await invokeApiRunner('pay-with-points', {
        userId: userProfile.id,
        amount: checkout.total_amount,
        description: `POS Order: ${checkout.id}`,
        sellerId: checkout.user_id,
        metadata: {
          source: 'pos',
          checkout_id: checkout.id
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Payment failed');
      }

      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href + '?success=true',
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setLoading(false);
    } else {
      // Payment succeeded!
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setPaymentMethod('stripe')}
          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${paymentMethod === 'stripe' ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-xs font-bold">Stripe</span>
        </button>
        <button 
          onClick={() => setPaymentMethod('points')}
          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${paymentMethod === 'points' ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <span className="text-xs font-bold">Points</span>
        </button>
      </div>

      {paymentMethod === 'stripe' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            disabled={!stripe || loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ${checkout.currency?.toUpperCase()} ${checkout.total_amount?.toFixed(2)}`}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Your Balance</span>
              <span className="font-mono font-bold text-yellow-600">{userProfile?.wersee_points?.toLocaleString() || 0} Points</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Cost</span>
              <span className="font-mono font-bold">{(checkout.total_amount * 100).toLocaleString()} Points</span>
            </div>
            {!userProfile && (
              <p className="text-xs text-red-500 font-medium">Please log in to use your points.</p>
            )}
            {userProfile && userProfile.wersee_points < (checkout.total_amount * 100) && (
              <p className="text-xs text-red-500 font-medium">Insufficient points balance.</p>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            onClick={handlePointsPayment}
            disabled={loading || !userProfile || userProfile.wersee_points < (checkout.total_amount * 100)}
            className="w-full py-4 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay with ${(checkout.total_amount * 100).toLocaleString()} Points`}
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
        <ShieldCheck className="w-3 h-3" /> {paymentMethod === 'stripe' ? 'Secure Payment by Stripe' : 'Secure Payment by Wersee'}
      </div>
    </div>
  );
};

export const PosCheckoutPage = () => {
  const { username, systemname, checkout_name, checkout_id, id } = useParams();
  const actualCheckoutId = checkout_id || id;
  const [checkout, setCheckout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        const { data, error } = await supabase
          .from('pos_checkouts')
          .select('*')
          .eq('id', actualCheckoutId)
          .single();

        if (error || !data) throw new Error('Checkout not found');
        
        setCheckout(data);

        // Fetch user's Stripe account ID
        const { data: userData } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', data.user_id)
          .maybeSingle();

        // Create Payment Intent
        const resData = await invokeApiRunner('create-payment-intent', {
          amount: data.total_amount,
          currency: data.currency,
          description: `POS Order: ${checkout_name}`,
          accountId: userData?.stripe_account_id,
          metadata: {
            checkout_id: data.id,
            system_name: systemname
          }
        });

        if (resData.error) {
          throw new Error(resData.error || 'Failed to create payment intent');
        }

        const { client_secret } = resData;
        
        setClientSecret(client_secret);
        
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
          setStripePromise(loadStripe(pk, userData?.stripe_account_id ? { stripeAccount: userData.stripe_account_id } : undefined));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (actualCheckoutId) fetchCheckout();
  }, [actualCheckoutId, checkout_name, systemname]);

  const handlePaymentComplete = async () => {
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Checkout Error</h1>
        <p className="text-gray-500 mt-2">{error || 'Checkout session not found'}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-emerald-500 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white text-emerald-500 rounded-full p-6 mb-6 shadow-xl"
        >
          <CheckCircle2 className="w-16 h-16" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Payment Submitted</h1>
        <p className="text-emerald-100 text-lg">Stripe is confirming your payment for {systemname?.replace('-', ' ').toUpperCase()}.</p>
        <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
          <p className="font-mono text-sm opacity-80">Order ID: {checkout_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO 
        title={`Checkout - ${systemname}`} 
        description="Secure checkout"
        url={window.location.pathname}
        noIndex={true}
      />
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg">
              {systemname?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-sm text-gray-900">{systemname?.replace('-', ' ').toUpperCase()}</h1>
              <p className="text-xs text-gray-500">Secure Checkout</p>
            </div>
          </div>
          <div className="font-mono font-bold text-lg">
            {checkout.currency?.toUpperCase()} {checkout.total_amount?.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-6 space-y-8">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Order Summary</h2>
            <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded-full text-gray-600">{checkout.items?.length || 0} Items</span>
          </div>
          <div className="divide-y divide-gray-50">
            {checkout.items?.map((item: any, i: number) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 m-3 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-mono font-medium text-sm">
                  {checkout.currency?.toUpperCase()} {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl font-mono">{checkout.currency?.toUpperCase()} {checkout.total_amount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        {clientSecret && stripePromise && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-6">Payment Method</h2>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { borderRadius: '12px', colorPrimary: '#000000' } } }}>
              <CheckoutForm checkout={checkout} onComplete={handlePaymentComplete} />
            </Elements>
          </div>
        )}
      </div>
      
      <div className="py-6 text-center text-xs text-gray-400">
        Powered by Wersee POS
      </div>
    </div>
  );
};
