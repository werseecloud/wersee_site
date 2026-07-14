import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, CheckCircle, Shield, RotateCw, HelpCircle, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PageWrapper } from '../components/PageWrapper';
import { KycStep } from '../components/KycStep';
import { SEO } from '../components/SEO';

import { appToast } from '@/lib/feedback';
export const SetupAccount = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'profile' | 'kyc'>('profile');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (user) {
      const checkProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, kyc_status')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setFullName(profile.full_name);
          if (profile.kyc_status !== 'verified') {
            setStep('kyc');
          } else {
            navigate('/dashboard');
          }
        }
      };
      checkProfile();
    }
  }, [user, navigate]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName });
      if (profileError) throw profileError;
      setStep('kyc');
    } catch (error: any) {
      console.error('Error setting up account:', error);
      appToast('Failed to setup account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKycComplete = () => {
    appToast('Account setup and verification complete!');
    navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <>
    <SEO title="Setup Account" noIndex />
    <PageWrapper>
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Column: ID Preview */}
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">Verify your identity</h1>
              <p className="text-white/60">Follow the steps to securely verify your account using your ID.</p>
            </div>

            <div className="relative w-full max-w-sm mx-auto md:mx-0 aspect-[1.6/1] perspective-1000">
              <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 backface-hidden border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white/20 rounded-full" />
                    <span className="font-bold tracking-widest">ID CARD</span>
                  </div>
                  <div className="mt-8 space-y-2">
                    <div className="w-3/4 h-4 bg-white/20 rounded" />
                    <div className="w-1/2 h-4 bg-white/10 rounded" />
                  </div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 backface-hidden border border-white/10 shadow-2xl rotate-y-180">
                  <div className="w-full h-full border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                    <p className="text-white/40">Back of ID</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors mx-auto md:mx-0"
            >
              <RotateCw className="w-4 h-4" /> Rotate ID Card
            </button>
          </div>

          {/* Right Column: Setup */}
          <div className="bg-white/[0.03] border border-white/[0.08] p-8 rounded-[2rem] relative">
            <div className="absolute top-6 right-6">
              <div className="relative">
                <button onClick={() => setShowPrivacy(!showPrivacy)} className="text-white/40 hover:text-white">
                  <HelpCircle className="w-6 h-6" />
                </button>
                {showPrivacy && (
                  <div className="absolute right-0 mt-2 w-64 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white/70">
                    Stripe handles all your identity data securely. Wersee never sees your documents or sensitive information.
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'profile' ? (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-2xl font-bold mb-6">Complete Profile</h2>
                  <form onSubmit={handleSubmitProfile} className="space-y-4">
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-xl bg-white/5 border border-white/10" required />
                    <button type="submit" className="w-full py-4 bg-white text-black rounded-xl font-bold">Next</button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="kyc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-2xl font-bold mb-6">Identity Verification</h2>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-6 flex items-center gap-4">
                    <Camera className="w-10 h-10 text-indigo-400" />
                    <div>
                      <p className="font-bold">Use your phone camera</p>
                      <p className="text-sm text-white/60">For best results, use your phone to capture your ID.</p>
                    </div>
                  </div>
                  <KycStep userId={user.id} onComplete={handleKycComplete} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center text-xs text-white/30 font-bold tracking-widest uppercase">
              Powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
    </>
  );
};
