import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
      className={`bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}
    />
  );
};
