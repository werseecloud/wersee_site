import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, CheckCircle2, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ContentProtection } from '../ContentProtection';

interface MobileCoursePlayerProps {
  course: any;
  selectedModule: number;
  selectedPhase: number;
  aiContent: any;
  isGenerating: boolean;
  onBack: () => void;
  onSelectLesson: (moduleIndex: number, phaseIndex: number) => void;
  quizAnswers: number[];
  setQuizAnswers: (answers: number[]) => void;
  showResults: boolean;
  handleQuizSubmit: () => void;
}

export const MobileCoursePlayer: React.FC<MobileCoursePlayerProps> = ({
  course,
  selectedModule,
  selectedPhase,
  aiContent,
  isGenerating,
  onBack,
  onSelectLesson,
  quizAnswers,
  setQuizAnswers,
  showResults,
  handleQuizSubmit
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeButton = scrollRef.current.querySelector(`[data-module="${selectedModule}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedModule]);

  const activeModule = course.content[selectedModule];
  const nextPhases = activeModule.phases.slice(selectedPhase + 1);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-[#050505] text-white overflow-hidden"
    >
      {/* Top Navigation Slider */}
      <div className="pt-12 pb-4 px-6 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-black text-lg tracking-tight truncate">{course.title}</h2>
        </div>

        <div 
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6"
        >
          {course.content.map((module: any, idx: number) => (
            <button
              key={idx}
              data-module={idx}
              onClick={() => onSelectLesson(idx, 0)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                selectedModule === idx 
                  ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' 
                  : 'bg-white/5 text-gray-500 border-white/5'
              }`}
            >
              Module {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">Preparing Lesson...</h3>
            <p className="text-gray-500 text-sm">Our AI is crafting your material.</p>
          </div>
        ) : aiContent ? (
          <ContentProtection contentId={`${course.id}-${selectedModule}-${selectedPhase}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Title & Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Phase {selectedPhase + 1}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{activeModule.title}</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight leading-tight">
                  {activeModule.phases[selectedPhase].title}
                </h1>
              </div>

              {/* Lesson Content */}
              <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-amber-500 prose-headings:font-black prose-p:text-gray-300 prose-strong:text-white">
                  <ReactMarkdown>{aiContent.lessonContent}</ReactMarkdown>
                </div>
              </div>

              {/* Quiz Section */}
              <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Knowledge Check</h2>
                </div>

                <div className="space-y-10">
                  {aiContent.quiz.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-4">
                      <h4 className="text-sm font-bold text-white leading-relaxed">
                        {qIdx + 1}. {q.question}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = quizAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;
                          const showCorrect = showResults && isCorrect;
                          const showWrong = showResults && isSelected && !isCorrect;

                          return (
                            <button
                              key={optIdx}
                              disabled={showResults}
                              onClick={() => {
                                const newAnswers = [...quizAnswers];
                                newAnswers[qIdx] = optIdx;
                                setQuizAnswers(newAnswers);
                              }}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all text-xs font-bold ${
                                showCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                                showWrong ? 'bg-red-500/10 border-red-500 text-red-400' :
                                isSelected ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' :
                                'bg-white/5 border-transparent'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {!showResults ? (
                  <button 
                    onClick={handleQuizSubmit}
                    disabled={quizAnswers.length < aiContent.quiz.length}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all disabled:opacity-20"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-500 text-black text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="text-lg font-black tracking-tight mb-1">Quiz Completed!</h3>
                    <p className="text-sm font-bold opacity-70 mb-6">
                      {quizAnswers.filter((a, i) => a === aiContent.quiz[i].correctAnswer).length} / {aiContent.quiz.length} Correct
                    </p>
                    <button 
                      onClick={() => {
                        let nextPhase = selectedPhase + 1;
                        let nextModule = selectedModule;
                        if (nextPhase >= activeModule.phases.length) {
                          nextPhase = 0;
                          nextModule = (selectedModule + 1) % course.content.length;
                        }
                        onSelectLesson(nextModule, nextPhase);
                      }}
                      className="w-full py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Next Phase
                    </button>
                  </div>
                )}
              </div>

              {/* Next Episodes */}
              {nextPhases.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Next Episodes</h3>
                  <div className="space-y-2">
                    {nextPhases.map((phase: any, idx: number) => (
                      <motion.button
                        key={idx}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (idx * 0.1) }}
                        onClick={() => onSelectLesson(selectedModule, selectedPhase + 1 + idx)}
                        className="w-full flex items-center gap-4 p-3 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/5 transition-all text-left"
                      >
                        <div className="w-20 h-12 rounded-xl bg-black/40 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                          {phase.thumbnail ? (
                            <img src={phase.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Play className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Phase {selectedPhase + 2 + idx}</p>
                          <h4 className="font-bold text-sm truncate">{phase.title}</h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-700" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </ContentProtection>
        ) : null}
      </div>
    </motion.div>
  );
};
