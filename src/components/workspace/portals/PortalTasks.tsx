import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Clock, User, MoreHorizontal, Filter, Search, CheckCircle2, AlertCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { PortalComments } from './PortalComments';

interface PortalTasksProps {
  businessId: string;
  user: any;
  teamMembers: any[];
}

export const PortalTasks: React.FC<PortalTasksProps> = ({ businessId, user, teamMembers }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    fetchTasks();

    // Real-time subscription
    const channel = supabase
      .channel(`portal-tasks-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_tasks',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, activeFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('portal_tasks')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (activeFilter === 'pending') query = query.eq('is_done', false);
      if (activeFilter === 'completed') query = query.eq('is_done', true);

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      const { error } = await supabase
        .from('portal_tasks')
        .insert({
          business_id: businessId,
          title: newTask.title,
          description: newTask.description,
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null,
          created_by: user.id
        });

      if (error) throw error;
      setShowAddModal(false);
      setNewTask({ title: '', description: '', assigned_to: '', due_date: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('portal_tasks')
        .update({ is_done: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_done: !currentStatus } : t));
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Team Tasks</h1>
          <p className="text-gray-500 text-sm">Assign tasks, track progress, and hit your deadlines.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            {['all', 'pending', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === f ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all ${
              task.is_done ? 'opacity-50' : ''
            }`}
          >
            <div className="p-6 flex items-start gap-6">
              <button 
                onClick={() => toggleTaskStatus(task.id, task.is_done)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  task.is_done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                }`}
              >
                {task.is_done ? <CheckCircle2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-lg font-bold text-white transition-all ${task.is_done ? 'line-through text-gray-500' : 'group-hover:text-indigo-400'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button className="p-1 text-gray-500 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm text-gray-500 mb-4 line-clamp-2 ${task.is_done ? 'line-through' : ''}`}>
                  {task.description || 'No description provided.'}
                </p>
                
                <div className="flex flex-wrap items-center gap-6">
                  {task.assigned_to && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-gray-400">
                        {teamMembers.find(m => m.user_id === task.assigned_to)?.user_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {teamMembers.find(m => m.user_id === task.assigned_to)?.user_name || 'Assigned'}
                      </span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Created by {task.created_by === user.id ? 'You' : 'Admin'}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedTaskId === task.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 bg-white/[0.01]"
                >
                  <div className="p-6">
                    <PortalComments 
                      businessId={businessId}
                      resourceType="task"
                      resourceId={task.id}
                      user={user}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
            <CheckSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No tasks found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Create tasks to keep your team organized and productive.</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Create Task</h2>
              <p className="text-gray-400 mb-8 text-sm">Assign a new task to your team.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Task Title</label>
                  <input 
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g. Finish Market Analysis"
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Provide details..."
                    rows={3}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Assign To</label>
                    <select 
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#111]">Unassigned</option>
                      {teamMembers.map(member => (
                        <option key={member.user_id} value={member.user_id} className="bg-[#111]">
                          {member.user_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Due Date</label>
                    <input 
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddTask}
                    className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
