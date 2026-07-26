import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, GraduationCap, Wallet, ArrowRight, CheckCircle, Lock, Eye, Play } from 'lucide-react';

export const NextGenLanding = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Wersee for School & Family
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8"
          >
            Empower the <br className="hidden md:block" />
            <span className="text-indigo-400">
              Next Generation
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            A safe, monitored, and educational environment for young creators to build their first digital business, learn financial literacy, and share their passion with the world.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/next-gen-setup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Setup <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Absolute Safety",
                desc: "You control what they can see, create, and publish. Every product requires your approval before going live.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20"
              },
              {
                icon: Wallet,
                title: "Financial Literacy",
                desc: "Teach them how money works. Payouts are routed securely to your bank account, while they track their earnings.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                icon: GraduationCap,
                title: "Real-World Skills",
                desc: "From marketing to product design, they learn by doing in a professional, yet protected ecosystem.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Age-Based Experience Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Tailored Experience</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Wersee adapts to your child's age, providing the right balance of freedom and protection at every stage of their growth.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                age: "0 - 12",
                title: "Kids Mode",
                desc: "A highly curated, simplified experience focused on learning and creativity. Every action is supervised.",
                features: ["Full Guardian Approval", "Curated Marketplace", "Educational Focus", "No Public Profile"],
                color: "from-blue-400 to-cyan-400",
                icon: "🎨"
              },
              {
                age: "12 - 16",
                title: "Next Gen Core",
                desc: "The sweet spot for budding entrepreneurs. More freedom to design and market, with guardian oversight.",
                features: ["Managed Payouts", "Public Storefront", "Marketing Tools", "Guardian Review"],
                color: "from-indigo-400 to-purple-400",
                icon: "🚀"
              },
              {
                age: "16 - 18",
                title: "Next Gen Pro",
                desc: "The final two years of preparation. Advanced features to bridge the gap to full professional independence.",
                features: ["Advanced Analytics", "Direct Collaboration", "Tax Readiness", "Independence Path"],
                color: "from-purple-400 to-pink-400",
                icon: "💎"
              }
            ].map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent hover:from-white/20 transition-all duration-500"
              >
                <div className="bg-[#0A0A0B] rounded-[2.4rem] p-8 h-full flex flex-col">
                  <div className={`text-4xl mb-6 bg-gradient-to-br ${tier.color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg`}>
                    {tier.icon}
                  </div>
                  
                  <div className="mb-6">
                    <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                      Ages {tier.age}
                    </span>
                    <h3 className="text-3xl font-black mt-2">{tier.title}</h3>
                  </div>

                  <p className="text-gray-400 mb-8 flex-grow">
                    {tier.desc}
                  </p>

                  <ul className="space-y-4">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">How it Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A streamlined setup process designed for parents and guardians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0"></div>

            {[
              {
                step: "01",
                title: "Guardian Setup",
                desc: "Create the account using your identity to ensure legal compliance and tax readiness.",
                icon: Lock
              },
              {
                step: "02",
                title: "Device Handoff",
                desc: "Send a secure, one-time link to your child's device so they can name their store and set a password.",
                icon: Play
              },
              {
                step: "03",
                title: "Review & Approve",
                desc: "Set boundaries, content filters, and approval workflows before they start creating.",
                icon: Eye
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="w-24 h-24 mx-auto bg-[#050505] border-2 border-blue-500/30 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <step.icon className="w-10 h-10 text-blue-400" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to start their journey?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Give them the tools to build, learn, and earn in a safe environment.
          </p>
          <Link 
            to="/next-gen-setup"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-all hover:scale-105 shadow-2xl shadow-blue-600/20"
          >
            Create Next Gen Account <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
};
