import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading...", 
  fullScreen = false 
}) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] bg-[#050505]/80 backdrop-blur-xl flex flex-col items-center justify-center"
    : "w-full py-20 flex flex-col items-center justify-center";

  return (
    <div className={containerClasses}>
      <motion.div
        animate={{ 
          scale: [0.95, 1.05, 0.95],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-gray-400 font-medium"
      >
        {message}
      </motion.p>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);
