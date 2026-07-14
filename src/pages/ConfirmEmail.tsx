import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleVerification = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;

      if (!tokenHash || !type) {
        setStatus('error');
        setError('Invalid verification link.');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });

        if (error) throw error;
        setStatus('success');
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setError(err.message || 'An error occurred while verifying your email.');
      }
    };

    handleVerification();
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      // Try to close window, if not possible redirect
      if (window.opener) {
        window.close();
      } else {
        navigate('/dashboard');
      }
    }
  }, [status, countdown, navigate]);

  return (
    <>
    <SEO title="Confirm Email" noIndex />
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 md:p-12 text-center relative z-10"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">Verifying...</h2>
              <p className="text-white/50 text-lg">We are confirming your email address, please wait a moment.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white tracking-tight">Email confirmed!</h2>
              <p className="text-white/50 text-lg">Your account is now fully verified. You can now get started on Wersee.</p>
              <p className="text-white/30 text-sm">This window will close in {countdown} seconds...</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white tracking-tight">Verification failed</h2>
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-white/40">The link may have expired or already been used.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 transition-all"
              >
                Back to Login
              </button>
              <button 
                onClick={() => navigate('/support')}
                className="text-sm font-medium text-white/40 hover:text-white transition-all"
              >
                Need help? Contact support
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
    </>
  );
};
