import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  listingId?: string;
  title?: string;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Scam or fraud',
  'Inappropriate content',
  'Harassment or bullying',
  'Intellectual property violation',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  listingId,
  title = 'Report'
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to report.');

      const { error: submitError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          listing_id: listingId,
          reason,
          description
        });

      if (submitError) throw submitError;

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
                  <p className="text-gray-400">Thank you for helping keep our community safe. We will review your report shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-white uppercase tracking-widest">
                      Reason for reporting
                    </label>
                    <div className="grid gap-2">
                      {REPORT_REASONS.map((r) => (
                        <label
                          key={r}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            reason === r
                              ? 'bg-red-500/10 border-red-500/50 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={reason === r}
                            onChange={(e) => setReason(e.target.value)}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            reason === r ? 'border-red-500' : 'border-gray-500'
                          }`}>
                            {reason === r && <div className="w-2 h-2 rounded-full bg-red-500" />}
                          </div>
                          <span className="text-sm font-medium">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-white uppercase tracking-widest">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide any additional context..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !reason}
                      className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
