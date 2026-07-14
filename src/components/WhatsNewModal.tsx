import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WhatsNewModalProps {
  context: 'store' | 'workspace';
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<{ id: string, title: string, content: string, version: string } | null>(null);

  useEffect(() => {
    const checkWhatsNew = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch active what's new for context
        const { data: whatsNewData, error: whatsNewError } = await supabase
          .from('whats_new')
          .select('*')
          .eq('context', context)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (whatsNewError || !whatsNewData) return;

        // Check if user has seen it
        const { data: viewData, error: viewError } = await supabase
          .from('user_whats_new_views')
          .select('*')
          .eq('user_id', user.id)
          .eq('whats_new_id', whatsNewData.id)
          .single();

        if (!viewData) {
          setContent(whatsNewData);
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Error checking whats new:', e);
      }
    };

    checkWhatsNew();
  }, [context]);

  const handleClose = async () => {
    setIsOpen(false);
    if (content) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_whats_new_views').insert({
            user_id: user.id,
            whats_new_id: content.id
          });
        }
      } catch (e) {
        console.error('Error recording view:', e);
      }
    }
  };

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="relative h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
              What's New
            </span>
            <span className="text-gray-500 text-sm font-medium">v{content.version}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">{content.title}</h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed">
              {content.content}
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleClose}
              className="w-full py-3.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Got it, thanks!
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
