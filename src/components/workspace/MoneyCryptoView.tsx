import React, { useState, useEffect } from "react";
import { loadStripeOnramp } from "@stripe/crypto";
import { CryptoElements, OnrampElement } from './StripeCryptoElements';
import { Loader2, AlertTriangle } from "lucide-react";

import { invokeApiRunner } from '../../lib/supabase';

export const MoneyCryptoView = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeOnrampPromise, setStripeOnrampPromise] = useState<any>(null);

  useEffect(() => {
    const initStripe = async () => {
      let pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      try {
        const config = await invokeApiRunner('stripe-config');
        if (config && config.publishableKey) {
          pk = config.publishableKey;
        }
      } catch (err) {
        console.warn('Could not fetch Stripe config', err);
      }

      if (!pk) {
        setError('Stripe publishable key is not configured.');
        setLoading(false);
        return;
      }

      setStripeOnrampPromise(loadStripeOnramp(pk));
    };
    initStripe();
  }, []);

  useEffect(() => {
    // Fetches an onramp session and captures the client secret
    const fetchSession = async () => {
      try {
        const resData = await invokeApiRunner('create-onramp-session', {
          source_currency: "eur",
          source_amount: "25.00",
          destination_currency: "usdc",
          destination_network: "ethereum",
        });

        if (resData?.error) {
          throw new Error(typeof resData.error === 'string' ? resData.error : resData.error.message);
        }
        if (!resData?.clientSecret) {
          throw new Error('Stripe did not return an onramp client secret.');
        }

        setClientSecret(resData.clientSecret);
      } catch (err: any) {
        console.error("Error creating onramp session:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const onChange = React.useCallback(({ session }: any) => {
    setMessage(`OnrampSession is now in ${session.status} state.`);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load Crypto Onramp</h2>
        <p className="text-gray-400 max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Crypto Onramp</h1>
        <p className="text-xs md:text-sm text-gray-400">Buy crypto directly with fiat currency.</p>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] md:min-h-[600px]">
        <CryptoElements stripeOnramp={stripeOnrampPromise}>
          {clientSecret && (
            <OnrampElement
              id="onramp-element"
              clientSecret={clientSecret}
              appearance={{ theme: "dark" }}
              onChange={onChange}
            />
          )}
        </CryptoElements>
        {message && <div className="mt-4 text-gray-500 text-[10px] md:text-sm">{message}</div>}
      </div>
    </div>
  );
};
