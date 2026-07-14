import React, { useState, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, Globe, Zap, Users, Rocket, Lock, Target, Heart, Sparkles, ChevronRight, Quote, Briefcase, TrendingUp, Map, Play, Pause, Volume2, HelpCircle, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FAQ_ITEMS = [
  {
    question: "What exactly is a 'Business OS'?",
    answer: "A Business OS is a unified digital ecosystem that combines all the essential tools for running a business—marketplace, CRM, networking, payments, and automation—into a single, seamless interface. It eliminates the need for multiple disconnected subscriptions."
  },
  {
    question: "How does Wersee ensure review authenticity?",
    answer: "We use advanced AI-driven detection systems to filter out bot activity and fake accounts. Reviews are verified against actual transaction data, ensuring that every rating comes from a real customer with a real experience."
  },
  {
    question: "Is my data truly sovereign on Wersee?",
    answer: "Yes. Sovereignty is our core principle. We use advanced encryption and decentralized protocols to ensure that you own and control your data. We provide the tools, but you hold the keys."
  },
  {
    question: "Can I migrate my existing business to Wersee?",
    answer: "Absolutely. Wersee is built for speed and ease of transition. Our migration tools and API integrations allow you to bring your existing data and workflows into our ecosystem with minimal friction."
  }
];

const AUDIO_SOURCES: Record<string, string> = {
  founder: "https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/audio_files/Raeven_secctions.mp3",
  jelte: "https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/audio_files/jelte_section.mp3"
};

export const AboutUs = () => {
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const toggleAudio = (sectionId: string) => {
    if (playingSection === sectionId) {
      audioRef.current?.pause();
      setPlayingSection(null);
    } else {
      // If another section was playing, stop it
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const source = AUDIO_SOURCES[sectionId];
      
      if (source) {
        setPlayingSection(sectionId);
        if (audioRef.current) {
          audioRef.current.src = source;
          audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
        }
      } else {
        setPlayingSection(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30 scroll-smooth">
      <SEO 
        title="The Vision of Wersee | About Us & Our Mission" 
        description="Learn how Raeven Voge and Jelte are building the world's first Business OS. Built for speed, trust, and the next generation of builders."
      />

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        onEnded={() => setPlayingSection(null)}
      />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Audio Control Overlay (Optional/Global) */}
      <AnimatePresence>
        {playingSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-4 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center animate-pulse">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Listening to</div>
              <div className="text-sm font-black text-white">Wersee Vision Audio</div>
            </div>
            <button 
              onClick={() => setPlayingSection(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="vision" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
              Our Origin Story
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              One Vision. <br />
              <span className="text-indigo-400">
                Zero Limits.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed">
              Wersee wasn't born in a corporate boardroom. It was born from the frustration of a founder who realized that earning your first dollar shouldn't require ten different subscriptions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Founder's Mission */}
      <section id="founder" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  The Spark of <br /> Raeven Voge.
                </h2>
                <button 
                  onClick={() => toggleAudio('founder')}
                  className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  title="Listen to this section"
                >
                  {playingSection === 'founder' ? <Pause className="w-5 h-5 text-indigo-400" /> : <Play className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />}
                </button>
              </div>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  Our founder, <span className="text-white font-bold">Raeven Voge</span>, looked at the digital landscape and saw a broken system. Entrepreneurs were drowning in a sea of software—one for payments, one for networking, one for CRM, and another for marketplaces. The cost of just *starting* was becoming a barrier to entry.
                </p>
                <p>
                  Drawing from deep experience in the entrepreneurial world and lessons learned from established ventures like <span className="text-indigo-400 italic">Taxi Borger Assen</span>, Raeven decided enough was enough. He envisioned a "Business OS"—a single, unified ecosystem where you could build, scale, and connect without friction.
                </p>
                <p>
                  "What is a business if you cannot network? What is a marketplace if you cannot find exactly what you need?" This philosophy drove the creation of Wersee. It wasn't just about building a tool; it was about building a sovereign digital nation for builders.
                </p>
                <p>
                  The journey wasn't easy. It required countless late nights, thousands of lines of code, and a relentless commitment to a vision that many thought was too ambitious. But Raeven knew that the world didn't need another app—it needed a new way to exist in the digital economy.
                </p>
              </div>
            </motion.div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 overflow-hidden relative group">
                <img 
                  src="https://picsum.photos/seed/founder/800/800" 
                  alt="Founder Vision" 
                  className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <Quote className="w-8 h-8 text-indigo-500 mb-4" />
                    <p className="text-white font-medium italic text-lg">
                      "We didn't build Wersee to compete. We built it to render the old ways of doing business obsolete."
                    </p>
                    <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">— Raeven Voge, Founder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The DNA of Innovation */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">A Legacy of Building</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Wersee is the culmination of years of success across marketing, sales, and software engineering.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">@raevenvoge</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                As the owner of the <span className="text-white">@raevenvoge motivation channel</span>, Raeven mastered the art of digital marketing and audience building, creating a massive community of driven individuals.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Protal Education</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                In the world of high-stakes sales, Raeven achieved significant success with <span className="text-white">Protal Education</span>, refining the conversion strategies that are now baked into Wersee's core.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Clickify</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                With <span className="text-white">Clickify</span>, Raeven pushed the boundaries of software utility, learning exactly what users need to stay productive and efficient in a crowded digital space.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Forge Engine</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Deep technical expertise from building <span className="text-white">Forge Engine</span>, a custom 3D engine, provided the architectural foundation for the spectacular performance and visual flow of Wersee.
              </p>
            </div>
          </div>
          <div className="mt-16 p-8 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-xl text-indigo-100 font-medium">
              "Every lesson learned from these ventures—every marketing win, every sales breakthrough, and every line of engine code—has been poured into making Wersee the ultimate Business OS."
            </p>
          </div>
        </div>
      </section>

      {/* Deep Dive: The Philosophy of Flow */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">The Philosophy of Flow</h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              At Wersee, we don't just design interfaces; we design experiences that respect the human cognitive load.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Target className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold">Intentional Design</h3>
              <p className="text-gray-400 leading-relaxed">
                Every pixel on Wersee has a purpose. We believe that a clean workspace leads to a clean mind. By removing the "noise" of traditional platforms, we allow creators to focus on what truly matters: their craft and their customers.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold">Sovereign Security</h3>
              <p className="text-gray-400 leading-relaxed">
                Security isn't a feature; it's the foundation. With Wersee Shield and our advanced encryption protocols, we ensure that your business remains your business. We empower you with the tools to protect your identity and your intellectual property.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <Users className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold">Community Synergy</h3>
              <p className="text-gray-400 leading-relaxed">
                Networking on Wersee isn't about collecting contacts; it's about building relationships. Our ecosystem is designed to foster collaboration, allowing businesses to find partners, mentors, and clients in a seamless, high-trust environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Speed */}
      <section className="py-24 relative overflow-hidden bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9]">
                Built for <br />
                <span className="text-indigo-500">Speed.</span>
              </h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  The world moves faster than ever. Ideas are launched in days. Companies grow in weeks instead of years. But the tools most people use? They are stuck in the past, dragging down innovation with heavy setups and technical debt.
                </p>
                <p>
                  Wersee is engineered for velocity. We’ve stripped away the friction so you can focus on the momentum.
                </p>
                <ul className="grid grid-cols-2 gap-4 mt-8">
                  {[
                    { label: 'Rapid Setup', desc: 'Zero to live in minutes.' },
                    { label: 'Instant Launch', desc: 'Deploy with a single click.' },
                    { label: 'Fast Iteration', desc: 'Adapt as fast as you think.' },
                    { label: 'Infinite Scale', desc: 'Grow without limits.' }
                  ].map((item, i) => (
                    <li key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-white font-bold mb-1">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-8">
                  No months of configuration. No technical barriers. Just build, launch, and dominate.
                </p>
              </div>
            </motion.div>
            <div className="relative">
              <div className="aspect-video rounded-3xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/speed/1200/800')] bg-cover bg-center opacity-30 grayscale" />
                <Zap className="w-24 h-24 text-white relative z-10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For the Next Generation of Builders */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8">For the Next Generation of Builders</h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Wersee isn't made for traditional corporations stuck in legacy systems. It's built for the rebels, the creators, the startups, and the small teams with massive ambitions.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Builders', 'Creators', 'Startups', 'Visionaries'].map((type, i) => (
                <div key={i} className="py-6 px-4 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-sm">
                  {type}
                </div>
              ))}
            </div>
            <p className="mt-12 text-gray-500 text-lg italic">
              "We build for the people who don't wait. The ones who test, fail, adapt, and keep going. The ones who understand that in the digital age, speed is the ultimate competitive advantage."
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Expansion & Jelte */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-64 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-indigo-400" />
                  </div>
                  <div className="h-48 rounded-2xl bg-white/5 border border-white/10" />
                </div>
                <div className="space-y-4 pt-8">
                  <div className="h-48 rounded-2xl bg-white/5 border border-white/10" />
                  <div className="h-64 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Briefcase className="w-12 h-12 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  Strategic Growth <br /> & Partnership.
                </h2>
                <button 
                  onClick={() => toggleAudio('jelte')}
                  className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  title="Listen to this section"
                >
                  {playingSection === 'jelte' ? <Pause className="w-5 h-5 text-indigo-400" /> : <Play className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />}
                </button>
              </div>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  The partnership was forged on a pivotal evening when Raeven visited Jelte. What began as a deep dive into business strategy and future ambitions took a dramatic turn when Raeven revealed the architecture of Wersee. Jelte was immediately captivated by the scale of the vision. He didn't just see a platform; he saw the future of digital sovereignty. Without hesitation, he knew he had to join the mission, bringing his marketing genius to help Raeven turn this spectacular vision into a global reality.
                </p>
                <p>
                  Jelte is the engine behind Wersee's global outreach. While Raeven architected the core OS and the spectacular visual identity of the platform, Jelte took command of the marketing frontier. He manages everything from strategic outreach to brand positioning, ensuring that the Wersee message reaches every corner of the globe.
                </p>
                <p>
                  Jelte's approach to marketing is as spectacular as the platform itself. He doesn't just run ads; he builds narratives. He understands that Wersee isn't just a product—it's a lifestyle for the modern entrepreneur. Under his leadership, our outreach efforts have expanded into new territories, bringing the Wersee experience to a truly global audience.
                </p>
                <p>
                  Together, they form a formidable duo: Raeven's visionary product leadership combined with Jelte's aggressive and precise marketing execution. This partnership is what transformed Wersee from a spectacular concept into a global movement.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-5xl font-black mb-6">Our Core Values</h2>
              <p className="text-xl text-gray-500 leading-relaxed">
                These aren't just words on a wall. They are the principles that guide every decision we make, from the features we build to the people we hire.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Heart className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Empathy First</h3>
              <p className="text-sm text-gray-500">We build for humans, not for metrics. We understand the struggles of business because we've lived them.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Sparkles className="w-10 h-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Spectacular Quality</h3>
              <p className="text-sm text-gray-500">If it's not spectacular, it's not Wersee. We obsess over the details so you don't have to.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wersee Sovereign */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
              <Sparkles className="w-full h-full text-white" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[0.9]">
                Wersee Sovereign: <br /> The Enterprise Evolution.
              </h2>
              <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
                We realized that the flow and knowledge we built for Wersee was too powerful to keep to ourselves. Wersee Sovereign was born to give established companies the same spectacular infrastructure, design language, and operational efficiency that powers our own ecosystem.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold">
                  Spectacular UI/UX
                </div>
                <div className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold">
                  Flow Optimization
                </div>
                <div className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold">
                  Sovereign Infrastructure
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Future Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9]">
              The World's <br /> Largest Marketplace.
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Our ambition is simple but massive: In the coming years, Wersee will become the world's largest digital marketplace and business software suite. We are building the infrastructure for the next century of digital commerce.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <Globe className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Global Scale</h3>
                <p className="text-sm text-gray-500">Connecting builders from every continent.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <Zap className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Infinite Speed</h3>
                <p className="text-sm text-gray-500">Zero-friction transactions and networking.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <Rocket className="w-10 h-10 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Total OS</h3>
                <p className="text-sm text-gray-500">Every tool you need in one spectacular place.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Where We’re Going & Long-Term Vision */}
      <section className="py-24 relative overflow-hidden bg-indigo-600/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl font-black mb-8">The Horizon: <br /> Where We’re Going</h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  Wersee is just getting started. What we are building goes far beyond a simple marketplace or a set of tools. We are constructing the infrastructure for the future of work.
                </p>
                <p>
                  Imagine a world where AI agents handle your repetitive tasks, where automation is the default, and where teams collaborate globally without the friction of traditional borders. That is the world we are building.
                </p>
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <span className="font-bold">AI Agent Integration</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Zap className="w-6 h-6 text-purple-400" />
                    <span className="font-bold">Hyper-Automation</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Globe className="w-6 h-6 text-pink-400" />
                    <span className="font-bold">Borderless Collaboration</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black mb-8">The Long-Term <br /> Vision</h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  Our vision is simple, yet incredibly ambitious: Anyone, anywhere, should be able to start and grow a business without being dependent on dozens of disconnected tools or complex systems.
                </p>
                <p>
                  We want to lower the barrier to entry for entrepreneurship. We want to increase the speed of innovation. And we want to make building something spectacular easier than it has ever been in human history.
                </p>
                <p className="text-white font-bold text-2xl mt-8">
                  "We aren't just building software. We are building the engine of the new economy."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* This Is Just the Beginning */}
      <section className="py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <span className="text-indigo-500 font-black tracking-widest uppercase text-sm mb-4 block">The Journey Continues</span>
          <h2 className="text-4xl md:text-6xl font-black mb-8">This Is Just the Beginning</h2>
          <p className="text-xl text-gray-500 leading-relaxed mb-12">
            Wersee is a living, breathing ecosystem. We are constantly evolving, listening to our community, and building the features that matter. We don't just build for you; we build with you.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-400 font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Constantly Improving & Evolving
          </div>
        </div>
      </section>

      {/* Transparency & Privacy */}
      <section className="py-24 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12 p-12 rounded-[2rem] bg-white/5 border border-white/10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-4">Radical Transparency.</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                At Wersee, we believe you should always know exactly what happens with your data. We don't hide behind complex legal jargon. Our commitment to privacy is absolute, and our operations are transparent. Your data is yours; we just provide the spectacular tools to help you use it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Deep Dive */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-square rounded-full border border-white/10 flex items-center justify-center p-12">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl animate-pulse" />
                <Shield className="w-32 h-32 text-white relative z-10" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                Trust is the <br /> New Currency.
              </h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  One of the biggest problems online today is trust. Reviews are faked. Ratings are manipulated. Companies can make themselves look better than they actually are, undermining the integrity of the entire digital economy.
                </p>
                <p>
                  Wersee was built to solve this. We are creating a system where reputation is earned, not bought.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2">Verified Reviews</h4>
                    <p className="text-sm text-gray-500">Only real customers, real feedback.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2">Fake Detection</h4>
                    <p className="text-sm text-gray-500">AI-powered bot and fake account filtering.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2">Transparent Reputation</h4>
                    <p className="text-sm text-gray-500">A clear, immutable history of business conduct.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2">Strict Accountability</h4>
                    <p className="text-sm text-gray-500">Clear consequences for platform abuse.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative overflow-hidden bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Common Questions</h2>
            <p className="text-xl text-gray-500">Everything you need to know about the Wersee ecosystem.</p>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <div 
                key={i}
                className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl font-bold">{faq.question}</span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {openFaq === i ? <Minus className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-8 pb-8 text-gray-400 text-lg leading-relaxed border-t border-white/5 pt-6">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-12 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Map className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black">Explore Our Roadmap</h3>
                <p className="text-gray-500">See the interactive timeline of our past and future milestones.</p>
              </div>
            </div>
            <Link 
              to="/roadmap"
              className="px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              View Roadmap
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black mb-10 leading-[0.9]">
            Ready to Join the <br /> Sovereign Future?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth" className="px-10 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-200 transition-all flex items-center gap-2">
              Get Started Now
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="mailto:support@wersee.com?subject=Wersee%20sales" className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-20" />
    </div>
  );
};
