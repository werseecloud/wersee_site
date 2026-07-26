import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { LogOut, ArrowRight, Home } from 'lucide-react';
import { SEO } from '../components/SEO';

export const LoggedOut: React.FC = () => {
  return (
    <>
    <SEO title="Uitgelogd" noIndex />
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center px-4 py-[calc(2rem+env(safe-area-inset-bottom))]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut className="w-10 h-10 text-indigo-300" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Je bent uitgelogd</h1>
          <p className="text-gray-400 text-lg">
            Je sessie is veilig afgesloten.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Opnieuw inloggen
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            to="/" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Naar home
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
};
