import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-20 rounded-full ${
              variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />

            <div className="flex justify-between items-start mb-6 relative">
              <div className={`p-3 rounded-2xl ${
                variant === 'danger' ? 'bg-red-500/10 text-red-500' : 
                variant === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 
                'bg-blue-500/10 text-blue-500'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative">
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex gap-4 relative">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  variant === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' :
                  variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' :
                  'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
