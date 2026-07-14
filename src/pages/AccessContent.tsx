import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, FileText, CheckCircle2, 
  Menu, X, Download, MessageSquare, Send,
  Award, Zap, Clock, BookOpen, Star, 
  ChevronRight, MoreVertical, Share2, Info,
  Trophy, Target, Flame, Sparkles, PartyPopper,
  Maximize2, Minimize2, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PageWrapper } from '../components/PageWrapper';
import { PdfViewer } from '../components/workspace/PdfViewer';

import { appToast } from '@/lib/feedback';
export const AccessContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progress, setProgress] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'discussion' | 'notes'>('content');
  const [notes, setNotes] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [newComment, setNewComment] = useState('');
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalXp, setTotalXp] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  // Calculate XP needed for next level (simple curve)
  const xpForNextLevel = level * 1000;
  const xpProgress = (totalXp / xpForNextLevel) * 100;

  // Sound effect for completion
  const playSuccessSound = () => {
    try {
      const audio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {}); // Ignore auto-play errors
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let listingData = null;

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        listingData = data;

        setListing(listingData);

        // Access Control Check
        if (!user) {
          navigate(`/listing/${id}`, { state: { error: "You need to be logged in to access this content." } });
          return;
        }

        if (listingData.seller_id !== user.id) {
          // Check if user has purchased the item directly
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('buyer_id', user.id)
            .eq('listing_id', id)
            .maybeSingle();
          
          if (!order) {
            // Check if user has purchased a bundle containing this item
            const { data: bundleItems } = await supabase
              .from('bundle_items')
              .select('bundle_id')
              .eq('listing_id', id);
              
            let hasBundleAccess = false;
            
            if (bundleItems && bundleItems.length > 0) {
              const bundleIds = bundleItems.map(bi => bi.bundle_id);
              const { data: bundleOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('buyer_id', user.id)
                .in('listing_id', bundleIds)
                .limit(1);
                
              if (bundleOrder && bundleOrder.length > 0) {
                hasBundleAccess = true;
              }
            }
            
            // Check for all-access pass
            if (!hasBundleAccess && listingData.seller_id && listingData.category) {
              const { data: allAccessBundles } = await supabase
                .from('listings')
                .select('id')
                .eq('seller_id', listingData.seller_id)
                .eq('type', 'bundle')
                .contains('metadata', { is_all_access: true, all_access_category: listingData.category });
                
              if (allAccessBundles && allAccessBundles.length > 0) {
                const aaBundleIds = allAccessBundles.map(b => b.id);
                const { data: aaOrder } = await supabase
                  .from('orders')
                  .select('id')
                  .eq('buyer_id', user.id)
                  .in('listing_id', aaBundleIds)
                  .limit(1);
                  
                if (aaOrder && aaOrder.length > 0) {
                  hasBundleAccess = true;
                }
              }
            }
            
            if (!hasBundleAccess) {
              navigate(`/listing/${id}`, { state: { error: "You don't have access. Please purchase this product to view the content." } });
              return;
            }
          }
        }

        if (listingData) {
          // Redirect to dashboard with access view
          navigate(`/dashboard?view=access_${id}`);
          return;
        }

        if (user) {
          const { data: progressData } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('listing_id', id)
            .single();

          if (progressData) {
            setProgress(progressData.completed_lessons || []);
            setPoints(progressData.points || 0);
            
            // Handle Streak Logic
            const today = new Date().toISOString().split('T')[0];
            let currentStreak = progressData.current_streak || 0;
            const lastAccessDate = progressData.last_streak_date;

            if (lastAccessDate !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];

              if (lastAccessDate === yesterdayStr) {
                // Consecutive day
                currentStreak += 1;
              } else {
                // Streak broken
                currentStreak = 1;
              }

              // Update streak in DB
              await supabase
                .from('course_progress')
                .update({ 
                  current_streak: currentStreak,
                  last_streak_date: today,
                  longest_streak: Math.max(currentStreak, progressData.longest_streak || 0)
                })
                .eq('id', progressData.id);
            }

            setStreak(currentStreak);
            setLevel(progressData.level || 1);
            setTotalXp(progressData.total_xp || 0);
          } else {
             // Initialize progress
             const today = new Date().toISOString().split('T')[0];
             const { data: newProgress } = await supabase
               .from('course_progress')
               .insert({
                 user_id: user.id,
                 listing_id: id,
                 current_streak: 1,
                 last_streak_date: today,
                 level: 1,
                 total_xp: 0,
                 points: 0
               })
               .select()
               .single();
               
             if (newProgress) {
               setStreak(1);
               setLevel(1);
               setTotalXp(0);
             }
          }
        }
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user]);

  useEffect(() => {
    if (activeLesson && id) {
      setQuizAnswer(null); // Reset quiz when lesson changes
      const fetchComments = async () => {
        const { data } = await supabase
          .from('lesson_comments')
          .select('*')
          .eq('listing_id', id)
          .eq('lesson_id', activeLesson.id)
          .order('created_at', { ascending: false });
        setComments(data || []);
      };
      fetchComments();
    }
  }, [activeLesson, id]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const toggleLessonCompletion = async (lessonId: string, bonusPoints: number = 0) => {
    if (!user) return;

    const isCompleted = progress.includes(lessonId);
    
    if (!isCompleted) {
      triggerConfetti();
      playSuccessSound();
      setEarnedXp(50 + (bonusPoints * 5));
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }

    const newProgress = isCompleted 
      ? progress.filter(l => l !== lessonId)
      : [...progress, lessonId];
    
    const newPoints = isCompleted ? points - 10 : points + 10 + bonusPoints;
    
    // Calculate new XP and Level
    let newTotalXp = isCompleted ? totalXp - 50 : totalXp + 50 + (bonusPoints * 5);
    if (newTotalXp < 0) newTotalXp = 0;
    
    let newLevel = level;
    let nextLevelXp = newLevel * 1000;
    
    // Level up logic
    while (newTotalXp >= nextLevelXp) {
      newLevel++;
      nextLevelXp = newLevel * 1000;
      // Could add level up celebration here too
    }
    
    // Level down logic (if they uncomplete lessons)
    while (newLevel > 1 && newTotalXp < (newLevel - 1) * 1000) {
      newLevel--;
    }

    setProgress(newProgress);
    setPoints(newPoints);
    setTotalXp(newTotalXp);
    setLevel(newLevel);

    try {
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          listing_id: id,
          completed_lessons: newProgress,
          points: newPoints,
          total_xp: newTotalXp,
          level: newLevel,
          last_accessed: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lesson_comments')
        .insert({
          listing_id: id,
          lesson_id: activeLesson.id,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonymous',
          user_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          content: newComment
        })
        .select()
        .single();

      if (error) throw error;
      setComments([data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  // Load notes from localStorage when activeLesson changes
  useEffect(() => {
    if (activeLesson) {
      const savedNotes = localStorage.getItem(`notes_${activeLesson.id}`);
      setNotes(savedNotes || '');
    }
  }, [activeLesson]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  const modules = listing.metadata?.modules || listing.metadata?.course?.modules || [];
  const totalLessons = modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0) || 0;
  const completionPercentage = Math.round((progress.length / totalLessons) * 100) || 0;

  // Save notes to localStorage
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (activeLesson) {
      localStorage.setItem(`notes_${activeLesson.id}`, newNotes);
    }
  };

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    if (!activeLesson || !modules.length) return;
    
    // Flatten lessons list to find current index
    const allLessons: any[] = [];
    modules.forEach((m: any) => allLessons.push(...m.lessons));
    
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex === -1) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      setActiveLesson(allLessons[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentIndex + 1]);
    }
  };

  const getModuleProgress = (moduleLessons: any[]) => {
    if (!moduleLessons.length) return 0;
    const completed = moduleLessons.filter((l: any) => progress.includes(l.id)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  // ... (existing render logic)

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col font-sans relative overflow-hidden">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div 
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-4 relative z-10 max-w-sm mx-4"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-bold text-[#1D1D1F]">Lesson Complete!</h2>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                <Sparkles className="w-5 h-5" />
                <span>+{earnedXp} XP Earned</span>
              </div>
              <p className="text-gray-500">Keep up the great momentum!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Navigation - Modified to include Focus Mode toggle if needed, but keeping existing for now */}
      <header className="h-16 border-b border-black/5 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl shrink-0 sticky top-0 z-50">
        {/* ... (Header content) ... */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-100 mx-2" />
          <div>
            <h1 className="font-bold text-sm text-[#1D1D1F] line-clamp-1">{listing?.title}</h1>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{completionPercentage}% Complete</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full cursor-default"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Flame className="w-4 h-4" />
              </motion.div>
              <span className="text-xs font-bold">{streak} Day Streak</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full cursor-default"
            >
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold">{points} Points</span>
            </motion.div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-all"><Share2 className="w-5 h-5 text-gray-400" /></button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="hidden lg:block p-2 hover:bg-gray-100 rounded-xl transition-all"
            title={sidebarOpen ? "Focus Mode" : "Show Sidebar"}
          >
            {sidebarOpen ? <Maximize2 className="w-5 h-5 text-gray-400" /> : <Minimize2 className="w-5 h-5 text-gray-400" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Curriculum */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 border-r border-black/5 bg-white overflow-y-auto shrink-0 fixed inset-y-16 left-0 z-40 lg:relative lg:inset-y-0"
            >
              <div className="p-6 space-y-6">
                {id === '7' && (
                  <div className="mb-6">
                    <button 
                      onClick={() => appToast('Community feature coming soon!')}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-sm">Wersee Community</h3>
                          <p className="text-[10px] text-blue-100 uppercase tracking-widest">Join the discussion</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                )}
                {modules.map((module: any, mIdx: number) => (
                  <div key={module.id} className="space-y-4">
                    <button 
                      onClick={() => toggleModule(mIdx)}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="text-left flex-1 pr-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module {mIdx + 1}</h3>
                          <span className="text-[10px] font-bold text-gray-400">{getModuleProgress(module.lessons)}%</span>
                        </div>
                        <h4 className="font-bold text-[#1D1D1F] text-sm group-hover:text-blue-600 transition-colors mb-2">{module.title}</h4>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <motion.div 
                            className="h-full bg-blue-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${getModuleProgress(module.lessons)}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedModules.includes(mIdx) ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedModules.includes(mIdx) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          {module.lessons.map((lesson: any) => (
                            <motion.button
                              key={lesson.id}
                              onClick={() => setActiveLesson(lesson)}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                                activeLesson?.id === lesson.id 
                                  ? 'bg-black text-white shadow-xl shadow-black/10' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                progress.includes(lesson.id) 
                                  ? 'bg-emerald-500 border-emerald-500' 
                                  : activeLesson?.id === lesson.id ? 'border-white/30' : 'border-gray-200'
                              }`}>
                                {progress.includes(lesson.id) ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <div className={`w-1.5 h-1.5 rounded-full ${activeLesson?.id === lesson.id ? 'bg-white' : 'bg-gray-200'}`} />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold truncate">{lesson.title}</p>
                                <p className={`text-[10px] font-medium ${activeLesson?.id === lesson.id ? 'text-white/60' : 'text-gray-400'}`}>
                                  {lesson.type === 'video' ? <Play className="w-2.5 h-2.5 inline mr-1" /> : <FileText className="w-2.5 h-2.5 inline mr-1" />}
                                  {lesson.duration || '10:00'}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth">
          {activeLesson ? (
            <div className="max-w-5xl mx-auto px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
              {/* Content Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {activeLesson.type} Lesson
                    </span>
                    {progress.includes(activeLesson.id) && (
                      <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigateLesson('prev')}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                      disabled={!modules.some((m: any) => m.lessons[0].id === activeLesson.id) && false /* Simplify logic for demo */}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => navigateLesson('next')}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight leading-tight">{activeLesson.title}</h2>
              </div>

              {/* Video Player / Content Display */}
              <div className="space-y-8">
                {activeLesson.type === 'video' && (
                  <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 border-4 border-white ring-1 ring-black/5 relative group">
                    {(activeLesson.videoUrl || activeLesson.content) ? (
                      <video
                        src={activeLesson.videoUrl || (typeof activeLesson.content === 'string' && activeLesson.content.startsWith('http') ? activeLesson.content : supabase.storage.from('course-videos').getPublicUrl(activeLesson.content || '').data.publicUrl)}
                        controls
                        className="w-full h-full object-cover"
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-zinc-900">
                        <div className="text-center">
                          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="font-medium opacity-70">Video content not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson.type === 'pdf' && activeLesson.content && (
                   <div className="h-[80vh] rounded-[2.5rem] overflow-hidden border border-black/5 shadow-2xl">
                     <PdfViewer url={activeLesson.content} />
                   </div>
                )}

                {/* Tabs Navigation */}
                <div className="border-b border-gray-100">
                  <div className="flex gap-8">
                    {['content', 'discussion', 'notes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                          activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {tab}
                        {activeTab === tab && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'content' && (
                      <motion.div 
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeLesson.type !== 'pdf' && (
                          <div className="prose prose-lg prose-neutral max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                            {activeLesson.type === 'text' ? (activeLesson.content || "No content available.") : (activeLesson.description || activeLesson.title)}
                          </div>
                        )}
                        
                        {/* Quiz Section */}
                        {activeLesson.type === 'video' && !progress.includes(activeLesson.id) && (
                          <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-3 text-blue-600">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Target className="w-5 h-5" />
                              </div>
                              <h3 className="text-xl font-bold">Quick Knowledge Check</h3>
                            </div>
                            <p className="text-blue-900 font-medium text-lg">What is the primary goal of this lesson?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {['To understand the basics', 'To master advanced techniques', 'To learn about history', 'To skip to the end'].map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setQuizAnswer(idx)}
                                  className={`p-4 rounded-2xl text-left font-medium transition-all border-2 ${
                                    quizAnswer === idx 
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                                      : 'bg-white text-blue-900 border-transparent hover:border-blue-200'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            <AnimatePresence>
                              {quizAnswer !== null && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="pt-4"
                                >
                                  <button 
                                    onClick={() => toggleLessonCompletion(activeLesson.id, 50)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" /> Submit Answer & Complete Lesson
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Lesson Actions */}
                        <div className="flex flex-wrap gap-4 items-center justify-between pt-12 border-t border-black/5 mt-12">
                          <div className="flex gap-4">
                            <motion.button 
                              onClick={() => toggleLessonCompletion(activeLesson.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                                progress.includes(activeLesson.id)
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-black text-white hover:bg-gray-800 shadow-xl shadow-black/10'
                              }`}
                            >
                              {progress.includes(activeLesson.id) ? (
                                <><CheckCircle2 className="w-5 h-5" /> Completed</>
                              ) : (
                                'Complete & Continue'
                              )}
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-6 py-4 bg-white border border-black/5 text-[#1D1D1F] rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                            >
                              <Download className="w-5 h-5" /> Resources
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'discussion' && (
                      <motion.div 
                        key="discussion"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-[#1D1D1F]">
                            Lesson Discussion
                          </h3>
                          <span className="text-sm font-bold text-gray-400">{comments.length} Comments</span>
                        </div>

                        <form onSubmit={handlePostComment} className="flex gap-4 items-start">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl bg-gray-100" />
                          <div className="flex-1 space-y-3">
                            <textarea 
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Ask a question or share your thoughts..."
                              className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 rounded-2xl outline-none transition-all min-h-[100px] resize-none"
                            />
                            <div className="flex justify-end">
                              <button className="px-6 py-2 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all">
                                <Send className="w-3 h-3" /> Post
                              </button>
                            </div>
                          </div>
                        </form>

                        <div className="space-y-6">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 group">
                              <img src={comment.user_avatar} referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl bg-gray-100" />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-sm">{comment.user_name}</h4>
                                  <span className="text-[10px] font-bold text-gray-300 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                                <div className="flex gap-4 pt-1">
                                  <button className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest">Reply</button>
                                  <button className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest">Like</button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {comments.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p>No comments yet. Be the first to start the discussion!</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'notes' && (
                      <motion.div 
                        key="notes"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="bg-yellow-50 border border-yellow-100 rounded-[2rem] p-8 space-y-4">
                          <div className="flex items-center gap-3 text-yellow-700">
                            <FileText className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Your Personal Notes</h3>
                          </div>
                          <p className="text-sm text-yellow-600/80">
                            These notes are private and saved automatically to your browser.
                          </p>
                          <textarea 
                            value={notes}
                            onChange={handleNoteChange}
                            placeholder="Type your notes here..."
                            className="w-full h-[400px] p-6 bg-white/50 border border-yellow-200/50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-yellow-200/50 transition-all resize-none font-mono text-sm leading-relaxed text-gray-700"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              {/* ... (Empty state remains same) ... */}
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4">Ready to start?</h2>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Select a lesson from the curriculum sidebar to begin your learning journey.
              </p>
            </div>
          )}
        </main>


        {/* Right Sidebar: Stats & Gamification (Desktop Only) */}
        <aside className="hidden xl:block w-80 border-l border-black/5 bg-white p-8 space-y-8 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Your Progress</h3>
            <div className="p-6 bg-[#FBFBFD] rounded-[2rem] border border-black/5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Level</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span>XP to Level {level + 1}</span>
                  <span>{totalXp}/{xpForNextLevel}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg">Leaderboard</h3>
            <div className="space-y-4">
              {[
                { name: 'Alex M.', points: 2450, avatar: '1' },
                { name: 'Sarah K.', points: 2100, avatar: '2' },
                { name: 'You', points: points, avatar: user?.id, isMe: true },
                { name: 'John D.', points: 1850, avatar: '3' }
              ].sort((a, b) => b.points - a.points).map((player, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${player.isMe ? 'bg-black text-white shadow-xl' : 'hover:bg-gray-50'}`}>
                  <span className={`text-xs font-bold w-4 ${player.isMe ? 'text-white/40' : 'text-gray-300'}`}>{i + 1}</span>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} referrerPolicy="no-referrer" className="w-8 h-8 rounded-xl bg-gray-100" />
                  <span className="text-xs font-bold flex-1 truncate">{player.name}</span>
                  <span className={`text-[10px] font-bold ${player.isMe ? 'text-white/60' : 'text-gray-400'}`}>{player.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-900 text-sm">Course Certificate</h4>
              <p className="text-[10px] text-emerald-700 leading-relaxed">
                Complete all lessons to unlock your official certificate of completion.
              </p>
            </div>
            <motion.button 
              disabled={completionPercentage < 100}
              onClick={() => appToast("Certificate claimed! (This would generate a PDF in a real app)")}
              whileHover={completionPercentage >= 100 ? { scale: 1.05 } : {}}
              whileTap={completionPercentage >= 100 ? { scale: 0.95 } : {}}
              animate={completionPercentage >= 100 ? { 
                boxShadow: ["0px 0px 0px rgba(16, 185, 129, 0)", "0px 0px 20px rgba(16, 185, 129, 0.5)", "0px 0px 0px rgba(16, 185, 129, 0)"],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              Claim Certificate
            </motion.button>
          </div>
        </aside>
      </div>
    </div>
  );
};
