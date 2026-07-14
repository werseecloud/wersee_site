import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('avenue_cookies_accepted');
    if (!hasAccepted) {
      // Small delay before showing
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('avenue_cookies_accepted', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-4 sm:top-auto sm:bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-2xl border border-black/10 shadow-2xl rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 sm:w-6 sm:h-6 text-[#1D1D1F]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-[#1D1D1F]">Privacy</h3>
                <p className="text-[10px] sm:text-sm text-[#86868B] max-w-xl leading-tight sm:leading-relaxed">
                  We use cookies to enhance your experience. <a href="/cookies" className="underline hover:text-[#1D1D1F]">Policy</a>.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsVisible(false)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-[10px] sm:text-sm text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={acceptCookies}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-[10px] sm:text-sm text-white bg-[#1D1D1F] hover:bg-black/90 transition-colors shadow-lg shadow-black/20"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
