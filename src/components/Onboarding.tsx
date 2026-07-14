import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronRight, User, Briefcase, Building2, Globe, CreditCard, Layout, Repeat, ShoppingBag, Wrench, FileCode, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Onboarding = ({ isOpen, onClose }: OnboardingProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    phoneNumber: '',
    accountType: '' as 'individual' | 'professional' | 'company' | '',
    companyName: '',
    companyWebsite: '',
    paymentModels: [] as string[],
    primaryGoal: ''
  });

  // Reset step when opened
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const togglePaymentModel = (model: string) => {
    setFormData(prev => {
      const models = prev.paymentModels.includes(model)
        ? prev.paymentModels.filter(m => m !== model)
        : [...prev.paymentModels, model];
      return { ...prev, paymentModels: models };
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          country: formData.country,
          phone_number: formData.phoneNumber,
          account_type: formData.accountType,
          onboarding_completed: true,
          name: `${formData.firstName} ${formData.lastName}`
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert business profile if applicable
      if (formData.accountType !== 'individual') {
        const { error: businessError } = await supabase
          .from('business_profiles')
          .insert({
            id: user.id,
            company_name: formData.companyName,
            company_website: formData.companyWebsite,
            payment_models: formData.paymentModels,
            primary_goal: formData.primaryGoal
          });

        if (businessError) throw businessError;
      }

      setStep(5); // Success step
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[600px] h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1D1D1F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-semibold text-[#1D1D1F]">Account Setup</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">Tell us about yourself</h2>
                      <p className="text-[#86868B]">We need a few basic details to set up your account.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">First name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => updateForm('firstName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none"
                          placeholder="Jan"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#1D1D1F]">Last name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => updateForm('lastName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none"
                          placeholder="Jansen"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">Country</label>
                      <select
                        value={formData.country}
                        onChange={(e) => updateForm('country', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none appearance-none"
                      >
                        <option value="">Select a country</option>
                        <option value="NL">Netherlands</option>
                        <option value="BE">Belgium</option>
                        <option value="DE">Germany</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">Phone number</label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => updateForm('phoneNumber', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none"
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">How do you want to sell?</h2>
                      <p className="text-[#86868B]">Choose the account type that fits you best.</p>
                    </div>

                    <div className="grid gap-4">
                      {[
                        { id: 'individual', title: 'Individual', desc: 'For personal selling and hobbyists.', icon: User },
                        { id: 'professional', title: 'Professional', desc: 'For freelancers and experts.', icon: Briefcase },
                        { id: 'company', title: 'Company', desc: 'For registered businesses.', icon: Building2 },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => updateForm('accountType', type.id)}
                          className={cn(
                            "flex items-center p-4 rounded-2xl border-2 transition-all text-left group",
                            formData.accountType === type.id
                              ? "border-[#1D1D1F] bg-[#F5F5F7]"
                              : "border-transparent bg-[#F5F5F7] hover:bg-[#E8E8ED]"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors",
                            formData.accountType === type.id ? "bg-[#1D1D1F] text-white" : "bg-white text-[#1D1D1F]"
                          )}>
                            <type.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1D1D1F]">{type.title}</h3>
                            <p className="text-sm text-[#86868B]">{type.desc}</p>
                          </div>
                          <div className={cn(
                            "ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            formData.accountType === type.id ? "border-[#1D1D1F] bg-[#1D1D1F]" : "border-[#86868B]"
                          )}>
                            {formData.accountType === type.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">Business details</h2>
                      <p className="text-[#86868B]">Tell us more about your business.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">
                        {formData.accountType === 'company' ? 'Company name' : 'Trading name'}
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => updateForm('companyName', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none"
                        placeholder="My Company Ltd."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">Website (optional)</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-3.5 w-5 h-5 text-[#86868B]" />
                        <input
                          type="url"
                          value={formData.companyWebsite}
                          onChange={(e) => updateForm('companyWebsite', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F5F7] border-transparent focus:bg-white focus:ring-2 focus:ring-[#1D1D1F] transition-all outline-none"
                          placeholder="https://www.example.com"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">How do you want to start?</h2>
                      <p className="text-[#86868B]">You can add other features later when you need them.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {[
                          { id: 'one_time', title: 'One-time payments', desc: 'Accept payments for products and services through a checkout page or invoices.', icon: CreditCard },
                          { id: 'recurring', title: 'Recurring payments', desc: 'Offer subscriptions and bill your customers for ongoing usage and services.', icon: Repeat },
                          { id: 'platform', title: 'Build a platform or marketplace', desc: 'For software platforms, marketplaces, or services where multiple parties get paid.', icon: Layout },
                          { id: 'all', title: 'Everything', desc: 'I want to use all of the payment models above.', icon: Sparkles },
                        ].map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (model.id === 'all') {
                                setFormData(prev => ({ ...prev, paymentModels: ['one_time', 'recurring', 'platform', 'all'] }));
                              } else {
                                togglePaymentModel(model.id);
                              }
                            }}
                            className={cn(
                              "flex items-start p-4 rounded-2xl border-2 transition-all text-left",
                              formData.paymentModels.includes(model.id)
                                ? "border-[#1D1D1F] bg-[#F5F5F7] shadow-sm"
                                : "border-transparent bg-[#F5F5F7] hover:bg-[#E8E8ED]"
                            )}
                          >
                            <model.icon className="w-5 h-5 mt-0.5 mr-3 text-[#1D1D1F]" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1D1D1F] text-sm">{model.title}</h4>
                              <p className="text-xs text-[#86868B] mt-0.5">{model.desc}</p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                              formData.paymentModels.includes(model.id) ? "bg-[#1D1D1F] border-[#1D1D1F]" : "border-[#86868B]"
                            )}>
                              {formData.paymentModels.includes(model.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-black/5">
                      <p className="text-sm font-medium text-[#1D1D1F]">How do you want to start?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'mijn eerste product maken', title: 'Create my first product', icon: ShoppingBag },
                          { id: 'mijn eerste service', title: 'Create my first service', icon: Wrench },
                          { id: 'mijn eerste digitale product maken', title: 'Create my first digital product', icon: FileCode },
                        ].map((goal) => (
                          <button
                            key={goal.id}
                            onClick={() => updateForm('primaryGoal', goal.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all h-auto min-h-[100px] text-center",
                              formData.primaryGoal === goal.id
                                ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                                : "border-transparent bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]"
                            )}
                          >
                            <goal.icon className="w-6 h-6 mb-2" />
                            <span className="text-xs font-medium leading-tight">{goal.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4">Welkom bij Wersee!</h2>
                    <p className="text-[#86868B] max-w-sm mb-8">
                      Je kunt nu al je features testen met een mooi scherm.
                    </p>
                    <button
                      onClick={onClose}
                      className="bg-[#1D1D1F] text-white px-8 py-4 rounded-full font-semibold hover:bg-black/90 transition-all active:scale-95 shadow-xl shadow-black/20"
                    >
                      Start met verkennen
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step < 5 && (
              <div className="p-6 border-t border-black/5 bg-white flex justify-between items-center">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === step ? "bg-[#1D1D1F]" : "bg-[#E5E5E5]"
                      )} 
                    />
                  ))}
                </div>
                
                <div className="flex gap-3">
                  {step > 1 && (
                    <button
                      onClick={prevStep}
                      className="px-6 py-2.5 rounded-full font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      Terug
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (step === 2 && formData.accountType === 'individual') {
                        setStep(4); // Skip business details for individuals
                      } else if (step === 4) {
                        handleSubmit();
                      } else {
                        nextStep();
                      }
                    }}
                    disabled={
                      (step === 1 && (!formData.firstName || !formData.lastName || !formData.country)) ||
                      (step === 2 && !formData.accountType) ||
                      (step === 3 && !formData.companyName) ||
                      (step === 4 && (!formData.primaryGoal || formData.paymentModels.length === 0)) ||
                      loading
                    }
                    className="bg-[#1D1D1F] text-white px-6 py-2.5 rounded-full font-medium hover:bg-black/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 4 ? 'Voltooien' : 'Volgende')}
                    {!loading && step !== 4 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
