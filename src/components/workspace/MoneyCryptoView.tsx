import React, { useCallback, useEffect, useState } from 'react';
import { loadStripeOnramp } from '@stripe/crypto';
import { AlertTriangle, Clock3, Loader2 } from 'lucide-react';
import { CryptoElements, OnrampElement } from './StripeCryptoElements';
import { invokeApiRunner } from '../../lib/supabase';

const cryptoOnrampEnabled = String(import.meta.env.VITE_STRIPE_CRYPTO_ONRAMP_ENABLED || '')
  .trim()
  .toLowerCase() === 'true';

const isOnrampUnavailableError = (error: any) =>
  error?.code === 'STRIPE_ONRAMP_NOT_ENABLED'
  || String(error?.message || '').toLowerCase().includes('onramp is not enabled');

export const MoneyCryptoView = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [stripeOnrampPromise, setStripeOnrampPromise] = useState<any>(null);

  const initializeOnramp = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnavailable(null);
    setClientSecret('');

    if (!cryptoOnrampEnabled) {
      setUnavailable('Crypto purchases are not available yet. Wersee will enable this screen after Stripe approves Crypto Onramp for the platform account.');
      setLoading(false);
      return;
    }

    try {
      let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      const config = await invokeApiRunner('stripe-config');
      if (config?.publishableKey) publishableKey = config.publishableKey;

      if (!publishableKey) {
        throw new Error('Stripe publishable key is not configured.');
      }

      const onramp = loadStripeOnramp(publishableKey);
      const session = await invokeApiRunner('create-onramp-session', {
        source_currency: 'eur',
        source_amount: '25.00',
        destination_currency: 'usdc',
        destination_network: 'ethereum',
      });

      if (!session?.clientSecret) {
        throw new Error('Stripe did not return an onramp client secret.');
      }

      setStripeOnrampPromise(onramp);
      setClientSecret(session.clientSecret);
    } catch (err: any) {
      if (isOnrampUnavailableError(err)) {
        setUnavailable('Crypto purchases are temporarily unavailable because Stripe Crypto Onramp has not been enabled for this platform account.');
      } else {
        setError(err?.message || 'Crypto Onramp could not be loaded.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeOnramp();
  }, [initializeOnramp]);

  const onChange = React.useCallback(({ session }: any) => {
    setMessage(`Onramp session is now in the ${session.status} state.`);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#635BFF]" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <Clock3 className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Crypto Onramp is coming soon</h2>
        <p className="max-w-md text-gray-400">{unavailable}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Failed to load Crypto Onramp</h2>
        <p className="mb-6 max-w-md text-gray-400">{error}</p>
        <button
          onClick={initializeOnramp}
          className="rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 md:space-y-8">
      <div className="mb-4 md:mb-8">
        <h1 className="mb-1 text-xl font-bold text-white md:mb-2 md:text-3xl">Crypto Onramp</h1>
        <p className="text-xs text-gray-400 md:text-sm">Buy crypto directly with fiat currency.</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#141414] p-4 md:min-h-[600px] md:rounded-[2rem] md:p-8">
        <CryptoElements stripeOnramp={stripeOnrampPromise}>
          {clientSecret && (
            <OnrampElement
              id="onramp-element"
              clientSecret={clientSecret}
              appearance={{ theme: 'dark' }}
              onChange={onChange}
            />
          )}
        </CryptoElements>
        {message && <div className="mt-4 text-[10px] text-gray-500 md:text-sm">{message}</div>}
      </div>
    </div>
  );
};
