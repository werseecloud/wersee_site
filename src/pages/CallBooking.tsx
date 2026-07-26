import React from 'react';
import { useParams } from 'react-router-dom';
import { CallScheduler } from '../components/CallScheduler';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export const CallBooking = () => {
  const { configId, username, businessSlug, configSlug } = useParams<{ 
    configId?: string; 
    username?: string; 
    businessSlug?: string; 
    configSlug?: string;
  }>();

  return (
    <div className="min-h-screen bg-[#050505] py-20 px-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap className="w-4 h-4" /> Powered by Wersee
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white"
          >
            Schedule Your Call
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CallScheduler 
            configId={configId} 
            username={username} 
            businessSlug={businessSlug} 
            configSlug={configSlug} 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-600 text-sm"
        >
          <p>© {new Date().getFullYear()} Wersee. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
};
