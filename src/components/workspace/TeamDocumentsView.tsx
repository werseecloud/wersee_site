import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Clock, MessageSquare, 
  Trash2, ChevronRight, History, Share2, 
  MoreVertical, Save, ArrowLeft, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DocumentEditor } from '../dashboard/DocumentEditor';

import { destructiveAction } from '@/lib/feedback';
interface Document {
  id: string;
  team_id: string;
  title: string;
  content: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Version {
  id: string;
  document_id: string;
  content: any;
  created_by: string;
  created_at: string;
}

interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  position: any;
  created_at: string;
}

interface TeamDocumentsViewProps {
  teamId: string;
}

export const TeamDocumentsView: React.FC<TeamDocumentsViewProps> = ({ teamId }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [teamId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_documents')
        .select('*')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('team_documents')
        .insert({
          team_id: teamId,
          title: newTitle,
          content: { type: 'doc', content: [] },
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setDocuments([data, ...documents]);
      setSelectedDoc(data);
      setIsCreating(false);
      setNewTitle('');
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      // Save current version
      await supabase.from('document_versions').insert({
        document_id: selectedDoc.id,
        content: selectedDoc.content,
        created_by: user?.id
      });

      // Update document
      const { error } = await supabase
        .from('team_documents')
        .update({
          title: selectedDoc.title,
          content: selectedDoc.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;
      
      setDocuments(documents.map(d => d.id === selectedDoc.id ? selectedDoc : d));
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this document?' }))) return;
    try {
      const { error } = await supabase.from('team_documents').delete().eq('id', id);
      if (error) throw error;
      setDocuments(documents.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const fetchVersions = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchComments = async (docId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedDoc || !newComment.trim()) return;
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          document_id: selectedDoc.id,
          user_id: user?.id,
          content: newComment
        })
        .select()
        .single();
      if (error) throw error;
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (selectedDoc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={selectedDoc.title}
              onChange={(e) => setSelectedDoc({ ...selectedDoc, title: e.target.value })}
              className="bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-white/20 px-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowVersions(!showVersions);
                if (!showVersions) fetchVersions(selectedDoc.id);
              }}
              className={`p-2 rounded-lg transition-colors ${showVersions ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:bg-white/5'}`}
              title="Version History"
            >
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSaveDocument}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <DocumentEditor 
              content={selectedDoc.content}
              onChange={(content) => setSelectedDoc({ ...selectedDoc, content })}
            />
          </div>
          <div className="space-y-6">
            {showVersions ? (
              <div className="bg-[#141414] rounded-2xl border border-white/5 p-4">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History
                </h3>
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer group">
                      <p className="text-xs text-white font-medium">
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-500">by {v.created_by?.split('-')[0]}</p>
                    </div>
                  ))}
                  {versions.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No versions yet.</p>}
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] rounded-2xl border border-white/5 p-4">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {comments.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-400">{c.user_id?.split('-')[0]}</span>
                        <span className="text-[9px] text-gray-600">{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-300 bg-white/5 p-2 rounded-lg">{c.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No comments yet.</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-white/20 resize-none h-20"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-full py-2 bg-white/5 text-white rounded-lg text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
            placeholder="Search documents..."
            className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/10"
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#141414] p-4 rounded-2xl border border-indigo-500/30 flex items-center gap-4"
          >
            <input 
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter document title..."
              autoFocus
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateDocument}
                disabled={!newTitle.trim() || saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => {
              setSelectedDoc(doc);
              fetchComments(doc.id);
            }}
            className="bg-[#141414] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDocument(doc.id);
                }}
                className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-white mb-2 truncate">{doc.title}</h3>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(doc.updated_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <MessageSquare className="w-3 h-3" />
                  {/* We'd need to fetch comment counts or store them */}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No documents found. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};
