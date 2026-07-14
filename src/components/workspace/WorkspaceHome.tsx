import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Users, MessageSquare, TrendingUp, Activity, Star, User, Store, Package, Zap, ArrowRight, DollarSign, ShoppingBag, GraduationCap, HelpCircle, Sparkles, RefreshCw, Download, Globe, Filter, Settings, Search } from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { emptyPlatformStats, fetchPlatformStats } from '../../lib/platformStats';
import { useNavigate } from 'react-router-dom';
import { useListingWizard } from '../../context/ListingWizardContext';
import { Skeleton } from '../ui/Skeleton';
import { fixOklchColors, getUsername } from '../../lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { AnnouncementCard } from '../ui/cards/AnnouncementCard';
import { JobCard } from '../ui/cards/JobCard';
import { MoneyDashboard } from './MoneyDashboard';
import { ManagementDashboard } from './ManagementDashboard';
import { WorkspaceTutorial } from './WorkspaceTutorial';
import { CrmView } from './CrmView';

import { appToast } from '@/lib/feedback';
// --- Widget Types ---
type WidgetType = 'popular_users' | 'recent_chats' | 'stats' | 'activity' | 'favorites' | 'tasks';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'stats', type: 'stats', title: 'Quick Stats' },
  { id: 'recent_chats', type: 'recent_chats', title: 'Recent Chats' },
  { id: 'tasks', type: 'tasks', title: 'Team Tasks' },
  { id: 'popular_users', type: 'popular_users', title: 'Top Customers' },
  { id: 'activity', type: 'activity', title: 'Recent Activity' },
];

// --- Sortable Item Component ---
interface SortableWidgetProps {
  widget: Widget;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ widget, onRemove, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative bg-[#141414] border border-white/5 rounded-3xl overflow-hidden group ${isDragging ? 'shadow-2xl shadow-black/50 ring-2 ring-indigo-500/50' : 'hover:border-white/10 transition-colors'}`}>
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
            <GripVertical className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-white text-lg">{widget.title}</h3>
        </div>
        <button onClick={() => onRemove(widget.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};


// --- Main Component ---
export const WorkspaceHome = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const navigate = useNavigate();
  const { openWizard } = useListingWizard();
  const [activeTab, setActiveTab] = useState<'overview' | 'money' | 'management'>('overview');
  const [widgets, setWidgets] = useState<Widget[]>([
    AVAILABLE_WIDGETS[0], // Stats
    AVAILABLE_WIDGETS[1], // Chats
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Data states
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, newOrders: 0, unreadMessages: 0, businesses: 0, customers: 0 });
  const [platformStats, setPlatformStats] = useState(emptyPlatformStats);
  const [isDownloading, setIsDownloading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchWidgetData();
  }, []);

  useEffect(() => {
    if (user && profile) {
      setUserName(getUsername(profile, user));
    }
  }, [user, profile]);

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch all initial dashboard data in parallel using direct Supabase queries
        const [
          profileRes, 
          popularUsersRes, 
          recentChatsRes, 
          tasksRes, 
          businessesRes, 
          jobsRes, 
          announcementsRes, 
          ordersRes, 
          orderStatsRes,
          unreadCountRes, 
          productsRes,
          businessCountRes,
          platformStatsRes
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('profiles').select('*').limit(5),
          supabase.from('chat_participants').select('chat_id, chat:chats(*)').eq('user_id', user.id).limit(5),
          supabase.from('tasks').select('*').eq('user_id', user.id).limit(5),
          supabase.from('businesses').select('*').eq('user_id', user.id).limit(5),
          supabase.from('jobs').select('*').eq('user_id', user.id).limit(5),
          supabase.from('announcements').select('*').limit(5),
          supabase.from('orders').select('*').eq('seller_id', user.id).limit(10),
          supabase.from('orders').select('amount, buyer_id, listing_id, status').eq('seller_id', user.id),
          supabase.from('chat_participants').select('unread_count').eq('user_id', user.id),
          supabase.from('listings').select('*').eq('seller_id', user.id).limit(5),
          supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          fetchPlatformStats()
        ]);
        
