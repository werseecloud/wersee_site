import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, AddressElement, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Loader2, ShieldCheck, DollarSign, AlertCircle, Check, ArrowLeft, Lock, CreditCard, ChevronDown, Info, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../SEO';
import { parseUsernameRouteValue } from '../../routing/routes';
import { PointsWalletSlider, usePointsWallets } from '../payments/PointsWalletSlider';
import { WerseePointsMark } from '../payments/WerseePointsMark';
import { QuickPayVideoPlayer } from './QuickPayVideoPlayer';
import { werseePaymentUrls } from '../../lib/paymentUrls';

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

const paymentStatusUrl = (
  link: any,
  status: 'succeeded' | 'failed' | 'error',
  retryUrl: string,
) => {
  const params = new URLSearchParams({
    source: 'quick-pay',
    status,
    link_id: String(link.id),
    return_to: retryUrl,
  });
  return `/payment-success?${params.toString()}`;
};

const MockPaymentElement = ({ link, colors, borderRadius }: { link: any, colors: any, borderRadius: string }) => {
  const enabledMethods = link.settings?.payment_methods || ['card'];
  const availableMethods = PAYMENT_METHODS.filter(m => enabledMethods.includes(m.id));
  const [selectedMethod, setSelectedMethod] = useState(availableMethods[0]?.id || 'card');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeMethod = availableMethods.find(method => method.id === selectedMethod) || availableMethods[0];

  return (
    <div className="space-y-6 p-6 rounded-2xl border bg-white/5" style={{ borderColor: colors.border, borderRadius }}>
      {availableMethods.length > 1 && (
        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDropdownOpen(false);
            }
          }}
        >
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            onClick={() => setDropdownOpen(open => !open)}
            className="flex min-h-12 w-full items-center gap-3 border bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 focus:outline-none focus:ring-2"
            style={{
              borderColor: dropdownOpen ? colors.primary : colors.border,
              borderRadius,
              color: colors.text,
            }}
          >
            <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
              {activeMethod?.logo ? (
                <img src={activeMethod.logo} alt="" className="max-h-5 max-w-8 object-contain" />
              ) : activeMethod?.icon ? (
                <activeMethod.icon className="h-5 w-5" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-50">Payment method</span>
              <span className="block truncate text-sm font-semibold">{activeMethod?.name || 'Choose a method'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 6, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                role="listbox"
                aria-label="Payment method"
                className="absolute inset-x-0 top-full z-30 overflow-hidden border p-1.5 shadow-2xl backdrop-blur-xl"
                style={{
                  backgroundColor: colors.card || colors.background,
                  borderColor: colors.border,
                  borderRadius,
                }}
              >
                {availableMethods.map(method => {
                  const isSelected = method.id === activeMethod?.id;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                      style={{ color: colors.text }}
                    >
                      <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                        {method.logo ? (
                          <img src={method.logo} alt="" className="max-h-5 max-w-8 object-contain" />
                        ) : method.icon ? (
                          <method.icon className="h-5 w-5" />
                        ) : null}
                      </span>
                      <span className="flex-1 text-sm font-medium">{method.name}</span>
                      {isSelected && <Check className="h-4 w-4" style={{ color: colors.primary }} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {availableMethods.length === 1 && activeMethod && (
        <div className="flex min-h-12 w-full items-center gap-3 border bg-white/5 px-4 py-3" style={{ borderColor: colors.border, borderRadius }}>
          <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
            {activeMethod.logo ? (
              <img src={activeMethod.logo} alt="" className="max-h-5 max-w-8 object-contain" />
            ) : activeMethod.icon ? (
              <activeMethod.icon className="h-5 w-5" />
            ) : null}
          </span>
          <span className="text-sm font-semibold" style={{ color: colors.text }}>{activeMethod.name}</span>
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
                  <img src={availableMethods.find(m => m.id === selectedMethod)?.logo || ''} alt="Payment Method" className="h-8 object-contain opacity-50" />
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
  const {
    userId,
    wallets,
    selectedWallet,
    selectedWalletId,
    selectWallet,
    loading: walletsLoading,
    error: walletsError,
  } = usePointsWallets();

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    
    if (link.settings?.terms_required && !termsAccepted) {
      setErrorMessage('You must agree to the Terms & Conditions.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      // Stripe requires Elements to be submitted immediately after the pay
      // action, before confirming the PaymentIntent.
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Check your payment details and try again.');
        return;
      }

      const retryUrl = `${window.location.pathname}${window.location.search}`;
      const returnParams = new URLSearchParams({
        source: 'quick-pay',
        link_id: String(link.id),
        return_to: retryUrl,
      });
      const returnUrl = link.settings?.confirmation_type === 'redirect' && link.settings?.success_url
        ? link.settings.success_url
        : `${window.location.origin}/payment-success?${returnParams.toString()}`;

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        if (error.type === 'validation_error') {
          setErrorMessage(error.message || 'Check your payment details and try again.');
          return;
        }

        window.location.assign(
          paymentStatusUrl(link, error.type === 'card_error' ? 'failed' : 'error', retryUrl),
        );
      }
    } catch {
      window.location.assign(
        paymentStatusUrl(link, 'error', `${window.location.pathname}${window.location.search}`),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePointsPayment = async () => {
    if (!userId) {
      setErrorMessage('Please log in to use Wersee Points.');
      return;
    }

    const pointsNeeded = Math.round(amount * 100);
    if (!selectedWallet || Number(selectedWallet.balance_points) < pointsNeeded) {
      setErrorMessage(`Insufficient points. You need ${pointsNeeded} points.`);
      return;
    }

    setLoading(true);
    try {
      const resData = await invokeApiRunner('pay-with-points', {
        listingId: link.id,
        userId,
        walletId: selectedWallet.wallet_id,
        amount: amount,
        description: link.product_name,
        sellerId: link.user_id,
        metadata: {
          source: 'quick_pay',
          slug: link.slug,
          productIds: Array.isArray(link.settings?.included_product_ids)
            ? link.settings.included_product_ids
            : [],
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Payment failed');
      }

      window.location.href = link.settings?.confirmation_type === 'redirect' && link.settings?.success_url 
        ? link.settings.success_url 
        : paymentStatusUrl(link, 'succeeded', `${window.location.pathname}${window.location.search}`);
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
              <WerseePointsMark className="h-6 w-8 text-yellow-500" />
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
                  <PaymentElement
                    options={{
                      layout: link.settings.layout || 'accordion',
                      paymentMethodOrder: link.settings?.payment_methods,
                    }}
                  />
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
                  <PointsWalletSlider
                    wallets={wallets}
                    selectedWalletId={selectedWalletId}
                    onSelect={selectWallet}
                    loading={walletsLoading}
                    error={walletsError}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Selected card balance</span>
                    <span className="font-mono font-bold text-yellow-500">{Number(selectedWallet?.balance_points || 0).toLocaleString()} Points</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Cost</span>
                    <span className="font-mono font-bold">{(amount * 100).toLocaleString()} Points</span>
                  </div>
                  {!userId && (
                    <p className="text-xs text-red-400">Please log in to use your points.</p>
                  )}
                  {userId && selectedWallet && Number(selectedWallet.balance_points) < (amount * 100) && (
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
        disabled={(!payWithPoints && !stripe) || loading || (link.settings?.terms_required && !termsAccepted) || (payWithPoints && (!userId || !selectedWallet || Number(selectedWallet.balance_points) < (amount * 100)))}
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
  const {
    wallets,
    selectedWallet,
    selectedWalletId,
    selectWallet,
    loading: walletsLoading,
    error: walletsError,
  } = usePointsWallets();

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
              <WerseePointsMark className="h-6 w-8 text-yellow-500" />
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
                  <PointsWalletSlider
                    wallets={wallets}
                    selectedWalletId={selectedWalletId}
                    onSelect={selectWallet}
                    loading={walletsLoading}
                    error={walletsError}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Selected card balance</span>
                    <span className="font-mono font-bold text-yellow-500">{Number(selectedWallet?.balance_points || 0).toLocaleString()} Points</span>
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
  const location = useLocation();
  const requestedEnvironment: 'test' | 'live' =
    location.pathname.startsWith('/s/') || location.pathname.startsWith('/sandbox/')
      ? 'test'
      : 'live';
  const routeUsername = parseUsernameRouteValue(username);
  const quickPayPath = routeUsername && slug
    ? werseePaymentUrls.quickPay({
        username: routeUsername,
        slug,
        sandbox: requestedEnvironment === 'test',
      })
    : '/';
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileHeroRef = useRef<HTMLDivElement>(null);
  const checkoutPanelRef = useRef<HTMLDivElement>(null);
  const [showCompactHeader, setShowCompactHeader] = useState(false);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const cleanUsername = parseUsernameRouteValue(username);
        const { data, error: dbError } = await supabase
          .from('quick_pay_links')
          .select('*')
          .eq('username', cleanUsername)
          .eq('slug', slug)
          .eq('environment', requestedEnvironment)
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

        const sandboxMode = data.environment === 'test';
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
          let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          try {
            const config = await invokeApiRunner('stripe-config', {}, 1, 500);
            if (typeof config?.publishableKey === 'string' && config.publishableKey) {
              publishableKey = config.publishableKey;
            }
          } catch (configError) {
            console.warn('Could not load Stripe checkout configuration', configError);
          }

          if (!publishableKey) {
            setCheckoutError('Secure checkout is not configured. Please contact the seller.');
            return;
          }

          const stripeOptions: any = {};
          if (data.stripe_account_id && data.stripe_account_id !== 'sandbox') {
            stripeOptions.stripeAccount = data.stripe_account_id;
          }
          setStripePromise(loadStripe(publishableKey, stripeOptions));

          // Initial intent creation (will update if variable price changes)
          await createPaymentIntent(
            data,
            data.settings?.pricing_type === 'fixed' ? data.price : (data.settings?.min_amount || 1),
          );
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) fetchLink();
  }, [username, slug, requestedEnvironment]);

  const createPaymentIntent = async (linkData: any, currentAmount: number) => {
    setIntentLoading(true);
    setCheckoutError(null);
    setClientSecret(null);
    try {
      const { data: resData, error: intentError } = await supabase.functions.invoke('quick-pay-payment', {
        body: {
          linkId: linkData.id,
          amount: currentAmount,
          environment: requestedEnvironment,
        },
      });

      if (intentError) {
        let message = intentError.message;
        try {
          const response = (intentError as any).context;
          if (response instanceof Response) {
            const payload = await response.json();
            if (typeof payload?.error === 'string') message = payload.error;
          }
        } catch {
          // Keep the SDK message when the response body is unavailable.
        }
        throw new Error(message);
      }
      if (resData?.error) {
        throw new Error(resData.error || 'Failed to create payment intent');
      }

      const { client_secret } = resData;
      if (!client_secret) throw new Error('Secure checkout did not return a payment session.');
      setClientSecret(client_secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Secure checkout could not start.';
      console.error('Quick Pay intent creation failed:', message);
      setCheckoutError(message);
    } finally {
      setIntentLoading(false);
    }
  };

  const handleMobileScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const heroHeight = mobileHeroRef.current?.offsetHeight || 0;
    const flattenDistance = Math.max(1, heroHeight - 48);
    const progress = Math.min(1, Math.max(0, event.currentTarget.scrollTop / flattenDistance));
    const radius = 36 * (1 - progress);
    checkoutPanelRef.current?.style.setProperty('--quick-pay-radius', `${radius.toFixed(2)}px`);
    const shouldShow = event.currentTarget.scrollTop >= flattenDistance;
    setShowCompactHeader(current => current === shouldShow ? current : shouldShow);
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
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
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
  const sellerName = link.name || link.username;
  const sellerLogo = link.settings?.logo_url || link.settings?.image_url || profile?.avatar_url;
  const videoUrl = typeof link.settings?.video_url === 'string' ? link.settings.video_url : '';
  const includedProducts = Array.isArray(link.settings?.included_products)
    ? link.settings.included_products
    : [];

  return (
    <div
      className="relative h-[100dvh] overflow-hidden transition-colors duration-500 lg:h-auto lg:min-h-[100dvh]"
      style={{ backgroundColor: colors.background }}
    >
      <SEO 
        title={link.product_name} 
        description={link.description}
        image={link.settings?.image_url || link.settings?.logo_url || profile?.avatar_url}
        url={quickPayPath}
        type="product"
      />

      <AnimatePresence>
        {showCompactHeader && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-2 px-3 pb-2 pt-[max(12px,env(safe-area-inset-top))] lg:hidden"
          >
            <div
              className="flex min-w-0 items-center gap-2 rounded-full border px-2 py-1.5 shadow-2xl backdrop-blur-xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${colors.card} 90%, transparent)`,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {sellerLogo ? (
                <img src={sellerLogo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: colors.primary }}>
                  <DollarSign className="h-4 w-4" />
                </span>
              )}
              <span className="max-w-[42vw] truncate pr-2 text-sm font-black">{sellerName}</span>
            </div>

            <div
              className="shrink-0 rounded-full border px-3 py-2 font-mono text-sm font-black shadow-2xl backdrop-blur-xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${colors.card} 90%, transparent)`,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {link.currency.toUpperCase()} {amount.toFixed(2)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={mobileScrollRef}
        onScroll={handleMobileScroll}
        className="h-full overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex lg:min-h-[100dvh] lg:h-auto lg:flex-row lg:overflow-visible"
      >
        {/* Product Info Section - Left/Top */}
        <motion.div
          ref={mobileHeroRef}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative flex min-h-[40dvh] w-full flex-col justify-center overflow-hidden p-8 pb-14 lg:min-h-[100dvh] lg:w-1/2 lg:p-16"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          {videoUrl && (
            <>
              <QuickPayVideoPlayer
                src={videoUrl}
                poster={link.settings?.video_poster_url || link.settings?.image_url}
                title={`${link.product_name} video`}
                className="absolute inset-0 h-full w-full"
                cover
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/80" />
            </>
          )}

          {/* Background Decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full opacity-10 blur-[100px]" style={{ backgroundColor: colors.primary }} />
            <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xl">
            {isSandbox && (
              <div className="mb-8 flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">Test Mode Active</h3>
                  <p className="mt-1 text-xs opacity-80">This checkout is currently in sandbox mode. No real payments will be processed. The seller has not fully set up their Wersee Pay account yet.</p>
                </div>
              </div>
            )}

            <div className="mb-8 lg:mb-16">
              <div className={`mb-12 flex items-center gap-3 ${videoUrl ? 'justify-between' : ''}`}>
                {link.settings?.logo_url ? (
                  <img src={link.settings.logo_url} alt="Logo" className="h-10 object-contain" />
                ) : link.settings?.image_url ? (
                  <img src={link.settings.image_url} alt={link.product_name} className="h-20 w-20 object-cover shadow-2xl" style={{ borderRadius }} />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary, borderRadius }}>
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                )}

                <span
                  className="max-w-[58vw] truncate rounded-full border px-4 py-2 text-sm font-black tracking-tight shadow-lg backdrop-blur-md lg:hidden"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${colors.card} 34%, transparent)`,
                    borderColor: `color-mix(in srgb, ${colors.text} 12%, transparent)`,
                  }}
                >
                  {videoUrl ? link.product_name : sellerName}
                </span>

                {!link.settings?.logo_url && (
                  <>
                    <div className="hidden h-10 w-px opacity-20 lg:block" style={{ backgroundColor: colors.text }} />
                    <span className="hidden text-lg font-bold tracking-tight opacity-60 lg:block">
                      {sellerName}
                    </span>
                  </>
                )}
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
                {link.product_name}
              </h1>

              <p className="text-lg leading-relaxed opacity-70">
                {link.description}
              </p>

              {includedProducts.length > 0 && (
                <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {includedProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex min-w-48 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-2.5 backdrop-blur-md"
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                          <DollarSign className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black">{product.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] opacity-60">
                          {link.currency.toUpperCase()} {Number(product.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto hidden lg:block">
              <div className="mb-2 text-sm font-bold uppercase tracking-widest opacity-50">Total to pay</div>
              <div className="text-6xl font-bold tracking-tighter">
                {link.currency.toUpperCase()} {amount.toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Checkout Section - Right/Bottom */}
        <motion.div
          ref={checkoutPanelRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 -mt-8 flex min-h-[calc(100dvh-2rem)] w-full flex-col justify-start [border-top-left-radius:var(--quick-pay-radius,36px)] [border-top-right-radius:var(--quick-pay-radius,36px)] p-6 pt-8 shadow-2xl lg:mt-0 lg:min-h-[100dvh] lg:w-1/2 lg:justify-center lg:!rounded-none lg:p-16 lg:shadow-none"
          style={{
            backgroundColor: colors.card,
            color: colors.text,
          }}
        >
          <div className="mx-auto w-full max-w-md">
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
                  key={clientSecret}
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
                        },
                        '.Dropdown': {
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`,
                          borderRadius: borderRadius,
                          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
                        },
                        '.DropdownItem': {
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderRadius: '10px',
                        },
                        '.DropdownItem--highlight': {
                          backgroundColor: colors.background,
                          color: colors.primary,
                        }
                      }
                    }
                  }}
                >
                  <CheckoutForm link={link} clientSecret={clientSecret} amount={amount} setAmount={setAmount} isSandbox={isSandbox} colors={colors} borderRadius={borderRadius} />
                </Elements>
              ) : checkoutError && !intentLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: colors.text }}>Secure checkout unavailable</h2>
                  <p className="mt-2 max-w-sm text-sm opacity-60" style={{ color: colors.text }}>{checkoutError}</p>
                  <button
                    type="button"
                    onClick={() => void createPaymentIntent(link, amount)}
                    className="mt-6 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
                  <p className="text-sm opacity-60">Loading secure checkout...</p>
                </div>
              )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
