import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  DollarSign,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Users,
  Building2,
  User,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const FeesAndPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('plan_tier').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.plan_tier) {
            setCurrentPlan(data.plan_tier);
          }
        });
    }
  }, [user]);

  const examples = [
    { price: 50, type: 'Individual', stripe: 1.00, marketplace: 2.50, receive: 46.50 },
    { price: 200, type: 'Small Business', stripe: 3.25, marketplace: 14.00, receive: 182.75 },
    { price: 1000, type: 'Large Enterprise', stripe: 15.25, marketplace: 100.00, receive: 884.75 },
    { price: 100, type: 'WERSEE PRO', stripe: 0.00, marketplace: 0, receive: 100.00 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Fees & Plans</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard?tab=plans')}
            className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-32 pb-20 px-6 space-y-20">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold">
            <Star className="w-4 h-4" />
            Transparent Pricing
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple, scalable fees.</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            We grow when you grow. Our fee structure is designed to support everyone from solo creators to global enterprises.
          </p>
        </motion.section>

        {/* 1. Transaction Fees */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <span className="text-xl font-bold">1</span>
            </div>
            <h2 className="text-3xl font-bold">Transaction Fees</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Individual</h3>
                  <p className="text-xs text-gray-500">Small seller</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Marketplace Fee</span>
                  <span className="text-2xl font-bold">5%</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Stripe Fee</span>
                  <span className="text-sm text-white">1.5% + €0.25</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Low costs to start, attractive for small creators just beginning.
              </p>
              <button
                disabled={currentPlan === 'free'}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  currentPlan === 'free'
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Switch to Individual'}
              </button>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Medium</h3>
                  <p className="text-xs text-gray-500">Small business</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Marketplace Fee</span>
                  <span className="text-2xl font-bold">7%</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Stripe Fee</span>
                  <span className="text-sm text-white">1.5% + €0.25</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Slightly higher fee for businesses doing more volume and using the platform intensively.
              </p>
              <button
                disabled={currentPlan === 'medium'}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  currentPlan === 'medium'
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currentPlan === 'medium' ? 'Current Plan' : 'Switch to Medium'}
              </button>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Enterprise</h3>
                  <p className="text-xs text-gray-500">High volume</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Marketplace Fee</span>
                  <span className="text-2xl font-bold">10%</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-sm">Stripe Fee</span>
                  <span className="text-sm text-white">1.5% + €0.25</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Scalable solution for large enterprises with budget and high transaction volume.
              </p>
              {currentPlan === 'enterprise' ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-bold transition-all bg-emerald-500/20 text-emerald-400 cursor-default"
                >
                  Current Plan
                </button>
              ) : (
                <a
                  href="mailto:support@wersee.com?subject=Enterprise%20plan%20sales"
                  className="block text-center w-full py-3 rounded-xl font-bold transition-all bg-white/10 text-white hover:bg-white/20"
                >
                  Contact Sales
                </a>
              )}
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6 flex items-start gap-4">
            <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="text-indigo-400 font-bold">Important Note</p>
              <p className="text-gray-400 text-sm">
                The marketplace fee is calculated on top of the Stripe fee. For small transactions (e.g., €2–€5), we apply a <span className="text-white font-bold">minimum fee of €0.50</span> to ensure small sales remain profitable for the platform.
              </p>
            </div>
          </div>
        </section>

        {/* 2. WERSEE PRO */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[100px] opacity-20 pointer-events-none"></div>
          <div className="relative bg-[#141414] border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-12 overflow-hidden">
            <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-64 h-64 text-indigo-400" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h2 className="text-4xl font-bold">WERSEE PRO</h2>
                </div>
                <p className="text-gray-400 text-xl max-w-xl">
                  The ultimate choice for serious sellers. Pay a fixed monthly amount and <span className="text-white font-bold">eliminate all marketplace fees</span>. Plus, we cover your Stripe processing fees.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center min-w-[240px]">
                <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Starting at</p>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <span className="text-4xl font-bold">€29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <button 
                  onClick={() => navigate('/dashboard?tab=plans')}
                  disabled={currentPlan === 'pro'}
                  className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl ${
                    currentPlan === 'pro'
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default shadow-none'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20'
                  }`}
                >
                  {currentPlan === 'pro' ? 'Current Plan' : 'Start Pro Plan'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">0% Transaction Fee</h3>
                <p className="text-sm text-gray-500">You pay no marketplace fees on your sales. Ideal for high-volume sellers.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">We Pay Stripe Fees</h3>
                <p className="text-sm text-gray-500">Keep 100% of your earnings. We cover the payment processing costs.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">Advanced Analytics</h3>
                <p className="text-sm text-gray-500">Get in-depth insights into your revenue, bestsellers, and traffic sources.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Example Calculations */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">Example Calculations</h2>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Product Price</th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Stripe fee</th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Marketplace fee</th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Seller Receives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {examples.map((ex, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6 font-bold text-white text-lg">€{ex.price}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${ex.type === 'WERSEE PRO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-400'}`}>
                          {ex.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-gray-400">€{ex.stripe.toFixed(2)}</td>
                      <td className="px-8 py-6 text-gray-400">€{ex.marketplace.toFixed(2)}</td>
                      <td className="px-8 py-6 text-right font-bold text-emerald-400 text-lg">€{ex.receive.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-8 py-10">
          <h2 className="text-3xl font-bold">Ready to scale?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/dashboard?tab=plans')}
              className="px-10 py-5 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 text-lg"
            >
              View all plans
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="px-10 py-5 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all text-lg"
            >
              Back to dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
