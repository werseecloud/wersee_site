import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, buildAppUrl } from '../lib/supabase';
import { ArrowLeft, Mail, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAppUrl('/update-password'),
      });
      
      // Security: Even if there's an error (like user not found), we might want to show a success message
      // to prevent email enumeration. However, Supabase usually handles this if "Enable email provider" 
      // is set to not confirm email existence.
      // For now, we'll just ensure the message is clear.
      if (error) {
        // We can choose to show a generic message or the actual error if it's a rate limit etc.
        if (error.message.toLowerCase().includes('user not found')) {
          // Still show success to prevent enumeration
          setMessage('If an account exists for this email address, we have sent a reset link.');
          return;
        }
        throw error;
      }
      
      setMessage('Check your email for the password reset link!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title="Reset Password" noIndex />
    <PageWrapper>
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
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
          className="w-full max-w-[440px] relative z-10"
        >
          <button 
            onClick={() => navigate('/auth')} 
            className="group flex items-center text-sm font-medium text-white/40 hover:text-white transition-all mb-8"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to login
          </button>

          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/50">
            <div className="space-y-2 mb-10">
              <h1 className="text-3xl font-bold text-white tracking-tight">Forgot password</h1>
              <p className="text-white/50 text-lg">Enter your email to reset your password.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6"
                >
                  {error}
                </motion.div>
              )}

              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-sm flex items-start gap-3 mb-6"
                >
                  <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group transition-all duration-300">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send link <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
    </>
  );
};