        if (profileRes.data) setProfile(profileRes.data);
        if (popularUsersRes.data) {
          // Ensure unique users by ID
          const uniqueUsers = Array.from(new Map(popularUsersRes.data.map(u => [u.id, u])).values());
          setPopularUsers(uniqueUsers);
        }
        if (recentChatsRes.data) {
          // Ensure unique chats by ID
          const chats = recentChatsRes.data.map((c: any) => c.chat).filter(Boolean);
          const uniqueChats = Array.from(new Map(chats.map((c: any) => [c.id, c])).values());
          setRecentChats(uniqueChats);
        }
        if (tasksRes.data) setTasks(tasksRes.data);
        if (businessesRes.data) setBusinesses(businessesRes.data);
        if (jobsRes.data) setJobs(jobsRes.data);
        if (announcementsRes.data) setAnnouncements(announcementsRes.data);
        if (ordersRes.data) setRecentOrders(ordersRes.data);
        setPlatformStats(platformStatsRes);
        
        const ordersData = orderStatsRes.data || [];
        const unreadCount = unreadCountRes.data?.reduce((sum: number, p: any) => sum + (p.unread_count || 0), 0) || 0;
        const completedOrders = ordersData.filter((order: any) => !order.status || ['completed', 'paid', 'succeeded', 'success'].includes(String(order.status).toLowerCase()));
        const revenue = completedOrders.reduce((sum: number, order: any) => sum + (Number(order.amount) || 0), 0);
        const newOrders = ordersData.filter((o: any) => o.status === 'pending' || o.status === 'new').length;
        const customers = new Set(ordersData.map((order: any) => order.buyer_id).filter(Boolean)).size;
        setStats({
          revenue,
          orders: ordersData.length,
          newOrders,
          unreadMessages: unreadCount,
          businesses: businessCountRes.count || businessesRes.data?.length || 0,
          customers
        });

