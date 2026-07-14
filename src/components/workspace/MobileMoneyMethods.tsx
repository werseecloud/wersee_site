import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CreditCard, 
  Wallet, 
  Landmark, 
  ArrowRightLeft, 
  Zap, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Save,
  ArrowLeft,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PAYMENT_FAMILIES = [
  { id: 'card', name: 'Cards', icon: CreditCard, description: 'Visa, Mastercard, Amex, etc.' },
  { id: 'wallet', name: 'Wallets', icon: Wallet, description: 'Apple Pay, Google Pay, Link' },
  { id: 'bank_debit', name: 'Bank Debits', icon: Landmark, description: 'Direct Debit, ACH, SEPA' },
  { id: 'bank_redirect', name: 'Bank Redirects', icon: ArrowRightLeft, description: 'iDEAL, Bancontact, Sofort' },
  { id: 'bank_transfer', name: 'Bank Transfers', icon: Landmark, description: 'Wire, SEPA Credit' },
  { id: 'buy_now_pay_later', name: 'BNPL', icon: Clock, description: 'Klarna, Affirm, Afterpay' },
  { id: 'real_time_payment', name: 'Real-time', icon: Zap, description: 'Pix, PayNow' },
  { id: 'voucher', name: 'Vouchers', icon: Ticket, description: 'OXXO, Boleto' },
];

interface MobileMoneyMethodsProps {
  onBack: () => void;
}

export const MobileMoneyMethods: React.FC<MobileMoneyMethodsProps> = ({ onBack }) => {
  const [supportedMethods, setSupportedMethods] = useState<string[]>(['card', 'wallet']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

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
      // Use a toast or simple feedback instead of alert
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/5 rounded-full border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-black tracking-tight">Payment Methods</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="p-2.5 bg-indigo-500 rounded-full border border-white/10 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Save className="w-5 h-5 text-white" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 scrollbar-hide">
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex items-start gap-4">
          <Shield className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
          <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
            Toggling these will restrict which methods are offered to your customers. 
            Ensure you have enabled them in your Stripe Dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_FAMILIES.map((family, i) => {
            const Icon = family.icon;
            const isSelected = supportedMethods.includes(family.id);
            
            return (
              <motion.button
                key={family.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleMethod(family.id)}
                className={`p-5 rounded-[2rem] border transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/[0.03] border-white/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">{family.name}</h3>
                  <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">{family.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
