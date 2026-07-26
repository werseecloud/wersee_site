import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft,
  CreditCard,
  Wallet,
  Settings,
  Info
} from 'lucide-react';
import { clearStoredStripeAccount, isStripeAccountInaccessibleError, supabase, invokeApiRunner } from '../../lib/supabase';

interface MobileMoneySetupProps {
  onBack: () => void;
}

export const MobileMoneySetup: React.FC<MobileMoneySetupProps> = ({ onBack }) => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [country, setCountry] = useState('NL');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // Fetch business name
      const { data: bSettings } = await supabase
        .from('business_settings')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (bSettings?.business_name) setBusinessName(bSettings.business_name);
      
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
        await fetchAccount(savedAccountId, user.id);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const fetchAccount = async (id: string, ownerId = userId) => {
    try {
      const resData = await invokeApiRunner('get-account', { id });
      if (resData.error) {
        throw new Error(resData.error || 'Failed to fetch account');
      }
      
      if (resData.livemode === false) {
        console.warn('Found a test Stripe account. Clearing it to force live mode.');
        setAccount(null);
        if (ownerId) {
          await clearStoredStripeAccount(ownerId);
        }
        return;
      }

      setAccount(resData);
    } catch (err: any) {
      console.error(err);
      if (ownerId && isStripeAccountInaccessibleError(err)) {
        await clearStoredStripeAccount(ownerId);
        setAccount(null);
        setError('Your previous Stripe connection is no longer available. Connect Stripe again.');
        return;
      }
      setError('Could not load Stripe account details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isComplete = account?.payouts_enabled && account?.charges_enabled;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight">Payment Setup</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        {/* Stripe Card */}
        <div className={`p-6 bg-white/[0.03] border rounded-[2.5rem] relative overflow-hidden transition-all ${isComplete ? 'border-emerald-500/30' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-xs font-black text-[#635BFF] tracking-tighter">stripe</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Stripe</h3>
                <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-widest">Required</span>
              </div>
            </div>
            {isComplete && (
              <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
            Accept credit cards, Apple Pay, Google Pay, and local payment methods globally.
          </p>

          {!account ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Business Country</label>
                <div className="relative">
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="NL">Netherlands</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="IE">Ireland</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Globe className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  setSubmitting(true);
                  setError(null);
                  try {
                    let resData;
                    try {
                      resData = await invokeApiRunner('stripe-v2-create-account', {
                        email: (await supabase.auth.getUser()).data.user?.email,
                        displayName: businessName || 'My Business',
                        country: country.toLowerCase(),
                        entityType: 'individual'
                      });
                    } catch (e) {
                      resData = await invokeApiRunner('create-account', {
                        country,
                        onboardingType: 'hosted'
                      });
                    }

                    if (resData.error) throw new Error(resData.error);
                    
                    if (userId) {
                      localStorage.setItem(`stripe_account_id_${userId}`, resData.id);
                      await supabase.from('profiles').update({ stripe_account_id: resData.id }).eq('id', userId);
                      await supabase.from('business_info').update({ stripe_account_id: resData.id }).eq('user_id', userId);
                    }
                    
                    const linkRes = await invokeApiRunner('create-account-link', {
                      accountId: resData.id,
                      returnUrl: window.location.href,
                      refreshUrl: window.location.href
                    });
                    if (linkRes.url) {
                      window.location.href = linkRes.url;
                    }
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              disabled={submitting}
              className="w-full py-4 bg-[#635BFF] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Login / Stripe Site Onboarding'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {!isComplete ? (
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
                      if (userId && isStripeAccountInaccessibleError(err)) {
                        await clearStoredStripeAccount(userId);
                        setAccount(null);
                        setError('Your previous Stripe connection is no longer available. Connect Stripe again.');
                      } else {
                      setError(err.message);
                      }
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="w-full py-4 bg-[#635BFF] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Login / Stripe Site Onboarding'} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <a 
                  href="https://dashboard.stripe.com/login" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  Dashboard <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button 
                onClick={async () => {
                  setAccount(null);
                  if (userId) await clearStoredStripeAccount(userId);
                }}
                className="w-full py-2 text-[10px] font-black text-gray-600 uppercase tracking-widest"
              >
                Update Info
              </button>
            </div>
          )}
        </div>

        {/* PayPal Card */}
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#003087] rounded-2xl flex items-center justify-center">
              <span className="text-[10px] font-black text-white italic">PayPal</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">PayPal</h3>
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Optional</span>
            </div>
          </div>
          <button className="w-full py-4 bg-[#0070ba] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#0070ba]/20">
            Connect Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Security Info */}
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
          <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
            All payments are processed securely via Stripe. Wersee does not store your credit card or bank information.
          </p>
        </div>
      </div>
    </div>
  );
};
