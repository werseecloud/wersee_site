import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Home,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Star,
  XCircle,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invokeApiRunner, supabase } from '../lib/supabase';
import { identifiers, routes, tryUserProductPath } from '../routing/routes';

type PaymentView = 'success' | 'processing' | 'failed' | 'cancelled' | 'error';

const BILLING_URL = 'https://billing.wersee.com';

const recommendedListingPath = (item: any) =>
  tryUserProductPath(item.profiles?.username, item.slug) ||
  routes.productById({ productId: identifiers.productId(String(item.id)) });

const normalizeStatus = (value: string | null): PaymentView | null => {
  switch (value?.toLowerCase()) {
    case 'success':
    case 'succeeded':
    case 'paid':
      return 'success';
    case 'processing':
    case 'pending':
      return 'processing';
    case 'failed':
    case 'payment_failed':
      return 'failed';
    case 'cancelled':
    case 'canceled':
    case 'abandoned':
    case 'incomplete':
      return 'cancelled';
    case 'error':
      return 'error';
    default:
      return null;
  }
};

const initialPaymentView = (
  explicitStatus: string | null,
  redirectStatus: string | null,
  hasLegacyOrder: boolean,
): PaymentView => {
  const normalized = normalizeStatus(explicitStatus);
  if (normalized) return normalized;
  if (redirectStatus === 'succeeded') return 'success';
  if (redirectStatus === 'processing') return 'processing';
  if (redirectStatus === 'failed') return 'cancelled';
  return hasLegacyOrder ? 'success' : 'error';
};

const safeInternalPath = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname === '/payment-success') return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

