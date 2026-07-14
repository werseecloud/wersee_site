import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Globe, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { clearStoredStripeAccount, isStripeAccountInaccessibleError, supabase, invokeApiRunner } from '../../lib/supabase';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';

import { MoneyPayoutsView } from './MoneyPayoutsView';
import { StripeV2OnboardingFlow } from './StripeV2OnboardingFlow';

// Helper to translate Stripe's requirement state into a user-friendly status
const getAccountState = (account: any) => {
  const reqs = account.requirements;
  if (!reqs) return "unknown";

  // Check for v2 accounts
  if (reqs.summary) {
    const status = reqs.summary.minimum_deadline?.status;
    if (status === 'currently_due' || status === 'past_due') {
      return "action required";
    }
    return "complete";
  }

  if (reqs.disabled_reason && reqs.disabled_reason.includes("rejected")) {
    return "rejected";
  } else if (account.payouts_enabled && account.charges_enabled) {
    if (reqs.pending_verification && reqs.pending_verification.length > 0) {
      return "pending enablement";
    } else if (!reqs.disabled_reason && (!reqs.currently_due || reqs.currently_due.length === 0)) {
      if (!reqs.eventually_due || reqs.eventually_due.length === 0) {
        return "complete";
      } else {
        return "enabled";
      }
    } else {
      return "restricted";
    }
  } else if (!account.payouts_enabled && account.charges_enabled) {
    return "restricted (payouts disabled)";
  } else if (!account.charges_enabled && account.payouts_enabled) {
    return "restricted (charges disabled)";
  } else if (reqs.past_due && reqs.past_due.length > 0) {
    return "restricted (past due)";
  } else if (reqs.pending_verification && reqs.pending_verification.length > 0) {
    return "pending (disabled)";
  } else {
    return "restricted";
  }
};

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
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
];

