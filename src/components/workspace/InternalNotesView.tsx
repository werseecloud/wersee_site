import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Trash2, Edit2, X, User, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SaveStateButton, type SaveState } from '../ui/SaveStateButton';

import { appToast, destructiveAction } from '@/lib/feedback';
interface InternalNote {
  id: string;
  title: string;
  content: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export const InternalNotesView = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<InternalNote | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [] as string[] });
  const [createSaveState, setCreateSaveState] = useState<SaveState>('idle');
  const [editSaveState, setEditSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('internal_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;
      if (data) {
        setNotes(data.map((note: any) => ({
          ...note,
          title: note.title || note.client_name || 'Untitled note',
          tags: note.tags || (note.category && note.category !== 'general' ? [note.category] : []),
        })));
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) return;

    setCreateSaveState('saving');
    try {
      const { data, error } = await supabase
        .from('internal_notes')
        .insert([{
          client_name: newNote.title.trim(),
          content: newNote.content.trim(),
          category: newNote.tags[0] || 'general',
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const savedNote = { ...data, title: data.client_name, tags: data.category === 'general' ? [] : [data.category] };
        setNotes([savedNote, ...notes]);
        setCreateSaveState('saved');
        await new Promise((resolve) => setTimeout(resolve, 550));
        setIsAdding(false);
        setNewNote({ title: '', content: '', tags: [] });
        setCreateSaveState('idle');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setCreateSaveState('error');
      appToast(error instanceof Error ? error.message : 'The note could not be saved');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setEditSaveState('saving');
    try {
      const { error } = await supabase
        .from('internal_notes')
        .update({
          client_name: editingNote.title,
          content: editingNote.content,
          category: editingNote.tags?.[0] || 'general',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id);

      if (error) throw error;
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, updated_at: new Date().toISOString() } : n));
      setEditSaveState('saved');
      await new Promise((resolve) => setTimeout(resolve, 550));
      setEditingNote(null);
      setEditSaveState('idle');
    } catch (error) {
      console.error('Error updating note:', error);
      setEditSaveState('error');
      appToast(error instanceof Error ? error.message : 'The note could not be updated');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this note?' }))) return;

    try {
      const { error } = await supabase
        .from('internal_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <StickyNote className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Internal Notes</h1>
            <p className="text-sm text-gray-400">Manage client observations and internal documentation.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#141414] border border-white/5 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-[#141414] border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#141414] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Note</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                type="text"
                placeholder="Note Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
              />
              <textarea 
                placeholder="Write your note here..."
                rows={4}
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-400 hover:text-white font-medium">Cancel</button>
                <SaveStateButton
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!newNote.title.trim() || !newNote.content.trim()}
                  state={createSaveState}
                  idleLabel="Save Note"
                  savedLabel="Note saved"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
          <StickyNote className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No notes found</h3>
          <p className="text-gray-500">Create your first internal note to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <motion.div 
              layout
              key={note.id}
              className="bg-[#141414] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <StickyNote className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingNote(note)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{note.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed">{note.content}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
                {note.contact_id && (
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <User className="w-3 h-3" />
                    Linked Client
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white">Edit Note</h3>
                <button onClick={() => setEditingNote(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
                  <input 
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Content</label>
                  <textarea 
                    rows={8}
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button onClick={() => setEditingNote(null)} className="px-6 py-2.5 text-gray-400 hover:text-white font-bold">Cancel</button>
                  <SaveStateButton
                    type="button"
                    onClick={handleUpdateNote}
                    disabled={!editingNote.title.trim() || !editingNote.content.trim()}
                    state={editSaveState}
                    idleLabel="Save Changes"
                    savedLabel="Note saved"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
