import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Loader2, ArrowRight, Building2, Globe, FileText, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const AfterpayApplyView = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [stats, setStats] = useState({ balance: 0, completedOrders: 0 });
  const [formData, setFormData] = useState({
    businessName: '',
    website: '',
    industry: 'retail',
    annualRevenue: '',
    contactName: '',
    contactEmail: '',
    termsAccepted: false
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) return;
      
      // Fetch completed orders to check for reliability and profit
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed');
        
      const totalBalance = completedOrders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
      const completedCount = completedOrders?.length || 0;

      setStats({ balance: totalBalance, completedOrders: completedCount });
      
      // Criteria: At least 5 completed orders and > 500 EUR balance
      if (completedCount >= 5 && totalBalance >= 500) {
        setIsEligible(true);
      }
      setLoading(false);
    };
    checkEligibility();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitting(false);
    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#b2fce4] animate-spin" />
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8 md:py-12 px-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
          <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Not Eligible Yet</h2>
        <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-lg">
          To apply for Afterpay, your business needs to demonstrate consistent performance. 
          Currently, you have {stats.completedOrders} completed orders and a total balance of €{stats.balance.toFixed(2)}.
        </p>
        <div className="p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-left">
          <h3 className="text-sm md:text-base font-bold text-white mb-4">Requirements to apply:</h3>
          <ul className="space-y-3 md:space-y-4">
            <li className="flex items-center gap-3 text-xs md:text-sm text-gray-400">
              <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${stats.completedOrders >= 5 ? 'text-emerald-500' : 'text-gray-600'}`} />
              <span>At least 5 completed orders</span>
            </li>
            <li className="flex items-center gap-3 text-xs md:text-sm text-gray-400">
              <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${stats.balance >= 500 ? 'text-emerald-500' : 'text-gray-600'}`} />
              <span>At least €500 in total completed sales</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8 md:py-12 px-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
          <Clock className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Application Submitted</h2>
        <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-lg">
          Your application for Afterpay is currently under review. This process typically takes 3-5 business days. 
          We will notify you via email once your account has been approved.
        </p>
        <div className="p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-left">
          <h3 className="text-sm md:text-base font-bold text-white mb-4">What happens next?</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-xs md:text-sm text-gray-400">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 text-[10px] md:text-xs font-bold">1</div>
              <span>Our compliance team will verify your business details and website.</span>
            </li>
            <li className="flex items-start gap-3 text-xs md:text-sm text-gray-400">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 text-gray-400 flex items-center justify-center shrink-0 text-[10px] md:text-xs font-bold">2</div>
              <span>You'll receive an email with the decision or a request for more information.</span>
            </li>
            <li className="flex items-start gap-3 text-xs md:text-sm text-gray-400">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 text-gray-400 flex items-center justify-center shrink-0 text-[10px] md:text-xs font-bold">3</div>
              <span>Once approved, Afterpay will be automatically enabled in your payment methods.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#b2fce4] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-black font-black text-xs md:text-xl tracking-tighter">afterpay</span>
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-white">Apply for Afterpay</h2>
            <p className="text-xs md:text-sm text-gray-400">Enable Buy Now, Pay Later for your customers.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6 md:mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-1 md:h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-[#b2fce4]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {step === 1 && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <input 
                    type="text"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Legal business name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <input 
                    type="url"
                    name="website"
                    required
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourstore.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Industry</label>
              <select 
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all appearance-none"
              >
                <option value="retail" className="bg-[#1a1a1a]">Retail & Fashion</option>
                <option value="electronics" className="bg-[#1a1a1a]">Electronics</option>
                <option value="beauty" className="bg-[#1a1a1a]">Beauty & Health</option>
                <option value="home" className="bg-[#1a1a1a]">Home & Garden</option>
                <option value="services" className="bg-[#1a1a1a]">Services</option>
                <option value="other" className="bg-[#1a1a1a]">Other</option>
              </select>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#b2fce4] text-black rounded-xl md:rounded-2xl font-bold hover:bg-[#9cfad9] transition-all flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Name</label>
                <input 
                  type="text"
                  name="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Email</label>
                <input 
                  type="email"
                  name="contactEmail"
                  required
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="email@business.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">Estimated Annual Revenue</label>
              <select 
                name="annualRevenue"
                required
                value={formData.annualRevenue}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-[#b2fce4] transition-all appearance-none"
              >
                <option value="" className="bg-[#1a1a1a]">Select range</option>
                <option value="0-50k" className="bg-[#1a1a1a]">€0 - €50,000</option>
                <option value="50k-250k" className="bg-[#1a1a1a]">€50,000 - €250,000</option>
                <option value="250k-1m" className="bg-[#1a1a1a]">€250,000 - €1,000,000</option>
                <option value="1m+" className="bg-[#1a1a1a]">€1,000,000+</option>
              </select>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-between gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full md:w-auto px-8 py-3 md:py-4 text-gray-400 hover:text-white transition-all text-sm font-bold"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#b2fce4] text-black rounded-xl md:rounded-2xl font-bold hover:bg-[#9cfad9] transition-all flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-4 text-[#b2fce4]">
                <Shield className="w-6 h-6 md:w-8 md:h-8" />
                <h3 className="text-lg md:text-xl font-bold">Terms & Conditions</h3>
              </div>
              <div className="h-40 md:h-48 overflow-y-auto pr-2 md:pr-4 text-[10px] md:text-sm text-gray-500 space-y-3 md:space-y-4 scrollbar-hide">
                <p>By applying for Afterpay, you agree to the Merchant Agreement and our Privacy Policy. Afterpay provides a Buy Now, Pay Later service that allows your customers to pay in installments.</p>
                <p>1. Merchant Fees: Afterpay charges a percentage fee per transaction plus a fixed fee. These fees will be deducted from your payouts.</p>
                <p>2. Integration: You agree to display Afterpay branding correctly on your website as per our brand guidelines.</p>
                <p>3. Refunds: Refunds for Afterpay transactions must be processed through the Afterpay system to ensure customer installments are correctly adjusted.</p>
                <p>4. Compliance: You must comply with all local laws regarding consumer credit and lending in your operating regions.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative shrink-0">
                  <input 
                    type="checkbox"
                    name="termsAccepted"
                    required
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                    formData.termsAccepted ? 'bg-[#b2fce4] border-[#b2fce4]' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {formData.termsAccepted && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-black" />}
                  </div>
                </div>
                <span className="text-xs md:text-sm text-gray-400 group-hover:text-white transition-colors">I agree to the Afterpay Merchant Agreement</span>
              </label>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-between gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full md:w-auto px-8 py-3 md:py-4 text-gray-400 hover:text-white transition-all text-sm font-bold"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={submitting || !formData.termsAccepted}
                className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#b2fce4] text-black rounded-xl md:rounded-2xl font-bold hover:bg-[#9cfad9] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-8 md:mt-12 p-4 md:p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl md:rounded-3xl flex items-start gap-3 md:gap-4 text-blue-400">
        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5" />
        <div className="text-[10px] md:text-sm">
          <p className="font-bold mb-1">Important Information</p>
          <p className="opacity-80">
            Afterpay is available for businesses in supported regions. Your account must be in good standing with Stripe to be eligible for Afterpay integration.
          </p>
        </div>
      </div>
    </div>
  );
};
