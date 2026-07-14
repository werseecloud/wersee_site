import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, MoreHorizontal, Loader2,
  ChevronDown, Copy, Link as LinkIcon, Mail, Trash2,
  Activity, Clock, Zap, MessageSquare, Shield,
  TrendingUp, CheckCircle, AlertCircle, Globe,
  Calendar, Filter, Plus, Tag, Book, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { InviteMemberModal } from './InviteMemberModal';
import { TeamChatWindow } from './TeamChatWindow';
import { CreateTaskModal } from './CreateTaskModal';
import { ConfirmationModal } from './ConfirmationModal';
import { TeamDocumentsView } from '../workspace/TeamDocumentsView';
import { TeamProjectsView } from '../workspace/TeamProjectsView';
import { WikiView } from '../workspace/WikiView';
import { globalSearch, SearchResult } from '../../services/SearchService';
import { AIAssistant } from './AIAssistant';
import { LinkManager } from './LinkManager';
import { TemplateManager } from './TemplateManager';

import { appToast } from '@/lib/feedback';
interface Team {
  id: string;
  name: string;
  owner_id: string;
  slug?: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  status: string;
  user_id?: string;
  last_active?: string;
}

interface ActivityItem {
  id: string;
  user_email: string;
  action: string;
  target_name: string;
  timestamp: string;
  target_type: 'product' | 'team' | 'system' | 'task';
}

interface TeamEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time?: string;
}

interface TeamTask {
  id: string;
  team_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  category?: string;
  assigned_to?: string;
  parent_task_id?: string;
  dependency_task_id?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  completed_at?: string;
  created_at?: string;
  subtasks?: TeamTask[];
}

