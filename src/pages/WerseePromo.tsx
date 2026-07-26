import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Globe, Users, Share2, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const WerseePromo = () => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Wersee and Earn Easy!',
          text: 'Check out Wersee - the easiest way to earn and grow locally. Join me now!',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24 flex flex-col min-h-screen">
        {/* Header/Logo */}
        <header className="flex justify-center mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
              <Globe className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">Wersee</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col justify-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Exclusive Local Access</span>
            </div>
            
            <h1 className="text-[14vw] sm:text-6xl font-black leading-[0.85] tracking-tighter uppercase mb-6">
              Earn <span className="text-indigo-500">Easy</span><br />
              Grow <span className="text-emerald-500">Fast</span>
            </h1>
            
            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-[90%]">
              The future of local commerce is here. Join thousands of creators and businesses earning with Wersee every day.
            </p>

            <div className="flex flex-col gap-4">
              <Link 
                to="/auth?mode=signup"
                className="group relative flex items-center justify-center gap-3 bg-white text-black h-16 rounded-2xl font-black text-lg uppercase tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 h-16 rounded-2xl font-bold text-gray-300 hover:bg-white/10 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share with Friends
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 gap-6 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Instant Setup</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Create your digital presence in under 60 seconds. No complex tools, just results.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Earn Locally</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Connect with customers right in your neighborhood. Keep 100% of what you earn.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Community Driven</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Join a network of like-minded individuals supporting local growth.
            </p>
          </motion.div>
        </section>

        {/* Social Proof */}
        <section className="text-center mb-20">
          <div className="flex justify-center -space-x-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-[#050505] overflow-hidden bg-gray-800">
                <img 
                  src={`https://picsum.photos/seed/user${i}/100/100`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-[#050505] bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
              +2k
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Joined by <span className="text-white">2,400+</span> people in your area this week.
          </p>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-2xl shadow-indigo-500/20 text-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Ready to Earn?</h2>
            <p className="text-indigo-100/70 text-sm mb-8">
              Don't miss out on the local revolution. Your spot is waiting.
            </p>
            <Link 
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-tight hover:scale-105 transition-transform"
            >
              Join Wersee Free
            </Link>
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </section>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            &copy; 2026 Wersee Global • Local First
          </p>
        </footer>
      </div>
    </div>
  );
};
