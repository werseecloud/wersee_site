import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, XCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rawRedirectTo = searchParams.get('redirect') || '/';
    const redirectTo = rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') ? rawRedirectTo : '/';

    const go = (path: string) => {
      if (cancelled) return;
      setTimeout(() => navigate(path, { replace: true }), 600);
    };

    (async () => {
      // 1) Surface any error Supabase/Google sent back.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorDescription =
        hashParams.get('error_description') || searchParams.get('error_description');
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
        return;
      }

      // 2) PKCE flow: Supabase sends ?code=... — exchange it for a session.
      const code = searchParams.get('code');
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError(exchangeErr.message);
          return;
        }
      }

      // 3) Hash / implicit flow is handled automatically by detectSessionInUrl.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        go(redirectTo);
      }
    })();

    // 4) In case the session lands slightly after mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        go(redirectTo);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  return (
    <>
    <SEO title="Authentication" noIndex />
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center relative z-10">
        {error ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">Login failed</h2>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 transition-all shadow-xl shadow-white/5"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-pulse" />
                </div>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">One moment...</h2>
                <p className="text-white/50 text-lg">We are verifying your credentials and logging you in.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
