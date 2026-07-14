import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const VentureLaunchpad = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Venture Launchpad - Create Your Business" 
        description="Launch your business in minutes on Wersee. The most powerful platform for entrepreneurs."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Venture <span className="text-purple-600">Launchpad.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            Launch your business in minutes on Wersee. From digital products to physical stores, we provide the tools you need to succeed.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Launch Now</Link>
            <a href="#roadmap" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">See Roadmap</a>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Idea to Empire in minutes.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Don't get stuck in analysis paralysis. Venture Launchpad guides you through every step of starting a business, from naming your brand to making your first sale. We've streamlined the chaos of starting up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Business Name Gen", desc: "Stuck on a name? Our AI generates catchy, available business names and checks domain availability instantly.", icon: Rocket },
              { title: "Logo Maker", desc: "Create a professional brand identity in seconds. Choose from thousands of icons and fonts.", icon: Sparkles },
              { title: "Legal Setup", desc: "We guide you through the basics of business registration and tax setup for your region.", icon: Shield },
              { title: "Domain Registration", desc: "Claim your .com, .store, or .io directly from the dashboard. We handle the DNS settings.", icon: Globe },
              { title: "Pre-built Themes", desc: "Choose from stunning, mobile-optimized store templates designed for high conversion.", icon: Zap },
              { title: "Supplier Network", desc: "Don't have products? Connect with our network of dropshipping and wholesale partners.", icon: CheckCircle2 }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-purple-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="py-32 px-6 bg-[#000000] text-white relative overflow-hidden scroll-mt-8">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
              The Roadmap.
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From zero to hero. We've mapped out the exact steps to build your empire.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-transparent md:-translate-x-1/2 opacity-30" />

            <div className="space-y-24">
              {[
                { 
                  step: "01", 
                  title: "Define Your Niche", 
                  desc: "Use our AI market analyzer to find profitable gaps in the market. Validate your idea before you spend a dime.",
                  color: "from-purple-500 to-indigo-500"
                },
                { 
                  step: "02", 
                  title: "Build Your Brand", 
                  desc: "Generate a logo, color palette, and brand voice in seconds. Create a cohesive identity that resonates.",
                  color: "from-indigo-500 to-blue-500"
                },
                { 
                  step: "03", 
                  title: "Launch Storefront", 
                  desc: "Deploy a high-conversion website with one click. Mobile-optimized, SEO-ready, and blazing fast.",
                  color: "from-blue-500 to-cyan-500"
                },
                { 
                  step: "04", 
                  title: "Scale & Automate", 
                  desc: "Connect suppliers, set up auto-fulfillment, and run ads. Turn your side hustle into a self-driving machine.",
                  color: "from-cyan-500 to-emerald-500"
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[20px] md:left-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] md:-translate-x-1/2 z-20 mt-8 md:mt-0" />

                  {/* Content */}
                  <div className="flex-1 pl-16 md:pl-0 md:text-right">
                    <div className={`hidden md:block ${index % 2 === 1 ? 'text-left' : 'text-right'}`}>
                      <span className={`text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r ${item.color} opacity-20`}>
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 pl-16 md:pl-0">
                    <div className={`bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors relative group overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                      <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span className="md:hidden text-purple-500 font-black">{item.step}</span>
                        {item.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to launch?</h2>
          <p className="text-xl text-[#86868B] mb-12">
            The world is waiting for your idea. Let's build it together.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-purple-600 text-white rounded-full font-bold text-xl hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Start Your Venture
          </Link>
        </div>
      </section>
    </div>
  );
};
