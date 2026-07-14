import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, MessageSquare, Shield, Zap, Calendar, Rocket, AlertCircle, CheckCircle2 } from 'lucide-react';

export const EarlyAccessView = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-black/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3" />
              Official Release
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
              Building the Future <br />
              <span className="text-white/70">Together.</span>
            </h1>
            <p className="text-lg text-white/80 font-medium max-w-xl">
              Wersee is now officially released. We're continuously refining every detail to ensure the best experience for our community.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <div className="flex items-center gap-2 px-5 py-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                <Calendar className="w-5 h-5 text-indigo-300" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Release Date</span>
                  <span className="text-sm font-black">May 12, 2026</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-2xl shadow-xl">
                <Rocket className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-black uppercase tracking-tight">V1.0 Live Now</span>
              </div>
            </div>
          </div>
          
          <div className="w-48 h-48 md:w-64 md:h-64 relative shrink-0">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full"
             />
             <div className="absolute inset-4 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                <div className="text-6xl font-black">W</div>
             </div>
          </div>
        </div>
      </div>

      {/* Sandbox & Discord Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Sandbox Environment</h3>
            <p className="text-gray-400 leading-relaxed">
              Stripe & Wersee Pay are currently running in <span className="text-indigo-400 font-bold">Sandbox Mode</span>. This allows you to test the entire payment flow without using real money.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-300/80 font-medium">
              Real transactions will be enabled once we transition to the full production system.
            </p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Limited Selling</h3>
            <p className="text-gray-400 leading-relaxed">
              Selling is <span className="text-emerald-400 font-bold">fully functional</span> but currently limited for testing purposes. You can list products, manage orders, and test payouts.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300/80 font-medium">
              Limits will be lifted for all verified businesses on launch day.
            </p>
          </div>
        </div>

        <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-24 h-24 text-[#5865F2]" />
          </div>
          <div className="w-12 h-12 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center border border-[#5865F2]/30">
            <MessageSquare className="w-6 h-6 text-[#5865F2]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Join Our Discord</h3>
            <p className="text-gray-400 leading-relaxed">
              Connect with other early access creators, share your feedback directly with the team, and get the latest updates.
            </p>
          </div>
          <a 
            href="https://discord.gg/GVCkJ4m8fK"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-[#5865F2]/20"
          >
            Join Discord Community
          </a>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white">Share Your Thoughts</h2>
            <p className="text-gray-400">Your feedback directly shapes the future of Wersee. Let us know what you think!</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">How would you rate Wersee?</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 transition-all hover:scale-110 active:scale-90 ${rating >= star ? 'text-yellow-500' : 'text-gray-700'}`}
                    >
                      <Star className={`w-10 h-10 ${rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Your Review</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What do you love? What can we improve?"
                  className="w-full bg-white/5 border border-white/5 rounded-[2rem] p-6 text-white placeholder:text-gray-600 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all min-h-[150px] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  rating > 0 
                    ? 'bg-white text-black hover:bg-gray-200 shadow-xl shadow-white/5' 
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Thank you for your feedback!</h3>
              <p className="text-gray-400">We've received your review and will use it to make Wersee even better.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
              >
                Submit another review
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