        if (productsRes.data) {
          const productsWithSales = productsRes.data.map((p: any) => ({
            ...p,
            sales_count: ordersData.filter((o: any) => o.listing_id === p.id).length || 0
          }));
          setProducts(productsWithSales);
        }
      }
    } catch (error) {
      console.error('Error fetching widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const addWidget = (widget: Widget) => {
    if (widgets.length >= 6) {
      appToast('Maximum widgets reached.');
      return;
    }
    if (!widgets.find(w => w.id === widget.id)) {
      setWidgets([...widgets, widget]);
    }
    setIsAddModalOpen(false);
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          fixOklchColors(clonedDoc);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Wersee_Dashboard_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      appToast('Failed to generate PDF report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const tabVariants: any = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.98,
      filter: 'blur(10px)'
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for cinematic feel
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.98,
      filter: 'blur(10px)',
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  // if (loading) return (
  //   <div className="space-y-4 p-6">
  //     <Skeleton className="h-20 w-full" />
  //     <Skeleton className="h-20 w-full" />
  //     <Skeleton className="h-20 w-full" />
  //   </div>
  // );

  const renderWidgetContent = (type: WidgetType) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    switch (type) {
      case 'popular_users':
        return (
          <div className="space-y-3">
            {popularUsers.length > 0 ? popularUsers.map((u, idx) => (
              <div key={`popular-user-${u.id || idx}-${idx}`} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-black">
                    {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm group-hover:text-indigo-400 transition-colors">{u.full_name || 'Unknown'}</h4>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                </div>
                <button className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            )) : <p className="text-gray-500 text-center text-sm py-4">No users found.</p>}
          </div>
        );
      case 'recent_chats':
        return (
          <div className="space-y-3">
            {recentChats.length > 0 ? recentChats.map((c, idx) => (
              <div key={`recent-chat-${c.id || c.chat_id || idx}-${idx}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">Chat #{c.chat_id ? c.chat_id.substring(0,4) : 'N/A'}</h4>
                  <p className="text-xs text-gray-500">Active {c.chats?.updated_at ? new Date(c.chats.updated_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            )) : <p className="text-gray-500 text-center text-sm py-4">No recent chats.</p>}
          </div>
        );
      case 'stats':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Earned</span>
              </div>
              <p className="text-xl font-bold text-white">US$ {stats.revenue.toFixed(0)}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Orders</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.orders.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Store className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Businesses</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.businesses.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Customers</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.customers.toLocaleString()}</p>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {recentOrders.length > 0 ? recentOrders.map((order, i) => (
              <div key={order.id || i} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#141414]" />
                <p className="text-sm text-white font-medium">{order.status || 'Order'} received</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'} &bull; US$ {Number(order.amount || 0).toLocaleString()}
                </p>
              </div>
            )) : <p className="text-gray-500 text-center text-sm py-4">No recent activity.</p>}
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.map((t, idx) => (
              <div key={`task-${t.id || idx}-${idx}`} onClick={() => onNavigate('management-team')} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === 'done' ? 'bg-emerald-500' : 
                    t.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <div className="min-w-0">
                    <h4 className={`font-medium text-white text-sm truncate ${t.status === 'done' ? 'line-through opacity-50' : ''}`}>{t.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        t.priority === 'high' ? 'text-red-400' :
                        t.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            )) : <p className="text-gray-500 text-center text-sm py-4">No tasks assigned.</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-2xl flex-1 sm:flex-none sm:w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('money')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'money'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Finance
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'management'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Manage
          </button>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
        >
          {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} PDF</span>
        </button>
      </div>

      <div ref={dashboardRef} className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 md:space-y-8"
            >
              {/* Hero Section */}
              <div id="welcome-hero" className="relative overflow-hidden rounded-[2rem] md:rounded-[40px] bg-gradient-to-r from-[#1A1A1A] to-[#141414] border border-white/5 p-6 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <button 
                      onClick={() => onNavigate('release')}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400 mb-4 uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> Release
                    </button>

                    {/* Search Bar */}
                    <div className="mb-8 max-w-2xl">
                      <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                        <input 
                          type="text"
                          placeholder="Search tabs..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const query = (e.target as HTMLInputElement).value;
                              if (query.trim()) {
                                window.dispatchEvent(new CustomEvent('trigger-workspace-search', { 
                                  detail: { query } 
                                }));
                              }
                            }
                          }}
                          className="w-full bg-[#141414] border border-white/5 rounded-[2rem] py-5 pl-16 pr-12 text-lg text-white placeholder:text-gray-500 focus:outline-none focus:bg-[#1A1A1A] focus:border-white/10 transition-all shadow-2xl"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white cursor-pointer transition-colors">
                          <X className="w-5 h-5" onClick={(e) => {
                            const input = (e.currentTarget.parentElement?.previousElementSibling) as HTMLInputElement;
                            if (input) input.value = '';
                          }} />
                        </div>
                      </div>
                    </div>

                    <h1 className="text-3xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
                      Welcome back, <br className="hidden md:block" /> {userName || 'Creator'}!
                    </h1>
                    <p className="text-base md:text-xl text-gray-400 max-w-xl font-medium">
                      Your central hub for building, managing, and scaling your creative business. Get discovered by more than <span className="text-white font-bold">{platformStats.customers.toLocaleString()} customers</span> on Wersee.
                    </p>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('wersee_tutorial_seen');
                        window.location.reload();
                      }}
                      className="mt-4 text-xs font-bold text-white/40 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Restart Tutorial
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <button 
                      onClick={() => openWizard('product')}
                      className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                    >
                      <Plus className="w-5 h-5" />
                      Create New
                    </button>
                    <button 
                      onClick={() => navigate('/search')}
                      className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-2xl font-black hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10"
                    >
                      <Store className="w-5 h-5" />
                      Visit Store
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Start Guide for New Users */}
              {!loading && businesses.length === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <h2 className="text-xs font-black uppercase tracking-widest">Getting Started</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div id="step-create-business" className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-4 right-4 px-2 py-0.5 bg-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                        Step 1
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                          <Store className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Create Business</h3>
                        <p className="text-sm text-gray-400 mb-4">Start by setting up your business profile to showcase your work.</p>
                        <button id="btn-create-business" onClick={() => onNavigate('create-business')} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                          Get Started <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div id="step-add-product" className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                        Step 2
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                          <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Add Products</h3>
                        <p className="text-sm text-gray-400 mb-4">Upload your first app, extension, or digital product to the store.</p>
                        <button id="btn-add-product" onClick={() => openWizard('product')} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                          Add Product <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div id="step-setup-payments" className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-4 right-4 px-2 py-0.5 bg-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-tighter">
                        Step 3
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Setup Payments</h3>
                        <p className="text-sm text-gray-400 mb-4">Connect your Stripe account to start receiving payouts.</p>
                        <button id="btn-setup-payments" onClick={() => onNavigate('money-setup')} className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-2">
                          Setup Wallet <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Left Column - Widgets */}
                <div className="lg:col-span-2 space-y-8">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={widgets.map(w => w.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {widgets.map((widget, idx) => (
                          <SortableWidget key={`widget-${widget.id || idx}`} widget={widget} onRemove={removeWidget}>
                            {renderWidgetContent(widget.type)}
                          </SortableWidget>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Business Overview */}
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Store className="w-5 h-5 text-indigo-400" />
                        Your Businesses
                      </h2>
                      <button onClick={() => onNavigate('create-business')} className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {loading ? (
                      <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                      </div>
                    ) : businesses.length > 0 ? businesses.map((b, idx) => (
                        <div key={`business-card-${b.id || idx}-${idx}`} onClick={() => onNavigate(b.slug || b.id)} className="group bg-gradient-to-br from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 border border-white/10 rounded-3xl p-6 transition-all cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                          <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                              {b.name.charAt(0)}
                            </div>
                            <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-md border border-white/5">
                              {b.status || 'Active'}
                            </div>
                          </div>
                          <div className="relative z-10">
                            <h3 className="font-bold text-xl text-white mb-2 group-hover:text-indigo-400 transition-colors">{b.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4">{b.description || 'Manage your business settings, products, and team.'}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> Dashboard</span>
                              <span className="flex items-center gap-1"><Settings className="w-3.5 h-3.5" /> Settings</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-400 mb-6 max-w-md mx-auto">You haven't created any businesses yet. Start your journey by setting up your first business profile.</p>
                          <button onClick={() => onNavigate('create-business')} className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create Business
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Jobs & Announcements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-white mb-6">Recent Jobs</h2>
                      <div className="space-y-4">
                        {jobs.map((job, idx) => (
                          <JobCard key={`job-card-${job.id || idx}`} job={{
                            id: job.id,
                            title: job.title,
                            company: 'Your Company',
                            location: job.metadata?.location || 'Remote',
                            salary: `€${job.price}`,
                            type: job.category || 'Full-time',
                            postedAt: new Date(job.created_at).toLocaleDateString()
                          }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                      <h2 className="text-xl font-bold text-white mb-6">Announcements</h2>
                      <div className="space-y-4">
                        {announcements.map((ann, idx) => (
                          <AnnouncementCard key={`ann-card-${ann.id || idx}`} announcement={{
                            title: ann.title,
                            content: ann.content,
                            date: new Date(ann.created_at).toLocaleDateString(),
                            category: 'Announcement'
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Quick Actions & Products */}
                <div className="space-y-8">
                  {/* Quick Actions */}
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                      <button onClick={() => openWizard('product')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Add Product</span>
                      </button>
                      <button onClick={() => onNavigate('management-websites')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Create Website</span>
                      </button>
                      <button onClick={() => onNavigate('management-funnels')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Filter className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Create Funnel</span>
                      </button>
                      <button onClick={() => onNavigate('create-community')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Create Community</span>
                      </button>
                      <button onClick={() => onNavigate('management-affiliates')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Manage Affiliates</span>
                      </button>
                      <button onClick={() => navigate('/learn')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Wersee Learn</span>
                      </button>
                      <button onClick={() => onNavigate('help')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white">Help Center</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Products */}
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-white">Top Products</h2>
                      <button onClick={() => onNavigate('management-products')} className="text-xs text-gray-400 hover:text-white">View All</button>
                    </div>
                    <div className="space-y-4">
                      {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : products.length > 0 ? products.map((p, idx) => (
                        <div key={p.id || `product-${idx}`} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-600 m-auto h-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">{p.title}</h4>
                            <p className="text-xs text-gray-500">€{p.price}</p>
                          </div>
                          <div className="text-xs font-bold text-white">
                            {p.sales_count || 0} sales
                          </div>
                        </div>
                      )) : (
                        <p className="text-gray-500 text-sm text-center py-4">No products yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'money' && (
            <motion.div
              key="money"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <MoneyDashboard />
            </motion.div>
          )}

          {activeTab === 'management' && (
            <motion.div
              key="management"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ManagementDashboard onNavigate={onNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Add Widget</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {AVAILABLE_WIDGETS.map(widget => {
                const isAdded = widgets.find(w => w.id === widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => !isAdded && addWidget(widget)}
                    disabled={!!isAdded}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isAdded 
                        ? 'bg-white/5 border-transparent opacity-50 cursor-not-allowed' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium text-white">{widget.title}</span>
                    {isAdded ? <span className="text-sm text-gray-500">Added</span> : <Plus className="w-5 h-5 text-gray-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      <WorkspaceTutorial />
    </div>
  );
};


