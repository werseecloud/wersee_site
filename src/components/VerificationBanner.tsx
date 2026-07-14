import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Mail, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, buildAppUrl } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const VerificationBanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no user, or user is already confirmed, don't show banner
  if (!user || user.email_confirmed_at) {
    return null;
  }

  const handleResend = async () => {
    if (user.email) {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: buildAppUrl('/confirm-email')
        }
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
        setTimeout(() => setSent(false), 5000);
      }
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border border-amber-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Email not verified</h4>
            <p className="text-xs text-gray-500">Confirm your email to unlock all features.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleResend} 
            disabled={loading || sent}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              sent 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : sent ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Verzonden
              </>
            ) : (
              'Link versturen'
            )}
          </button>
        </div>

        {error && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 text-red-600 text-[10px] rounded-lg text-center border border-red-100">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
};
