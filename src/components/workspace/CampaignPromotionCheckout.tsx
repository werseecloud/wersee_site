import React, { useEffect, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type CheckoutConfig = {
  clientSecret: string;
  publishableKey: string;
  amountMinor: number;
  currency: string;
};

const PaymentForm = ({ campaignId, amountMinor, currency, onPaid, onCancel }: {
  campaignId: string;
  amountMinor: number;
  currency: string;
  onPaid: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/workspace/overview?view=management-ads&campaign=${campaignId}` },
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message || 'Payment could not be completed.');
      setProcessing(false);
      return;
    }
    const { data, error: statusError } = await supabase.functions.invoke('campaign-promotion-checkout', {
      body: { action: 'status', campaignId },
    });
    if (statusError || data?.status !== 'paid') {
      setError(data?.status === 'processing' ? 'Payment is still processing. Refresh shortly.' : statusError?.message || 'Payment has not been verified yet.');
      setProcessing(false);
      return;
    }
    onPaid();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/60 hover:bg-white/5">Back</button>
        <button disabled={!stripe || processing} className="flex-[2] rounded-xl bg-white px-4 py-3 font-black text-black disabled:opacity-40">
          {processing ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : `Pay ${new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format(amountMinor / 100)}`}
        </button>
      </div>
    </form>
  );
};

export const CampaignPromotionCheckout = ({ campaign, onClose, onPaid }: {
  campaign: { id: string; title: string };
  onClose: () => void;
  onPaid: () => void;
}) => {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.functions.invoke('campaign-promotion-checkout', { body: { action: 'create', campaignId: campaign.id } })
      .then(({ data, error: invokeError }) => {
        if (!active) return;
        if (invokeError || !data?.clientSecret || !data?.publishableKey) {
          setError(data?.error || invokeError?.message || 'Checkout could not be opened.');
          return;
        }
        setConfig(data as CheckoutConfig);
        setStripePromise(loadStripe(data.publishableKey));
      });
    return () => { active = false; };
  }, [campaign.id]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xl">
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d10] shadow-2xl md:grid-cols-[.9fr_1.1fr]">
        <button onClick={onClose} className="absolute right-5 top-5 z-10 rounded-full bg-white/5 p-2 text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-indigo-600/25 via-fuchsia-500/10 to-transparent p-8 md:border-b-0 md:border-r">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-500/25 blur-[90px]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-200"><Sparkles className="h-4 w-4" /> Promote on Wersee</div>
            <h2 className="mt-6 text-3xl font-black text-white">{campaign.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/45">A seven-day launch package built into the Wersee discovery surfaces.</p>
            <div className="mt-8 space-y-4">
              {[
                [Target, 'Relevant discovery', 'Target search and community placements using the campaign audience.'],
                [CheckCircle2, 'Real reporting', 'Impressions, clicks and conversions flow into campaign analytics.'],
                [ShieldCheck, 'Verified payment', 'The campaign activates only after Stripe confirms payment server-side.'],
              ].map(([Icon, title, copy]: any) => (
                <div key={title} className="flex gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-indigo-300" />
                  <div><p className="font-black text-white">{title}</p><p className="mt-1 text-xs leading-5 text-white/35">{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="min-h-[440px] p-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-white/35">Secure checkout</p>
          <h3 className="mt-2 text-2xl font-black text-white">Activate your promotion</h3>
          <div className="mt-8">
            {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : !config || !stripePromise ? (
              <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-300" /></div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret: config.clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#818cf8' } } }}>
                <PaymentForm campaignId={campaign.id} amountMinor={config.amountMinor} currency={config.currency.toUpperCase()} onPaid={onPaid} onCancel={onClose} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
