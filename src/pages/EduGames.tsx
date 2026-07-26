import React from 'react';
import { Helmet } from 'react-helmet-async';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { Gamepad2, Brain, Star, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EduGames = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      <Helmet>
        <title>Educational Games | Wersee Kids</title>
      </Helmet>
      
      <NavBar />
      
      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-purple-600 text-white mb-8 shadow-2xl shadow-purple-600/40">
              <Gamepad2 className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
              Learn & <span className="text-purple-500">Play</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Educational games designed to teach kids about entrepreneurship, money management, and creativity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Game 1 */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">My First Shop</h3>
              <p className="text-gray-400 mb-6">Learn the basics of running a store, setting prices, and helping customers.</p>
              <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                Play Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Game 2 */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Money Math</h3>
              <p className="text-gray-400 mb-6">Practice counting money, giving change, and understanding profit margins.</p>
              <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                Play Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Game 3 */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Creative Studio</h3>
              <p className="text-gray-400 mb-6">Design your own virtual products and see how people react to them.</p>
              <button className="w-full py-3 rounded-xl bg-yellow-600 text-white font-bold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2">
                Play Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Simple Store icon since it wasn't imported from lucide-react in the main import
const Store = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
);