const statusContent: Record<PaymentView, {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  glow: string;
  primaryLabel: string;
}> = {
  success: {
    eyebrow: 'Payment confirmed',
    title: 'Your payment was successful',
    description: 'Thank you for your purchase. The payment provider confirmed your payment.',
    note: 'Your purchase history, subscriptions and receipts are available at billing.wersee.com.',
    icon: CheckCircle2,
    accent: 'text-emerald-300',
    glow: 'bg-emerald-400/15 border-emerald-300/20',
    primaryLabel: 'View purchase history',
  },
  processing: {
    eyebrow: 'Payment pending',
    title: 'Your payment is still processing',
    description: 'Your payment provider has not sent a final result yet. Do not start another payment while this one is being processed.',
    note: 'The final payment and receipt will appear at billing.wersee.com when processing is complete.',
    icon: Clock3,
    accent: 'text-blue-300',
    glow: 'bg-blue-400/15 border-blue-300/20',
    primaryLabel: 'Check billing',
  },
  failed: {
    eyebrow: 'Payment failed',
    title: 'The payment was declined',
    description: 'The payment provider could not complete this payment. No successful payment is being shown.',
    note: 'Try again with the same method or choose another available payment method.',
    icon: XCircle,
    accent: 'text-red-300',
    glow: 'bg-red-400/15 border-red-300/20',
    primaryLabel: 'Try payment again',
  },
  cancelled: {
    eyebrow: 'Payment not completed',
    title: 'You have not paid',
    description: 'You opened the payment provider, but the payment was not completed or confirmed.',
    note: 'Nothing has been marked as paid. You can safely return to checkout when you are ready.',
    icon: ArrowLeft,
    accent: 'text-amber-300',
    glow: 'bg-amber-400/15 border-amber-300/20',
    primaryLabel: 'Return to checkout',
  },
  error: {
    eyebrow: 'Payment error',
    title: 'We could not verify the payment',
    description: 'A technical error interrupted the payment flow. This screen does not mean that a payment succeeded.',
    note: 'Check billing.wersee.com before trying again. If no purchase appears, return to checkout.',
    icon: AlertCircle,
    accent: 'text-orange-300',
    glow: 'bg-orange-400/15 border-orange-300/20',
    primaryLabel: 'Check billing first',
  },
};

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const listingId = searchParams.get('listingId');
  const source = searchParams.get('source');
  const linkId = searchParams.get('link_id');
  const subscriptionId = searchParams.get('subscription_id');
  const redirectStatus = searchParams.get('redirect_status');
  const paymentIntentSecret = searchParams.get('payment_intent_client_secret');
  const retryPath = safeInternalPath(searchParams.get('return_to'));
  const [view, setView] = useState<PaymentView>(() =>
    initialPaymentView(searchParams.get('status'), redirectStatus, Boolean(orderId || listingId)),
  );
  const [recommendedListings, setRecommendedListings] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(Boolean(paymentIntentSecret));
  const content = statusContent[view];
  const StatusIcon = content.icon;
  const isQuickPay = source === 'quick-pay';
  const isSubscription = source === 'subscription';
  const isInvoice = source === 'invoice';

  const destinationLabel = useMemo(() => {
    if (retryPath) return 'Return to checkout';
    if (isQuickPay) return 'Go to Wersee';
    return 'Go to Workspace';
  }, [isQuickPay, retryPath]);

  useEffect(() => {
    if (!paymentIntentSecret) {
      setVerifying(false);
      return;
    }

    let cancelled = false;

    const verifyPaymentIntent = async () => {
      try {
        let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        try {
          const config = await invokeApiRunner('stripe-config', {}, 1, 800);
          if (typeof config?.publishableKey === 'string' && config.publishableKey) {
            publishableKey = config.publishableKey;
          }
        } catch {
          // The public build-time key remains a valid fallback.
        }
        if (!publishableKey) return;

        let stripeAccount: string | undefined;
        if (linkId) {
          const { data } = await supabase
            .from('quick_pay_links')
            .select('stripe_account_id')
            .eq('id', linkId)
            .maybeSingle();
          stripeAccount = data?.stripe_account_id && data.stripe_account_id !== 'sandbox'
            ? data.stripe_account_id
            : undefined;
        } else if (subscriptionId) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('seller_id')
            .eq('id', subscriptionId)
            .maybeSingle();
          if (subscription?.seller_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('stripe_account_id')
              .eq('id', subscription.seller_id)
              .maybeSingle();
            stripeAccount = profile?.stripe_account_id || undefined;
          }
        }

        const stripe = await loadStripe(
          publishableKey,
          stripeAccount ? { stripeAccount } : undefined,
        );
        if (!stripe) return;

        const result = await stripe.retrievePaymentIntent(paymentIntentSecret);
        if (cancelled || !result.paymentIntent) return;

        const intent = result.paymentIntent;
        if (intent.status === 'succeeded') setView('success');
        else if (intent.status === 'processing') setView('processing');
        else if (intent.status === 'canceled') setView('cancelled');
        else if (intent.status === 'requires_payment_method') {
          setView(intent.last_payment_error ? 'failed' : 'cancelled');
        } else if (intent.status === 'requires_action' || intent.status === 'requires_confirmation') {
          setView('cancelled');
        }
      } catch (error) {
        console.warn('Payment status verification was unavailable', error);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };

    void verifyPaymentIntent();
    return () => {
      cancelled = true;
    };
  }, [linkId, paymentIntentSecret, subscriptionId]);

  useEffect(() => {
    if (view !== 'success' || !listingId) return;

    const fetchRecommendations = async () => {
      try {
        const { data: purchasedListing } = await supabase
          .from('listings')
          .select('category, seller_id')
          .eq('id', listingId)
          .single();

        if (!purchasedListing) return;
        const { data } = await supabase
          .from('listings')
          .select('*, profiles(username, avatar_url)')
          .neq('id', listingId)
          .or(`seller_id.eq.${purchasedListing.seller_id},category.eq.${purchasedListing.category}`)
          .limit(3);
        setRecommendedListings(data || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    void fetchRecommendations();
  }, [listingId, view]);

  const handlePrimaryAction = () => {
    if (view === 'success' || view === 'processing' || view === 'error') {
      window.location.assign(BILLING_URL);
      return;
    }
    if (retryPath) navigate(retryPath);
    else navigate(-1);
  };

  const handleSecondaryAction = () => {
    if (retryPath) {
      navigate(retryPath);
      return;
    }
    navigate(isQuickPay ? '/' : '/workspace');
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#070707] px-5 py-10 text-white sm:px-8">
      <div className={`pointer-events-none absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full blur-[150px] ${content.glow.split(' ')[0]}`} />
      <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <a href="/" className="text-lg font-black tracking-tight text-white">Wersee</a>
          <a
            href={BILLING_URL}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ReceiptText className="h-4 w-4" />
            Billing
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <motion.section
            key={view}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl text-center"
          >
            <div className={`mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[28px] border ${content.glow}`}>
              {verifying ? (
                <Loader2 className={`h-9 w-9 animate-spin ${content.accent}`} />
              ) : (
                <StatusIcon className={`h-9 w-9 ${content.accent}`} />
              )}
            </div>
            <p className={`text-xs font-black uppercase tracking-[0.25em] ${content.accent}`}>
              {verifying ? 'Verifying payment' : content.eyebrow}
            </p>
            <h1 className="mx-auto mt-4 max-w-xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              {verifying ? 'Checking your payment status' : content.title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
              {verifying ? 'Wersee is asking the payment provider for the latest result.' : content.description}
            </p>

            {!verifying && (
              <>
                <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
                  <div className="flex items-start gap-3">
                    <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-white/45" />
                    <p className="text-sm leading-6 text-white/55">{content.note}</p>
                  </div>
                  {orderId && (
                    <p className="mt-4 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Reference: {orderId}
                    </p>
                  )}
                </div>

                <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-white/90"
                  >
                    {view === 'failed' || view === 'cancelled' ? <RefreshCw className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                    {content.primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSecondaryAction}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    {retryPath ? <ArrowLeft className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                    {destinationLabel}
                  </button>
                </div>
              </>
            )}
          </motion.section>
        </main>

        {view === 'success' && recommendedListings.length > 0 && (
          <section className="border-t border-white/10 py-12">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Star className="h-5 w-5 text-yellow-400" />
              You might also like
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {recommendedListings.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate(recommendedListingPath(item))}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] text-left transition hover:bg-white/[0.07]"
                >
                  <div className="aspect-video bg-white/5">
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-1 font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/40">
                      {item.price === 0 ? 'Free' : `€${item.price}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-center gap-x-2 py-4 text-center text-xs text-white/30">
          <ShoppingBag className="h-3.5 w-3.5" />
          {isSubscription ? 'Subscription payment' : isQuickPay ? 'Quick Pay' : isInvoice ? 'Invoice payment' : 'Wersee checkout'}
          <span aria-hidden="true">·</span>
          Secure provider status
        </footer>
      </div>
    </div>
  );
};
