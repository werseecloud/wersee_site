import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Globe, Users, DollarSign, Share2, CheckCircle2, TrendingUp, Heart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

import { appToast } from '@/lib/feedback';
export const CityCampaign = () => {
  const [stats, setStats] = useState({ views: 0, joins: 500, products_created: 1200 });
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Increment view count
        await supabase.rpc('increment_campaign_stat', {
          p_campaign_id: 'city_campaign',
          p_stat_type: 'views'
        });

        // Fetch current stats
        const { data, error } = await supabase
          .from('campaign_stats')
          .select('*')
          .eq('campaign_id', 'city_campaign')
          .single();

        if (data && !error) {
          setStats({
            views: data.views || 0,
            joins: Math.max(500, data.joins || 500), // Ensure it shows at least 500 as requested
            products_created: Math.max(1200, data.products_created || 1200)
          });
        }
      } catch (err) {
        console.error('Error fetching campaign stats:', err);
      }
    };

    fetchStats();
  }, []);

  const sharePage = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Earn with Wersee',
        text: 'Join Wersee and start earning today! The premium marketplace for creators.',
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      appToast('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      <SEO 
        title="Earn with Wersee - Global Creator Campaign" 
        description="Join Wersee and start earning today! The premium marketplace for creators worldwide."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-bold tracking-widest uppercase">Global Campaign • Creator Edition</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase"
          >
            Earn with <br />
            <span className="text-white/70">Wersee</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed"
          >
            The premium marketplace for digital creators, professionals, and visionaries. 
            Join the global community and start building your future today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth?mode=signup"
              onClick={() => {
                supabase.rpc('increment_campaign_stat', { p_campaign_id: 'city_campaign', p_stat_type: 'joins' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={sharePage}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-full font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>
          </motion.div>
        </div>
      </section>

      {/* The Story Behind Wersee */}
      <section className="py-32 px-4 relative overflow-hidden bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8">
              The Story <br />
              <span className="text-white/40">Behind Wersee</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We noticed a broken system. Creators were building immense value, but platforms were taking the lion's share. We decided to change the rules of the game.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center">
            <motion.div style={{ y: y1 }} className="space-y-12">
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Born from Frustration</h3>
                <p className="text-gray-400 leading-relaxed">
                  Wersee was built by creators, for creators. We experienced firsthand the high fees, delayed payouts, and lack of support on traditional platforms. We knew there had to be a better way to empower the people actually doing the work.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                <Target className="w-8 h-8 text-white mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">A New Standard</h3>
                <p className="text-gray-400 leading-relaxed">
                  Our mission is simple: provide the most premium, seamless, and rewarding ecosystem for digital commerce. We focus on design, speed, and putting more money directly into your pocket.
                </p>
              </div>
            </motion.div>

            <motion.div style={{ y: y2 }} className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" 
                alt="Creators collaborating" 
                className="w-full h-full object-cover grayscale opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-12 left-8 right-8">
                <p className="text-3xl font-black uppercase tracking-tight leading-tight">
                  "We're not just building a platform. We're building an economy."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Wersee? */}
      <section className="py-32 px-4 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Fast Payouts</h3>
              <p className="text-gray-400 leading-relaxed">
                Get paid instantly for your digital products and services. No more waiting weeks for your hard-earned money.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Secure Platform</h3>
              <p className="text-gray-400 leading-relaxed">
                Your data and transactions are protected by industry-leading security protocols. Focus on creating, we handle the rest.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Global Reach</h3>
              <p className="text-gray-400 leading-relaxed">
                Sell to anyone, anywhere. Our platform is optimized for international commerce and worldwide growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Community Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.01] -skew-y-3 origin-right" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">
                Built for <br />
                <span className="text-white/40">The World</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Wersee is a global ecosystem where creators from every continent can connect, collaborate, and scale their businesses without borders.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'Borderless Commerce', desc: 'Accept payments globally with automatic currency conversion and localized checkout.' },
                  { title: 'Worldwide Network', desc: 'Connect with top-tier professionals and creators from over 150 countries.' },
                  { title: '24/7 Global Support', desc: 'Our dedicated team is always online to help you succeed, no matter your timezone.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-lg">{item.title}</h4>
                      <p className="text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square md:aspect-video lg:aspect-square rounded-[40px] overflow-hidden border border-white/10 group"
            >
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?w=1000&q=80" 
                alt="Global Community" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="p-6 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Join the movement</p>
                    <p className="text-xl font-black uppercase tracking-tight">Over {stats.joins.toLocaleString()}+ creators joined this month</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <p className="text-sm font-bold text-gray-300">{stats.products_created.toLocaleString()} products launched globally this month</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-24 text-center"
          >
            3 Steps to <span className="text-white/40">Success</span>
          </motion.h2>

          <div className="space-y-24">
            {[
              {
                step: '01',
                title: 'Create an Account',
                description: 'Sign up in seconds. It\'s free and always will be. Join thousands of creators already on Wersee.',
                icon: Users
              },
              {
                step: '02',
                title: 'List Your Talent',
                description: 'Whether it\'s digital art, consulting, or physical goods, list them on our premium marketplace.',
                icon: Zap
              },
              {
                step: '03',
                title: 'Start Earning',
                description: 'Promote your profile, reach new customers, and watch your earnings grow with our optimized checkout.',
                icon: DollarSign
              }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="text-6xl md:text-8xl font-black text-white/10 leading-none">
                  {item.step}
                </div>
                <div className="flex-1 pt-2 md:pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <item.icon className="w-6 h-6 text-white" />
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{item.title}</h3>
                  </div>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Call to Action */}
      <section className="py-32 px-4 bg-white text-black">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] mb-12 uppercase"
          >
            Don't miss <br />
            <span className="text-black/40">The Future</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mb-16"
          >
            {[
              'Premium Experience',
              'Global Network',
              'Fast Growth',
              'Verified Sellers'
            ].map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-black uppercase tracking-widest text-sm">{tag}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/auth?mode=signup"
              onClick={() => {
                supabase.rpc('increment_campaign_stat', { p_campaign_id: 'city_campaign', p_stat_type: 'joins' });
              }}
              className="inline-flex px-12 py-6 bg-black text-white rounded-full font-black text-2xl hover:bg-gray-900 transition-all items-center gap-3 group"
            >
              Join Wersee Today
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-20 px-4 text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-black uppercase tracking-widest mb-6">Love Wersee?</h3>
          <p className="text-gray-400 mb-8">
            Share this page with your network and help build the global creator economy.
          </p>
          <button
            onClick={sharePage}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all font-bold"
          >
            <Share2 className="w-5 h-5" />
            Copy Share Link
          </button>
        </div>
      </section>
    </div>
  );
};

