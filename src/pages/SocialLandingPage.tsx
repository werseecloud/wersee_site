import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Instagram, 
  MessageSquare, 
  Twitter, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Zap, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
  </svg>
);

const sourceConfigs: Record<string, any> = {
  tiktok: {
    name: 'TikTok',
    icon: TikTokIcon,
    color: 'from-[#00f2ea] to-[#ff0050]',
    title: 'Welcome from TikTok!',
    description: 'Ready to turn your content into a business? Join the next generation of creators on Wersee.',
    cta: 'Start Creating',
    stats: ['10k+ Creators', 'Fast Payouts', 'Zero Fees']
  },
  discord: {
    name: 'Discord',
    icon: MessageSquare,
    color: 'from-[#5865F2] to-[#4752C4]',
    title: 'Welcome Discord Fam!',
    description: 'Take your community to the next level. Integrated chat, courses, and payments in one place.',
    cta: 'Build Your Community',
    stats: ['Smart Channels', 'Role Management', 'Live Events']
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
    title: 'Welcome from Instagram!',
    description: 'Your bio link just got an upgrade. Sell products, courses, and access with ease.',
    cta: 'Launch Your Store',
    stats: ['Visual Builder', 'Mobile First', 'Instant Setup']
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'from-[#1DA1F2] to-[#0C85D0]',
    title: 'Welcome from X!',
    description: 'Monetize your thoughts and expertise. The ultimate platform for knowledge creators.',
    cta: 'Get Started',
    stats: ['Global Reach', 'Secure Payments', 'AI Powered']
  },
  general: {
    name: 'Wersee',
    icon: Globe,
    color: 'from-blue-600 to-indigo-600',
    title: 'Welcome to Wersee',
    description: 'The all-in-one platform for the modern creator economy. Build, grow, and monetize.',
    cta: 'Join Now',
    stats: ['All-in-one', 'Secure', 'Scalable']
  }
};

export const SocialLandingPage: React.FC = () => {
  const { source } = useParams<{ source: string }>();
  const navigate = useNavigate();
  const config = sourceConfigs[source?.toLowerCase() || 'general'] || sourceConfigs.general;
  const Icon = config.icon;

  return (
    <div className="min-h-[100dvh] bg-black text-white selection:bg-white/20 overflow-x-hidden">
      {/* Background Glow */}
      <div className={`fixed inset-0 bg-gradient-to-br ${config.color} opacity-5 blur-[120px] pointer-events-none`} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-16"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter">WERSEE</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.color} bg-opacity-10 border border-white/10 mb-8`}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Special Invite</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[0.9]">
              {config.title}
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-lg leading-relaxed">
              {config.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/auth?mode=signup')}
                className="group relative px-8 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                {config.cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/5">
              {config.stats.map((stat: string, i: number) => (
                <div key={i}>
                  <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Feature</p>
                  <p className="text-lg font-bold text-white">{stat}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', damping: 20 }}
            className="relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-20 blur-[100px]`} />
            
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[40px] p-8 aspect-square flex flex-col justify-center overflow-hidden">
              {/* Floating Elements */}
              <div className="absolute top-10 right-10 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl animate-bounce">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="absolute bottom-20 left-10 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10">
                <Smartphone className="w-full h-full" />
              </div>

              <div className="relative z-10 text-center">
                <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-2xl`}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4">Start your journey</h3>
                <p className="text-gray-400">Join thousands of creators who are already building their future on Wersee.</p>
              </div>

              {/* Decorative Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-white/5 rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center border-t border-white/5 bg-black/50 backdrop-blur-xl">
        <p className="text-sm text-gray-500 font-medium">
          © 2026 Wersee. All rights reserved. Built for the future.
        </p>
      </div>
    </div>
  );
};
