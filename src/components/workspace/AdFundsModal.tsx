import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, ShieldCheck, DollarSign, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { BottomSheetModal } from '../ui/BottomSheetModal';

const CheckoutForm = ({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/workspace/overview?view=management-ads&success=true`,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message || 'An unexpected error occurred.');
      setProcessing(false);
    } else {
      // Payment successful, update wallet balance
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // In a real app, this would be handled by a webhook
          // For this demo, we'll update it directly
          const { data: wallet } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();
          
          const newBalance = (wallet?.balance || 0) + amount;
          await supabase.from('user_wallets').upsert({ user_id: user.id, balance: newBalance });
        }
        onSuccess();
      } catch (err) {
        console.error('Error updating wallet:', err);
        setError('Payment succeeded but failed to update wallet. Please contact support.');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-[2] px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay €${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

interface AdFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export const AdFundsModal: React.FC<AdFundsModalProps> = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState<number>(25);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initStripe();
    }
  }, [isOpen]);

  const initStripe = async () => {
    try {
      const data = await invokeApiRunner('stripe-config');
      if (data?.publishableKey) {
        setStripePromise(loadStripe(data.publishableKey));
      }
    } catch (err) {
      console.error('Error loading stripe config:', err);
    }
  };

  const handleStartPayment = async () => {
    setLoading(true);
    try {
      const data = await invokeApiRunner('create-payment-intent', { 
        amount: amount, 
        currency: 'eur',
        description: 'Ad Funds'
      });
      setClientSecret(data.client_secret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-indigo-500/10 to-transparent shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Ad Funds</h2>
            <p className="text-sm text-gray-400 mt-1">Top up your campaign wallet</p>
          </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {!clientSecret ? (
            <div className="space-y-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Balance</div>
                    <div className="text-2xl font-bold text-white">€{currentBalance.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 25, 50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-3 rounded-2xl font-bold transition-all border ${
                        amount === val 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      €{val}
                    </button>
                  ))}
                </div>
                <div className="relative mt-4">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</div>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Custom amount"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStartPayment}
                  disabled={loading || amount <= 0}
                  className="w-full py-5 bg-white text-black rounded-3xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      Continue to Payment
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-widest">Secure Stripe Checkout</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#6366f1' } } }}>
                  <CheckoutForm 
                    amount={amount} 
                    onSuccess={onSuccess} 
                    onCancel={() => setClientSecret(null)} 
                  />
                </Elements>
              )}
            </div>
          )}
        </div>
      </div>
    </BottomSheetModal>
  );
};
