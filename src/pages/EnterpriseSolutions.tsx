import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, BarChart3, Globe2, Briefcase, Users2, Lock, Zap, ArrowRight, Building2, CheckCircle, Database, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const EnterpriseSolutions = () => {
  return (
    <PageWrapper>
      <SEO 
        title="Enterprise Solutions | Wersee" 
        description="Scale your organization with Wersee's enterprise-grade infrastructure, security, and management tools."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[#f5f2ed]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-200/50 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 text-gray-600 text-xs font-bold uppercase tracking-[0.2em] mb-8"
              >
                <Building2 className="w-4 h-4" /> Enterprise Grade
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-light text-gray-900 tracking-tight leading-[1] mb-8 font-serif"
              >
                Infrastructure for <br />
                <span className="font-black italic">Global Scale.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-600 mb-12 leading-relaxed max-w-xl"
              >
                Wersee Enterprise provides the security, compliance, and management 
                capabilities required by the world's most demanding organizations.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-4"
              >
                <a href="mailto:support@wersee.com?subject=Enterprise%20sales" className="px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-black/10 flex items-center gap-2">
                  Contact Sales <ArrowRight className="w-5 h-5" />
                </a>
                <Link to="/community/docs" className="px-10 py-5 bg-white border border-gray-200 hover:border-gray-900 text-gray-900 rounded-full font-bold text-lg transition-all">
                  Documentation
                </Link>
              </motion.div>
            </div>
            
            <div className="flex-1 relative hidden lg:block">
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden border border-gray-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" 
                  alt="Enterprise" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xs">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="font-bold text-gray-900">99.99% Uptime SLA</div>
                </div>
                <p className="text-sm text-gray-500">Guaranteed reliability for mission-critical operations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale">
            <Building2 className="w-12 h-12" />
            <Globe2 className="w-12 h-12" />
            <Network className="w-12 h-12" />
            <Database className="w-12 h-12" />
            <Briefcase className="w-12 h-12" />
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">Built for Governance.</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Comprehensive tools to manage your entire digital ecosystem at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                title: "Advanced Security",
                desc: "SSO, SAML, and granular permission controls for total data sovereignty.",
                icon: Lock
              },
              {
                title: "Global Compliance",
                desc: "GDPR, SOC2, and HIPAA ready infrastructure for international operations.",
                icon: ShieldCheck
              },
              {
                title: "Team Management",
                desc: "Centralized billing, user provisioning, and organizational analytics.",
                icon: Users2
              },
              {
                title: "Custom Integrations",
                desc: "Deep API access to connect Wersee with your existing tech stack.",
                icon: Zap
              },
              {
                title: "Dedicated Support",
                desc: "24/7 priority support with a dedicated account management team.",
                icon: Briefcase
              },
              {
                title: "Performance Insights",
                desc: "Real-time auditing and advanced reporting for strategic decision making.",
                icon: BarChart3
              }
            ].map((sol, i) => (
              <div key={i} className="group">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-gray-900 group-hover:text-white transition-all">
                  <sol.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{sol.title}</h3>
                <p className="text-gray-500 leading-relaxed">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
                Uncompromising <br />
                <span className="text-gray-500">Reliability.</span>
              </h2>
              <div className="space-y-6">
                {[
                  "Isolated cloud infrastructure",
                  "Real-time threat monitoring",
                  "Automated backup & recovery",
                  "Multi-region data residency"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-medium text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-12">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Security Audit</div>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">PASSED</div>
                </div>
                <div className="space-y-6">
                  {[85, 92, 78].map((w, i) => (
                    <div key={i} className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${w}%` }}
                        className="h-full bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-[#f5f2ed] text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-light text-gray-900 tracking-tight mb-12 font-serif">
            Ready to <span className="font-black italic">Transform?</span>
          </h2>
          <a href="mailto:support@wersee.com?subject=Enterprise%20consultation" className="inline-flex items-center justify-center px-12 py-6 bg-gray-900 text-white rounded-full font-bold text-2xl hover:scale-105 transition-all shadow-2xl shadow-black/20">
            Schedule a Consultation
          </a>
        </div>
      </section>
    </PageWrapper>
  );
};
