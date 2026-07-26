import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { createAuthReference, mapAuthError } from '../lib/authFlow';

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reference] = useState(createAuthReference);

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleVerification = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;

      if (!tokenHash || !type) {
        setStatus('error');
        setError('Deze verificatielink is ongeldig of onvolledig.');
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
        console.error('[auth-flow]', { flowId: reference, stage: 'verifying_code', code: String(err?.code || 'VERIFY_EMAIL_FAILED') });
        setStatus('error');
        setError(mapAuthError(err).message);
      }
    };

    handleVerification();
  }, [reference, searchParams]);

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
    <SEO title="E-mail bevestigen" noIndex />
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#050505] px-4 py-[calc(2rem+env(safe-area-inset-bottom))] relative overflow-hidden">
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
              <h1 className="text-3xl font-bold text-white tracking-tight">E-mail verifiëren…</h1>
              <p className="text-white/50 text-lg">We bevestigen je e-mailadres. Dit duurt maar even.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">E-mail bevestigd</h1>
              <p className="text-white/50 text-lg">Je account is geverifieerd. Je kunt nu aan de slag met Wersee.</p>
              <p className="text-white/30 text-sm">Je wordt over {countdown} seconden doorgestuurd…</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
            >
              Naar je werkruimte
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
              <h1 className="text-3xl font-bold text-white tracking-tight">Verificatie is niet gelukt</h1>
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-white/40">De link kan verlopen of al gebruikt zijn.</p>
              <p className="text-xs text-white/25">Referentie: {reference}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 transition-all"
              >
                Terug naar inloggen
              </button>
              <button 
                onClick={() => navigate('/support')}
                className="text-sm font-medium text-white/40 hover:text-white transition-all"
              >
                Hulp nodig? Neem contact op
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
    </>
  );
};
