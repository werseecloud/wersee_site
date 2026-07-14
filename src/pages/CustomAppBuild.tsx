import React from 'react';
import { motion } from 'motion/react';
import { Code2, Cpu, Globe, Layers, Rocket, Shield, Zap, ArrowRight, CheckCircle2, Smartphone, Terminal } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';

export const CustomAppBuild = () => {
  return (
    <PageWrapper>
      <SEO 
        title="Custom App Build | Wersee" 
        description="Build high-performance, scalable custom applications tailored to your business needs with Wersee's expert engineering."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8"
            >
              <Terminal className="w-4 h-4" /> Bespoke Engineering
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8"
            >
              WE BUILD THE <span className="text-indigo-500">UNIMAGINABLE.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 mb-12 leading-relaxed"
            >
              From complex SaaS platforms to high-performance mobile ecosystems. 
              Wersee turns your most ambitious ideas into production-ready reality.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2">
                Start Your Build <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-lg transition-all border border-white/10">
                View Portfolio
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Full-Stack SaaS",
                desc: "Scalable backends, intuitive frontends, and seamless integrations.",
                icon: Layers,
                color: "text-blue-400",
                bg: "bg-blue-500/10"
              },
              {
                title: "Mobile Ecosystems",
                desc: "Native-feel cross-platform apps for iOS and Android.",
                icon: Smartphone,
                color: "text-purple-400",
                bg: "bg-purple-500/10"
              },
              {
                title: "AI Integration",
                desc: "Custom LLM implementations and intelligent automation.",
                icon: Cpu,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10"
              }
            ].map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`w-14 h-14 ${cap.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <cap.icon className={`w-7 h-7 ${cap.color}`} />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic uppercase tracking-tight">{cap.title}</h3>
                <p className="text-gray-500 leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="py-24 bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 leading-none">
                OUR <span className="text-indigo-500">BLUEPRINT</span> FOR SUCCESS.
              </h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Discovery", desc: "Deep dive into your business goals and user needs." },
                  { step: "02", title: "Architecting", desc: "Designing robust, scalable system architectures." },
                  { step: "03", title: "Rapid Build", desc: "Iterative development with weekly milestones." },
                  { step: "04", title: "Launch & Scale", desc: "Seamless deployment and ongoing performance optimization." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <span className="text-2xl font-black text-indigo-500/40 italic">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">{item.title}</h4>
                      <p className="text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center overflow-hidden">
                <Code2 className="w-64 h-64 text-indigo-500/20 animate-pulse" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
            READY TO BUILD <br /> SOMETHING <span className="text-black">ICONIC?</span>
          </h2>
          <p className="text-indigo-100 text-xl mb-12 max-w-2xl mx-auto">
            Let's discuss your project and see how Wersee can help you dominate your market.
          </p>
          <button className="px-12 py-6 bg-white text-indigo-600 rounded-2xl font-black text-2xl hover:scale-105 transition-all shadow-2xl shadow-black/20">
            Book a Strategy Call
          </button>
        </div>
      </section>
    </PageWrapper>
  );
};
