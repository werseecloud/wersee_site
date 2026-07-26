import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const IntelligenceCore = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Intelligence Core - AI Assisted" 
        description="Power your business with advanced AI. The most intelligent platform for commerce."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-cyan-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Intelligence <span className="text-cyan-600">Core.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            Power your business with advanced AI. From automated customer support to predictive sales analytics, Wersee is built on intelligence.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#features" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Explore AI</a>
            <a href="#features" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">See Features</a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">The brain behind your business.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Wersee isn't just software; it's a smart assistant. Our Intelligence Core uses advanced AI to optimize your pricing, marketing, and operations automatically, giving you a competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smart Pricing", desc: "Automatically adjust prices based on demand, competition, and inventory levels to maximize profit.", icon: Cpu },
              { title: "Customer Segmentation", desc: "Group customers by behavior and value for hyper-targeted marketing campaigns.", icon: Zap },
              { title: "Inventory Forecasting", desc: "Predict what will sell and when. Never run out of stock or overstock again.", icon: Sparkles },
              { title: "Automated Support", desc: "AI chatbots handle 80% of customer queries instantly, 24/7, in any language.", icon: Shield },
              { title: "Content Generation", desc: "Write SEO-optimized product descriptions, blog posts, and ad copy in seconds.", icon: CheckCircle2 },
              { title: "Fraud Detection", desc: "Real-time analysis of every transaction to block fraudsters before they chargeback.", icon: Globe }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-cyan-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-cyan-600" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
               <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20"></div>
               <div className="relative bg-black border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                  <div className="flex flex-col gap-4">
                     <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>
                        <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 text-sm text-gray-300">
                           How can I improve my sales this week?
                        </div>
                     </div>
                     <div className="flex items-start gap-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex-shrink-0 flex items-center justify-center">
                           <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-2xl rounded-tr-none p-4 text-sm text-cyan-100">
                           Based on your data, running a flash sale on "Summer Collection" could boost revenue by 15%. I've prepared a draft email campaign for you.
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-8">Your 24/7 Analyst.</h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Imagine having a data scientist, a copywriter, and a support agent working for you around the clock. That's Intelligence Core.
              </p>
              <ul className="space-y-4">
                {[
                  "Analyzes millions of data points",
                  "Learns from your business patterns",
                  "Proactively suggests improvements",
                  "Integrates with all Wersee tools"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg font-medium">
                    <CheckCircle2 className="w-6 h-6 text-cyan-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-cyan-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Work smarter, not harder.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Unlock the power of AI for your business today.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-cyan-600 text-white rounded-full font-bold text-xl hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Activate Intelligence
          </Link>
        </div>
      </section>
    </div>
  );
};
