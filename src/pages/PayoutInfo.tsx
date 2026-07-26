import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  CreditCard,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PayoutInfoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Payout Information</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Hero */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Understanding your payouts</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Everything you need to know about how and when you receive your funds.
            </p>
          </section>

          {/* 1. First Payout */}
          <section className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="w-32 h-32 text-indigo-500" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h2 className="text-2xl font-bold">First Payout</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                The first payout usually takes <span className="text-white font-bold">7–14 days</span> after your first payment is received. This is a standard security period from Stripe to prevent fraud and verify your account.
              </p>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-400/80">This delay only applies to your very first successful transaction.</p>
              </div>
            </div>
          </section>

          {/* 2. Standard Schedules */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <span className="text-xl font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold">Subsequent Payouts (Standard)</h2>
            </div>
            <p className="text-gray-400">After your first payout, you can choose from different schedules in your settings:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold">Daily payouts</h3>
                </div>
                <p className="text-sm text-gray-500">Paid out automatically every business day. This is the most common schedule.</p>
              </div>
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold">Weekly payouts</h3>
                </div>
                <p className="text-sm text-gray-500">Once a week on a fixed day of your choice.</p>
              </div>
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold">Monthly payouts</h3>
                </div>
                <p className="text-sm text-gray-500">Once a month on a fixed date.</p>
              </div>
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold">Manual payouts</h3>
                </div>
                <p className="text-sm text-gray-500">You decide when to send the balance to your bank account.</p>
              </div>
            </div>
          </section>

          {/* 3. Bank Arrival Time */}
          <section className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 md:p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h2 className="text-2xl font-bold">Bank Processing Time</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                Even with daily payouts, funds usually arrive in your account about <span className="text-white font-bold">4 business days</span> after the payment.
              </p>
              
              <div className="relative py-8">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-8">
                  <div className="relative pl-12">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-[#141414]" />
                    <p className="font-bold">Monday</p>
                    <p className="text-sm text-gray-500">Customer pays for your product</p>
                  </div>
                  <div className="relative pl-12">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-white/10 ring-4 ring-[#141414]" />
                    <p className="font-bold text-gray-500">Tuesday - Thursday</p>
                    <p className="text-sm text-gray-500">Processing by Stripe and banks</p>
                  </div>
                  <div className="relative pl-12">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#141414]" />
                    <p className="font-bold">Friday</p>
                    <p className="text-sm text-gray-500">Funds sent to your bank and become visible</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Instant Payouts */}
          <section className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <span className="text-xl font-bold">4</span>
                </div>
                <h2 className="text-2xl font-bold">Instant Payouts (Optional)</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                Need funds immediately? You can use <span className="text-white font-bold">instant payouts</span>. Funds will be in your account within minutes, for a small fee (~1%).
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all">
                Check Eligibility
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Summary</h3>
            <p className="text-gray-400">
              First time: <span className="text-white font-medium">7–14 days</span>. <br />
              Thereafter usually: <span className="text-white font-medium">every day or every few days</span> (±4 business days delay).
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};
