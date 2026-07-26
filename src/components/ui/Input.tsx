import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="relative w-full mb-6">
        <motion.div
          animate={error ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="relative"
        >
          <input
            id={inputId}
            ref={ref}
            placeholder=" " // Required for peer-placeholder-shown
            className={cn(
              "peer block w-full px-4 pb-2 pt-6 text-sm text-gray-900 bg-transparent rounded-lg border-2 appearance-none focus:outline-none focus:ring-0 transition-colors duration-200",
              "dark:text-white",
              error 
                ? "border-red-500 focus:border-red-500" 
                : "border-gray-300 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-500",
              className
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute text-sm text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text pointer-events-none",
              error ? "text-red-500 peer-focus:text-red-500" : "peer-focus:text-blue-600 dark:peer-focus:text-blue-500"
            )}
          >
            {label}
          </label>
        </motion.div>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -bottom-5 left-1 text-xs text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
