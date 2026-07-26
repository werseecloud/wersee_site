import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, CreditCard, Lock, Smartphone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export const DemoFlashCheckout = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'product' | 'processing' | 'success'>('product');
  const [isApplePay, setIsApplePay] = useState(false);

  // Simulate "Scanning" if we came from a QR code context, but for web demo we start at product
  
  const handlePay = (method: 'apple' | 'google') => {
    setIsApplePay(method === 'apple');
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <SEO title="Flash Checkout Demo" noIndex />
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">Flash</span>
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
            Demo Mode
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'product' && (
            <motion.div 
              key="product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-6 pt-0"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 shadow-lg group">
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" 
                  alt="Product" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  In Stock
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1D1D1F] mb-2">Minimalist Watch Series 7</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Swiss movement, sapphire crystal glass, and genuine leather strap. The perfect daily driver.
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-black text-[#1D1D1F]">$149.00</p>
                  </div>
                </div>

                <button 
                  onClick={() => handlePay('apple')}
                  className="w-full h-14 bg-black text-white rounded-2xl flex items-center justify-center gap-2 font-medium text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  Pay
                </button>
                
                <button 
                  onClick={() => handlePay('google')}
                  className="w-full h-14 bg-white border border-gray-200 text-black rounded-2xl flex items-center justify-center gap-2 font-medium text-lg hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Pay
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                  <Lock className="w-3 h-3" />
                  Secured by Wersee Flash
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                {isApplePay && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 fill-current" viewBox="0 0 384 512">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                      </svg>
                   </div>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2">Processing Payment...</h2>
              <p className="text-gray-500">Please hold your device near the reader</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-500/30">
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </div>
              <h2 className="text-3xl font-black mb-2">Paid!</h2>
              <p className="text-gray-500 mb-8">Your order #8392 is confirmed.</p>
              
              <div className="w-full bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
                <div className="flex justify-between mb-2">
                   <span className="text-gray-500">Amount</span>
                   <span className="font-bold">$149.00</span>
                </div>
                <div className="flex justify-between mb-2">
                   <span className="text-gray-500">Date</span>
                   <span className="font-bold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-500">Method</span>
                   <span className="font-bold flex items-center gap-1">
                     {isApplePay ? 'Apple Pay' : 'Google Pay'} •••• 4242
                   </span>
                </div>
              </div>

              <button 
                onClick={() => setStep('product')}
                className="w-full py-4 bg-gray-100 text-black rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Make Another Payment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
