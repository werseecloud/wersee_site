import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, AddressElement, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Loader2, ShieldCheck, DollarSign, AlertCircle, Check, ArrowLeft, Lock, CreditCard, Sparkles, ChevronDown, Info, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../SEO';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit Card', icon: CreditCard, logo: null },
  { id: 'ideal', name: 'iDEAL', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/iDEAL_Wero_Lockup_Yellow_Square_RGB.svg' },
  { id: 'bancontact', name: 'Bancontact', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Bancontact_logo.svg.png' },
  { id: 'klarna', name: 'Klarna', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/klarna-icon.webp' },
  { id: 'affirm', name: 'Affirm', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/blue_solid_circle-transparent_bg.avif' },
  { id: 'eps', name: 'EPS', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/32041242-b0eb5b7c-ba33-11e7-8d58-7f134da0e4d8.png' },
  { id: 'alipay', name: 'Alipay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/62b1e77b56b6848f8bec9031.png' },
  { id: 'sepa_debit', name: 'SEPA Direct Debit', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/67433ffcacc11a3a9c648faf_639b928a92f2c749f5ad800c_APMsLPMs20Website20Template.png' },
  { id: 'sofort', name: 'Sofort', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment-sofort.png' },
  { id: 'afterpay_clearpay', name: 'Afterpay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/unnamed.png' },
  { id: 'giropay', name: 'Giropay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Giropay.svg.png' },
  { id: 'p24', name: 'Przelewy24', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/6.Przelewy24_logo.webp' },
  { id: 'wechat_pay', name: 'WeChat Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/77adb574c905404f69555e6fc9e47e3693444c6c.svg' },
  { id: 'link', name: 'Link', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/link.png' },
  { id: 'customer_balance', name: 'Bank Transfer', icon: Landmark, logo: null },
  { id: 'us_bank_account', name: 'ACH Direct Debit', icon: Landmark, logo: null },
  { id: 'boleto', name: 'Boleto', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/boleto.png' },
  { id: 'cashapp', name: 'Cash App Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/cashapp.png' },
];

const MockPaymentElement = ({ link, colors, borderRadius }: { link: any, colors: any, borderRadius: string }) => {
  const enabledMethods = link.settings?.payment_methods || ['card'];
  const availableMethods = PAYMENT_METHODS.filter(m => enabledMethods.includes(m.id));
  const [selectedMethod, setSelectedMethod] = useState(availableMethods[0]?.id || 'card');

  return (
    <div className="space-y-6 p-6 rounded-2xl border bg-white/5" style={{ borderColor: colors.border, borderRadius }}>
      {availableMethods.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {availableMethods.map(method => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedMethod === method.id ? 'bg-white/10' : 'bg-transparent opacity-60 hover:opacity-100'}`}
              style={{ borderColor: selectedMethod === method.id ? colors.primary : colors.border }}
            >
              {method.logo ? (
                <img src={method.logo} alt={method.name} className="h-4 object-contain" />
              ) : method.icon ? (
                <method.icon className="w-4 h-4" />
              ) : null}
              <span className="text-sm font-medium" style={{ color: colors.text }}>{method.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMethod}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {selectedMethod === 'card' ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: colors.text }}>Card Information</label>
                  <div className="flex gap-1 opacity-50">
                    <div className="w-6 h-4 bg-white/20 rounded-sm" />
                    <div className="w-6 h-4 bg-white/20 rounded-sm" />
                    <div className="w-6 h-4 bg-white/20 rounded-sm" />
                  </div>
                </div>
                
                <div className="space-y-px">
                  <div className="h-12 rounded-t-xl border flex items-center px-4 gap-3 bg-white/5" style={{ borderColor: colors.border }}>
                    <CreditCard className="w-5 h-5 opacity-40" />
                    <input 
                      type="text" 
                      placeholder="1234 5678 1234 5678" 
                      className="bg-transparent border-none outline-none w-full text-sm"
                      style={{ color: colors.text }}
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="h-12 rounded-bl-xl border-t border-r flex items-center px-4 bg-white/5" style={{ borderColor: colors.border }}>
                      <input 
                        type="text" 
                        placeholder="MM / YY" 
                        className="bg-transparent border-none outline-none w-full text-sm"
                        style={{ color: colors.text }}
                        disabled
                      />
                    </div>
                    <div className="h-12 rounded-br-xl border-t flex items-center px-4 bg-white/5" style={{ borderColor: colors.border }}>
                      <input 
                        type="text" 
                        placeholder="CVC" 
                        className="bg-transparent border-none outline-none w-full text-sm"
                        style={{ color: colors.text }}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                {availableMethods.find(m => m.id === selectedMethod)?.logo ? (
                  <img src={availableMethods.find(m => m.id === selectedMethod)?.logo!} alt="Payment Method" className="h-8 object-contain opacity-50" />
                ) : (
                  <Landmark className="w-8 h-8 opacity-50" style={{ color: colors.text }} />
                )}
                <p className="text-sm opacity-60" style={{ color: colors.text }}>
                  You will be redirected to {availableMethods.find(m => m.id === selectedMethod)?.name} to complete your purchase.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: colors.text }}>Country or region</label>
        <div className="h-12 rounded-xl border flex items-center px-4 bg-white/5" style={{ borderColor: colors.border }}>
          <span className="text-sm opacity-60">Netherlands</span>
          <ChevronDown className="w-4 h-4 ml-auto opacity-40" />
        </div>
      </div>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-yellow-500">Sandbox Mode Active</p>
          <p className="text-[10px] text-yellow-500/80 leading-relaxed">
            This is a simulated payment environment. No real money will be charged. 
            You can click the button below to test the success flow.
          </p>
        </div>
      </div>
    </div>
  );
};

const StripeCheckoutForm = ({ link, clientSecret, amount, setAmount, isSandbox, colors, borderRadius }: { link: any, clientSecret: string, amount: number, setAmount: (val: number) => void, isSandbox: boolean, colors: any, borderRadius: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [payWithPoints, setPayWithPoints] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleConfirm = async (event: any) => {
    if (!stripe || !elements) return;
    
    if (link.settings?.terms_required && !termsAccepted) {
      setErrorMessage('You must agree to the Terms & Conditions.');
      return;
    }

    setLoading(true);
    
    const returnUrl = link.settings?.confirmation_type === 'redirect' && link.settings?.success_url 
      ? link.settings.success_url 
      : `${window.location.origin}/payment-success`;

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchUser();
  }, []);

  const handlePointsPayment = async () => {
    if (!userProfile) {
      setErrorMessage('Please log in to use Wersee Points.');
      return;
    }

    const pointsNeeded = Math.round(amount * 100);
    if (userProfile.wersee_points < pointsNeeded) {
      setErrorMessage(`Insufficient points. You need ${pointsNeeded} points.`);
      return;
    }

    setLoading(true);
    try {
      const resData = await invokeApiRunner('pay-with-points', {
        listingId: link.id,
        userId: userProfile.id,
        amount: amount,
        description: link.product_name,
        sellerId: link.user_id,
        metadata: {
          source: 'quick_pay',
          slug: link.slug
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Payment failed');
      }

      window.location.href = link.settings?.confirmation_type === 'redirect' && link.settings?.success_url 
        ? link.settings.success_url 
        : `${window.location.origin}/payment-success`;
    } catch (err: any) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <ExpressCheckoutElement onConfirm={handleConfirm} />
        
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t opacity-10" style={{ borderColor: colors.text }}></div>
          <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: colors.text }}>Or pay with card</span>
          <div className="flex-grow border-t opacity-10" style={{ borderColor: colors.text }}></div>
        </div>
      </div>

      <div className="space-y-6">
        {link.settings?.pricing_type === 'variable' && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
               Pay what you want
             </h3>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium opacity-70" style={{ color: colors.text }}>
                 {link.currency.toUpperCase()}
               </span>
               <input 
                 type="number" 
                 min={link.settings?.min_amount || 1}
                 value={amount}
                 onChange={(e) => setAmount(parseFloat(e.target.value))}
                 className="w-full bg-transparent border rounded-xl pl-12 pr-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 transition-all"
                 style={{ 
                   borderColor: colors.border, 
                   color: colors.text,
                   backgroundColor: colors.background,
                   borderRadius: borderRadius
                 }}
               />
             </div>
          </div>
        )}

        {link.settings.collect_address && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
              Shipping Details
            </h3>
            <AddressElement options={{ mode: 'shipping' }} />
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
            Payment Method
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              onClick={() => setPayWithPoints(false)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!payWithPoints ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
              style={{ borderColor: !payWithPoints ? colors.primary : colors.border }}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-bold">Credit Card</span>
            </button>
            <button 
              onClick={() => setPayWithPoints(true)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${payWithPoints ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 hover:border-white/20'}`}
              style={{ borderColor: payWithPoints ? '#EAB308' : colors.border }}
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-xs font-bold">Wersee Points</span>
            </button>
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!payWithPoints ? (
                <motion.div
                  key="fiat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PaymentElement options={{ layout: link.settings.layout || 'accordion' }} />
                </motion.div>
              ) : (
                <motion.div
                  key="points"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Your Balance</span>
                    <span className="font-mono font-bold text-yellow-500">{userProfile?.wersee_points?.toLocaleString() || 0} Points</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Cost</span>
                    <span className="font-mono font-bold">{(amount * 100).toLocaleString()} Points</span>
                  </div>
                  {!userProfile && (
                    <p className="text-xs text-red-400">Please log in to use your points.</p>
                  )}
                  {userProfile && userProfile.wersee_points < (amount * 100) && (
                    <p className="text-xs text-red-400">Insufficient points balance.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {link.settings?.terms_required && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all mt-0.5 ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`} style={{ borderColor: termsAccepted ? 'transparent' : colors.border }}>
              {termsAccepted && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="hidden" />
            <span className="text-sm opacity-70 leading-tight" style={{ color: colors.text }}>
              I agree to the <a href="#" className="underline hover:opacity-100">Terms & Conditions</a> and Privacy Policy.
            </span>
          </label>
        )}
      </div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </motion.div>
      )}

      <button
        onClick={payWithPoints ? handlePointsPayment : handleConfirm}
        disabled={(!payWithPoints && !stripe) || loading || (link.settings?.terms_required && !termsAccepted) || (payWithPoints && (!userProfile || userProfile.wersee_points < (amount * 100)))}
        className="w-full py-4 font-bold text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
        style={{ 
          backgroundColor: payWithPoints ? '#EAB308' : (link.settings.button_color || colors.primary || '#635BFF'),
          borderRadius: borderRadius
        }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : payWithPoints ? `Pay with ${ (amount * 100).toLocaleString() } Points` : `Pay ${link.currency.toUpperCase()} ${amount.toFixed(2)}`}
      </button>

      <div className="flex items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-opacity" style={{ color: colors.text }}>
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Secure Payment by Stripe</span>
      </div>
    </div>
  );
};

const SandboxCheckoutForm = ({ link, amount, setAmount, colors, borderRadius }: { link: any, amount: number, setAmount: (val: number) => void, colors: any, borderRadius: string }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [payWithPoints, setPayWithPoints] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchUser();
  }, []);

  const handleConfirm = async () => {
    if (link.settings?.terms_required && !termsAccepted) {
      setErrorMessage('You must agree to the Terms & Conditions.');
      return;
    }
    setErrorMessage('Sandbox payment simulation is disabled. Configure Stripe before this link can accept payment.');
  };

  const handlePointsPayment = async () => {
    setErrorMessage('Sandbox point payments are disabled for paid checkout links.');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {link.settings?.pricing_type === 'variable' && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
               Pay what you want
             </h3>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium opacity-70" style={{ color: colors.text }}>
                 {link.currency.toUpperCase()}
               </span>
               <input 
                 type="number" 
                 min={link.settings?.min_amount || 1}
                 value={amount}
                 onChange={(e) => setAmount(parseFloat(e.target.value))}
                 className="w-full bg-transparent border rounded-xl pl-12 pr-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 transition-all"
                 style={{ 
                   borderColor: colors.border, 
                   color: colors.text,
                   backgroundColor: colors.background,
                   borderRadius: borderRadius
                 }}
               />
             </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
            Payment Method <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Sandbox Mode</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              onClick={() => setPayWithPoints(false)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!payWithPoints ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
              style={{ borderColor: !payWithPoints ? colors.primary : colors.border }}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-bold">Credit Card</span>
            </button>
            <button 
              onClick={() => setPayWithPoints(true)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${payWithPoints ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 hover:border-white/20'}`}
              style={{ borderColor: payWithPoints ? '#EAB308' : colors.border }}
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-xs font-bold">Wersee Points</span>
            </button>
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!payWithPoints ? (
                <motion.div
                  key="fiat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MockPaymentElement link={link} colors={colors} borderRadius={borderRadius} />
                </motion.div>
              ) : (
                <motion.div
                  key="points"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Your Balance</span>
                    <span className="font-mono font-bold text-yellow-500">{userProfile?.wersee_points?.toLocaleString() || 0} Points</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Cost</span>
                    <span className="font-mono font-bold">{(amount * 100).toLocaleString()} Points</span>
                  </div>
                  <p className="text-xs text-yellow-500">In sandbox mode, you can pay with unlimited Wersee Points for testing.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {link.settings?.terms_required && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all mt-0.5 ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`} style={{ borderColor: termsAccepted ? 'transparent' : colors.border }}>
              {termsAccepted && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="hidden" />
            <span className="text-sm opacity-70 leading-tight" style={{ color: colors.text }}>
              I agree to the <a href="#" className="underline hover:opacity-100">Terms & Conditions</a> and Privacy Policy.
            </span>
          </label>
        )}
      </div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </motion.div>
      )}

      <button
        onClick={payWithPoints ? handlePointsPayment : handleConfirm}
        disabled={loading || (link.settings?.terms_required && !termsAccepted)}
        className="w-full py-4 font-bold text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
        style={{ 
          backgroundColor: payWithPoints ? '#EAB308' : (link.settings.button_color || colors.primary || '#635BFF'),
          borderRadius: borderRadius
        }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : payWithPoints ? 'Test Pay with Points' : `Test Pay ${link.currency.toUpperCase()} ${amount.toFixed(2)}`}
      </button>

      <div className="flex items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-opacity" style={{ color: colors.text }}>
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Sandbox Payment Simulation</span>
      </div>
    </div>
  );
};

const CheckoutForm = (props: any) => {
  if (props.isSandbox) return <SandboxCheckoutForm {...props} />;
  return <StripeCheckoutForm {...props} />;
};

export const QuickPayCheckout = () => {
  const { username, slug } = useParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const cleanUsername = username?.replace('@', '');
        const { data, error: dbError } = await supabase
          .from('quick_pay_links')
          .select('*')
          .eq('username', cleanUsername)
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (dbError || !data) throw new Error('Payment link not found');
        setLink(data);
        setAmount(data.settings?.pricing_type === 'fixed' ? data.price : (data.settings?.min_amount || 1));

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user_id)
          .single();
        if (profileData) {
          setProfile(profileData);
        }

        // Fetch business settings for sandbox mode
        const { data: settingsData } = await supabase
          .from('business_settings')
          .select('sandbox_mode')
          .eq('user_id', data.user_id)
          .maybeSingle();
          
        const sandboxMode = data.settings?.is_sandbox === true || (!data.stripe_account_id || data.stripe_account_id === 'sandbox') || (settingsData?.sandbox_mode === true);
        setIsSandbox(sandboxMode);

        // Track visit
        try {
          let visitorId = localStorage.getItem('wersee_visitor_id');
          if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem('wersee_visitor_id', visitorId);
          }
          
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const deviceType = isMobile ? 'mobile' : 'desktop';

          await supabase.rpc('track_quick_pay_visit', {
            p_link_id: data.id,
            p_visitor_id: visitorId,
            p_device_type: deviceType
          });
        } catch (visitErr) {
          console.error('Failed to track visit:', visitErr);
        }

        if (!sandboxMode) {
          let pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          try {
            const config = await invokeApiRunner('stripe-config', {});
            if (config && config.publishableKey) {
              pk = config.publishableKey;
            }
          } catch (err: any) {
            console.warn('Could not fetch Stripe config', err);
          }
          
          if (pk) {
            const stripeOptions: any = {};
            if (data.stripe_account_id && data.stripe_account_id !== 'sandbox') {
              stripeOptions.stripeAccount = data.stripe_account_id;
            }
            setStripePromise(loadStripe(pk, stripeOptions));
          }

          // Initial intent creation (will update if variable price changes)
          await createPaymentIntent(data, data.settings?.pricing_type === 'fixed' ? data.price : (data.settings?.min_amount || 1));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) fetchLink();
  }, [username, slug]);

  const createPaymentIntent = async (linkData: any, currentAmount: number) => {
    try {
      const resData = await invokeApiRunner('create-payment-intent', {
        accountId: linkData.stripe_account_id,
        amount: currentAmount,
        currency: linkData.currency,
        description: linkData.product_name,
        metadata: {
          linkId: linkData.id,
          slug: linkData.slug,
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Failed to create payment intent');
      }

      const { client_secret } = resData;
      setClientSecret(client_secret);
    } catch (err) {
      console.error(err);
    }
  };

  // Debounce amount updates for variable pricing
  useEffect(() => {
    if (!link || link.settings?.pricing_type !== 'variable') return;
    
    const timer = setTimeout(() => {
      if (amount >= (link.settings?.min_amount || 1) && !isSandbox) {
        createPaymentIntent(link, amount);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [amount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Link Unavailable</h1>
        <p className="text-gray-400 max-w-md">{error || 'This payment link is no longer active or does not exist.'}</p>
        <a href="/" className="mt-8 text-[#635BFF] font-bold hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Return to Wersee
        </a>
      </div>
    );
  }

  const colors = link.settings.colors || {
    background: link.settings.theme === 'dark' ? '#0A0A0A' : '#F9FAFB',
    card: link.settings.theme === 'dark' ? '#141414' : '#FFFFFF',
    text: link.settings.theme === 'dark' ? '#FFFFFF' : '#111827',
    secondary_text: link.settings.theme === 'dark' ? '#A1A1AA' : '#6B7280',
    border: link.settings.theme === 'dark' ? '#27272A' : '#E5E7EB',
    primary: link.settings.button_color || '#635BFF'
  };
  
  const borderRadius = link.settings.border_radius || '16px';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row transition-colors duration-500" style={{ backgroundColor: colors.background }}>
      <SEO 
        title={link.product_name} 
        description={link.description}
        image={link.settings?.image_url || link.settings?.logo_url || profile?.avatar_url}
        url={`/@${username}/quick-pay/${slug}`}
        type="product"
      />
      {/* Product Info Section - Left/Top */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden"
        style={{ backgroundColor: colors.background, color: colors.text }}
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[100px]" style={{ backgroundColor: colors.primary }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-xl mx-auto">
          {isSandbox && (
            <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Test Mode Active</h3>
                <p className="text-xs opacity-80 mt-1">This checkout is currently in sandbox mode. No real payments will be processed. The seller has not fully set up their Wersee Pay account yet.</p>
              </div>
            </div>
          )}

          <div className="mb-8 lg:mb-16">
            <div className="flex items-center gap-4 mb-12">
              {link.settings?.logo_url ? (
                <img src={link.settings.logo_url} alt="Logo" className="h-10 object-contain" />
              ) : link.settings?.image_url ? (
                <img src={link.settings.image_url} alt={link.product_name} className="w-20 h-20 object-cover shadow-2xl" style={{ borderRadius }} />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary, borderRadius }}>
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              )}
              
              {!link.settings?.logo_url && (
                <>
                  <div className="h-10 w-px opacity-20" style={{ backgroundColor: colors.text }}></div>
                  
                  <span className="font-bold tracking-tight opacity-60 text-lg">
                    {link.name || link.username}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">
              {link.product_name}
            </h1>
            
            <p className="text-lg leading-relaxed opacity-70">
              {link.description}
            </p>
          </div>

          <div className="mt-auto hidden lg:block">
            <div className="text-sm font-bold uppercase tracking-widest opacity-50 mb-2">Total to pay</div>
            <div className="text-6xl font-bold tracking-tighter">
              {link.currency.toUpperCase()} {amount.toFixed(2)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Checkout Section - Right/Bottom */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-16 relative z-20 shadow-2xl lg:shadow-none" 
        style={{ 
          backgroundColor: colors.card,
          color: colors.text,
        }}
      >
        <div className="w-full max-w-md mx-auto">
              {/* Mobile Price Display */}
              <div className="lg:hidden mb-8 pb-8 border-b opacity-100" style={{ borderColor: colors.border }}>
                <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: colors.text }}>Total to pay</div>
                <div className="text-4xl font-bold" style={{ color: colors.text }}>
                  {link.currency.toUpperCase()} {amount.toFixed(2)}
                </div>
              </div>

              {isSandbox ? (
                <CheckoutForm link={link} clientSecret="" amount={amount} setAmount={setAmount} isSandbox={isSandbox} colors={colors} borderRadius={borderRadius} />
              ) : clientSecret && stripePromise ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'night', // We override variables anyway
                      variables: {
                        colorPrimary: colors.primary,
                        colorBackground: colors.card,
                        colorText: colors.text,
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: borderRadius,
                      },
                      rules: {
                        '.Input': {
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.background,
                          color: colors.text,
                        },
                        '.Label': {
                          color: colors.text,
                          opacity: '0.8',
                        },
                        '.Tab': {
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        },
                        '.Tab--selected': {
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.primary}`,
                          color: colors.primary,
                        }
                      }
                    }
                  }}
                >
                  <CheckoutForm link={link} clientSecret={clientSecret} amount={amount} setAmount={setAmount} isSandbox={isSandbox} colors={colors} borderRadius={borderRadius} />
                </Elements>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
                  <p className="text-sm opacity-60">Loading secure checkout...</p>
                </div>
              )}
          </div>
        </motion.div>
      </div>
  );
};
