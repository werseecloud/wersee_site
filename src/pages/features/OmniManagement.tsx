import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const OmniManagement = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Omni-Management - Manage Everything" 
        description="Manage your entire business from one place. The most powerful management system."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Omni <span className="text-slate-600">Management.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            Manage your entire business from one place. From inventory to staff, Wersee Omni-Management provides the tools you need to stay in control.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Get Started</Link>
            <a href="#features" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">Learn More</a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Unified management for a fragmented world.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Stop jumping between tabs. Omni Management brings your online store, physical POS, social commerce, and marketplace listings under one roof. One inventory, one customer list, one powerful system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Inventory Sync", desc: "Keep your stock levels in sync across all channels. Sell an item in-store, and it instantly updates on your website and Amazon.", icon: LayoutGrid },
              { title: "Staff Management", desc: "Manage your team and their permissions easily. Track hours, sales performance, and set access levels per role.", icon: Zap },
              { title: "Global Control", desc: "Monitor your business performance from anywhere. Our mobile app gives you full control on the go.", icon: Globe },
              { title: "Unified Inbox", desc: "All your customer messages from email, chat, and social media in one single feed. Never miss a query.", icon: CheckCircle2 },
              { title: "Order Routing", desc: "Smart fulfillment logic automatically routes orders to the nearest warehouse or store with stock.", icon: Shield },
              { title: "Vendor Portal", desc: "Manage suppliers, purchase orders, and incoming shipments efficiently. Streamline your supply chain.", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-slate-100 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-slate-600" />
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
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center">Connect Everywhere.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {['Shopify', 'Amazon', 'Instagram', 'TikTok', 'WooCommerce', 'Etsy', 'eBay', 'Pinterest'].map((brand, i) => (
              <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-300">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Simplify your operations.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Join the platform that powers the world's most efficient businesses.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-slate-800 text-white rounded-full font-bold text-xl hover:bg-slate-900 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};
