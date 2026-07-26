import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state: SaveState;
  idleLabel: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
}

export const SaveStateButton: React.FC<SaveStateButtonProps> = ({
  state,
  idleLabel,
  savingLabel = 'Saving…',
  savedLabel = 'Saved',
  errorLabel = 'Try again',
  className = '',
  disabled,
  ...props
}) => {
  const content = state === 'saving'
    ? { label: savingLabel, icon: <Loader2 className="h-4 w-4 animate-spin" /> }
    : state === 'saved'
      ? { label: savedLabel, icon: <Check className="h-4 w-4" /> }
      : state === 'error'
        ? { label: errorLabel, icon: <AlertCircle className="h-4 w-4" /> }
        : { label: idleLabel, icon: <Check className="h-4 w-4" /> };

  return (
    <motion.button
      type="submit"
      whileTap={{ scale: 0.97 }}
      animate={state === 'saved' ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      disabled={disabled || state === 'saving'}
      className={`relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        state === 'saved'
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          : state === 'error'
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
            : 'bg-white text-black hover:bg-gray-100'
      } ${className}`}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="inline-flex items-center gap-2"
        >
          {content.icon}
          {content.label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};
