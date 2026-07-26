import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, Globe, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { clearStoredStripeAccount, isStripeAccountInaccessibleError, supabase, invokeApiRunner } from '../../lib/supabase';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';

import { BottomSheetModal } from '../ui/BottomSheetModal';

interface StripeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'IE', name: 'Ireland' },
];

export const StripeSetupModal: React.FC<StripeSetupModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          setUserId(user.id);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', user.id)
            .maybeSingle();
            
          let savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
          
          if (!savedAccountId && profile?.stripe_account_id) {
            savedAccountId = profile.stripe_account_id;
            localStorage.setItem(`stripe_account_id_${user.id}`, savedAccountId);
          }

          if (savedAccountId) {
            try {
              const resData = await invokeApiRunner('get-account', { id: savedAccountId });
              if (resData.livemode === false) {
                console.warn('Found a test Stripe account. Clearing it to force live mode.');
                await clearStoredStripeAccount(user.id);
                setStripeAccountId(null);
              } else {
                setStripeAccountId(savedAccountId);
                initializeConnect(savedAccountId);
              }
            } catch (err: any) {
              console.error('Error fetching account:', err);
              if (isStripeAccountInaccessibleError(err)) {
                await clearStoredStripeAccount(user.id);
                setStripeAccountId(null);
                setStripeConnectInstance(null);
                setError('Your previous Stripe connection is no longer available. Connect Stripe again.');
              }
            }
          }
        }
      });
    }
  }, [isOpen]);

  const initializeConnect = async (accountId: string) => {
    const fetchClientSecret = async () => {
      try {
        const resData = await invokeApiRunner('create-account-session', { accountId });
        if (resData.error) {
          throw new Error(resData.error || 'Failed to create account session');
        }
        return resData.client_secret;
      } catch (err: any) {
        if (userId && isStripeAccountInaccessibleError(err)) {
          await clearStoredStripeAccount(userId);
          setStripeAccountId(null);
          setStripeConnectInstance(null);
          setError('Your previous Stripe connection is no longer available. Connect Stripe again.');
        }
        throw err;
      }
    };

    let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    try {
      const config = await invokeApiRunner('stripe-config');
      if (config && config.publishableKey) {
        publishableKey = config.publishableKey;
      }
    } catch (err: any) {
      console.warn('Could not fetch Stripe config', err);
      if (err.message && err.message.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
        setError(err.message);
        return;
      }
    }

    const instance = loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret,
      appearance: {
        variables: {
          colorPrimary: '#635BFF',
        },
      },
    });
    setStripeConnectInstance(instance);
  };

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const resData = await invokeApiRunner('create-account', { country });
      if (resData.error) {
        throw new Error(resData.error || 'Failed to create account');
      }
      
      if (userId) {
        localStorage.setItem(`stripe_account_id_${userId}`, resData.id);
        await supabase
          .from('profiles')
          .update({ stripe_account_id: resData.id })
          .eq('id', userId);
        await supabase
          .from('business_info')
          .update({ stripe_account_id: resData.id })
          .eq('user_id', userId);
      }
      
      setStripeAccountId(resData.id);
      initializeConnect(resData.id);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth={stripeConnectInstance ? "max-w-4xl" : "max-w-md"}
    >
      <div className={`relative w-full ${stripeConnectInstance ? 'h-[80vh]' : ''} bg-white flex flex-col`}>
        {stripeConnectInstance ? (
          <div className="flex-1 overflow-y-auto p-4 pt-12">
            <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
              <ConnectAccountOnboarding
                onExit={() => {
                  onClose();
                  if (onComplete) onComplete();
                }}
              />
            </ConnectComponentsProvider>
          </div>
        ) : (
          <div className="p-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-[#635BFF]" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Set up payments</h2>
            <p className="text-gray-500 mb-8">
              Connect with Stripe to start accepting payments securely. It only takes a minute.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Where is your business located?</label>
                <div className="relative">
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all"
                  >
                    {SUPPORTED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateAccount}
                disabled={loading}
                className="w-full py-4 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue with Stripe'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              <p className="text-xs text-center text-gray-400">
                By clicking continue, you agree to our Terms of Service and Privacy Policy. You can also log in with an existing Stripe account.
              </p>
            </div>
          </div>
        )}
      </div>
    </BottomSheetModal>
  );
};
