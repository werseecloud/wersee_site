import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { LogOut, ArrowRight, Home } from 'lucide-react';
import { SEO } from '../components/SEO';

export const LoggedOut: React.FC = () => {
  return (
    <>
    <SEO title="Logged Out" noIndex />
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut className="w-10 h-10 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">You've been logged out</h1>
          <p className="text-gray-500 text-lg">
            Thanks for visiting. We hope to see you again soon!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Sign In Again
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
};
