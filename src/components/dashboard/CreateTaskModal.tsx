import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, User, Folder, Repeat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SaveStateButton, type SaveState } from '../ui/SaveStateButton';

interface CreateTaskModalProps {
  teamId: string;
  onClose: () => void;
  onCreate: (
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
  ) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ teamId, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [dependencyTaskId, setDependencyTaskId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submitError, setSubmitError] = useState('');
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
  const [members, setMembers] = useState<{ id: string, email: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: string, title: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('team_id', teamId);
      setProjects(projectsData || []);

      // Fetch team members
      const { data: membersData } = await supabase
        .from('team_members')
        .select('user_id, email')
        .eq('team_id', teamId);
      setMembers(membersData?.filter((member) => member.user_id).map((member) => ({ id: member.user_id, email: member.email })) || []);

      // Fetch existing tasks for subtasks/dependencies
      const { data: tasksData } = await supabase
        .from('team_tasks')
        .select('id, title')
        .eq('team_id', teamId)
        .eq('status', 'todo');
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching modal data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setSaveState('saving');
    setSubmitError('');
    try {
      await onCreate(
        title, 
        priority, 
        deadline || undefined, 
        category.trim() || undefined,
        projectId || undefined,
        assignedTo || undefined,
        isRecurring,
        isRecurring ? recurrenceRule : undefined,
        parentTaskId || undefined,
        dependencyTaskId || undefined
      );
      setSaveState('saved');
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setSaveState('error');
      setSubmitError(error instanceof Error ? error.message : 'The task could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Create New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        priority === p
                          ? p === 'high' ? 'bg-red-500/20 border-red-500 text-red-500' :
                            p === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                            'bg-blue-500/20 border-blue-500 text-blue-500'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assign To</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Project</label>
                <div className="relative">
                  <Folder className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Parent Task</label>
                  <select
                    value={parentTaskId}
                    onChange={(e) => setParentTaskId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">None</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Dependency</label>
                  <select
                    value={dependencyTaskId}
                    onChange={(e) => setDependencyTaskId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">None</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Repeat className={`w-5 h-5 ${isRecurring ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-white">Recurring Task</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Repeat this task automatically</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isRecurring ? 'bg-indigo-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isRecurring ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {isRecurring && (
                <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                  <label className="block text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-2">Recurrence Rule</label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <SaveStateButton
              type="submit"
              disabled={loading || !title.trim()}
              state={saveState}
              idleLabel="Create Task"
              savingLabel="Creating…"
              savedLabel="Task created"
              errorLabel="Try again"
              className="flex-1"
            />
          </div>
        </form>
      </motion.div>
    </div>
  );
};

