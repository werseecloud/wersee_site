import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, CreditCard, ArrowRight, ChevronLeft, 
  Zap, Globe, Sparkles, Check, Star, Cpu, MessageSquare,
  ZapOff, Shield, Rocket, Crown, Loader2
} from 'lucide-react';
import { invokeApiRunner } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PageWrapper } from '../components/PageWrapper';

import { appToast } from '@/lib/feedback';
const AI_PLANS = [
  {
    id: 'ai-lite',
    name: 'Wersee AI Lite',
    price: 9.99,
    period: 'month',
    description: 'Perfect for casual creators and hobbyists.',
    features: [
      '1,000 AI generations / mo',
      'Standard processing speed',
      'Basic AI models',
      'Email support',
      'Community access'
    ],
    color: 'from-blue-500 to-cyan-400',
    icon: Zap
  },
  {
    id: 'ai-pro',
    name: 'Wersee AI Pro',
    price: 29.99,
    period: 'month',
    description: 'The ultimate tool for professional creators.',
    features: [
      'Unlimited AI generations',
      'Priority processing speed',
      'Advanced AI models (Gemini 3.1 Pro)',
      'Priority support',
      'Early access to new features',
      'Custom AI training'
    ],
    color: 'from-purple-600 to-pink-500',
    icon: Rocket,
    popular: true
  },
  {
    id: 'ai-elite',
    name: 'Wersee AI Elite',
    price: 99.99,
    period: 'month',
    description: 'Enterprise-grade AI for teams and agencies.',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'API access',
      'Custom model fine-tuning',
      'Team collaboration tools',
      'SLA guarantee'
    ],
    color: 'from-amber-500 to-orange-600',
    icon: Crown
  }
];

export const AiPlanCheckout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Review, 2: Payment

  const plan = AI_PLANS.find(p => p.id === planId) || AI_PLANS[1];

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handlePayment = async () => {
    if (!email) {
      appToast('Please enter your email address.');
      return;
    }

    setProcessing(true);
    try {
      const result = await invokeApiRunner('create-ai-subscription-checkout', {
        planId: plan.id,
        email,
        successUrl: `${window.location.origin}/success/ai-${plan.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href,
      });

      if (result.error || !result.url) {
        throw new Error(result.error || 'Could not start Stripe Checkout.');
      }

      window.location.href = result.url;
    } catch (err) {
      console.error('Payment error:', err);
      appToast('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br ${plan.color} opacity-20 blur-[120px] rounded-full animate-pulse`} />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-gradient-to-tl from-indigo-600 to-purple-600 opacity-10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-12 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Back to Plans
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Plan Details */}
            <div className="lg:col-span-7 space-y-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${plan.color} text-black font-bold text-xs uppercase tracking-widest mb-6 shadow-lg shadow-white/5`}>
                  <Sparkles className="w-4 h-4" />
                  Wersee AI Subscription
                </div>
                <h1 className="text-6xl sm:text-7xl font-bold leading-tight tracking-tighter mb-6">
                  Upgrade to <br />
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${plan.color}`}>
                    {plan.name}
                  </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                  {plan.description} Unlock the full potential of Wersee AI and take your creativity to the next level.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <Check className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{feature}</span>
                  </div>
                ))}
              </motion.div>

              <div className="pt-8 border-t border-white/10 flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="text-sm text-gray-400">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-sm text-gray-400">Instant Activation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <span className="text-sm text-gray-400">Global Access</span>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout Card */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden"
              >
                {/* Glassmorphism Shine */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Total Due Today</p>
                      <h2 className="text-5xl font-bold">€{plan.price}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Billed monthly</p>
                      <p className="text-xs text-gray-500">Cancel anytime</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Account Email</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg outline-none focus:border-white/30 transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Lock className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-between p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-gray-400" />
                            <span className="font-bold">Credit or Debit Card</span>
                          </div>
                          <div className="w-4 h-4 rounded-full border-2 border-white/40 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </button>
                        <button className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all opacity-50">
                          <div className="flex items-center gap-4">
                            <Globe className="w-6 h-6 text-gray-400" />
                            <span className="font-bold">PayPal</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 bg-gradient-to-r ${plan.color} text-black hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      {processing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Subscribe Now
                          <ArrowRight className="w-6 h-6" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
                      By subscribing, you agree to Wersee's <a href="#" className="underline hover:text-white">Terms of Service</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>. Your subscription will automatically renew each month.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Trust Badges */}
              <div className="mt-8 flex justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold italic text-[10px]">VISA</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold italic text-[10px]">MC</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold italic text-[10px]">AMEX</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold italic text-[10px]">APPLE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
