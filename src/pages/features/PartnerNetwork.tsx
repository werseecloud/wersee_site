import React from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const PartnerNetwork = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Partner Network - Affiliates for You" 
        description="Grow your business with a powerful affiliate network. The most advanced partner system."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Partner <span className="text-emerald-600">Network.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            Grow your business with a powerful affiliate network. Recruit partners, track sales, and pay commissions automatically.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/affiliate/join" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Join Network</Link>
            <a href="#how-it-works" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">How it Works</a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-white scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Turn customers into your sales team.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Word of mouth is powerful. The Partner Network amplifies it. Launch an affiliate program in minutes and let your fans, influencers, and other businesses promote your products for a commission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Affiliate Tracking", desc: "Track every click and conversion with precision. We use advanced fingerprinting to ensure attribution is accurate.", icon: Users },
              { title: "Auto-Payments", desc: "Pay your partners automatically via Stripe. No more manual spreadsheets or delayed PayPal transfers.", icon: Zap },
              { title: "Global Reach", desc: "Recruit partners from all over the world. Our marketplace connects you with top-tier affiliates ready to sell.", icon: Globe },
              { title: "Partner Portal", desc: "Give your affiliates a professional dashboard where they can get links, view stats, and access assets.", icon: Shield },
              { title: "Flexible Commissions", desc: "Set flat rates, percentages, or tiered structures. Reward your top performers with bonuses.", icon: CheckCircle2 },
              { title: "Marketing Assets", desc: "Upload banners, swipe copy, and social posts for your partners to share with one click.", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-emerald-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#1D1D1F] text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center">Built for Growth.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
              <div className="text-5xl font-black text-emerald-500 mb-4">30%</div>
              <h3 className="text-xl font-bold mb-2">Revenue Increase</h3>
              <p className="text-gray-400">Average growth in the first 3 months of launching a partner program.</p>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
              <div className="text-5xl font-black text-emerald-500 mb-4">0h</div>
              <h3 className="text-xl font-bold mb-2">Admin Time</h3>
              <p className="text-gray-400">With automated payouts and tax handling, you save hours every month.</p>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
              <div className="text-5xl font-black text-emerald-500 mb-4">10k+</div>
              <h3 className="text-xl font-bold mb-2">Active Partners</h3>
              <p className="text-gray-400">Access our network of vetted affiliates ready to promote your brand.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-emerald-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Start your partner program.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Don't leave money on the table. Let others help you grow.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-emerald-600 text-white rounded-full font-bold text-xl hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Launch Network
          </Link>
        </div>
      </section>
    </div>
  );
};
