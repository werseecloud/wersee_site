import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Store, CheckCircle, ArrowRight, User, HelpCircle } from 'lucide-react';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

import { appToast } from '@/lib/feedback';
export const NextGenInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('next_gen_invites')
          .select('*')
          .eq('token', token)
          .single();

        if (error) throw error;
        setInvite(data);
        
        if (data.status === 'completed') {
          setStep(4); // Already done
        }
      } catch (error) {
        console.error('Error fetching invite:', error);
        // Handle invalid token
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvite();
    }
  }, [token]);

  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      // 1. Create the auth user with age metadata for the badge logic
      const { error: signUpError } = await supabase.auth.signUp({
        email: invite.kid_email,
        password: password,
        options: {
          data: {
            full_name: invite.kid_name,
            age: invite.kid_age,
            is_next_gen: true,
            parent_id: invite.parent_id
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // 2. Log the user in automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.kid_email,
        password: password,
      });

      if (signInError) throw signInError;
      
      // 3. Update invite status to completed and set kid_id so the parent's screen updates
      const response = await invokeApiRunner('next-gen/complete-setup', {
        token: token,
        kid_id: signInData.user?.id
      });

      if (!response.success) throw new Error(response.error || 'Failed to complete setup');

      setStep(3);
    } catch (error) {
      console.error('Error creating account:', error);
      appToast('Failed to create account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Invalid or Expired Link</h1>
        <p className="text-gray-400">Please ask your parent/guardian to generate a new setup link.</p>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <Helmet>
        <title>Finish Setup | Wersee Next Gen</title>
        <meta name="description" content="Complete your Next Gen Creator account setup." />
      </Helmet>
      <div className="max-w-md w-full">
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-3xl font-black mb-2">Welcome to Wersee!</h1>
              <p className="text-gray-400 mb-8">
                Your guardian ({invite.parent_email}) has invited you to start your journey as a Next Gen Creator.
              </p>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8 text-left space-y-2">
                <div className="text-sm text-gray-500 uppercase font-bold tracking-wider flex items-center">
                  Your Account
                  <Tooltip id="account" text="This is the account Wersee created for you using your parent's permission." />
                </div>
                <p className="font-bold">{invite.kid_name}</p>
                <p className="text-sm text-blue-400">{invite.kid_email}</p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                Let's Go <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-center">Create Your Store</h2>
              <p className="text-gray-400 text-center mb-8">Set a password and name your storefront.</p>

              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Your Age
                    <Tooltip id="age" text="We need your age to set up the right account type for you." />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="17"
                    value={invite.kid_age || ''}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Password
                    <Tooltip id="password" text="Choose a strong password that only you know. Don't share it with anyone!" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Store Name
                    <Tooltip id="storeName" text="This is the public name of your shop where people will buy your creations." />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="My Awesome Store"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={!password || !storeName || isCreating}
                className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? 'Creating...' : 'Create Store'}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black mb-4 text-emerald-400">All Set!</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Your account and store have been created. Tell your guardian to check their screen to finish the final approvals.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Setup Already Completed</h2>
              <p className="text-gray-400 mb-8">This invite link has already been used.</p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
              >
                Log In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
