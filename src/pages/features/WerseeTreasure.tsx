import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Gem, Gift, Trophy, Crown, ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export default function WerseeTreasure() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-yellow-500/30">
      <SEO 
        title="Wersee Treasure - Exclusive Rewards" 
        description="Unlock premium rewards, exclusive drops, and elite status on Wersee. The more you engage, the more you earn."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold hover:bg-white/20 transition-all shadow-sm text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-yellow-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium text-sm mb-8"
          >
            <Gem className="w-4 h-4" />
            The Ultimate Rewards Program
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 flex flex-col items-center gap-4"
          >
            <img 
              src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/d6c2d486-dde4-4447-8f0b-364a5e8d2f17-0.8917728164945703.png" 
              alt="Wersee Logo" 
              className="w-20 h-20 object-contain rounded-2xl shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div>
              Unlock the Vault. <br />
              <span className="text-amber-400">
                Claim Your Treasure.
              </span>
            </div>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Earn points for every purchase, sale, and interaction on Wersee. Redeem them for exclusive digital assets, premium features, and real-world perks.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-black rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
              Start Earning <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/features/academy-builder" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              View Rewards
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
                icon: Gift,
                title: "Exclusive Drops",
                desc: "Get early access to limited-edition digital products, courses, and physical merch from top Wersee creators."
              },
              {
                icon: Crown,
                title: "Elite Status",
                desc: "Level up your profile with exclusive badges, custom themes, and priority support. Show the world you're a top tier member."
              },
              {
                icon: Zap,
                title: "Instant Perks",
                desc: "Redeem your Treasure Points for instant discounts, free shipping, or even cash back on your Wersee wallet."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-[#0A0A0A]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">How to Earn Treasure</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">It's simple. Engage with the platform, grow your business, and get rewarded.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "Shop", label: "Earn points on every purchase" },
              { value: "Sell", label: "Bonus points for hitting sales milestones" },
              { value: "Learn", label: "Complete Academy courses for rewards" },
              { value: "Refer", label: "Invite friends and earn massive bonuses" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 rounded-3xl border border-white/10"
              >
                <div className="text-3xl font-black text-white mb-4">{stat.value}</div>
                <div className="text-yellow-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Your Treasure Awaits</h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands of users who are already earning rewards just for using Wersee.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-8 py-4 bg-yellow-500 text-black rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors gap-2">
            Claim Your First Reward <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
