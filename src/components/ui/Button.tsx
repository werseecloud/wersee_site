import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-none overflow-hidden";
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md focus:ring-blue-500 active:bg-blue-800 active:shadow-none",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-sm focus:ring-gray-500 active:bg-gray-300 active:shadow-none dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100 active:shadow-none dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700",
      danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500 active:bg-red-800 active:shadow-none",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 py-2 text-sm rounded-lg",
      lg: "h-12 px-6 text-base rounded-xl",
      icon: "h-10 w-10 rounded-lg",
    };

    const isActuallyDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isActuallyDisabled ? undefined : { scale: 0.95 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isActuallyDisabled}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </motion.span>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
