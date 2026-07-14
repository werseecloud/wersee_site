import React, { useState, useEffect } from 'react';
import { 
  Copy, Plus, Trash2, Layout, 
  CheckCircle, FileText, Folder,
  Loader2, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Template {
  id: string;
  team_id: string;
  name: string;
  description: string;
  type: 'project' | 'task' | 'document';
  content: any;
}

interface TemplateManagerProps {
  teamId: string;
  onApply: (template: Template) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ teamId, onApply }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'task' as const,
    content: {}
  });

  useEffect(() => {
    fetchTemplates();
  }, [teamId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('team_id', teamId);
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          ...newTemplate,
          team_id: teamId,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setTemplates([...templates, data]);
      setShowCreate(false);
      setNewTemplate({ name: '', description: '', type: 'task', content: {} });
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layout className="w-4 h-4 text-indigo-400" />
          Templates
        </h3>
        <button 
          onClick={() => setShowCreate(true)}
          className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreate && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <input 
            type="text"
            placeholder="Template Name"
            value={newTemplate.name}
            onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          />
          <select 
            value={newTemplate.type}
            onChange={e => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          >
            <option value="task">Task Template</option>
            <option value="project">Project Template</option>
            <option value="document">Document Template</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={handleCreate}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Save Template
            </button>
            <button 
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {templates.map(template => (
          <div 
            key={template.id}
            className="group flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                {template.type === 'task' ? <CheckCircle className="w-4 h-4" /> :
                 template.type === 'project' ? <Folder className="w-4 h-4" /> :
                 <FileText className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{template.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{template.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onApply(template)}
                className="p-1.5 hover:bg-white/10 text-indigo-400 rounded-lg"
                title="Apply Template"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(template.id)}
                className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && !showCreate && (
          <p className="text-center py-4 text-xs text-gray-500 italic">No templates saved yet.</p>
        )}
      </div>
    </div>
  );
};
