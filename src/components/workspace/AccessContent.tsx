import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Play, FileText, CheckCircle2, 
  Menu, X, Download, MessageSquare, Send,
  Award, Zap, Clock, BookOpen, Star, 
  ChevronRight, MoreVertical, Share2, Info,
  Trophy, Target, Flame, Paperclip, Smile, Maximize, Settings, Pause, Volume2, VolumeX, File, Users, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PdfViewer } from './PdfViewer';
import { VideoPlayer } from './VideoPlayer';
import { DigitalProductAccess } from './DigitalProductAccess';
import { VirtualItemAccess } from './VirtualItemAccess';
import { Asset3DAccess } from './Asset3DAccess';

import { appToast } from '@/lib/feedback';
interface AccessContentProps {
  listingId: string;
  onClose: () => void;
}

export const AccessContent: React.FC<AccessContentProps> = ({ listingId, onClose }) => {
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileView, setMobileView] = useState<'list' | 'player'>('list');
  const [progress, setProgress] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [points, setPoints] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDuration, setEditedDuration] = useState('');
  const [isSavingDuration, setIsSavingDuration] = useState(false);

  const handleSaveDuration = async () => {
    if (!listing || !activeLesson || !user) return;
    setIsSavingDuration(true);
    try {
      // Find the module and lesson to update
      let updatedModules = listing.metadata?.curriculum || listing.metadata?.modules || listing.metadata?.course?.modules || [];
      
      updatedModules = updatedModules.map((m: any) => ({
        ...m,
        lessons: m.lessons.map((l: any) => 
          l.id === activeLesson.id ? { ...l, duration: editedDuration } : l
        )
      }));

      const { error } = await supabase
        .from('listings')
        .update({
          metadata: {
            ...listing.metadata,
            curriculum: updatedModules
          }
        })
        .eq('id', listingId);

      if (error) throw error;
      
      setListing({
        ...listing,
        metadata: {
          ...listing.metadata,
          curriculum: updatedModules
        }
      });
      setActiveLesson({ ...activeLesson, duration: editedDuration });
      setIsEditMode(false);
    } catch (err) {
      console.error('Error saving duration:', err);
    } finally {
      setIsSavingDuration(false);
    }
  };

  const resolveUrl = React.useCallback((path: string | undefined, type: 'video' | 'file' | 'image') => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    
    let bucket = 'course-content';
    if (type === 'video') bucket = 'course-videos';
    if (type === 'file') bucket = 'digital-downloads';
    if (type === 'image') bucket = 'course-content';

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!listingId) return;

      try {
        let listingData = null;

        // Validate UUID format to prevent fetch errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(listingId)) {
          console.error('Invalid listing ID format:', listingId);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (error) throw error;
        listingData = data;

        if (!listingData) {
          setLoading(false);
          return;
        }
        
        // Access Control Check
        if (listingData.seller_id !== user?.id) {
          // Check if user has purchased the item directly
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('buyer_id', user?.id)
            .eq('listing_id', listingId)
            .maybeSingle();
          
          if (!order) {
            // Check if user has purchased a bundle containing this item
            const { data: bundleItems } = await supabase
              .from('bundle_items')
              .select('bundle_id')
              .eq('listing_id', listingId);
              
            let hasBundleAccess = false;
            
            if (bundleItems && bundleItems.length > 0) {
              const bundleIds = bundleItems.map(bi => bi.bundle_id);
              const { data: bundleOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('buyer_id', user?.id)
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
                  .eq('buyer_id', user?.id)
                  .in('listing_id', aaBundleIds)
                  .limit(1);
                  
                if (aaOrder && aaOrder.length > 0) {
                  hasBundleAccess = true;
                }
              }
            }
            
            if (!hasBundleAccess) {
              setListing({ ...listingData, noAccess: true });
              setLoading(false);
              return;
            }
          }
        }
        
        setListing(listingData);

        // Handle different listing types
        let firstLesson = null;
        const isCourse = listingData.category === 'course' || 
                         listingData.type === 'course' || 
                         listingData.metadata?.curriculum || 
                         listingData.metadata?.modules || 
                         listingData.metadata?.course?.modules;
        
        if (isCourse) {
          const modules = listingData.metadata?.curriculum || listingData.metadata?.modules || listingData.metadata?.course?.modules || [];
          if (modules?.[0]?.lessons?.[0]) {
            firstLesson = modules[0].lessons[0];
          }
        } else {
          // Digital product or virtual item
          const files = [];
          
          // Check for mainFileUrl from DigitalProductBuilder/ProductEditor
          if (listingData.metadata?.mainFileUrl) {
            files.push({
              id: 'main-file',
              title: 'Main Product File',
              type: 'pdf',
              file_url: listingData.metadata.mainFileUrl,
              duration: 'File'
            });
          }
          
          // Check for legacy files array
          if (listingData.metadata?.files && Array.isArray(listingData.metadata.files)) {
            files.push(...listingData.metadata.files.map((f: any) => ({ 
              ...f, 
              type: 'pdf', 
              duration: f.size || 'File' 
            })));
          }
          
          if (files.length > 0) {
            firstLesson = files[0];
          }
        }

        if (firstLesson) {
          if (!isMobile) {
            setActiveLesson(firstLesson);
          }
        }

        if (user) {
          const { data: progressData } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('listing_id', listingId)
            .single();

          if (progressData) {
            setProgress(progressData.completed_lessons || []);
            setPoints(progressData.points || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [listingId, user]);

  useEffect(() => {
    if (activeLesson && listingId) {
      // Resolve Media URL
      const url = activeLesson.videoUrl || activeLesson.video_url || activeLesson.file_url || activeLesson.url || activeLesson.content;
      const type = activeLesson.type === 'video' ? 'video' : 'file';
      setMediaUrl(resolveUrl(url, type));

      const fetchComments = async () => {
        const { data } = await supabase
          .from('lesson_comments')
          .select('*')
          .eq('listing_id', listingId)
          .eq('lesson_id', activeLesson.id)
          .order('created_at', { ascending: false });
        setComments(data || []);
      };
      fetchComments();
      
      // Reset video state when lesson changes
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [activeLesson, listingId, resolveUrl]);

  // Video Player Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleLessonCompletion = async (lessonId: string, bonusPoints: number = 0) => {
    if (!user) return;

    const isCompleted = progress.includes(lessonId);
    const newProgress = isCompleted 
      ? progress.filter(l => l !== lessonId)
      : [...progress, lessonId];
    
    const newPoints = isCompleted ? points - 10 : points + 10 + bonusPoints;

    setProgress(newProgress);
    setPoints(newPoints);

    try {
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          listing_id: listingId,
          completed_lessons: newProgress,
          points: newPoints,
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
          listing_id: listingId,
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

  const handleLessonSelect = (lesson: any) => {
    setActiveLesson(lesson);
    if (isMobile) {
      setMobileView('player');
      setSidebarOpen(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;

  if (listing?.noAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0A0A0A] text-white p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400 max-w-md mb-8">
          You don't have access to this product. Please purchase it to view the content.
        </p>
        <button 
          onClick={onClose}
          className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isVirtual = listing?.type === 'virtual' || listing?.category === 'Virtual Item';
  const isDigital = listing?.type === 'digital' || listing?.category === 'Digital Product';
  const isAsset3D = listing?.type === 'asset_3d' || listing?.category === '3D Assets';

  if (isAsset3D) {
    return <Asset3DAccess listing={listing} onClose={onClose} />;
  }

  if (isVirtual) {
    return <VirtualItemAccess listing={listing} onClose={onClose} />;
  }

  if (isDigital) {
    return <DigitalProductAccess listing={listing} onClose={onClose} />;
  }

  const isCourse = listing?.category === 'course' || 
                   listing?.type === 'course' || 
                   listing?.metadata?.curriculum || 
                   listing?.metadata?.modules || 
                   listing?.metadata?.course?.modules;
  
  let modules = [];
  if (isCourse) {
    modules = listing?.metadata?.curriculum || listing?.metadata?.modules || listing?.metadata?.course?.modules || [];
  } else {
    const files = [];
    if (listing?.metadata?.mainFileUrl) {
      files.push({
        id: 'main-file',
        title: 'Main Product File',
        type: 'pdf',
        file_url: listing.metadata.mainFileUrl,
        duration: 'File'
      });
    }
    if (listing?.metadata?.files && Array.isArray(listing.metadata.files)) {
      files.push(...listing.metadata.files.map((f: any) => ({ 
        ...f, 
        type: 'pdf', 
        duration: f.size || 'File' 
      })));
    }
    if (files.length > 0) {
      modules = [{ title: 'Files', lessons: files }];
    }
  }

  const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completionPercentage = totalLessons > 0 ? Math.round((progress.length / totalLessons) * 100) : 0;

  if (isMobile && mobileView === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full bg-[#050505] text-white overflow-y-auto pb-20"
      >
        <div className="p-6 space-y-8">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
          >
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-black text-lg tracking-tight">Curriculum</h2>
            <div className="w-9" /> {/* Spacer */}
          </motion.div>

          {modules.length === 0 ? (
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
            <>
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 rounded-3xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Course Progress</p>
                    <p className="text-xl font-black">{completionPercentage}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </motion.div>

              <div className="space-y-6">
                {modules.map((module: any, mIdx: number) => (
                  <motion.div 
                    key={mIdx} 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + (mIdx * 0.1) }}
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">
                      {module.title}
                    </h3>
                    <div className="grid gap-3">
                      {module.lessons?.map((lesson: any, lIdx: number) => (
                        <button
                          key={lIdx}
                          onClick={() => handleLessonSelect(lesson)}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-left active:scale-95 transition-all"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            progress.includes(lesson.id) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
                          }`}>
                            {progress.includes(lesson.id) ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{lesson.title || lesson.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{lesson.duration || 'Lesson'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex bg-[#0A0A0A] text-white overflow-hidden"
    >
      {/* Sidebar: Curriculum */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="border-r border-white/5 bg-[#141414] flex flex-col shrink-0 h-full fixed inset-y-0 left-0 z-[60] lg:relative lg:inset-auto w-[320px]"
          >
            {/* Sidebar Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-sm truncate">{listing?.title || 'Course Content'}</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-2xl text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Overview */}
            {totalLessons > 0 && (
              <div className="p-6 border-b border-white/5 bg-[#1A1A1A]/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Course Progress</span>
                    <span className="text-xs font-bold text-white mt-0.5">{progress.length} of {totalLessons} completed</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400">{completionPercentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {listingId === '7' && (
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
                <div key={module.id || mIdx} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {listing.type === 'digital' || listing.type === 'digital_product' ? 'Downloads' : `Module ${mIdx + 1}`}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-600">{module.lessons?.length || 0} Items</span>
                  </div>
                  <h4 className="font-bold text-white px-2 text-sm line-clamp-2">{module.title}</h4>
                  <div className="space-y-1">
                    {module.lessons?.map((lesson: any) => (
                      <button
                        key={lesson.id || lesson.url || Math.random()}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`w-full flex items-center gap-3 p-3 rounded-[1.25rem] transition-all group text-left ${
                          activeLesson?.id === lesson.id || activeLesson?.url === lesson.url
                            ? 'bg-white/10 text-white shadow-lg shadow-black/20 border border-white/5' 
                            : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className={`shrink-0 w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                          progress.includes(lesson.id) 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : (activeLesson?.id === lesson.id || activeLesson?.url === lesson.url) 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'bg-white/5 border-white/5 text-gray-600 group-hover:border-white/20'
                        }`}>
                          {progress.includes(lesson.id) ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-[10px] font-black">{mIdx + 1}.{lesson.index || ''}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{lesson.title || lesson.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {lesson.type === 'video' ? <Play className="w-3 h-3 text-gray-500" /> : <File className="w-3 h-3 text-gray-500" />}
                            <span className="text-[10px] text-gray-500">{lesson.duration || 'File'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0A0A0A]">
        {/* Top Bar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0A]/80 backdrop-blur-md z-30 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (isMobile) setMobileView('list');
                else setSidebarOpen(!sidebarOpen);
              }} 
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (isMobile) setMobileView('list');
                else onClose();
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-200">3 Day Streak</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-200">{points} XP</span>
              </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              {/* Lesson Header */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      activeLesson.type === 'video' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                    }`} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {activeLesson.type === 'pdf' ? 'Document' : activeLesson.type === 'video' ? 'Video Lesson' : 'Content'}
                    </span>
                  </div>
                  
                  {progress.includes(activeLesson.id) && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Completed</span>
                    </div>
                  )}

                  {activeLesson.duration && (
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeLesson.duration}</span>
                    </div>
                  )}

                  {listing?.seller_id === user?.id && activeLesson.type === 'video' && (
                    <button 
                      onClick={() => {
                        setIsEditMode(!isEditMode);
                        setEditedDuration(activeLesson.duration || '');
                      }}
                      className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-sm transition-all group"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-90 transition-transform" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Edit Duration</span>
                    </button>
                  )}
                </div>

                {isEditMode && (
                  <div className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={editedDuration}
                        onChange={(e) => setEditedDuration(e.target.value)}
                        placeholder="e.g. 10:30"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveDuration}
                        disabled={isSavingDuration}
                        className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {isSavingDuration ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditMode(false)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (videoRef.current && videoRef.current.duration) {
                            const mins = Math.floor(videoRef.current.duration / 60);
                            const secs = Math.floor(videoRef.current.duration % 60);
                            setEditedDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
                          } else {
                            appToast("Please play the video for a second to load metadata.");
                          }
                        }}
                        className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Auto
                      </button>
                    </div>
                  </div>
                )}

                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  {activeLesson.title || activeLesson.name}
                </h1>
              </div>

              {/* Video Player */}
              {activeLesson.type === 'video' && (
                <div className="w-full">
                  {mediaUrl ? (
                    <VideoPlayer src={mediaUrl} />
                  ) : (
                    <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative group flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-xl mx-auto">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                        <p className="text-white/60 font-medium">Video content not available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PDF Viewer */}
              {activeLesson.type === 'pdf' && (
                <div className="relative group">
                  {mediaUrl ? (
                    <PdfViewer url={mediaUrl} />
                  ) : (
                    <div className="h-[80vh] bg-[#141414] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-xl mx-auto">
                          <File className="w-8 h-8 text-white/50" />
                        </div>
                        <p className="text-white/60 font-medium">Document not available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              {activeLesson.content && (
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="bg-[#141414] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 leading-relaxed text-gray-300">
                    {activeLesson.content}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-white/5">
                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`flex-1 sm:flex-none px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                      progress.includes(activeLesson.id)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5'
                    }`}
                  >
                    {progress.includes(activeLesson.id) ? (
                      <><CheckCircle2 className="w-5 h-5" /> Completed</>
                    ) : (
                      <>Mark as Complete <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                  <button className="px-6 py-4 bg-[#141414] border border-white/5 text-white rounded-2xl font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2 group">
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 text-gray-400 hover:text-yellow-400"><Zap className="w-5 h-5" /></button>
                  <button className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 text-gray-400 hover:text-purple-400"><Award className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Discussion Section */}
              <div className="pt-12 border-t border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-indigo-400" /> 
                    Discussion
                  </h3>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 border border-white/5">{comments.length} Comments</span>
                </div>

                <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden mb-8">
                  <form onSubmit={handlePostComment} className="p-6">
                    <div className="flex gap-4">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <textarea 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ask a question or share your thoughts..."
                          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-600 resize-none min-h-[80px]"
                        />
                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                          <div className="flex gap-2">
                            <button type="button" className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"><Paperclip className="w-4 h-4" /></button>
                            <button type="button" className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"><Smile className="w-4 h-4" /></button>
                          </div>
                          <button 
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-6 py-2 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" /> Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-5 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <img src={comment.user_avatar} className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                      <div className="flex-1">
                        <div className="bg-[#141414] p-5 rounded-2xl rounded-tl-none border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm text-white">{comment.user_name}</h4>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        <div className="flex gap-4 mt-2 pl-2">
                          <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Reply</button>
                          <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Like</button>
                          <button className="ml-auto text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center h-full min-h-[60vh]">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse border border-white/10">
                <BookOpen className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to start learning?</h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
                Select a lesson from the curriculum sidebar on the left to begin your journey. Track your progress and earn XP as you go!
              </p>
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Open Curriculum
              </button>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};
