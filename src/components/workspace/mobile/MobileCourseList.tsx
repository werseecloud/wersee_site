import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Play, CheckCircle2, ChevronDown, Package } from 'lucide-react';

interface MobileCourseListProps {
  course: any;
  onSelectLesson: (moduleIndex: number, phaseIndex: number) => void;
  selectedModule: number;
  selectedPhase: number;
}

export const MobileCourseList: React.FC<MobileCourseListProps> = ({ 
  course, 
  onSelectLesson,
  selectedModule,
  selectedPhase
}) => {
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-[#050505] text-white overflow-y-auto pb-32"
    >
      <div className="p-6 pt-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-3xl font-black tracking-tighter mb-2">{course.title}</h1>
          <p className="text-gray-500 text-sm font-medium mb-8">{course.description}</p>
        </motion.div>

        {(!course.content || course.content.length === 0) ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-black tracking-tight">This has nothing in store</h3>
            <p className="text-gray-500 text-sm max-w-[200px]">This course doesn't have any content yet. Check back later!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {course.content.map((module: any, mIdx: number) => (
              <motion.div 
                key={mIdx} 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: mIdx * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden"
              >
                <button 
                  onClick={() => toggleModule(mIdx)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                    {mIdx + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-sm uppercase tracking-wider">{module.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                      {module.phases.length} Phases
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedModules.includes(mIdx) ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedModules.includes(mIdx) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 space-y-2">
                      {module.phases.map((phase: any, pIdx: number) => {
                        const isActive = selectedModule === mIdx && selectedPhase === pIdx;
                        const isCompleted = mIdx < selectedModule || (mIdx === selectedModule && pIdx < selectedPhase);
                        
                        return (
                          <button 
                            key={pIdx}
                            onClick={() => onSelectLesson(mIdx, pIdx)}
                            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                              isActive ? 'bg-amber-500 text-black' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="relative w-20 h-12 rounded-xl bg-black/40 overflow-hidden shrink-0 border border-white/10">
                              {phase.thumbnail ? (
                                <img src={phase.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-500'}`} />
                                </div>
                              )}
                              {isCompleted && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`font-black text-[10px] uppercase tracking-widest mb-0.5 ${isActive ? 'text-black/60' : 'text-gray-500'}`}>
                                Phase {pIdx + 1}
                              </p>
                              <h4 className="font-bold text-sm truncate">{phase.title}</h4>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-black/40' : 'text-gray-700'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
