import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Smartphone, Wifi, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PosNfcMobile = () => {
  const { accountHandle, systemname } = useParams();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'scanning' | 'success'>('connecting');

  useEffect(() => {
    // Simulate connection delay
    const timer = setTimeout(() => {
      setStatus('connected');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('success');
      // Here we would trigger the actual payment logic or signal the main POS
      setTimeout(() => {
        setStatus('connected');
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-purple-500/10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

      <div className="relative z-10 w-full max-w-sm mx-auto text-center space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Wersee Tap to Pay</h1>
          <p className="text-gray-400 text-sm">Connected to {systemname?.replace('-', ' ').toUpperCase()}</p>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center">
          {status === 'connecting' && (
            <div className="w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          )}

          {status === 'connected' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSimulateScan}
              className="w-48 h-48 rounded-full bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.4)] flex flex-col items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wifi className="w-16 h-16 text-white rotate-90" />
              <span className="text-sm font-bold uppercase tracking-wider">Tap to Pay</span>
            </motion.button>
          )}

          {status === 'scanning' && (
            <div className="w-48 h-48 rounded-full bg-indigo-600 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500 opacity-50" />
              <CreditCard className="w-16 h-16 text-white animate-pulse" />
            </div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-48 h-48 rounded-full bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center"
            >
              <CheckCircle2 className="w-20 h-20 text-white" />
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="h-12">
          {status === 'connecting' && <p className="text-gray-400 animate-pulse">Connecting to terminal...</p>}
          {status === 'connected' && <p className="text-gray-400">Ready. Tap card on back of phone.</p>}
          {status === 'scanning' && <p className="text-white font-bold">Processing payment...</p>}
          {status === 'success' && <p className="text-emerald-400 font-bold">Payment Approved</p>}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Smartphone className="w-4 h-4" />
            <span>NFC Reader Mode Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
