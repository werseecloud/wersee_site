import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs text-[#1D1D1F] dark:text-white truncate">Install Wersee</h3>
            <p className="text-[10px] text-[#86868B] truncate">Quick access from home screen</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full hover:bg-blue-600 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-[#86868B] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
