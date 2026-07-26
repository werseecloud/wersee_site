import React, { useState, useEffect, useRef } from 'react';
import { FileText, FileUp, Download, MessageSquare, Plus, Search, Filter, Trash2, Users, AtSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { PortalComments } from './PortalComments';

interface PortalDocsProps {
  businessId: string;
  user: any;
  teamMembers: any[];
}

export const PortalDocs: React.FC<PortalDocsProps> = ({ businessId, user, teamMembers }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    file: null as File | null,
    mentions: [] as string[]
  });
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = docs.find(d => d.id === selectedDocId);

  useEffect(() => {
    fetchDocs();

    // Real-time subscription
    const channel = supabase
      .channel(`portal-docs-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_docs',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchDocs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_docs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Error fetching docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newDoc.file || !newDoc.title) return;
    setUploading(true);
    try {
      const fileExt = newDoc.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `portals/${businessId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-assets')
        .upload(filePath, newDoc.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-assets')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('portal_docs')
        .insert({
          business_id: businessId,
          title: newDoc.title,
          description: newDoc.description,
          file_url: publicUrl,
          file_type: fileExt,
          mentions: newDoc.mentions,
          created_by: user.id
        });

      if (dbError) throw dbError;

      setShowUploadModal(false);
      setNewDoc({ title: '', description: '', file: null, mentions: [] });
      fetchDocs();
    } catch (error) {
      console.error('Error uploading doc:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleMention = (userId: string) => {
    if (newDoc.mentions.includes(userId)) {
      setNewDoc({ ...newDoc, mentions: newDoc.mentions.filter(id => id !== userId) });
    } else {
      setNewDoc({ ...newDoc, mentions: [...newDoc.mentions, userId] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Documents</h1>
          <p className="text-gray-500 text-sm">Share resources, guides, and important files with your team.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-gray-400">
            <Search className="w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder="Search docs..." 
              className="bg-transparent text-sm outline-none w-40 md:w-64"
            />
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                doc.file_type === 'pdf' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedDocId(doc.id)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-indigo-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">{doc.title}</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{doc.description || 'No description provided.'}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-gray-400">
                  {doc.created_by?.charAt(0) || 'U'}
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {doc.mentions?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400">{doc.mentions.length}</span>
                  </div>
                )}
                <button 
                  onClick={() => setSelectedDocId(doc.id)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Discuss</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {docs.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
            <FileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No documents shared yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Upload guides, resources, or PDFs to share them with your team.</p>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedDocId && selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDocId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 20 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{selectedDoc.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">Discussion & Feedback</p>
                </div>
                <button 
                  onClick={() => setSelectedDocId(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PortalComments 
                businessId={businessId}
                resourceType="doc"
                resourceId={selectedDocId}
                user={user}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Upload Document</h2>
              <p className="text-gray-400 mb-8 text-sm">Share a file with your team members.</p>

              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:border-indigo-500/50 hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{newDoc.file ? newDoc.file.name : 'Click to select file'}</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, Images, or Documents up to 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Document Title</label>
                  <input 
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="e.g. Onboarding Guide"
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Mentions (@)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newDoc.mentions.map(id => {
                      const member = teamMembers.find(m => m.user_id === id);
                      return (
                        <span key={id} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                          @{member?.user_name || id}
                          <button onClick={() => toggleMention(id)} className="hover:text-white">×</button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <AtSign className="w-4 h-4 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={mentionSearch}
                        onChange={(e) => {
                          setMentionSearch(e.target.value);
                          setShowMentionList(true);
                        }}
                        onFocus={() => setShowMentionList(true)}
                        placeholder="Mention team members..."
                        className="bg-transparent text-sm text-white outline-none flex-1"
                      />
                    </div>
                    <AnimatePresence>
                      {showMentionList && mentionSearch && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden z-10 shadow-2xl"
                        >
                          {teamMembers
                            .filter(m => m.user_name?.toLowerCase().includes(mentionSearch.toLowerCase()))
                            .map(member => (
                              <button
                                key={member.user_id}
                                onClick={() => {
                                  toggleMention(member.user_id);
                                  setMentionSearch('');
                                  setShowMentionList(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">
                                  {member.user_name?.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-white">{member.user_name}</span>
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading || !newDoc.file || !newDoc.title}
                    className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {uploading ? 'Uploading...' : 'Upload Now'}
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
