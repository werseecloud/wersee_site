import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutGrid, 
  Zap, 
  Shield, 
  Smartphone, 
  BarChart3, 
  Users, 
  Globe, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  QrCode,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const NextGenPos = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Next-Gen POS System - Wersee" 
        description="The most advanced point of sale system for modern businesses. Digital-first, AI-powered, and globally connected."
      />

      {/* Back Button */}
      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-[#F5F5F7]">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-sm font-bold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Introducing Wersee POS v2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]"
          >
            The Future of <br />
            <span className="text-indigo-400">Point of Sale.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium"
          >
            A digital-first POS system that connects your physical store to the global Wersee ecosystem. AI-powered, lightning-fast, and beautiful.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
              Get Started Free
            </Link>
            <a href="#features" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">
              Watch Demo
            </a>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-[20%] left-[10%] w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center"
          >
            <QrCode className="w-16 h-16 text-indigo-600" />
          </motion.div>
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center"
          >
            <CreditCard className="w-20 h-20 text-purple-600" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Active Merchants", value: "10k+" },
              { label: "Countries Supported", value: "135+" },
              { label: "Transaction Speed", value: "< 2s" },
              { label: "Uptime Guarantee", value: "99.9%" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-black mb-2">{stat.value}</p>
                <p className="text-sm text-[#86868B] font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Built for the next generation.</h2>
            <p className="text-lg text-[#86868B] max-w-2xl mx-auto">Everything you need to run a modern business, from inventory management to AI-driven sales insights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Digital-First QR Payments",
                desc: "Accept payments instantly via QR codes. No expensive hardware required. Just scan and pay.",
                icon: QrCode,
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "AI Sales Insights",
                desc: "Our AI analyzes your sales patterns to suggest inventory restocks and cross-selling opportunities.",
                icon: Sparkles,
                color: "bg-purple-50 text-purple-600"
              },
              {
                title: "Global Inventory Sync",
                desc: "Sync your physical stock with your online Wersee shop automatically. Never oversell again.",
                icon: RefreshCw,
                color: "bg-emerald-50 text-emerald-600"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-[#F5F5F7] rounded-[3rem] hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-gray-100 group"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="py-32 px-6 bg-[#F5F5F7]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Zero Hardware <br />Requirement.</h2>
            <p className="text-xl text-[#86868B] mb-10 font-medium leading-relaxed">
              Wersee POS runs on any device with a browser. Use your iPad, Android tablet, or even your smartphone. Connect standard receipt printers and barcode scanners via Bluetooth or USB.
            </p>
            <ul className="space-y-4">
              {[
                "Compatible with iOS, Android, and Web",
                "Bluetooth & USB Printer Support",
                "Offline Mode for unstable connections",
                "Multi-terminal sync in real-time"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="aspect-square bg-white rounded-[4rem] shadow-2xl p-12 flex items-center justify-center overflow-hidden">
               <motion.div 
                 animate={{ rotate: [0, 360] }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 opacity-5"
               >
                 <div className="w-full h-full border-[40px] border-dashed border-black rounded-full" />
               </motion.div>
               <Smartphone className="w-48 h-48 text-black relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Bento Section */}
      <section className="py-32 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-[#1D1D1F] rounded-[3.5rem] p-12 overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-4xl font-black mb-6">Real-time Dashboard</h3>
                <p className="text-gray-400 max-w-md text-lg mb-8">Monitor your business from anywhere in the world. Live sales tracking, staff performance, and more.</p>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold border border-emerald-500/20">LIVE UPDATES</div>
                  <div className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold border border-blue-500/20">CLOUD SYNC</div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-indigo-600/20 to-transparent rounded-tl-[5rem] translate-y-10 translate-x-10 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700" />
            </div>
            
            <div className="md:col-span-4 bg-indigo-600 rounded-[3.5rem] p-12 flex flex-col justify-between">
              <Smartphone className="w-16 h-16 mb-8" />
              <div>
                <h3 className="text-3xl font-black mb-4">Mobile Ready</h3>
                <p className="text-indigo-100">Turn any smartphone into a powerful POS terminal in seconds.</p>
              </div>
            </div>

            <div className="md:col-span-4 bg-[#1D1D1F] rounded-[3.5rem] p-12">
              <Shield className="w-12 h-12 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black mb-4">Secure by Design</h3>
              <p className="text-gray-400">Enterprise-grade security for every transaction. Fully PCI compliant.</p>
            </div>

            <div className="md:col-span-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[3.5rem] p-12 flex items-center justify-between">
              <div className="max-w-md">
                <h3 className="text-4xl font-black mb-6">Global Reach</h3>
                <p className="text-purple-100 text-lg">Accept 135+ currencies and local payment methods automatically.</p>
              </div>
              <Globe className="w-32 h-32 opacity-20 hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Simple, transparent pricing.</h2>
            <p className="text-xl text-[#86868B]">Choose the plan that fits your business scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "0", desc: "Perfect for small shops", features: ["1 Terminal", "Basic Analytics", "QR Payments"] },
              { name: "Pro", price: "29", desc: "For growing businesses", features: ["Unlimited Terminals", "AI Insights", "Inventory Sync", "Staff Management"] },
              { name: "Enterprise", price: "Custom", desc: "For large scale operations", features: ["Custom Integration", "Dedicated Support", "SLA Guarantee", "White-labeling"] }
            ].map((plan, i) => (
              <div key={i} className={`p-12 rounded-[3.5rem] border ${i === 1 ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-white'} flex flex-col`}>
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-[#86868B] mb-8">{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black">€{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-gray-500 font-bold">/mo</span>}
                </div>
                <ul className="space-y-4 mb-12 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.name === 'Enterprise' ? '/enterprise' : '/auth'} className={`block text-center w-full py-5 rounded-full font-black text-lg transition-all ${i === 1 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-black text-white hover:bg-gray-800'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tight">Ready to upgrade your business?</h2>
          <p className="text-xl text-[#86868B] mb-12 max-w-2xl mx-auto">Join thousands of merchants who are already using Wersee to power their physical and digital stores.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth" className="w-full sm:w-auto px-12 py-6 bg-black text-white rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl">
              Start Free Trial
            </Link>
            <a href="mailto:support@wersee.com?subject=Next-Gen%20POS%20sales" className="w-full sm:w-auto px-12 py-6 bg-white text-black border border-gray-200 rounded-full font-black text-xl hover:bg-gray-50 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
