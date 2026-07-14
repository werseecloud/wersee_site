import React, { useState, useEffect } from 'react';
import { 
  Filter, Plus, Search, Trash2, ChevronRight, 
  MoreVertical, Save, ArrowLeft, Loader2,
  Folder, List, Calendar, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { destructiveAction } from '@/lib/feedback';
interface Project {
  id: string;
  team_id: string;
  name: string;
  description: string;
  created_at: string;
}

interface TeamProjectsViewProps {
  teamId: string;
}

export const TeamProjectsView: React.FC<TeamProjectsViewProps> = ({ teamId }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [teamId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          team_id: teamId,
          name: newName,
          description: newDescription
        })
        .select()
        .single();

      if (error) throw error;
      setProjects([data, ...projects]);
      setIsCreating(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this project? All associated tasks will be unassigned from this project.' }))) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search projects..."
            className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/10"
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#141414] p-6 rounded-3xl border border-indigo-500/30 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Project Name</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter project name..."
                  autoFocus
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Description</label>
                <input 
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={!newName.trim() || saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="bg-[#141414] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Folder className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
                className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-white mb-2">{project.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description || 'No description provided.'}</p>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest">
                  <List className="w-3 h-3" />
                  Tasks
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <Folder className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No projects found. Create your first one to group tasks!</p>
          </div>
        )}
      </div>
    </div>
  );
};
