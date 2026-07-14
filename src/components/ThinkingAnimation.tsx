import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Brain, ListChecks, Loader2, 
  Target, BarChart3, Lightbulb, Combine, Flag,
  ChevronDown, ChevronUp
} from 'lucide-react';

export interface ReasoningStep {
  id: string;
  label: string;
  content: string;
  status: 'pending' | 'active' | 'completed';
  icon: React.ElementType;
}

interface ThinkingAnimationProps {
  steps: ReasoningStep[];
  isDark?: boolean;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ steps, isDark }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const activeStep = steps.find(s => s.status === 'active');
  const completedSteps = steps.filter(s => s.status === 'completed');
  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-2xl rounded-[2rem] rounded-tl-none border shadow-sm overflow-hidden transition-all ${
        isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-gray-50 border-black/5'
      }`}
    >
      {/* Header */}
      <div 
        className={`px-5 py-3 flex items-center justify-between cursor-pointer border-b ${
          isDark ? 'border-white/5' : 'border-black/5'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <Brain className={`w-4 h-4 ${activeStep ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Reasoning Process
            </span>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {activeStep ? activeStep.label : 'Thinking complete'}
              </h3>
              {activeStep && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden hidden sm:block">
            <motion.div 
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative pl-8">
                  {/* Line */}
                  {idx !== steps.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                      step.status === 'completed' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/5'
                    }`} />
                  )}
                  
                  {/* Icon/Dot */}
                  <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                    step.status === 'completed' ? 'bg-blue-500 text-white' :
                    step.status === 'active' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/50' :
                    'bg-gray-100 dark:bg-white/5 text-gray-400'
                  }`}>
                    {(() => {
                      const Icon = step.icon as any;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>

                  <div className="pt-1">
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      step.status === 'active' ? 'text-blue-500' : 
                      step.status === 'completed' ? (isDark ? 'text-gray-300' : 'text-gray-700') : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </h4>
                    
                    <AnimatePresence mode="wait">
                      {(step.status === 'active' || step.status === 'completed') && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-sm leading-relaxed ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {step.content || (step.status === 'active' ? 'Thinking...' : '')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
