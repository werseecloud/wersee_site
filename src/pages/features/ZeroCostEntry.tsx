import React from 'react';
import { motion } from 'motion/react';
import { Gift, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const ZeroCostEntry = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Zero-Cost Entry - 100% Free to Start" 
        description="Start your business for free on Wersee. No hidden costs, no setup fees."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-lime-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Zero-Cost <span className="text-lime-600">Entry.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            Start your business for free on Wersee. No hidden costs, no setup fees. We only win when you win.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Start Free</Link>
            <Link to="/pricing" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">Compare Plans</Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Start for free. Scale to infinity.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              We believe entrepreneurship should be accessible to everyone. That's why Wersee has no monthly fees for starters. We only make money when you make money, aligning our success with yours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "No Setup Fees", desc: "Create your account and start selling in minutes. No credit card required to get started.", icon: Gift },
              { title: "Free Tools", desc: "Get access to our powerful commerce tools, including the website builder and analytics, for free.", icon: Zap },
              { title: "Global Reach", desc: "Sell to anyone, anywhere. We handle the currency conversion and global payments.", icon: Globe },
              { title: "Unlimited Products", desc: "List as many items as you want. We don't cap your inventory or your creativity.", icon: CheckCircle2 },
              { title: "Low Transaction Fees", desc: "Our competitive rates drop as you grow. Keep more of what you earn.", icon: Shield },
              { title: "24/7 Support", desc: "Just because it's free doesn't mean you're alone. Our support team is here to help you launch.", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-lime-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-lime-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#1D1D1F] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-16">What's included?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="space-y-4">
              {['Online Store Builder', 'Unlimited Products', 'Global Payments', 'Fraud Analysis', 'Mobile App', '24/7 Support'].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                   <div className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center text-black font-bold text-xs">✓</div>
                   <span className="font-medium text-lg">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {['Marketing Tools', 'Discount Codes', 'Abandoned Cart Recovery', 'Customer Profiles', 'Inventory Tracking', 'Tax Automation'].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                   <div className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center text-black font-bold text-xs">✓</div>
                   <span className="font-medium text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-lime-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Launch your dream today.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            No credit card required. Cancel anytime.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-lime-600 text-white rounded-full font-bold text-xl hover:bg-lime-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};
