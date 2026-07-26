import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Store, Package, DollarSign, ArrowRight, Play } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  buttonId?: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Wersee!',
    description: 'Let\'s get you started with your new workspace. We\'ll show you the most important features to launch your business.',
    targetId: 'welcome-hero',
    icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
    position: 'bottom'
  },
  {
    id: 'create-business',
    title: 'Create Your Business',
    description: 'First, set up your business profile. This is how customers will see you in the store.',
    targetId: 'step-create-business',
    buttonId: 'btn-create-business',
    icon: <Store className="w-6 h-6 text-indigo-400" />,
    position: 'top'
  },
  {
    id: 'add-product',
    title: 'Add Your Products',
    description: 'Upload your apps, extensions, or digital products. You can set prices and manage listings easily.',
    targetId: 'step-add-product',
    buttonId: 'btn-add-product',
    icon: <Package className="w-6 h-6 text-emerald-400" />,
    position: 'top'
  },
  {
    id: 'setup-payments',
    title: 'Configure Payments',
    description: 'Connect your Stripe account to start receiving payouts directly to your bank account.',
    targetId: 'step-setup-payments',
    buttonId: 'btn-setup-payments',
    icon: <DollarSign className="w-6 h-6 text-purple-400" />,
    position: 'top'
  }
];

export const WorkspaceTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleRestart = () => {
      setCurrentStep(0);
      setIsVisible(false);
      setShowWelcome(true);
    };
    window.addEventListener('restart-tutorial', handleRestart);
    return () => window.removeEventListener('restart-tutorial', handleRestart);
  }, []);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('wersee_tutorial_seen');
    if (!hasSeenTutorial) {
      // Show welcome modal first
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => {
    setShowWelcome(false);
    setIsVisible(true);
  };

  useEffect(() => {
    if (isVisible) {
      const step = STEPS[currentStep];
      const mobileTargetIds: Record<string, string> = {
        'create-business': 'step-business',
        'add-product': 'step-product',
        'setup-payments': 'step-sale',
      };
      const resolvedTargetId = step.targetId === 'welcome-hero' && window.innerWidth >= 768
        ? 'welcome-hero-desktop'
        : window.innerWidth < 768
          ? mobileTargetIds[step.id] || step.targetId
          : step.targetId;
      const element = document.getElementById(resolvedTargetId)
        || (window.innerWidth < 768 ? document.getElementById('mobile-getting-started') : null);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (step.buttonId) {
        const button = document.getElementById(
          window.innerWidth < 768 ? mobileTargetIds[step.id] || step.buttonId : step.buttonId,
        );
        if (button) {
          setButtonRect(button.getBoundingClientRect());
        } else {
          setButtonRect(null);
        }
      } else {
        setButtonRect(null);
      }
    }
  }, [currentStep, isVisible, windowSize]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setShowWelcome(false);
    setIsVisible(false);
    localStorage.setItem('wersee_tutorial_seen', 'true');
  };

  const getTooltipPosition = () => {
    if (!targetRect) return { left: 0, top: 0, width: 320 };
    
    const isMobile = windowSize.width < 640;
    const tooltipWidth = isMobile ? windowSize.width - 32 : 360;
    const tooltipHeight = 260; // Approximate height
    const padding = 16;

    if (isMobile) {
      // On mobile, dock to bottom to avoid covering the whole screen
      return { 
        left: 16, 
        top: windowSize.height - tooltipHeight - padding,
        width: tooltipWidth
      };
    }

    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    let top = 0;

    // Constrain left
    left = Math.max(padding, Math.min(windowSize.width - tooltipWidth - padding, left));

    const step = STEPS[currentStep];
    
    if (step.position === 'bottom') {
      top = targetRect.bottom + 24;
      // If it goes off bottom, put it on top
      if (top + tooltipHeight > windowSize.height) {
        top = targetRect.top - tooltipHeight - 24;
      }
    } else {
      top = targetRect.top - tooltipHeight - 24;
      // If it goes off top, put it on bottom
      if (top < padding) {
        top = targetRect.bottom + 24;
      }
    }

    return { left, top, width: tooltipWidth };
  };

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative bg-[#111111] border border-white/10 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/5">
                <img src="/vite.svg" alt="Wersee" className="w-14 h-14 drop-shadow-lg" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Welcome to Wersee!</h2>
              <p className="text-gray-400 mb-10 text-base sm:text-lg leading-relaxed">
                We're excited to have you here. Let's take a quick tour of your new workspace so you can start selling your digital products in minutes.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startTutorial}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Quick Tour
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-transparent text-gray-400 rounded-2xl font-bold hover:text-white hover:bg-white/5 transition-all active:scale-95"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isVisible && targetRect && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Backdrop with hole */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-[3px] transition-all duration-500 ease-in-out"
            style={{
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${targetRect.left - 16}px 100%, 
                ${targetRect.left - 16}px ${targetRect.top - 16}px, 
                ${targetRect.right + 16}px ${targetRect.top - 16}px, 
                ${targetRect.right + 16}px ${targetRect.bottom + 16}px, 
                ${targetRect.left - 16}px ${targetRect.bottom + 16}px, 
                ${targetRect.left - 16}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />

          {/* Highlight Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute border-2 border-indigo-500 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.4)]"
            style={{
              left: targetRect.left - 16,
              top: targetRect.top - 16,
              width: targetRect.width + 32,
              height: targetRect.height + 32,
            }}
          >
            <div className="absolute inset-0 animate-pulse bg-indigo-500/10 rounded-2xl" />
          </motion.div>

          {/* Button Highlight (Pulsing ring on the actual button) */}
          {buttonRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute border-[3px] border-white rounded-xl z-[10000]"
              style={{
                left: buttonRect.left - 6,
                top: buttonRect.top - 6,
                width: buttonRect.width + 12,
                height: buttonRect.height + 12,
              }}
            >
              <div className="absolute inset-0 animate-ping bg-white/30 rounded-xl" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-widest whitespace-nowrap shadow-2xl flex items-center gap-1">
                Click Here
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
              </div>
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="absolute pointer-events-auto bg-[#111111] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col"
            style={{
              ...getTooltipPosition(),
              // Ensure it doesn't overflow on small screens
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto'
            }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex flex-col gap-2">
                <div className="p-3.5 bg-white/5 rounded-2xl w-fit border border-white/5 shadow-inner">
                  {STEPS[currentStep].icon}
                </div>
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mt-2">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{STEPS[currentStep].title}</h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 flex-grow">
              {STEPS[currentStep].description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <button 
                onClick={handleClose}
                className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
              >
                Skip
              </button>

              <div className="flex gap-1.5 absolute left-1/2 -translate-x-1/2">
                {STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors bg-white/5"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
                  {currentStep !== STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