export const TeamManagementView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'activity' | 'members' | 'tasks' | 'invites' | 'settings' | 'documents' | 'projects' | 'wiki'>('activity');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTeams = async () => {
      try {
        const { data: ownedTeams } = await supabase.from('teams').select('*').eq('owner_id', user.id);
        const { data: memberTeams } = await supabase.from('team_members').select('team:teams(*)').eq('user_id', user.id);
        
        const joinedTeams = memberTeams?.map((m: any) => m.team).filter(t => t) || [];
        const allTeams = [...(ownedTeams || []), ...joinedTeams];
        const uniqueTeams = Array.from(new Map(allTeams.map(t => [t.id, t])).values());

        if (uniqueTeams.length > 0) {
          setTeams(uniqueTeams);
          // Only set if not already selected
          if (!selectedTeam) setSelectedTeam(uniqueTeams[0]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [user]);

  useEffect(() => {
    if (!selectedTeam) return;

    const fetchData = async () => {
      // Fetch Members
      const { data: memberData } = await supabase.from('team_members').select('*').eq('team_id', selectedTeam.id);
      setMembers(memberData || []);

      // Fetch Activities
      const { data: activityData } = await supabase
        .from('team_activities')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('timestamp', { ascending: false })
        .limit(10);
      setActivities(activityData || []);

      // Fetch Events
      const { data: eventData } = await supabase
        .from('team_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      setEvents(eventData || []);

      // Fetch Tasks
      const { data: taskData } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false });
      setTasks(taskData || []);
    };

    fetchData();
  }, [selectedTeam]);

  // Global Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim() && selectedTeam) {
        setIsSearching(true);
        const results = await globalSearch(selectedTeam.id, searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTeam]);

  const handleInvite = async (email: string, role: string) => {
    if (!selectedTeam) return;
    try {
      const { data, error } = await supabase.from('team_members').insert({
        team_id: selectedTeam.id,
        email,
        role,
        status: 'pending'
      }).select().single();

      if (error) throw error;
      
      // Log activity
      await supabase.from('team_activities').insert({
        team_id: selectedTeam.id,
        user_id: user?.id,
        user_email: user?.email,
        action: 'invited',
        target_type: 'team',
        target_name: email
      });

      setMembers([...members, data]);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      appToast('Failed to invite member');
    }
  };

  const handleCreateTask = async (
    title: string, 
    priority: 'low' | 'medium' | 'high', 
    deadline?: string, 
    category?: string,
    projectId?: string,
    assignedTo?: string,
    isRecurring?: boolean,
    recurrenceRule?: string,
    parentTaskId?: string,
    dependencyTaskId?: string
  ) => {
    if (!selectedTeam || !user) return;
    try {
      const { data, error } = await supabase.from('team_tasks').insert({
        team_id: selectedTeam.id,
        project_id: projectId,
        title,
        priority,
        deadline,
        category,
        assigned_to: assignedTo,
        is_recurring: isRecurring,
        recurrence_rule: recurrenceRule,
        parent_task_id: parentTaskId,
        dependency_task_id: dependencyTaskId,
        status: 'todo',
        created_by: user.id
      }).select().single();

      if (error) throw error;
      
      // Log activity
      await supabase.from('team_activities').insert({
        team_id: selectedTeam.id,
        user_id: user.id,
        user_email: user.email,
        action: 'created task',
        target_type: 'task',
        target_name: title
      });

      setTasks([data, ...tasks]);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'todo' | 'doing' | 'done') => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ 
          status,
          completed_at: status === 'done' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : undefined } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, priority: 'low' | 'medium' | 'high') => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ priority })
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, priority } : t));
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase.from('team_tasks').delete().eq('id', taskToDelete);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const doneTasksCount = tasks.filter(t => t.status === 'done').length;
  const highPriorityTasksCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <div className="space-y-6 md:space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Team Hub</h1>
          <p className="text-sm text-gray-500">Monitor activity and manage your workspace.</p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative inline-block w-full sm:w-auto">
              <button 
                onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
                className="flex items-center justify-between w-full sm:w-auto gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium truncate max-w-[150px]">{selectedTeam?.name || 'No Team Selected'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTeamSwitcher ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showTeamSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-[#141414] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {teams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowTeamSwitcher(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between ${
                          selectedTeam?.id === team.id ? 'text-white bg-white/5' : 'text-gray-400'
                        }`}
                      >
                        <span className="font-medium">{team.name}</span>
                        {selectedTeam?.id === team.id && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Global Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
              />
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                  >
                    {searchResults.map(result => (
                      <button 
                        key={result.id}
                        onClick={() => {
                          setSearchQuery('');
                          if (result.type === 'wiki') setActiveTab('wiki');
                          else if (result.type === 'task') setActiveTab('tasks');
                          else if (result.type === 'project') setActiveTab('projects');
                          else if (result.type === 'document') setActiveTab('documents');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex flex-col"
                      >
                        <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">{result.type}</span>
                        <span className="text-sm text-white font-medium truncate">{result.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowChat(true)}
            disabled={!selectedTeam}
            className="flex-1 sm:flex-none p-2.5 bg-white/5 text-gray-400 rounded-xl hover:text-white transition-colors border border-white/10 disabled:opacity-50 flex justify-center"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            disabled={!selectedTeam}
            className="flex-[2] sm:flex-none px-4 sm:px-6 py-2.5 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      {!selectedTeam ? (
        <div className="bg-[#141414] rounded-2xl sm:rounded-3xl border border-white/5 p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">No Team Found</h2>
          <p className="text-sm text-gray-500 mb-6">You are not part of any team yet. Create one in the Team & Splits section or ask for an invite.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 bg-[#141414] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Tasks Done</p>
              <p className="text-2xl font-bold text-white">{doneTasksCount}</p>
            </div>
            <div className="p-4 sm:p-6 bg-[#141414] border border-white/5 rounded-3xl group hover:border-red-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">High Priority</p>
              <p className="text-2xl font-bold text-white">{highPriorityTasksCount}</p>
            </div>
            <div className="p-4 sm:p-6 bg-[#141414] border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Active Members</p>
              <p className="text-2xl font-bold text-white">{members.filter(m => m.status === 'active').length + 1}</p>
            </div>
            <div className="p-4 sm:p-6 bg-[#141414] border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Team Velocity</p>
              <p className="text-2xl font-bold text-white">84%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Activity & Members */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-full overflow-x-auto no-scrollbar">
              {[
                { id: 'activity', label: 'Activity', icon: Activity },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'tasks', label: 'Tasks', icon: CheckCircle },
                { id: 'projects', label: 'Projects', icon: Filter },
                { id: 'documents', label: 'Documents', icon: Globe },
                { id: 'wiki', label: 'Wiki', icon: Book },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-fit px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {activities.length > 0 ? activities.map((activity) => (
                    <div key={activity.id} className="bg-[#141414] p-3 sm:p-4 rounded-2xl border border-white/5 flex items-start gap-3 sm:gap-4 group hover:border-white/10 transition-colors">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        activity.target_type === 'product' ? 'bg-blue-500/10 text-blue-400' :
                        activity.target_type === 'team' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {activity.target_type === 'product' ? <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> :
                         activity.target_type === 'team' ? <Users className="w-4 h-4 sm:w-5 sm:h-5" /> :
                         <Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-white leading-relaxed">
                          <span className="font-bold">{activity.user_email?.split('@')[0] || 'System'}</span>
                          {' '}{activity.action}{' '}
                          <span className="text-gray-300 font-medium">{activity.target_name}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] sm:text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                            {activity.target_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/5">
                      <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">No activity recorded yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h3 className="font-bold text-white">Active Members</h3>
                    <div className="relative w-full sm:w-auto">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search members..." 
                        className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 w-full sm:w-48"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {members.map((member) => (
                      <div key={member.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                              {member.email[0].toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-[#141414] rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{member.email.split('@')[0]}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Status</p>
                            <p className="text-xs text-white capitalize">{member.status}</p>
                          </div>
                          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white">Team Tasks</h3>
                    <button 
                      onClick={() => setShowCreateTaskModal(true)}
                      className="px-3 sm:px-4 py-2 bg-white text-black rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Task</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {tasks.length > 0 ? tasks.map((task) => (
                      <div key={task.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-colors group gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <button 
                            onClick={() => handleUpdateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                            className={`p-1.5 rounded-lg border transition-colors shrink-0 mt-0.5 ${
                              task.status === 'done' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold text-white truncate ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest">
                                {task.status.replace('_', ' ')}
                              </span>
                              {task.category && (
                                <span className="text-[9px] sm:text-[10px] text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                  <Tag className="w-3 h-3" />
                                  {task.category}
                                </span>
                              )}
                              {task.deadline && (
                                <span className="text-[9px] sm:text-[10px] text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              )}
                              {selectedTeam && (
                                <LinkManager sourceId={task.id} sourceType="task" teamId={selectedTeam.id} />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                          <div className="flex items-center gap-2">
                            <select 
                              value={task.priority}
                              onChange={(e) => handleUpdateTaskPriority(task.id, e.target.value as any)}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-white/20"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <select 
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-white/20"
                            >
                              <option value="todo">Todo</option>
                              <option value="doing">Doing</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (!selectedTeam) return;
                              const { error } = await supabase.from('templates').insert({
                                team_id: selectedTeam.id,
                                name: `Template: ${task.title}`,
                                type: 'task',
                                content: task,
                                created_by: user?.id
                              });
                              if (!error) appToast('Task saved as template!');
                            }}
                            className="p-2 hover:bg-indigo-500/10 text-gray-500 hover:text-indigo-400 rounded-lg transition-colors"
                            title="Save as Template"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks found. Create one to get started.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'documents' && selectedTeam && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <TeamDocumentsView teamId={selectedTeam.id} />
                </motion.div>
              )}

              {activeTab === 'projects' && selectedTeam && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <TeamProjectsView teamId={selectedTeam.id} />
                </motion.div>
              )}

              {activeTab === 'wiki' && selectedTeam && (
                <motion.div
                  key="wiki"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <WikiView teamId={selectedTeam.id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Team Health */}
            <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Team Velocity
              </h3>
              <div className="space-y-6">
                <div className="flex items-end justify-between gap-1 h-20 sm:h-24 px-1">
                  {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative group min-w-[8px]">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-indigo-500/40 group-hover:bg-indigo-500 transition-colors rounded-t-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Upcoming
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {events.length > 0 ? events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2.5 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex flex-col items-center justify-center text-purple-400 shrink-0">
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase">
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xs sm:text-sm font-bold">
                        {new Date(event.start_time).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{event.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-4 text-sm">No upcoming events.</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div 
              onClick={() => selectedTeam && setShowChat(true)}
              className="bg-indigo-600 p-5 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-white mb-1">Team Chat</h3>
                <p className="text-indigo-100 text-[10px] sm:text-xs mb-4">Open the collaborative workspace chat.</p>
                <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">
                  Open Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )}

      <AnimatePresence>
        {showInviteModal && selectedTeam && (
          <InviteMemberModal
            teamId={selectedTeam.id}
            isOwner={selectedTeam.owner_id === user?.id}
            onClose={() => setShowInviteModal(false)}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateTaskModal && selectedTeam && (
          <CreateTaskModal
            teamId={selectedTeam.id}
            onClose={() => setShowCreateTaskModal(false)}
            onCreate={handleCreateTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* AI Assistant Floating Button */}
      {selectedTeam && (
        <button 
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center group z-[90]"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <div className="absolute right-full mr-4 px-3 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Team AI Assistant
          </div>
        </button>
      )}

      <AnimatePresence>
        {showAI && selectedTeam && (
          <AIAssistant teamId={selectedTeam.id} onClose={() => setShowAI(false)} />
        )}
      </AnimatePresence>

      {showChat && selectedTeam && (
          <TeamChatWindow
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone and will remove the task from the team's workspace."
        confirmText="Delete Task"
        variant="danger"
      />
    </div>
  );
};
