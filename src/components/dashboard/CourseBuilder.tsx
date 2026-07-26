import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, 
  Video, FileText, Link as LinkIcon, Save, X, 
  Layout, Palette, Type, MousePointer2, Settings,
  Eye, Monitor, Smartphone, CheckCircle2, Music, 
  FileDown, Calendar, Zap, BarChart3, Users, 
  MessageSquare, Award, Play, Clock, Sparkles,
  Search, Filter, MoreVertical, Copy, Layers, BookOpen, Moon, Sun,
  UserCheck, ArrowLeft
} from 'lucide-react';
import { BuilderLoader } from '../BuilderLoader';
import { FileUpload } from '../FileUpload';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

import { appToast } from '@/lib/feedback';
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'link' | 'audio' | 'pdf' | 'quiz';
  content: string;
  videoUrl?: string;
  duration?: string;
  isFreePreview?: boolean;
  resources?: { name: string, url: string }[];
  quiz?: { question: string, options: string[], correctAnswer: number }[];
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  dripDays?: number;
}

export const CourseBuilder = ({ initialData, onSave, onCancel, listingId }: { initialData?: any, onSave: (data: any) => void, onCancel: () => void, listingId?: string }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'settings' | 'analytics'>('content');
  const [modules, setModules] = useState<Module[]>(initialData?.modules || [
    { id: '1', title: 'Introduction', lessons: [{ id: '1-1', title: 'Welcome to the course', type: 'text', content: '', duration: '5:00' }] }
  ]);
  const [design, setDesign] = useState(initialData?.design || {
    primaryColor: '#000000',
    accentColor: '#F27D26',
    buttonText: 'Start Learning',
    layout: 'sidebar',
    font: 'sans',
    theme: 'light',
    borderRadius: 'xl'
  });
  const [selectedLesson, setSelectedLesson] = useState<{ mId: string, lId: string } | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [showMobileCurriculum, setShowMobileCurriculum] = useState(false);
  const [insights, setInsights] = useState({
    revenue: 0,
    students: 0,
    completion: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (listingId) {
        // Fetch real insights
        const { data: orders } = await supabase
          .from('orders')
          .select('amount, user_id')
          .eq('listing_id', listingId);
        
        if (orders) {
          const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
          const uniqueStudents = new Set(orders.map(o => o.user_id)).size;
          setInsights({
            revenue: totalRevenue,
            students: uniqueStudents,
            completion: 68 // Mock completion for now as it requires complex tracking
          });

          // Fetch real users for top bar
          const userIds = orders.slice(0, 5).map(o => o.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('avatar_url, name')
            .in('id', userIds);
          
          if (profiles) setActiveUsers(profiles);
        }
      }
    };

    fetchData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [listingId]);



  const addModule = () => {
    const newModule: Module = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Module',
      lessons: [],
      dripDays: 0
    };
    setModules([...modules, newModule]);
  };

  const addLesson = (moduleId: string, type: Lesson['type'] = 'text') => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [...m.lessons, { 
            id: Math.random().toString(36).substr(2, 9), 
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, 
            type, 
            content: '',
            duration: '10:00'
          }]
        };
      }
      return m;
    }));
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
      }
      return m;
    }));
  };

  const updateModule = (id: string, updates: Partial<Module>) => {
    setModules(modules.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
        };
      }
      return m;
    }));
  };

  const getActiveLesson = () => {
    if (!selectedLesson) return null;
    const module = modules.find(m => m.id === selectedLesson.mId);
    return module?.lessons.find(l => l.id === selectedLesson.lId);
  };

  if (loading) {
    return <BuilderLoader onComplete={() => setLoading(false)} title="Course Builder Pro" />;
  }

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#FBFBFD] text-black'}`}>
      {/* Header */}
      <header className={`h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-8 backdrop-blur-xl shrink-0 sticky top-0 z-50 transition-colors ${
        isDark ? 'bg-[#050505]/80 border-white/10' : 'bg-white/80 border-black/5'
      }`}>
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={onCancel} className={`p-2 md:p-3 rounded-2xl transition-all active:scale-95 ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className={`font-bold text-sm md:text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
              Course Builder <span className={`px-2 py-0.5 text-[10px] rounded-md uppercase tracking-wider ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>Pro</span>
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">Draft saved 2m ago</p>
          </div>
          
          <div className={`hidden md:block h-8 w-px mx-2 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
          
          <nav className={`flex p-1 rounded-xl md:rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100/50'}`}>
            {[
              { id: 'content', icon: Layers, label: 'Curriculum' },
              { id: 'design', icon: Palette, label: 'Design' },
              { id: 'settings', icon: Settings, label: 'Settings' },
              { id: 'analytics', icon: BarChart3, label: 'Insights' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? (isDark ? 'bg-white/10 text-white shadow-lg' : 'bg-white shadow-xl text-black scale-105')
                    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black')
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 h-4" />
                <span className={activeTab === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <div className="hidden md:flex -space-x-2 mr-4">
            {activeUsers.length > 0 ? (
              activeUsers.map((u, i) => (
                <img 
                  key={i} 
                  src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} 
                  className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-black bg-white/10' : 'border-white bg-gray-100'}`} 
                  title={u.name}
                />
              ))
            ) : (
              [1, 2, 3].map(i => (
                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-black bg-white/10' : 'border-white bg-gray-100'}`} />
              ))
            )}
            <div className={`w-8 h-8 rounded-full border-2 text-[10px] flex items-center justify-center font-bold ${isDark ? 'border-black bg-white text-black' : 'border-white bg-black text-white'}`}>
              +{activeUsers.length > 3 ? activeUsers.length - 3 : 12}
            </div>
          </div>
          <button 
            onClick={() => {
              if (listingId) {
                navigate(`/access/${listingId}`);
              } else {
                appToast("Please save the course first to preview it.");
              }
            }}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 text-[10px] md:text-sm font-bold rounded-xl md:rounded-2xl transition-all active:scale-95 ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Eye className="w-4 h-4" /> <span className="hidden sm:block">Preview</span>
          </button>
          <button 
            onClick={() => onSave({ modules, design })}
            className={`flex items-center gap-2 px-4 md:px-8 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all active:scale-95 shadow-xl ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800 shadow-black/10'}`}
          >
            <Save className="w-4 h-4" /> <span className="hidden sm:block">Publish</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Curriculum Toggle */}
        {isMobile && activeTab === 'content' && !selectedLesson && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <button 
              onClick={() => setShowMobileCurriculum(true)}
              className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95"
            >
              <Layers className="w-4 h-4" /> View Curriculum
            </button>
          </div>
        )}

        {/* Left Sidebar: Curriculum Tree */}
        <div className={`
          ${isMobile ? 'fixed inset-0 z-40 pt-16' : 'w-96 border-r'} 
          overflow-y-auto p-6 md:p-8 space-y-8 transition-all duration-300
          ${isDark ? 'bg-[#050505] border-white/10' : 'bg-white border-black/5'}
          ${isMobile && (!selectedLesson || showMobileCurriculum) ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Curriculum</h3>
            <div className="flex gap-2">
              {isMobile && (
                <button 
                  onClick={() => setShowMobileCurriculum(false)}
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}><Search className="w-4 h-4" /></button>
              <button 
                onClick={addModule}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                <Plus className="w-4 h-4" /> Module
              </button>
            </div>
          </div>

          <Reorder.Group axis="y" values={modules} onReorder={setModules} className="space-y-6">
            {modules.map((module) => (
              <Reorder.Item key={module.id} value={module} className="group">
                <div className={`rounded-3xl border overflow-hidden transition-all hover:shadow-xl ${isDark ? 'bg-[#141414] border-white/5 hover:shadow-white/5' : 'bg-[#FBFBFD] border-black/5 hover:shadow-black/5'}`}>
                  <div className={`p-5 flex items-center gap-4 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/50 border-black/5'}`}>
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing" />
                    <input 
                      value={module.title || ''}
                      onChange={(e) => updateModule(module.id, { title: e.target.value })}
                      className={`flex-1 bg-transparent font-bold text-sm outline-none transition-colors ${isDark ? 'text-white focus:text-blue-400' : 'text-black focus:text-blue-600'}`}
                    />
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeModule(module.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      <button className={`p-2 text-gray-400 ${isDark ? 'hover:text-white' : 'hover:text-black'}`}><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-1">
                    <Reorder.Group axis="y" values={module.lessons} onReorder={(newLessons) => updateModule(module.id, { lessons: newLessons })}>
                      {module.lessons.map((lesson) => (
                        <Reorder.Item 
                          key={lesson.id} 
                          value={lesson}
                          onClick={() => {
                            setSelectedLesson({ mId: module.id, lId: lesson.id });
                            if (isMobile) setShowMobileCurriculum(false);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group/lesson ${
                            selectedLesson?.lId === lesson.id 
                              ? (isDark ? 'bg-white/10 shadow-lg ring-1 ring-white/10' : 'bg-white shadow-lg ring-1 ring-black/5')
                              : (isDark ? 'hover:bg-white/5' : 'hover:bg-white/50')
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            lesson.type === 'video' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') : 
                            lesson.type === 'quiz' ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600') : 
                            (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500')
                          }`}>
                            {lesson.type === 'video' ? <Video className="w-4 h-4" /> : 
                             lesson.type === 'quiz' ? <Zap className="w-4 h-4" /> : 
                             lesson.type === 'audio' ? <Music className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${selectedLesson?.lId === lesson.id ? (isDark ? 'text-white' : 'text-black') : 'text-gray-600'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">{lesson.duration || '10:00'}</p>
                          </div>
                          {lesson.isFreePreview && <Sparkles className="w-3 h-3 text-yellow-500" />}
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    
                    <div className="grid grid-cols-4 gap-2 pt-3">
                      {[
                        { type: 'video', icon: Video },
                        { type: 'text', icon: FileText },
                        { type: 'quiz', icon: Zap },
                        { type: 'pdf', icon: FileDown }
                      ].map(btn => (
                        <button 
                          key={btn.type}
                          onClick={() => addLesson(module.id, btn.type as any)}
                          className={`p-2 border rounded-xl transition-all flex items-center justify-center ${
                            isDark 
                              ? 'bg-[#141414] border-white/10 hover:bg-white hover:text-black text-gray-400' 
                              : 'bg-white border-black/5 hover:bg-black hover:text-white text-gray-600'
                          }`}
                          title={`Add ${btn.type}`}
                        >
                          <btn.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Main Editor Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
          {activeTab === 'content' && (
            <div className="flex-1 flex overflow-hidden">
              {selectedLesson ? (
                <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-12">
                  <div className="max-w-4xl mx-auto w-full space-y-8 md:y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {isMobile && (
                            <button 
                              onClick={() => setSelectedLesson(null)}
                              className="p-1.5 bg-white/5 rounded-lg mr-2"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {getActiveLesson()?.type} Lesson
                        </div>
                        <input 
                          value={getActiveLesson()?.title || ''}
                          onChange={(e) => updateLesson(selectedLesson.mId, selectedLesson.lId, { title: e.target.value })}
                          className={`text-2xl md:text-4xl font-bold outline-none bg-transparent w-full ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-50 hover:bg-gray-100 text-black'}`}><Copy className="w-4 h-4 md:w-5 h-5" /></button>
                        <button 
                          onClick={() => removeLesson(selectedLesson.mId, selectedLesson.lId)}
                          className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                        >
                          <Trash2 className="w-4 h-4 md:w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Lesson Content Editor */}
                    <div className="space-y-6 md:space-y-8">
                      {getActiveLesson()?.type === 'video' && (
                        <div className={`aspect-video rounded-3xl md:rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 border-4 md:border-8 shadow-2xl relative overflow-hidden ${isDark ? 'bg-black border-[#1A1A1A] text-white' : 'bg-black border-gray-100 text-white'}`}>
                          {getActiveLesson()?.videoUrl ? (
                            <video 
                              src={getActiveLesson()?.videoUrl} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 fill-current" />
                              </div>
                              <p className="font-bold text-lg">Upload Video Content</p>
                              <FileUpload
                                bucket="course-videos"
                                onUpload={(url) => updateLesson(selectedLesson.mId, selectedLesson.lId, { videoUrl: url })}
                                label="Select Video File"
                                accept="video/*"
                                maxSizeMB={2048}
                                darkMode={true}
                              />
                              <p className="text-xs text-gray-500">MP4, MOV, AVI (Max 2GB)</p>
                            </>
                          )}
                          {getActiveLesson()?.videoUrl && (
                            <button 
                              onClick={() => updateLesson(selectedLesson.mId, selectedLesson.lId, { videoUrl: '' })}
                              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Lesson Description</label>
                        <textarea 
                          value={getActiveLesson()?.content || ''}
                          onChange={(e) => updateLesson(selectedLesson.mId, selectedLesson.lId, { content: e.target.value })}
                          placeholder="Write your lesson content here..."
                          className={`w-full min-h-[200px] md:min-h-[300px] p-6 md:p-8 border rounded-2xl md:rounded-[2rem] outline-none transition-all text-base md:text-lg leading-relaxed ${
                            isDark 
                              ? 'bg-[#141414] border-white/10 text-gray-300 focus:ring-4 focus:ring-white/5 placeholder-gray-600' 
                              : 'bg-[#FBFBFD] border-black/5 text-black focus:ring-4 focus:ring-black/5 placeholder-gray-400'
                          }`}
                        />
                      </div>

                      {/* Lesson Settings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-6 rounded-2xl md:rounded-3xl border shadow-sm space-y-4 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                          <h4 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Settings className="w-4 h-4" /> Lesson Options</h4>
                          <div className="space-y-3">
                            <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-5'}`}>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-black'}`}>Free Preview</span>
                              <input 
                                type="checkbox" 
                                checked={getActiveLesson()?.isFreePreview}
                                onChange={(e) => updateLesson(selectedLesson.mId, selectedLesson.lId, { isFreePreview: e.target.checked })}
                                className="w-5 h-5 accent-black" 
                              />
                            </label>
                            <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-black'}`}>Enable Comments</span>
                              <input type="checkbox" defaultChecked className="w-5 h-5 accent-black" />
                            </label>
                          </div>
                        </div>
                        <div className={`p-6 rounded-2xl md:rounded-3xl border shadow-sm space-y-4 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                          <h4 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><FileDown className="w-4 h-4" /> Resources</h4>
                          <div className="space-y-2">
                            <button className={`w-full py-3 border-2 border-dashed rounded-xl text-xs font-bold transition-all ${
                              isDark 
                                ? 'border-white/10 text-gray-500 hover:border-white hover:text-white' 
                                : 'border-gray-100 text-gray-400 hover:border-black hover:text-black'
                            }`}>
                              + Add Downloadable Resource
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12">
                  <div className={`w-16 h-16 md:w-24 h-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-6 md:mb-8 animate-pulse ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <BookOpen className={`w-8 h-8 md:w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-xl md:text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Select a lesson to edit</h2>
                  <p className={`max-w-md mx-auto text-sm md:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Choose a lesson from the curriculum on the left to start building your content. You can drag and drop modules to reorder them.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'design' && (
            <div className={`flex-1 overflow-y-auto p-12 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FBFBFD]'}`}>
              <div className="max-w-5xl mx-auto space-y-12">
                <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Visual Identity</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <section className="space-y-6">
                      <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Palette className="w-5 h-5" /> Brand Colors</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Primary Color</label>
                          <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                            <input 
                              type="color" 
                              value={design.primaryColor || '#000000'}
                              onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
                              className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                            />
                            <input 
                              type="text" 
                              value={design.primaryColor || ''}
                              onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
                              className={`flex-1 bg-transparent font-mono text-sm outline-none ${isDark ? 'text-white' : 'text-black'}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accent Color</label>
                          <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                            <input 
                              type="color" 
                              value={design.accentColor || '#F27D26'}
                              onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
                              className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                            />
                            <input 
                              type="text" 
                              value={design.accentColor || ''}
                              onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
                              className={`flex-1 bg-transparent font-mono text-sm outline-none ${isDark ? 'text-white' : 'text-black'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Layout className="w-5 h-5" /> Layout & Style</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'sidebar', label: 'Classic Sidebar', icon: Monitor },
                          { id: 'grid', label: 'Modern Grid', icon: Layout }
                        ].map(l => (
                          <button 
                            key={l.id}
                            onClick={() => setDesign({ ...design, layout: l.id })}
                            className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 ${
                              design.layout === l.id 
                                ? (isDark ? 'border-white bg-[#1A1A1A] shadow-xl scale-105' : 'border-black bg-white shadow-xl scale-105')
                                : (isDark ? 'border-white/10 bg-[#141414] text-gray-500' : 'border-gray-100 bg-white/50 grayscale')
                            }`}
                          >
                            <l.icon className={`w-6 h-6 ${design.layout === l.id ? (isDark ? 'text-white' : 'text-black') : ''}`} />
                            <p className={`font-bold text-sm ${design.layout === l.id ? (isDark ? 'text-white' : 'text-black') : ''}`}>{l.label}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Design Preview */}
                  <div className="space-y-6">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview</label>
                    <div className={`aspect-[4/5] rounded-[3rem] shadow-2xl border overflow-hidden flex flex-col ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                      <div className={`h-12 border-b flex items-center px-6 gap-2 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 flex">
                        {design.layout === 'sidebar' && <div className={`w-20 border-r ${isDark ? 'bg-[#1A1A1A] border-white/5' : 'bg-gray-50 border-gray-100'}`} />}
                        <div className="flex-1 p-8 space-y-6">
                          <div className={`h-4 w-1/2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                          <div className={`aspect-video rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-900'}`} />
                          <div className="space-y-2">
                            <div className={`h-3 w-full rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'}`} />
                            <div className={`h-3 w-3/4 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'}`} />
                          </div>
                          <div 
                            style={{ backgroundColor: design.primaryColor }}
                            className="h-12 w-full rounded-xl shadow-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`flex-1 overflow-y-auto p-12 ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
              <div className="max-w-3xl mx-auto space-y-12">
                <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Course Settings</h2>
                
                <div className="space-y-6">
                  <section className={`p-8 rounded-[2.5rem] border space-y-8 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-[#FBFBFD] border-black/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Drip Content</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Release modules over time to increase retention.</p>
                      </div>
                      <div className={`w-14 h-8 rounded-full relative cursor-pointer ${isDark ? 'bg-white' : 'bg-black'}`}>
                        <div className={`absolute right-1 top-1 w-6 h-6 rounded-full shadow-sm ${isDark ? 'bg-black' : 'bg-white'}`} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Certificates</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Auto-generate PDF certificates on completion.</p>
                      </div>
                      <div className={`w-14 h-8 rounded-full relative cursor-pointer ${isDark ? 'bg-white/20' : 'bg-gray-200'}`}>
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Gamification</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enable points, badges, and leaderboards.</p>
                      </div>
                      <div className={`w-14 h-8 rounded-full relative cursor-pointer ${isDark ? 'bg-white' : 'bg-black'}`}>
                        <div className={`absolute right-1 top-1 w-6 h-6 rounded-full shadow-sm ${isDark ? 'bg-black' : 'bg-white'}`} />
                      </div>
                    </div>
                  </section>

                  <section className={`p-8 rounded-[2.5rem] border flex gap-6 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${isDark ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                      <Zap className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className="space-y-2">
                      <h4 className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Automation: Completion Trigger</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        When a student completes the final lesson, automatically send a congratulatory message and an upsell offer for your 1-on-1 coaching session.
                      </p>
                      <button className={`text-sm font-bold hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Configure Automation →</button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className={`flex-1 overflow-y-auto p-12 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FBFBFD]'}`}>
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Course Insights</h2>
                  <div className="flex gap-2">
                    <button className={`px-4 py-2 border rounded-xl text-sm font-bold shadow-sm ${isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-black/5 text-black'}`}>Last 30 Days</button>
                    <button className={`px-4 py-2 border rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 ${isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-black/5 text-black'}`}><Calendar className="w-4 h-4" /> Custom</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Total Revenue', value: `€${insights.revenue.toLocaleString()}`, change: '+12%', icon: BarChart3, color: 'blue' },
                    { label: 'Active Students', value: insights.students.toString(), change: '+5%', icon: Users, color: 'purple' },
                    { label: 'Completion Rate', value: `${insights.completion}%`, change: '+2%', icon: CheckCircle2, color: 'emerald' }
                  ].map((stat, i) => (
                    <div key={i} className={`p-8 rounded-[2.5rem] border shadow-sm space-y-4 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? `bg-${stat.color}-500/20` : `bg-${stat.color}-50`}`}>
                        <stat.icon className={`w-6 h-6 ${isDark ? `text-${stat.color}-400` : `text-${stat.color}-600`}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <div className="flex items-baseline gap-3">
                          <h4 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</h4>
                          <span className="text-xs font-bold text-emerald-500">{stat.change}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`p-8 rounded-[2.5rem] border shadow-sm space-y-6 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Clock className="w-5 h-5 text-orange-500" /> Drop-off Analysis</h3>
                    <div className="space-y-4">
                      {modules.slice(0, 4).map((m, i) => (
                        <div key={i} className="space-y-2">
                          <div className={`flex justify-between text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                            <span>{m.title}</span>
                            <span className="text-gray-400">{100 - (i * 15)}% retention</span>
                          </div>
                          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-50'}`}>
                            <div className="h-full bg-orange-400" style={{ width: `${100 - (i * 15)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`p-8 rounded-[2.5rem] border shadow-sm space-y-6 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}><Zap className="w-5 h-5 text-yellow-500" /> Engagement Score</h3>
                    <div className="flex items-center justify-center py-8">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className={isDark ? 'text-white/10' : 'text-gray-100'} />
                          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={552} strokeDashoffset={552 * (1 - 0.85)} className="text-yellow-400" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>85</span>
                          <span className="text-xs font-bold text-gray-400 uppercase">Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
