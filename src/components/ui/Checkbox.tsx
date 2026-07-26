import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
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
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <motion.div
          animate={{
            backgroundColor: checked ? '#2563eb' : 'transparent',
            borderColor: checked ? '#2563eb' : '#d1d5db',
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            "dark:border-gray-600"
          )}
        >
          {checked && (
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
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
