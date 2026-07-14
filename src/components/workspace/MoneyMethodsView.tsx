import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, Wallet, Landmark, ArrowRightLeft, Zap, Ticket, Clock, CheckCircle2, Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { appToast } from '@/lib/feedback';
const PAYMENT_FAMILIES = [
  { id: 'card', name: 'Cards', icon: CreditCard, description: 'Visa, Mastercard, American Express, Discover, etc.' },
  { id: 'wallet', name: 'Wallets', icon: Wallet, description: 'Apple Pay, Google Pay, Link, etc.' },
  { id: 'bank_debit', name: 'Bank Debits', icon: Landmark, description: 'Direct Debit, ACH, SEPA, etc.' },
  { id: 'bank_redirect', name: 'Bank Redirects', icon: ArrowRightLeft, description: 'iDEAL, Bancontact, Sofort, etc.' },
  { id: 'bank_transfer', name: 'Bank Transfers', icon: Landmark, description: 'Wire transfers, SEPA Credit Transfer, etc.' },
  { id: 'buy_now_pay_later', name: 'Buy Now, Pay Later', icon: Clock, description: 'Klarna, Affirm, Afterpay, etc.' },
  { id: 'real_time_payment', name: 'Real-time Payments', icon: Zap, description: 'Pix, PayNow, etc.' },
  { id: 'voucher', name: 'Vouchers', icon: Ticket, description: 'OXXO, Boleto, etc.' },
];

export const MoneyMethodsView = () => {
  const [supportedMethods, setSupportedMethods] = useState<string[]>(['card', 'wallet']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id, supported_payment_methods')
        .eq('user_id', user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
        if (business.supported_payment_methods) {
          setSupportedMethods(business.supported_payment_methods);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const toggleMethod = (id: string) => {
    setSupportedMethods(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ supported_payment_methods: supportedMethods })
        .eq('id', businessId);

      if (error) throw error;
      appToast('Payment methods updated successfully!');
    } catch (err) {
      console.error(err);
      appToast('Failed to update payment methods.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Supported Payment Methods</h2>
          <p className="text-xs md:text-sm text-gray-400">Choose which payment method families you want to support for your products.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {PAYMENT_FAMILIES.map((family) => {
          const Icon = family.icon;
          const isSelected = supportedMethods.includes(family.id);
          
          return (
            <button
              key={family.id}
              onClick={() => toggleMethod(family.id)}
              className={`flex items-start gap-3 md:gap-4 p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all text-left group ${
                isSelected 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all shrink-0 ${
                isSelected ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 group-hover:text-white'
              }`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                  <h3 className="text-sm md:text-base font-bold text-white truncate">{family.name}</h3>
                  {isSelected && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] md:text-sm text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-none">{family.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 md:p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl md:rounded-3xl flex items-start gap-3 md:gap-4 text-blue-400">
        <Shield className="w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5" />
        <div className="text-[10px] md:text-sm">
          <p className="font-bold mb-1">Stripe Automatic Payment Methods</p>
          <p className="opacity-80">
            We use Stripe's Automatic Payment Methods. Toggling these here will restrict which methods are offered to your customers. 
            Ensure you have enabled the corresponding methods in your <a href="https://dashboard.stripe.com/settings/payments" target="_blank" rel="noreferrer" className="underline font-bold">Stripe Dashboard</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
