import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Shield, 
  Zap, 
  TrendingUp, 
  Link as LinkIcon, 
  ShoppingCart,
  Bot,
  ArrowRight,
  Sparkles,
  Command,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BotGuide: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Support Tickets",
      description: "A complete ticketing system directly in Discord. Create private channels for customers, let staff claim tickets, and keep everything in logs.",
      icon: MessageSquare,
      color: "blue",
      command: "/support setup"
    },
    {
      title: "Auto-Moderation",
      description: "Protect your server from spam, NSFW content, and raids. Our advanced filters help keep your community safe.",
      icon: Shield,
      color: "red",
      command: "/automod"
    },
    {
      title: "XP & Levels",
      description: "Reward active members with XP and automatic role rewards. Keep your server lively with a leaderboard.",
      icon: Zap,
      color: "amber",
      command: "/rank"
    },
    {
      title: "Marketplace Sync",
      description: "Show your newest Wersee products and live sales directly in your server. Sync roles for buyers.",
      icon: ShoppingCart,
      color: "emerald",
      command: "/marketplace"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>

      <main className="relative max-w-6xl mx-auto pt-32 pb-24 px-6">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-24">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>Powering Communities</span>
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tighter leading-none"
          >
            Wersee <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500">Bot Guide</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Everything you need to use the Wersee Bot. No complicated dev language, just the features that make your server better.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <a 
              href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 group"
            >
              Add Bot
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button 
              onClick={() => navigate('/support')}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Need Help?
            </button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${f.color}-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-${f.color}-500/10 transition-all`} />
              
              <div className={`w-14 h-14 bg-${f.color}-500/10 rounded-2xl flex items-center justify-center text-${f.color}-400 mb-6 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {f.description}
              </p>
              
              <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl">
                <Command className="w-4 h-4 text-gray-500" />
                <code className="text-sm font-mono text-indigo-400">{f.command}</code>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Setup Wizard Highlight */}
        <section className="bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/10 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3 mb-8">
              <Bot className="w-12 h-12" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">The Setup Wizard</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              When you add the bot, we send the server owner a DM with a helpful wizard. Your server is fully ready in 3 clicks.
            </p>
            
            <div className="flex flex-wrap justify-center gap-12 pt-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 font-bold">1</div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Link Account</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 font-bold">2</div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Setup Tickets</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 font-bold">3</div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Join Community</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ / Simple Tips */}
        <section className="mt-32 space-y-12">
          <h2 className="text-4xl font-black tracking-tighter text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-indigo-500/20 rounded text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">How do I link my account?</h4>
                  <p className="text-gray-400">Use `/link` in your Discord server. You will get a code to enter in your Wersee dashboard. Simple.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-indigo-500/20 rounded text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Is the bot free?</h4>
                  <p className="text-gray-400">Yes, core features like moderation, levels, and marketplace sync are completely free to use.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-indigo-500/20 rounded text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Can I customize the bot?</h4>
                  <p className="text-gray-400">With `/config`, you can choose which channels the bot posts in and which features are enabled.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 p-1 bg-indigo-500/20 rounded text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Why do I need to link?</h4>
                  <p className="text-gray-400">Linking lets us automatically assign roles to your buyers and show your stats in Discord.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="mt-40 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold uppercase tracking-[0.3em] text-xs">
            <Heart className="w-4 h-4 fill-current" />
            <span>Ready to go?</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Make your server stronger with Wersee.</h2>
          <div className="pt-4">
            <a 
              href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="px-12 py-5 bg-indigo-500 text-white rounded-[2rem] font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 inline-block"
            >
              Add Bot Now
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};
