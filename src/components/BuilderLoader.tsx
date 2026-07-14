import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface BuilderLoaderProps {
  onComplete: () => void;
  title?: string;
}

export const BuilderLoader = ({ onComplete, title = "Initializing Builder" }: BuilderLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay after 100% before unmounting
          return 100;
        }
        // Random increment for realistic feel
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
      <div className="w-full max-w-md px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-6 shadow-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
            A.
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{title}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Setting up your workspace...</p>
        </motion.div>

        <div className={`relative h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        
        <div className={`mt-4 flex justify-between text-xs font-medium font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>LOADING ASSETS</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
