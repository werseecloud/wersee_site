import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Scale, Lock, Search, DollarSign, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface SellerGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Seller Guidelines",
    description: "Before you list your first product, please confirm that you agree to our core principles.",
    icon: ShieldCheck,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    content: "We are building a trusted marketplace. Your commitment to quality and honesty is what makes this community thrive."
  },
  {
    title: "No Fraud or Scams",
    description: "Zero tolerance for fraudulent activity.",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    content: "You guarantee that all digital goods are authentic, legally owned by you, and do not contain malicious software. Any attempt to scam buyers will result in an immediate ban."
  },
  {
    title: "Accuracy is Key",
    description: "What you see is what you get.",
    icon: Search,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    content: "Your product description and preview images must 100% reflect the actual file the buyer receives. Misleading marketing is strictly prohibited."
  },
  {
    title: "Commitment to Quality",
    description: "Stand behind your work.",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    content: "You agree to provide functional products and offer reasonable support to your customers if issues arise. Broken files must be fixed or refunded."
  },
  {
    title: "Respect Intellectual Property",
    description: "Create, don't steal.",
    icon: Lock,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    content: "You will not upload content that infringes on the copyrights, trademarks, or privacy of others. Only sell what you have the rights to sell."
  },
  {
    title: "Fair Pricing",
    description: "Transparent and honest.",
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    content: "You agree to set transparent prices and honor all successful transactions made through our platform. No hidden fees or bait-and-switch tactics."
  }
];

export const SellerGuidelinesModal: React.FC<SellerGuidelinesModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ seller_terms_accepted_at: new Date().toISOString() })
            .eq('id', user.id);
            
          if (error) throw error;
          onComplete();
        }
      } catch (error) {
        console.error('Error accepting terms:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="h-1 bg-white/5 w-full shrink-0">
          <motion.div 
            className="h-full bg-[#635BFF]"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${STEPS[currentStep].bg} mb-2`}>
                <StepIcon className={`w-10 h-10 ${STEPS[currentStep].color}`} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">{STEPS[currentStep].title}</h2>
                <p className="text-lg font-medium text-gray-300">{STEPS[currentStep].description}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full">
                <p className="text-gray-400 leading-relaxed">
                  {STEPS[currentStep].content}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep === 0 && (
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#635BFF]/20 flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : currentStep === STEPS.length - 1 ? 'I Agree & Continue' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
};
