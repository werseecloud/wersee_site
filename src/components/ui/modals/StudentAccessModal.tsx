import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, GraduationCap, BookOpen, Globe, BarChart3, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
}

export const StudentAccessModal = ({ isOpen, onClose, courseName }: StudentAccessModalProps) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleStartLearning = () => {
    onClose();
    navigate('/learn');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Header Image/Pattern */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-10 translate-y-1/2 p-4 rounded-3xl bg-white dark:bg-[#0A0A0A] shadow-lg border border-gray-100 dark:border-white/10">
              <GraduationCap className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="pt-16 pb-10 px-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                Access Granted: {courseName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Wersee for Students — Empowering your learning journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Free Access</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This course is provided free of charge as part of our student initiative.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Full Curriculum</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get access to all modules, exercises, and community discussions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleStartLearning}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Start Learning Now
              </button>
              <p className="text-center text-xs text-gray-500 dark:text-gray-500 uppercase tracking-widest font-bold">
                No credit card required • Student verified
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
