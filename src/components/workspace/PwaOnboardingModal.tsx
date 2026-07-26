import React, { useState, useEffect } from 'react';
import { Download, Bell, Smartphone, Check, ArrowRight } from 'lucide-react';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { hapticFeedback } from '../../lib/haptics';

import { appToast } from '@/lib/feedback';
export const PwaOnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if already installed or dismissed
    const hasSeenOnboarding = localStorage.getItem('pwa_onboarding_seen');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const shouldOfferInstall = !hasSeenOnboarding && !isStandalone && isMobile;
    
    // Only show on mobile
    if (shouldOfferInstall) {
      setIsOpen(true);
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Desktop uses the browser's native install UI. Only suppress it when
      // this mobile modal is visible and will call prompt() from its button.
      if (!shouldOfferInstall) return;
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Listen for custom event to show modal manually
    const handleShowModal = () => setIsOpen(true);
    window.addEventListener('show-pwa-modal', handleShowModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-pwa-modal', handleShowModal);
    };
  }, []);

  const handleInstall = async () => {
    hapticFeedback('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        handleDismiss();
      }
    } else {
      // Fallback for iOS
      appToast('To install: tap the share button and select "Add to Home Screen"');
    }
  };

  const handleEnableNotifications = async () => {
    hapticFeedback('medium');
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('Notifications Enabled', {
            body: 'You will now receive updates from Wersee Workspace.',
          });
        }
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    }
  };

  const handleDismiss = () => {
    hapticFeedback('light');
    localStorage.setItem('pwa_onboarding_seen', 'true');
    setIsOpen(false);
  };

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={handleDismiss}
      maxWidth="max-w-md"
    >
      <div className="p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Wersee Workspace</h2>
            <p className="text-gray-400 font-medium">Your all-in-one business manager. Install as an app for the best experience.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Install App</h3>
              <p className="text-xs text-gray-500">Access your workspace directly from your home screen.</p>
            </div>
            <button 
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-black text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              Install
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Notifications</h3>
              <p className="text-xs text-gray-500">Stay updated with real-time alerts and messages.</p>
            </div>
            {notificationPermission === 'granted' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <button 
                onClick={handleEnableNotifications}
                className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={handleDismiss}
          className="w-full py-4 text-gray-500 font-bold hover:text-white transition-colors flex items-center justify-center gap-2 group"
        >
          Continue to Workspace
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </BottomSheetModal>
  );
};
