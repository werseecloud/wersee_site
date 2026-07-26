import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface RadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className
}) => {
  return (
    <label className={cn("flex items-center cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)}>
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <motion.div
          animate={{
            borderColor: checked ? '#2563eb' : '#d1d5db',
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            "dark:border-gray-600"
          )}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-2.5 h-2.5 bg-blue-600 rounded-full"
            />
          )}
        </motion.div>
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};