export const MoneySetupView = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [country, setCountry] = useState('US');
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [onboardingMode, setOnboardingMode] = useState<'embedded' | 'custom' | 'hosted' | null>(null);

  const [businessName, setBusinessName] = useState('My Business');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', user.id)
          .maybeSingle();
        
        const { data: businessInfo } = await supabase
          .from('business_info')
          .select('company_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (businessInfo?.company_name) {
          setBusinessName(businessInfo.company_name);
        }
        
        let savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
        
        if (!savedAccountId && profile?.stripe_account_id) {
          savedAccountId = profile.stripe_account_id;
          localStorage.setItem(`stripe_account_id_${user.id}`, savedAccountId);
        }

        if (savedAccountId) {
          await fetchAccount(savedAccountId, user.id);
          // Don't initialize connect automatically if we might use custom flow
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const initializeConnect = async (accountId: string) => {
    const fetchClientSecret = async () => {
      const resData = await invokeApiRunner('create-account-session', { accountId });
      if (resData.error) {
        throw new Error(resData.error || 'Failed to create account session');
      }
      return resData.client_secret;
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
          colorBackground: '#141414',
          colorText: '#FFFFFF',
          colorDanger: '#ef4444',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      },
    });
    setStripeConnectInstance(instance);
    setOnboardingMode('embedded');
  };

  const fetchAccount = async (id: string, ownerId = userId) => {
    try {
      const resData = await invokeApiRunner('get-account', { id });
      if (resData.error) {
        throw new Error(resData.error || 'Failed to fetch account');
      }
      
      // If the account is a test account, we should clear it and force the user to create a live one
      if (resData.livemode === false) {
        console.warn('Found a test Stripe account. Clearing it to force live mode.');
        setAccount(null);
        if (ownerId) {
          await clearStoredStripeAccount(ownerId);
        }
        return;
      }

      setAccount(resData);
      if (resData.country) {
        setCountry(resData.country);
      }
    } catch (err: any) {
      console.error(err);
      if (ownerId && isStripeAccountInaccessibleError(err)) {
        await clearStoredStripeAccount(ownerId);
        setAccount(null);
        setError('Your previous Stripe connection is no longer available. Start setup again to connect the current Stripe platform.');
        return;
      }
      setError('Could not load Stripe account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (mode: 'embedded' | 'custom' | 'hosted') => {
    setSubmitting(true);
    setError(null);
    try {
      let resData;
      if (mode === 'custom') {
        const { data: { user } } = await supabase.auth.getUser();
        resData = await invokeApiRunner('stripe-v2-create-account', {
          email: user?.email,
          displayName: businessName,
          country: country.toLowerCase(),
          entityType: 'individual'
        });
        if (resData.error) {
          throw new Error(resData.error || 'Failed to create account');
        }
      } else {
        resData = await invokeApiRunner('create-account', {
          country,
          onboardingType: mode
        });
        if (resData.error) {
          throw new Error(resData.error || 'Failed to create account');
        }
      }
      
      setAccount(resData);
      if (userId) {
        localStorage.setItem(`stripe_account_id_${userId}`, resData.id);
        await supabase
          .from('profiles')
          .update({ stripe_account_id: resData.id })
          .eq('id', userId);
          
        // Also update business_info if it exists
        await supabase
          .from('business_info')
          .update({ stripe_account_id: resData.id })
          .eq('user_id', userId);
      }

      if (mode === 'embedded') {
        initializeConnect(resData.id);
      } else if (mode === 'hosted') {
        const linkRes = await invokeApiRunner('create-account-link', {
          accountId: resData.id,
          returnUrl: window.location.href,
          refreshUrl: window.location.href
        });
        if (linkRes.error) {
          throw new Error(linkRes.error || 'Failed to create account link');
        }
        if (linkRes.url) {
          window.location.href = linkRes.url;
        }
      } else {
        setOnboardingMode('custom');
      }
    } catch (err: any) {
      if (err.message.includes('capabilities') || err.message.includes('Express')) {
        setError('Your Stripe account needs to be recreated to support your region. Please click "Reset Account & Start Over" below.');
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAccount = async () => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      setAccount(null);
      await clearStoredStripeAccount(userId);
    } catch (err: any) {
      console.error("Failed to reset account:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-12 h-12 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  const accountState = account ? getAccountState(account) : null;
  const isComplete = accountState === 'complete' || accountState === 'enabled';

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-y-auto">
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-12 pb-24">
        <div className="relative z-10">
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide uppercase mb-4">
              <ShieldCheck className="w-4 h-4" />
              Secure Payment Infrastructure
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">Wersee Pay Setup</h2>
            <p className="text-sm md:text-xl text-gray-400 max-w-2xl">Activate your financial operating system to start accepting credit cards, Apple Pay, and local payment methods globally.</p>
          </div>

          {error && (
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 md:gap-4 text-red-400">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5" />
              <span className="text-sm md:text-lg">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:gap-8">
            {/* Wersee Pay Column */}
            <div className={`relative overflow-hidden bg-white/5 border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col transition-all ${isComplete ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.05)]'}`}>
              {/* Background Glow */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-black text-xl md:text-2xl tracking-tighter">W</span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Wersee Pay</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-xs font-medium text-gray-400">Powered by</span>
                      <span className="text-[10px] md:text-xs font-bold text-[#635BFF] tracking-tighter">stripe</span>
                    </div>
                  </div>
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold shrink-0 border border-emerald-400/20">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </div>
                )}
              </div>

              <p className="text-sm md:text-base text-gray-300 mb-8 md:mb-10 leading-relaxed max-w-xl relative z-10">
                Wersee Pay acts as your complete financial stack. Accept payments globally, handle subscriptions, and get direct payouts to your bank account with enterprise-grade security.
              </p>

              {!account ? (
                <div className="space-y-5 md:space-y-6 mt-auto relative z-10">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Location</label>
                    <select 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                    >
                      {SUPPORTED_COUNTRIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[#1a1a1a] text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => handleCreateAccount('hosted')}
                      disabled={submitting}
                      className="w-full py-3.5 md:py-4 bg-white hover:bg-gray-100 text-black rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-white/10"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'Activate Wersee Pay'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <p className="text-[11px] text-center text-gray-500 font-medium">
                      You will be securely redirected to our payment partner (Stripe) to verify your identity.
                    </p>
                  </div>
                </div>
              ) : isComplete ? (
                <div className="mt-auto space-y-3 md:space-y-4 relative z-10">
                  <a 
                    href="https://dashboard.stripe.com/login" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-3.5 md:py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    Open Partner Dashboard (Stripe) <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={handleResetAccount}
                    className="w-full py-2 text-gray-500 hover:text-white text-xs md:text-sm transition-colors font-medium"
                  >
                    Update Verification Details
                  </button>
                </div>
              ) : (
                <div className="mt-auto space-y-3 md:space-y-4 relative z-10">
                  <button 
                    onClick={async () => {
                      setSubmitting(true);
                      setError(null);
                      try {
                        const linkRes = await invokeApiRunner('create-account-link', {
                          accountId: account.id,
                          returnUrl: window.location.href,
                          refreshUrl: window.location.href
                        });
                        if (linkRes.url) {
                          window.location.href = linkRes.url;
                        }
                      } catch (err: any) {
                        if (err.message.includes('capabilities') || err.message.includes('Express')) {
                          setError('Your account needs to be recreated to support your region. Please click "Reset Account & Start Over" below.');
                        } else if (userId && isStripeAccountInaccessibleError(err)) {
                          await clearStoredStripeAccount(userId);
                          setAccount(null);
                          setError('Your previous Stripe connection is no longer available. Start setup again to connect the current Stripe platform.');
                        } else {
                          setError(err.message);
                        }
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className="w-full py-3.5 md:py-4 bg-white text-black rounded-xl text-sm md:text-base font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'Continue Verification'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={handleResetAccount}
                    className="w-full py-2 text-gray-500 hover:text-white text-xs md:text-sm transition-colors font-medium"
                  >
                    Reset Account & Start Over
                  </button>
                  <p className="text-[11px] text-center text-gray-500 font-medium">
                    Please complete your identity verification to enable payouts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Afterpay Section */}
          <div className="mt-4 md:mt-8 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-6 w-full">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#b2fce4] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-black font-black text-xs md:text-xl tracking-tighter">afterpay</span>
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1">Apply for Afterpay</h3>
                <p className="text-[10px] md:text-sm text-gray-400">Increase your sales by offering Buy Now, Pay Later.</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate?.('money-afterpay')}
              className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#b2fce4] text-black rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:bg-[#9cfad9] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Start Application <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Onboarding Flow */}
          {account && !isComplete && onboardingMode === 'custom' && (
            <div className="mt-8 md:mt-12">
              <StripeV2OnboardingFlow 
                accountId={account.id} 
                onComplete={() => {
                  fetchAccount(account.id);
                  setOnboardingMode(null);
                }} 
              />
            </div>
          )}

          {account && !isComplete && onboardingMode === 'embedded' && stripeConnectInstance && (
            <div className="mt-8 md:mt-12 bg-white rounded-2xl md:rounded-3xl overflow-hidden min-h-[600px]">
              <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                <ConnectAccountOnboarding
                  onExit={() => {
                    fetchAccount(account.id);
                    setOnboardingMode(null);
                  }}
                />
              </ConnectComponentsProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
