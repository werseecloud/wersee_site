import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Building2, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  FileText
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';

interface StripeV2OnboardingFlowProps {
  accountId: string;
  onComplete: () => void;
}

export const StripeV2OnboardingFlow = ({ accountId, onComplete }: StripeV2OnboardingFlowProps) => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchAccount();
  }, [accountId]);

  const fetchAccount = async () => {
    try {
      const data = await invokeApiRunner('stripe-v2-get-account', { id: accountId });
      if (data.error) {
        throw new Error(data.error || 'Failed to fetch account');
      }
      setAccount(data);
      
      // Pre-fill some data if available
      if (data.identity) {
        setFormData((prev: any) => ({
          ...prev,
          identity: data.identity
        }));
      }
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    setSubmitting(true);
    setError(null);
    try {
      const updatedAccount = await invokeApiRunner('stripe-v2-update-account', { id: accountId, body: data });
      if (updatedAccount.error) {
        throw new Error(updatedAccount.error || 'Failed to update account');
      }
      setAccount(updatedAccount);
      return updatedAccount;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
        <p className="text-gray-400 font-medium">Loading requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Setup Error</h3>
        <p className="text-red-400/80 mb-6">{error}</p>
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const requirements = account?.requirements?.entries || [];
  const currentlyDue = requirements.filter((r: any) => r.minimum_deadline?.status === 'currently_due');
  
  if (account && currentlyDue.length === 0 && account?.requirements?.summary?.minimum_deadline?.status !== 'currently_due') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Verification Complete</h3>
        <p className="text-emerald-400/80 mb-6">Your account is verified and ready to receive payments.</p>
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Define logical groupings based on requirements
  const getSteps = () => {
    const steps = [];
    
    // 1. Business Identity
    const businessReqs = currentlyDue.filter((r: any) => 
      r.description.startsWith('identity.business_details') || 
      r.description.startsWith('identity.individual')
    );
    if (businessReqs.length > 0) {
      steps.push({
        id: 'business',
        title: 'Personal / Business Details',
        icon: Building2,
        fields: businessReqs.map((r: any) => r.description)
      });
    }

    // 2. Representative Info
    const repReqs = currentlyDue.filter((r: any) => r.description.startsWith('representative'));
    if (repReqs.length > 0) {
      steps.push({
        id: 'representative',
        title: 'Representative Info',
        icon: User,
        fields: repReqs.map((r: any) => r.description)
      });
    }

    // 3. Terms of Service
    const tosReqs = currentlyDue.filter((r: any) => r.description.includes('terms_of_service'));
    if (tosReqs.length > 0) {
      steps.push({
        id: 'tos',
        title: 'Terms of Service',
        icon: ShieldCheck,
        fields: tosReqs.map((r: any) => r.description)
      });
    }

    return steps;
  };

  const onboardingSteps = getSteps();
  const currentStep = onboardingSteps[step];

  const renderField = (path: string) => {
    const label = path.split('.').pop()?.replace(/_/g, ' ') || path;
    const value = path.split('.').reduce((obj, key) => obj?.[key], formData) || '';

    const handleChange = (val: any) => {
      const newFormData = { ...formData };
      const keys = path.split('.');
      let current = newFormData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        
        // Automatically set 'type' for document fields
        if (keys[i] === 'primary_verification' || keys[i] === 'secondary_verification') {
          current[keys[i]]['type'] = 'front_back';
        } else if (keys[i] === 'documents' && keys[i+1] !== undefined) {
          // If we are inside documents (e.g. documents.company_license.files)
          if (!current[keys[i]][keys[i+1]]) current[keys[i]][keys[i+1]] = {};
          current[keys[i]][keys[i+1]]['type'] = 'files';
        }
        
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = val;

      setFormData(newFormData);
    };

    if (path.includes('dob')) {
      // Special handling for date of birth
      return (
        <div key={path} className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
          <input 
            type="date"
            onChange={(e) => {
              const date = new Date(e.target.value);
              handleChange({
                day: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear()
              });
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all"
          />
        </div>
      );
    }

    if (path.includes('percent_ownership')) {
      return (
        <div key={path} className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label} (%)</label>
          <input 
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all"
          />
        </div>
      );
    }

    if (path.includes('executive') || path.includes('owner')) {
      return (
        <div key={path} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <label className="text-sm font-bold text-white uppercase tracking-wider">{label}</label>
          <button
            onClick={() => handleChange(!value)}
            className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-[#635BFF]' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      );
    }

    if (path.includes('document') || path.includes('additional_document')) {
      return (
        <div key={path} className="space-y-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
          <div className="relative group">
            <input 
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                setSubmitting(true);
                try {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64String = reader.result as string;
                    const data = await invokeApiRunner('stripe-files-v2', { 
                      file: base64String, 
                      name: file.name,
                      type: file.type,
                      purpose: 'identity_document' 
                    });
                    
                    if (path.endsWith('files')) {
                      handleChange([data.id]);
                    } else {
                      handleChange(data.id);
                    }
                    setSubmitting(false);
                  };
                  reader.readAsDataURL(file);
                } catch (err: any) {
                  setError(err.message);
                  setSubmitting(false);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full bg-white/5 border border-white/10 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group-hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-[#635BFF]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#635BFF]" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{value ? 'Document Uploaded' : 'Upload Document'}</p>
                <p className="text-xs text-gray-500 mt-1">{value ? 'Click to replace' : 'JPG, PNG or PDF (max 10MB)'}</p>
              </div>
              {value && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ID: {value}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (path.includes('terms_of_service')) {
      return (
        <div key={path} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#635BFF] shrink-0" />
            <div>
              <h4 className="font-bold text-white">Stripe Services Agreement</h4>
              <p className="text-sm text-gray-400 mt-1">
                By clicking "Accept", you agree to the Stripe Services Agreement.
              </p>
            </div>
          </div>
          <button 
            onClick={async () => {
              const success = await handleUpdate({
                identity: {
                  attestations: {
                    terms_of_service: {
                      account: {
                        date: new Date().toISOString(),
                        ip: '8.8.8.8' // In a real app, get user's IP
                      }
                    }
                  }
                }
              });
              if (success) fetchAccount();
            }}
            disabled={submitting}
            className="w-full py-3 bg-[#635BFF] text-white rounded-xl font-bold hover:bg-[#5851E5] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept & Continue'}
          </button>
        </div>
      );
    }

    return (
      <div key={path} className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        <input 
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Enter ${label}`}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] transition-all"
        />
      </div>
    );
  };

  const handleNext = async () => {
    const updatedAccount = await handleUpdate(formData);
    if (updatedAccount) {
      const freshAccount = await fetchAccount();
      if (step < onboardingSteps.length - 1) {
        setStep(step + 1);
      } else {
        // Check if there are still requirements
        const stillDue = freshAccount?.requirements?.currently_due || [];
        if (stillDue.length === 0) {
          onComplete();
        } else {
          // Stay on last step or re-evaluate steps
          setStep(0); // Reset to first step to catch any new requirements
        }
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#635BFF]/10 rounded-2xl flex items-center justify-center">
            {currentStep && <currentStep.icon className="w-6 h-6 text-[#635BFF]" />}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{currentStep?.title || 'Onboarding'}</h3>
            <p className="text-gray-400">Step {step + 1} of {onboardingSteps.length}</p>
          </div>
        </div>
        <button 
          onClick={onComplete}
          className="text-gray-500 hover:text-white text-sm font-bold transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="mb-8">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#635BFF] transition-all duration-500"
            style={{ width: `${((step + 1) / onboardingSteps.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {currentStep?.fields.map(field => renderField(field))}
          </div>

          <div className="flex items-center gap-4 pt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex-[2] py-4 bg-[#635BFF] text-white rounded-xl font-bold hover:bg-[#5851E5] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/20"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === onboardingSteps.length - 1 ? 'Complete Setup' : 'Continue'} 
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
        <ShieldCheck className="w-8 h-8 text-emerald-500" />
        <p className="text-sm text-gray-400 leading-relaxed">
          Your information is encrypted and sent directly to Stripe for verification. We never store your sensitive personal data.
        </p>
      </div>
    </div>
  );
};
