import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, Search, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { appToast, destructiveAction } from '@/lib/feedback';
export const TermsCreatorView: React.FC = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) {
        setTerms([]);
        return;
      }

      const { data, error } = await supabase
        .from('business_terms')
        .select('*')
        .eq('business_id', businessIdToUse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      appToast('Please provide both a title and content for the terms.');
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) throw new Error('No business found');

      // If setting as default, unset others first
      if (isDefault) {
        await supabase
          .from('business_terms')
          .update({ is_default: false })
          .eq('business_id', businessIdToUse);
      }

      const termData = {
        business_id: businessIdToUse,
        title,
        content,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      };

      let error;
      if (editingTerm) {
        const { error: updateError } = await supabase
          .from('business_terms')
          .update(termData)
          .eq('id', editingTerm.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('business_terms')
          .insert(termData);
        error = insertError;
      }

      if (error) throw error;

      setIsEditorOpen(false);
      setEditingTerm(null);
      setTitle('');
      setContent('');
      setIsDefault(false);
      fetchTerms();
    } catch (err) {
      console.error('Error saving terms:', err);
      appToast('Failed to save terms. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete these terms? This action cannot be undone.' }))) return;

    try {
      const { error } = await supabase
        .from('business_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTerms();
    } catch (err) {
      console.error('Error deleting terms:', err);
      appToast('Failed to delete terms.');
    }
  };

  const openEditor = (term: any = null) => {
    if (term) {
      setEditingTerm(term);
      setTitle(term.title);
      setContent(term.content);
      setIsDefault(term.is_default);
    } else {
      setEditingTerm(null);
      setTitle('');
      setContent('');
      setIsDefault(false);
    }
    setIsEditorOpen(true);
  };

  const filteredTerms = terms.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Terms Creator</h1>
          <p className="text-gray-400 text-sm mt-1">Manage terms and conditions for your proposals and contracts</p>
        </div>
        
        <button 
          onClick={() => openEditor()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Terms
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No terms found</h3>
          <p className="text-gray-400 max-w-md mb-6">
            {searchQuery 
              ? "We couldn't find any terms matching your search."
              : "You haven't created any terms and conditions yet. Create your first set of terms to use in proposals."}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => openEditor()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Terms
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerms.map((term) => (
            <div key={term.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors group relative">
              {term.is_default && (
                <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Default
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="pr-16">
                  <h3 className="font-medium text-white truncate">{term.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Updated {new Date(term.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                {term.content}
              </p>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={() => openEditor(term)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(term.id)}
                  className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isSaving && setIsEditorOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingTerm ? 'Edit Terms' : 'Create Terms'}
                </h2>
                <button 
                  onClick={() => !isSaving && setIsEditorOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Standard Web Design Terms"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your terms and conditions here..."
                    className="w-full h-64 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">You can paste plain text or basic markdown here.</p>
                </div>

                <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.07] transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Set as Default</div>
                    <div className="text-xs text-gray-400">Automatically select these terms for new proposals</div>
                  </div>
                </label>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Terms'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
