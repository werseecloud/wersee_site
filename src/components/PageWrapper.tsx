import React from 'react';
import { motion } from 'motion/react';

export const PageWrapper = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full h-full overflow-x-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};
