import React, { useState } from 'react';
import { WerseeShield } from '../components/WerseeShield';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const SecurityVerify = () => {
  const [verified, setVerified] = useState(false);

  return (
    <>
    <SEO title="Security Verification" noIndex />
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {!verified ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <WerseeShield onVerify={() => setVerified(true)} />
            <div className="text-center mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="text-gray-600 hover:text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Challenge
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Access Granted</h1>
              <p className="text-gray-500">Your identity has been successfully verified by Wersee Shield.</p>
            </div>
            <Link 
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all"
            >
              Continue to Workspace
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};
