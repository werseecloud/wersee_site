import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { motion, AnimatePresence } from 'motion/react';
import { WerseeCaptcha } from '../components/WerseeCaptcha';
import { SEO } from '../components/SEO';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const verifyCaptcha = async (token: string | null) => {
    if (!token) return { success: false };
    if (token.startsWith('wersee-v1-')) {
      return { success: true };
    }
    return await invokeApiRunner('verify-hcaptcha', { token });
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    if (pass.length >= 12) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(password);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setError('Please confirm you are not a robot.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Verify hCaptcha token on backend, but allow local Wersee custom captcha tokens.
      const verifyData = await verifyCaptcha(captchaToken);
      
      if (verifyData.error || !verifyData.success) {
        throw new Error('Verification failed. Please try again.');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password successfully updated!');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setError(err.message);
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title="Update Password" noIndex />
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
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/50">
            <div className="space-y-2 mb-10">
              <h1 className="text-3xl font-bold text-white tracking-tight">New password</h1>
              <p className="text-white/50 text-lg">Enter your new password.</p>
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

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group transition-all duration-300">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-3 space-y-2 px-1">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-white/40">
                      <span>Password strength</span>
                      <span className={
                        strength <= 1 ? 'text-red-400' : 
                        strength === 2 ? 'text-amber-400' : 
                        strength === 3 ? 'text-blue-400' : 'text-emerald-400'
                      }>
                        {strength <= 1 ? 'Weak' : strength === 2 ? 'Medium' : strength === 3 ? 'Strong' : 'Very Strong'}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-500 ${
                            i <= strength 
                              ? (strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-blue-500' : 'bg-emerald-500')
                              : 'bg-white/5'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center py-2">
                <WerseeCaptcha
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update password <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
    </>
  );
};
