import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, FileText, DollarSign, Users, CheckCircle2, ChevronRight, UploadCloud, X, AlertTriangle, Loader2, CreditCard, Landmark, ShoppingBag, Smartphone, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FileUpload } from '../FileUpload';
import { BusinessSettings, RevenueSplit } from '../../types/business';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit Card & Wallets', icon: CreditCard, logo: null },
  { id: 'ideal', name: 'iDEAL', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/iDEAL_Wero_Lockup_Yellow_Square_RGB.svg' },
  { id: 'bancontact', name: 'Bancontact', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/Bancontact_logo.svg.png' },
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

interface BusinessOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({
    business_name: '',
    business_description: '',
    logo_url: '',
    terms_url: '',
    privacy_url: '',
    use_platform_policies: true,
    payout_schedule: 'monthly',
    default_payment_methods: ['card', 'ideal', 'bancontact'],
  });
  const [splits, setSplits] = useState<Partial<RevenueSplit>[]>([{ recipient_email: '', percentage: 0 }]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save Business Settings
      const { error: settingsError } = await supabase
        .from('business_settings')
        .upsert({
          user_id: userId,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (settingsError) throw settingsError;

      // Save Splits (simplified - just insert for now, ideally handle updates/deletes)
      const validSplits = splits.filter(s => s.recipient_email && s.percentage > 0);
      if (validSplits.length > 0) {
        const { error: splitsError } = await supabase
          .from('revenue_splits')
          .insert(validSplits.map(s => ({
            user_id: userId,
            recipient_email: s.recipient_email,
            percentage: s.percentage,
            status: 'pending'
          })));
        
        if (splitsError) throw splitsError;
      }

      onClose();
    } catch (err) {
      console.error('Error saving business settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Your Business Profile</h2>
            <p className="text-sm text-gray-400">Set up your business details to start selling.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? 'bg-[#635BFF]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-[#635BFF]" />
                </div>
                <h3 className="text-lg font-bold text-white">Business Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.business_name} 
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})} 
                    placeholder="e.g. Acme Corp" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    value={formData.business_description} 
                    onChange={(e) => setFormData({...formData, business_description: e.target.value})} 
                    placeholder="Tell us about your business..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all h-24 resize-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Logo</label>
                  {formData.logo_url ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 group">
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain bg-white/5" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => setFormData({...formData, logo_url: ''})}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <FileUpload 
                      bucket="listings"
                      onUpload={(url) => setFormData({...formData, logo_url: url})}
                      label="Upload Logo"
                      accept="image/*"
                      darkMode={true}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                  <FileText className="w-5 h-5 text-[#635BFF]" />
                </div>
                <h3 className="text-lg font-bold text-white">Policies & Terms</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                  <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${formData.use_platform_policies ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20'}`}>
                    {formData.use_platform_policies && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.use_platform_policies} 
                    onChange={(e) => setFormData({...formData, use_platform_policies: e.target.checked})} 
                    className="hidden" 
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Use Wersee Standard Policies</span>
                    <span className="text-xs text-gray-400 block mt-1">We'll provide standard Terms of Service and Privacy Policy for your customers.</span>
                  </div>
                </label>

                {!formData.use_platform_policies && (
                  <div className="space-y-4 pl-8 border-l border-white/10 ml-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms of Service URL</label>
                      <input 
                        type="url" 
                        value={formData.terms_url} 
                        onChange={(e) => setFormData({...formData, terms_url: e.target.value})} 
                        placeholder="https://example.com/terms" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Privacy Policy URL</label>
                      <input 
                        type="url" 
                        value={formData.privacy_url} 
                        onChange={(e) => setFormData({...formData, privacy_url: e.target.value})} 
                        placeholder="https://example.com/privacy" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#635BFF]" />
                </div>
                <h3 className="text-lg font-bold text-white">Payouts & Fees</h3>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Fee Agreement
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Wersee Platform Fee</span>
                      <span className="font-mono text-white">3.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stripe Processing Fee</span>
                      <span className="font-mono text-white">2.9% + €0.30</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-xs text-gray-500">
                      Fees are automatically deducted from each transaction.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payout Schedule</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['monthly', 'bi-weekly', 'quarterly'].map((schedule) => (
                      <button
                        key={schedule}
                        onClick={() => setFormData({...formData, payout_schedule: schedule as any})}
                        className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${formData.payout_schedule === schedule ? 'bg-[#635BFF] border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        {schedule}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Default Payment Methods</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${formData.default_payment_methods?.includes(method.id) ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20'}`}>
                            {formData.default_payment_methods?.includes(method.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={formData.default_payment_methods?.includes(method.id)} 
                            onChange={(e) => {
                              const current = formData.default_payment_methods || [];
                              const newMethods = e.target.checked 
                                ? [...current, method.id]
                                : current.filter(m => m !== method.id);
                              setFormData({...formData, default_payment_methods: newMethods});
                            }} 
                            className="hidden" 
                          />
                          <span className="text-xs font-medium text-white truncate">{method.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                  <Users className="w-5 h-5 text-[#635BFF]" />
                </div>
                <h3 className="text-lg font-bold text-white">Revenue Splits</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-400">Add team members who should receive a percentage of revenue directly.</p>
                
                {splits.map((split, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input 
                        type="email" 
                        value={split.recipient_email} 
                        onChange={(e) => {
                          const newSplits = [...splits];
                          newSplits[index].recipient_email = e.target.value;
                          setSplits(newSplits);
                        }} 
                        placeholder="recipient@email.com" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all" 
                      />
                    </div>
                    <div className="w-24 relative">
                      <input 
                        type="number" 
                        value={split.percentage} 
                        onChange={(e) => {
                          const newSplits = [...splits];
                          newSplits[index].percentage = parseFloat(e.target.value);
                          setSplits(newSplits);
                        }} 
                        placeholder="%" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all" 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newSplits = splits.filter((_, i) => i !== index);
                        setSplits(newSplits);
                      }}
                      className="p-3 hover:bg-white/10 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <button 
                  onClick={() => setSplits([...splits, { recipient_email: '', percentage: 0 }])}
                  className="flex items-center gap-2 text-sm font-bold text-[#635BFF] hover:text-[#5851E5] transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Add Recipient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#141414] flex justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(prev => prev - 1)}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-bold"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(prev => prev + 1)}
              className="px-6 py-2 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-bold transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
