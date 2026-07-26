import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Play, CheckCircle2, 
  BrainCircuit, Loader2, Sparkles, Trophy, BookOpen, Package
} from 'lucide-react';
import { Type, getGeminiClient } from '../../lib/geminiClient';
import ReactMarkdown from 'react-markdown';
import { WERSEE_COURSES, getCourseContent } from '../../data/wersee-courses';
import { ContentProtection } from './ContentProtection';
import { MobileCourseList } from './mobile/MobileCourseList';
import { MobileCoursePlayer } from './mobile/MobileCoursePlayer';

let aiClient = getGeminiClient();

const getAiClient = () => {
  return aiClient;
};

interface WerseeCoursePlayerProps {
  courseId: string;
  onBack: () => void;
}

export const WerseeCoursePlayer: React.FC<WerseeCoursePlayerProps> = ({ courseId, onBack }) => {
  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [aiContent, setAiContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'player'>('list');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeCourse = WERSEE_COURSES.find(c => c.id === courseId);

  const loadLesson = async (moduleIndex: number, phaseIndex: number) => {
    if (!activeCourse) return;
    
    setIsGenerating(true);
    setAiContent(null);
    setShowResults(false);
    setQuizAnswers([]);

    try {
      // First try to get pre-made content
      const preMadeContent = getCourseContent(courseId, moduleIndex, phaseIndex);
      
      if (preMadeContent) {
        setAiContent({
          lessonContent: preMadeContent.content,
          quiz: preMadeContent.quiz
        });
        setIsGenerating(false);
        return;
      }

      // Fallback to AI generation if no pre-made content exists
      const ai = getAiClient();
      if (!ai) {
        throw new Error("Gemini API key is missing");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a comprehensive lesson and a 3-question quiz for the course "${activeCourse.title}", specifically for Module ${moduleIndex + 1}, Phase ${phaseIndex + 1}. 
        The lesson should be highly practical, based on real-world strategies that actually work in business today. Avoid fluff. Give actionable advice.
        The quiz should test their understanding of the lesson.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lessonContent: { type: Type.STRING, description: "The educational content of the lesson in Markdown format." },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.INTEGER, description: "The index of the correct option (0-3)." }
                  },
                  required: ["question", "options", "correctAnswer"]
                }
              }
            },
            required: ["lessonContent", "quiz"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setAiContent(data);
    } catch (error) {
      console.error("Error generating AI lesson:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeCourse) {
      loadLesson(0, 0);
    }
  }, [courseId]);

  const handleLessonSelect = (moduleIndex: number, phaseIndex: number) => {
    setSelectedModule(moduleIndex);
    setSelectedPhase(phaseIndex);
    loadLesson(moduleIndex, phaseIndex);
    if (isMobile) {
      setMobileView('player');
    }
  };

  const toggleModule = (moduleIndex: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleIndex) 
        ? prev.filter(m => m !== moduleIndex)
        : [...prev, moduleIndex]
    );
  };

  const handleQuizSubmit = () => {
    setShowResults(true);
  };

  if (!activeCourse) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center">
          <Package className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-xl font-black tracking-tight">This has nothing in store</h3>
        <p className="text-gray-500 text-sm max-w-[200px]">Course not found or empty.</p>
        <button onClick={onBack} className="px-6 py-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all font-bold">
          Go Back
        </button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full bg-[#050505]">
        {mobileView === 'list' ? (
          <MobileCourseList 
            course={activeCourse}
            onSelectLesson={handleLessonSelect}
            selectedModule={selectedModule}
            selectedPhase={selectedPhase}
          />
        ) : (
          <MobileCoursePlayer 
            course={activeCourse}
            selectedModule={selectedModule}
            selectedPhase={selectedPhase}
            aiContent={aiContent}
            isGenerating={isGenerating}
            onBack={() => setMobileView('list')}
            onSelectLesson={handleLessonSelect}
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            showResults={showResults}
            handleQuizSubmit={handleQuizSubmit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
      {/* Header */}
      <header className="h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="h-10 w-[1px] bg-white/10 mx-1" />
          <div>
            <h1 className="font-black text-lg sm:text-xl tracking-tight truncate max-w-[200px] sm:max-w-md">
              {activeCourse.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-amber-500 uppercase tracking-[0.2em] font-black">
                Module {selectedModule + 1}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                Phase {selectedPhase + 1}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            </div>
            Wersee Academy
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 scroll-smooth relative z-10">
          <div className="max-w-4xl mx-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                   <div className="relative w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                   </div>
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-2">Preparing Lesson...</h2>
                <p className="text-gray-400 font-medium">Our AI is crafting your personalized study material.</p>
              </div>
            ) : aiContent ? (
              <ContentProtection contentId={`${courseId}-${selectedModule}-${selectedPhase}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-16 pb-40"
                >
                  {/* Lesson Content */}
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] p-8 sm:p-16 border border-white/5 shadow-2xl">
                      <div className="prose prose-invert max-w-none prose-headings:text-amber-500 prose-headings:font-black prose-headings:tracking-tighter prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-white prose-code:text-amber-400 prose-code:bg-amber-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{aiContent.lessonContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Section */}
                  <div className="relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-amber-500/20 z-20">
                      Knowledge Check
                    </div>
                    
                    <div className="bg-white/[0.02] backdrop-blur-sm rounded-[3rem] p-8 sm:p-16 border border-white/5 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                      
                      <div className="relative z-10 space-y-16">
                        {aiContent.quiz.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="space-y-8">
                            <div className="flex items-start gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xl font-black text-amber-500/50">
                                {qIdx + 1}
                              </div>
                              <h4 className="text-2xl font-black tracking-tight text-white pt-1">
                                {q.question}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-18">
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
                                    className={`group relative p-6 rounded-[1.5rem] border-2 text-left transition-all duration-300 ${
                                      showCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                                      showWrong ? 'bg-red-500/10 border-red-500 text-red-400' :
                                      isSelected ? 'bg-amber-500 border-amber-500 text-black shadow-2xl shadow-amber-500/40 scale-[1.02]' :
                                      'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                                        isSelected ? 'bg-black/20' : 'bg-white/10 group-hover:bg-white/20'
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </div>
                                      <span className="font-bold text-sm">{opt}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {!showResults ? (
                        <div className="relative z-10 pt-12">
                          <button 
                            onClick={handleQuizSubmit}
                            disabled={quizAnswers.length < aiContent.quiz.length}
                            className="w-full py-6 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-200 transition-all active:scale-[0.98] shadow-2xl shadow-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            Validate My Knowledge
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative z-10 mt-16 p-10 rounded-[2rem] bg-amber-500 text-black text-center shadow-2xl shadow-amber-500/20"
                        >
                          <div className="w-20 h-20 bg-black/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10" />
                          </div>
                          <h3 className="text-3xl font-black tracking-tighter mb-2">Module Mastery!</h3>
                          <p className="font-bold opacity-70 mb-8">
                            You achieved {quizAnswers.filter((a, i) => a === aiContent.quiz[i].correctAnswer).length} / {aiContent.quiz.length} correct answers.
                          </p>
                          <button 
                            onClick={() => {
                              let nextPhase = selectedPhase + 1;
                              let nextModule = selectedModule;
                              if (nextPhase > 6) {
                                nextPhase = 0;
                                nextModule = (selectedModule + 1) % 6;
                                if (!expandedModules.includes(nextModule)) {
                                  setExpandedModules(prev => [...prev, nextModule]);
                                }
                              }
                              handleLessonSelect(nextModule, nextPhase);
                            }}
                            className="px-12 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/80 transition-all active:scale-95"
                          >
                            Continue to Next Phase
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </ContentProtection>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
                <BookOpen className="w-16 h-16 mb-6" />
                <p className="text-xl font-bold">Select a lesson to begin your journey.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-96 bg-black/40 backdrop-blur-3xl border-l border-white/5 overflow-y-auto shrink-0 relative z-20 hidden lg:block">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-2xl tracking-tighter">Curriculum</h3>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {activeCourse.content.length} Modules
              </div>
            </div>
            
            <div className="space-y-6">
              {activeCourse.content.map((module, mIdx) => (
                <div key={mIdx} className="space-y-3">
                  <button 
                    onClick={() => toggleModule(mIdx)}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                        expandedModules.includes(mIdx) ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500 border border-white/10 group-hover:border-white/20'
                      }`}>
                        {mIdx + 1}
                      </div>
                      <span className={`font-black text-sm uppercase tracking-wider transition-colors ${
                        expandedModules.includes(mIdx) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                      }`}>{module.title}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform duration-500 ${expandedModules.includes(mIdx) ? '-rotate-90' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedModules.includes(mIdx) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-14 space-y-2 py-2">
                          {module.phases.map((phase, pIdx) => {
                            const isActive = selectedModule === mIdx && selectedPhase === pIdx;
                            const isCompleted = mIdx < selectedModule || (mIdx === selectedModule && pIdx < selectedPhase);
                            
                            return (
                              <button 
                                key={pIdx}
                                onClick={() => handleLessonSelect(mIdx, pIdx)}
                                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group/item ${
                                  isActive ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                              >
                                <div className="relative">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                      isActive ? 'border-amber-500 bg-amber-500/20' : 'border-white/10 group-hover/item:border-white/30'
                                    }`} />
                                  )}
                                  {isActive && (
                                    <motion.div 
                                      layoutId="active-dot"
                                      className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-bold tracking-tight">{phase.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
