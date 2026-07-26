import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Onboarding } from './Onboarding';

export const SetupBanner = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowBanner(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (data && !data.onboarding_completed) {
        // Delay showing banner slightly for effect
        setTimeout(() => setShowBanner(true), 1000);
      } else {
        setShowBanner(false);
      }
    };

    checkOnboardingStatus();
  }, [user, showOnboarding]); // Re-check when onboarding closes

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 sm:top-auto sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-[120] max-w-sm w-auto sm:w-full"
          >
            <div className="bg-[#1D1D1F] text-white p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-4 border border-white/10 backdrop-blur-xl bg-opacity-90">
              <div className="flex items-center justify-between flex-1">
                <div className="pr-2">
                  <h3 className="font-bold text-sm sm:text-lg">Complete profile</h3>
                  <p className="text-[10px] sm:text-sm text-white/70 leading-tight sm:leading-relaxed hidden sm:block">
                    Unlock selling features and get paid.
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-300" />
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-4 sm:px-0 py-2 sm:py-3 bg-white text-[#1D1D1F] rounded-xl sm:rounded-2xl font-bold hover:bg-gray-100 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-base whitespace-nowrap"
              >
                Start <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Onboarding 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          // Optimistically hide banner, effect will verify
          setShowBanner(false);
        }} 
      />
    </>
  );
};
