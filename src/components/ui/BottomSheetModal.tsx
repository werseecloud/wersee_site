import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-2xl'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-[110] bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto w-full md:${maxWidth} max-h-[90vh] md:max-h-[85vh] bg-[#141414] border-t md:border border-white/10 rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
          >
            <div className="md:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            
            {title && (
              <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white text-lg md:text-xl">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {!title && (
                <button 
                  onClick={onClose} 
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 text-gray-400 hover:text-white transition-colors md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
