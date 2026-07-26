import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PayoutScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
}

export const PayoutScheduleModal = ({ isOpen, onClose, onSave }: PayoutScheduleModalProps) => {
  const [selectedSchedule, setSelectedSchedule] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('finance-api', {
        body: { action: 'update-payout-schedule', interval: selectedSchedule },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving payout schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const schedules = [
    {
      id: 'daily',
      title: 'Daily',
      description: 'Receive payouts every day. Best for high volume sellers.',
      fee: 'Standard fees apply'
    },
    {
      id: 'weekly',
      title: 'Weekly',
      description: 'Receive payouts every Monday. Easier for accounting.',
      fee: 'No extra fees'
    },
    {
      id: 'monthly',
      title: 'Monthly',
      description: 'Receive payouts on the 1st of every month.',
      fee: 'No extra fees'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#141414] border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Payout Schedule</h2>
                <p className="text-gray-400 text-sm">Choose how often you want to receive your funds.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              {schedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => setSelectedSchedule(schedule.id as any)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all relative group ${
                    selectedSchedule === schedule.id
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-bold text-lg mb-1 ${selectedSchedule === schedule.id ? 'text-black' : 'text-white'}`}>
                        {schedule.title}
                      </h3>
                      <p className={`text-sm ${selectedSchedule === schedule.id ? 'text-gray-600' : 'text-gray-500'}`}>
                        {schedule.description}
                      </p>
                    </div>
                    {selectedSchedule === schedule.id && (
                      <div className="p-1 bg-black text-white rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02]">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Save Schedule
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
