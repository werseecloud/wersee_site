import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, UserPlus, Mail, Link as LinkIcon, CheckCircle, ArrowRight, Smartphone, AlertTriangle, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { appToast } from '@/lib/feedback';
export const NextGenSetup = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [parentEmail, setParentEmail] = useState(user?.email || '');
  const [parentAge, setParentAge] = useState('');
  const [kidName, setKidName] = useState('');
  const [kidAge, setKidAge] = useState('');
  const [kidEmail, setKidEmail] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'pending' | 'completed'>('pending');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteToken) return;

    // Realtime subscription for invite status
    const channel = supabase
      .channel(`invite-${inviteToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'next_gen_invites',
          filter: `token=eq.${inviteToken}`
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            setInviteStatus('completed');
            setTimeout(() => setStep(4), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inviteToken]);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const generatedEmail = useCustomEmail ? kidEmail : `kid_${kidName.toLowerCase().replace(/\s+/g, '_')}@wersee.com`;
      
      const response = await invokeApiRunner('next-gen/create-invite', {
        parent_id: user?.id || null,
        parent_email: parentEmail,
        parent_age: parentAge,
        kid_name: kidName,
        kid_age: kidAge,
        kid_email: generatedEmail,
      });

      if (!response.success) throw new Error(response.error || 'Failed to generate invite');
      
      setInviteToken(response.data.token);
      setStep(3);
      
    } catch (error) {
      console.error('Error generating invite:', error);
      appToast('Failed to generate invite link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishSetup = async () => {
    if (user) {
      // Update parent's metadata to show the shield badge
      await supabase.auth.updateUser({
        data: { has_children: true }
      });
    }
    appToast('Next Gen Creator account successfully linked and configured!');
    window.location.href = '/workspace';
  };

  const Tooltip = ({ id, text }: { id: string, text: string }) => (
    <div className="relative inline-block ml-2">
      <button 
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="text-gray-500 hover:text-blue-400 transition-colors focus:outline-none"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {activeTooltip === id && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-blue-600 text-white text-xs rounded-xl shadow-xl pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Setup Next Gen Creator | Wersee</title>
        <meta name="description" content="Set up a secure, managed storefront for your child. You remain in control while they build their future." />
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-blue-600 text-white mb-8 shadow-2xl shadow-blue-600/40 relative"
          >
            <Shield className="w-10 h-10" />
            <div className="absolute inset-0 rounded-[2rem] bg-blue-600 animate-ping opacity-20" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            Next Gen <span className="text-blue-500">Creator</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Set up a secure, managed storefront for your child. You remain in control while they build their future.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Step 1: Guardian Identity</h2>
                  <p className="text-gray-400">Who is the legal guardian for this account?</p>
                </div>

                {user ? (
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Linked to your account</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Parent/Guardian Email</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="guardian@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500">Or <Link to="/auth" className="text-blue-400 hover:underline">log in</Link> to link to your existing Wersee account.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Your Age (Guardian)
                    <Tooltip id="parentAge" text="You must be 18 or older to manage a minor's account for legal and tax compliance." />
                  </div>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    value={parentAge}
                    onChange={(e) => setParentAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <p className="text-xs text-gray-500">You must be at least 18 years old to be a legal guardian.</p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!parentEmail || !parentAge || parseInt(parentAge) < 18}
                  className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Step 2: Creator Details</h2>
                  <p className="text-gray-400">Set up the identity for the Next Gen Creator.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                        Child's First Name
                        <Tooltip id="kidName" text="This will be used to personalize their experience and generate their initial email." />
                      </div>
                      <input
                        type="text"
                        value={kidName}
                        onChange={(e) => setKidName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                        Child's Age
                        <Tooltip id="kidAge" text="We use the child's age to automatically enable the correct mode (Kids, Next Gen Core, or Next Gen Pro)." />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="17"
                        value={kidAge}
                        onChange={(e) => setKidAge(e.target.value)}
                        placeholder="e.g. 14"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setUseCustomEmail(false)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${!useCustomEmail ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        Auto-Generate Email
                      </button>
                      <button
                        onClick={() => setUseCustomEmail(true)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${useCustomEmail ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        Use Custom Email
                      </button>
                    </div>

                    {!useCustomEmail ? (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">
                          {kidName ? `kid_${kidName.toLowerCase().replace(/\s+/g, '_')}@wersee.com` : 'kid_[name]@wersee.com'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="email"
                        value={kidEmail}
                        onChange={(e) => setKidEmail(e.target.value)}
                        placeholder="child@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateLink}
                    disabled={!kidName || !kidAge || (useCustomEmail && !kidEmail) || isGenerating}
                    className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Setup Link'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                  <Smartphone className="w-10 h-10 text-blue-400" />
                </div>
                
                <h2 className="text-3xl font-black mb-4">Device Handoff</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Send this link to {kidName}'s device. They will complete the storefront setup on their end. This screen will automatically update when they are finished.
                </p>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                  <div className="truncate text-blue-400 font-mono text-sm">
                    {window.location.origin}/next-gen-invite/{inviteToken}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/next-gen-invite/${inviteToken}`)}
                    className="p-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors shrink-0"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                  {inviteStatus === 'pending' ? (
                    <>
                      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-widest animate-pulse">Waiting for {kidName}...</p>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-emerald-400 font-bold text-xl">Setup Completed!</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Final Approvals</h2>
                  <p className="text-gray-400">Configure what {kidName} is allowed to do.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-transparent" defaultChecked />
                    <div>
                      <h4 className="font-bold text-white mb-1">Require approval for publishing</h4>
                      <p className="text-sm text-gray-400">You must review and approve any product or course before it goes live on the marketplace.</p>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-transparent" defaultChecked />
                    <div>
                      <h4 className="font-bold text-white mb-1">Block explicit/mature categories</h4>
                      <p className="text-sm text-gray-400">Automatically restrict access to creating or viewing content flagged as 18+.</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-transparent" defaultChecked />
                    <div>
                      <h4 className="font-bold text-white mb-1">Manage payouts</h4>
                      <p className="text-sm text-gray-400">All earnings are routed to your connected Stripe account. The creator cannot withdraw funds directly.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3 text-yellow-200/80 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>As the legal guardian, you are responsible for the KYC verification and tax reporting for this account.</p>
                </div>

                <button
                  onClick={handleFinishSetup}
                  className="w-full py-4 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  Complete Setup <CheckCircle className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
