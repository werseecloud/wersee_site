import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Search, ArrowLeft, Ghost } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';

export const NotFound = () => {
  return (
    <PageWrapper>
      <SEO title="Page not found" noIndex />
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 relative inline-block"
          >
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Ghost className="w-16 h-16 text-white/20" />
            </div>
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-2 -right-2 bg-white text-black text-xs font-black px-3 py-1 rounded-full shadow-xl"
            >
              404
            </motion.div>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-black text-white mb-4 tracking-tighter"
          >
            Lost in the Wersee?
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mb-12 leading-relaxed"
          >
            The page you're looking for has drifted away or never existed. Let's get you back to familiar waters.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 gap-4"
          >
            <Link
              to="/"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/10"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            
            <div className="flex gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <Link
                to="/search"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95"
              >
                <Search className="w-4 h-4" />
                Search
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
              Wersee Business OS &copy; 2026
            </p>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};
