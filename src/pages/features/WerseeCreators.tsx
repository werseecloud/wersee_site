import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Video, DollarSign, Users, ArrowRight, Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { emptyPlatformStats, fetchPlatformStats } from '../../lib/platformStats';

export default function WerseeCreators() {
  const [stats, setStats] = useState(emptyPlatformStats);

  useEffect(() => {
    fetchPlatformStats()
      .then(setStats)
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('Could not load creator stats:', error);
      });
  }, []);

  const statCards = [
    { value: `US$ ${stats.earned.toLocaleString()}`, label: "Paid to Creators" },
    { value: stats.businesses.toLocaleString(), label: "Active Brands" },
    { value: "0%", label: "Fees on first $10k" },
    { value: "24/7", label: "Creator Support" }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30">
      <SEO 
        title="Wersee Creators - Get Paid to Create" 
        description="Join the ultimate creator network. Partner with top brands, monetize your content, and build your empire on Wersee."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold hover:bg-white/20 transition-all shadow-sm text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            The Creator Economy, Evolved
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 flex flex-col items-center gap-4"
          >
            <img 
              src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
              alt="Wersee Logo" 
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              Turn Your Influence <br />
              <span className="text-orange-400">
                Into Income.
              </span>
            </div>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Connect with premium brands, launch your own products, and get paid instantly. Wersee Creators is the all-in-one platform for the modern creator.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/features/academy-builder" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Brand Deals",
                desc: "Get matched with brands looking for your specific audience and aesthetic. Negotiate and get paid all in one place."
              },
              {
                icon: Video,
                title: "Content Monetization",
                desc: "Sell exclusive content, courses, and digital products directly to your fans with zero platform fees on your first $10k."
              },
              {
                icon: Users,
                title: "Community Building",
                desc: "Launch your own private community. Host live streams, Q&As, and build deeper connections with your top supporters."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-[#0A0A0A]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {statCards.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8"
              >
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-orange-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to own your audience?</h2>
          <p className="text-xl text-gray-400 mb-10">Stop renting your followers on other platforms. Build your business on Wersee and keep what you earn.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-colors gap-2">
            Start Creating <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
