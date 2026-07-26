import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, FileText, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../SEO';
import { parseUsernameRouteValue, routes } from '../../routing/routes';
import { PointsWalletSlider, usePointsWallets } from '../payments/PointsWalletSlider';
import { WerseePointsMark } from '../payments/WerseePointsMark';
import { werseePaymentUrls } from '../../lib/paymentUrls';

const CheckoutForm = ({ invoice, clientSecret, returnUrl, retryUrl, isSandbox }: { invoice: any, clientSecret: string, returnUrl: string, retryUrl: string, isSandbox: boolean }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [payWithPoints, setPayWithPoints] = useState(isSandbox);
  const {
    userId,
    wallets,
    selectedWallet,
    selectedWalletId,
    selectWallet,
    loading: walletsLoading,
    error: walletsError,
  } = usePointsWallets();

  useEffect(() => {
    if (isSandbox) {
      setPayWithPoints(true);
    }
  }, [isSandbox]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSandbox) {
      setError('Stripe payments are disabled in sandbox mode. Please use Wersee Points.');
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (submitError) {
        if (submitError.type === 'validation_error') {
          setError(submitError.message || 'Check your payment details and try again.');
          setProcessing(false);
          return;
        }
        const status = submitError.type === 'card_error' ? 'failed' : 'error';
        window.location.assign(
          `/payment-success?source=invoice&status=${status}&return_to=${encodeURIComponent(retryUrl)}`,
        );
      }
    } catch {
      window.location.assign(
        `/payment-success?source=invoice&status=error&return_to=${encodeURIComponent(retryUrl)}`,
      );
    }
  };

  const handlePointsPayment = async () => {
    if (!userId) {
      setError('Please log in to use Wersee Points.');
      return;
    }

    const pointsNeeded = Math.round(invoice.amount * 100);
    if ((!selectedWallet || Number(selectedWallet.balance_points) < pointsNeeded) && !isSandbox) {
      setError(`Insufficient points. You need ${pointsNeeded} points.`);
      return;
    }

    setProcessing(true);
    try {
      if (isSandbox) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = `${returnUrl}&status=succeeded`;
        return;
      }

      const resData = await invokeApiRunner('pay-with-points', {
        listingId: invoice.id,
        userId,
        walletId: selectedWallet?.wallet_id,
        amount: invoice.amount,
        description: `Invoice #${invoice.invoice_number || invoice.id.slice(0, 8)}`,
        sellerId: invoice.user_id,
        metadata: {
          source: 'invoice',
          invoiceId: invoice.id
        }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Payment failed');
      }

      window.location.href = `${returnUrl}&status=succeeded`;
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-bold opacity-70 uppercase tracking-wider flex items-center gap-2">
          Payment Method {isSandbox && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Sandbox Only</span>}
        </h3>
        
        {!isSandbox && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              onClick={() => setPayWithPoints(false)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!payWithPoints ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-bold">Stripe</span>
            </button>
            <button 
              onClick={() => setPayWithPoints(true)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${payWithPoints ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <WerseePointsMark className="h-6 w-8 text-yellow-500" />
              <span className="text-xs font-bold">Wersee Points</span>
            </button>
          </div>
        )}

        {payWithPoints ? (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
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
              <span className="font-mono font-bold">{(invoice.amount * 100).toLocaleString()} Points</span>
            </div>
            {!userId && !isSandbox && (
              <p className="text-xs text-red-400">Please log in to use your points.</p>
            )}
            {userId && selectedWallet && Number(selectedWallet.balance_points) < (invoice.amount * 100) && !isSandbox && (
              <p className="text-xs text-red-400">Insufficient points balance.</p>
            )}
            {isSandbox && (
              <p className="text-xs text-yellow-500">In sandbox mode, you can pay with unlimited Wersee Points for testing.</p>
            )}
          </div>
        ) : (
          <PaymentElement />
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={payWithPoints ? handlePointsPayment : handleSubmit}
        disabled={(!payWithPoints && !stripe && !isSandbox) || processing || (payWithPoints && (!userId || !selectedWallet || (!isSandbox && Number(selectedWallet.balance_points) < (invoice.amount * 100))))}
        className="w-full py-4 bg-[#635BFF] hover:bg-[#5851E5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-[#635BFF]/25 flex items-center justify-center gap-2"
        style={{ backgroundColor: payWithPoints ? '#EAB308' : '#635BFF' }}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {payWithPoints ? (isSandbox ? 'Test Pay with Points' : `Pay with ${(invoice.amount * 100).toLocaleString()} Points`) : `Pay ${invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}${invoice.amount.toFixed(2)}`}
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
        <ShieldCheck className="w-3 h-3" />
        <span>{isSandbox ? 'Sandbox Payment Simulation' : 'Secure payment processing by Stripe'}</span>
      </div>
    </div>
  );
};

export const InvoicePaymentPage = () => {
  const { username, slug, invoiceNumber } = useParams();
  const routeUsername = parseUsernameRouteValue(username);
  const invoicePath = routeUsername && slug
    ? routes.userInvoice({ username: routeUsername, invoiceSlug: slug })
    : '/';
  const quickPayInvoicePath = routeUsername && slug
    ? routes.userQuickPayInvoice({ username: routeUsername, invoiceSlug: slug })
    : '/';
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [isSandbox, setIsSandbox] = useState<boolean>(false);

  useEffect(() => {
    const fetchInvoiceAndSetupPayment = async () => {
      try {
        // 1. Fetch Invoice
        let query = supabase.from('invoices').select('*');
        
        if (invoiceNumber) {
          // Try fetching by invoice_number or slug
          // Note: invoice_number is typically a string, slug is a string
          query = query.or(`invoice_number.eq.${invoiceNumber},slug.eq.${invoiceNumber}`);
        } else if (username && slug) {
          const cleanUsername = parseUsernameRouteValue(username);
          if (!cleanUsername) throw new Error('Invalid username');
          query = query.eq('username', cleanUsername).eq('slug', slug);
        } else {
          throw new Error('Invalid payment link');
        }

        const { data: invoiceData, error: dbError } = await query.single();

        if (dbError || !invoiceData) throw new Error('Invoice not found');
        setInvoice(invoiceData);

        if (invoiceData.status === 'paid') {
            setLoading(false);
            return;
        }

        // 2. Fetch Profile for Stripe Account ID and sandbox settings
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_account_id, business_name, avatar_url')
          .eq('id', invoiceData.user_id)
          .single();

        if (profileError) {
          throw new Error('Seller profile not found');
        }
        setProfile(profileData);

        // Fetch business settings for sandbox mode
        const { data: settingsData } = await supabase
          .from('business_settings')
          .select('sandbox_mode')
          .eq('user_id', invoiceData.user_id)
          .maybeSingle();
          
        const sandboxMode = (!profileData.stripe_account_id || profileData.stripe_account_id === 'sandbox') || (settingsData?.sandbox_mode === true);
        setIsSandbox(sandboxMode);

        // 3. Get Client Secret for Invoice Payment Intent
        if (!sandboxMode) {
          const resData = await invokeApiRunner('invoice-payment-intent', {
            accountId: profileData.stripe_account_id,
            invoiceId: invoiceData.stripe_invoice_id
          });

          const { clientSecret } = resData;
          setClientSecret(clientSecret);
        }

        const returnUrl = werseePaymentUrls.invoice({
          username: invoiceData.username,
          invoiceId: invoiceData.invoice_number || invoiceData.slug || invoiceData.id,
          sandbox: sandboxMode,
        });
          
        setInvoice({...invoiceData, returnUrl});

        // Initialize Stripe if not sandbox
        if (!sandboxMode) {
          let pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          try {
            const config = await invokeApiRunner('stripe-config');
            if (config && config.publishableKey) {
              pk = config.publishableKey;
            }
          } catch (err: any) {
            console.warn('Could not fetch Stripe config', err);
          }
          setStripePromise(loadStripe(pk, { stripeAccount: profileData.stripe_account_id }));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceAndSetupPayment();
  }, [username, slug, invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
        <p className="text-gray-400 max-w-md">{error}</p>
        <button 
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
            Go Back
        </button>
      </div>
    );
  }

  if (invoice?.status === 'paid') {
      return (
        <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invoice Paid</h1>
            <p className="text-gray-400 max-w-md">This invoice has already been paid. Thank you!</p>
            <button 
                onClick={() => navigate(invoicePath)}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
                View Invoice
            </button>
        </div>
      );
  }

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#635BFF',
      colorBackground: '#1A1A1A',
      colorText: '#ffffff',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex flex-col md:flex-row">
      <SEO 
        title={`Pay Invoice #${invoice.slug?.toUpperCase() || invoice.id.slice(0, 8).toUpperCase()}`}
        description={`Secure payment for invoice from ${profile?.business_name || username}`}
        url={quickPayInvoicePath}
        noIndex={true}
      />
      {/* Left Panel - Invoice Details */}
      <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF]/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-lg mx-auto w-full">
          {isSandbox && (
            <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Test Mode Active</h3>
                <p className="text-xs opacity-80 mt-1">This checkout is currently in sandbox mode. No real payments will be processed. The seller has not fully set up their Wersee Pay account yet.</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoice
          </button>

          <div className="flex items-center gap-4 mb-8">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.business_name} className="w-16 h-16 rounded-xl object-cover bg-white/5" />
            ) : (
              <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#635BFF]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile?.business_name || 'Business Name'}</h1>
              <p className="text-gray-400">Invoice #{invoice.slug?.toUpperCase() || invoice.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-400">Amount Due</span>
              <span className="text-4xl font-bold">
                {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                {invoice.amount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Items</h3>
            <div className="space-y-3">
              {invoice.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.description} <span className="text-gray-600">x{item.quantity}</span></span>
                  <span className="font-medium">
                    {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between font-bold">
              <span>Total</span>
              <span>
                {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                {invoice.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Payment Form */}
      <div className="w-full md:w-1/2 bg-[#141414] border-l border-white/10 p-6 md:p-12 lg:p-16 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
          
          {isSandbox ? (
            <CheckoutForm 
              invoice={invoice} 
              clientSecret="" 
              returnUrl={`${window.location.origin}/payment-success?source=invoice&invoice_id=${encodeURIComponent(invoice.id)}&return_to=${encodeURIComponent(invoicePath)}`}
              retryUrl={invoicePath}
              isSandbox={isSandbox}
            />
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: appearance as any }}>
              <CheckoutForm 
                invoice={invoice} 
                clientSecret={clientSecret} 
                returnUrl={`${window.location.origin}/payment-success?source=invoice&invoice_id=${encodeURIComponent(invoice.id)}&return_to=${encodeURIComponent(invoicePath)}`}
                retryUrl={invoicePath}
                isSandbox={isSandbox}
              />
            </Elements>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#635BFF' }} />
              <p className="text-sm opacity-60">Loading secure checkout...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
