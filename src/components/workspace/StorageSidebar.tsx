import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Link as LinkIcon, Download, Globe, Mail, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { destructiveAction } from '@/lib/feedback';
interface StorageSidebarProps {
  item: any;
  onClose: () => void;
}

export const StorageSidebar = ({ item, onClose }: StorageSidebarProps) => {
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<any>(null);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      fetchShareSettings();
    }
  }, [item]);

  const handleCopy = () => {
    const link = `${window.location.origin}/share/${shareData.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchShareSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const path = [user.id, item.path].join('/');
      
      const { data, error } = await supabase
        .from('shared_files')
        .select('*')
        .eq('file_path', path)
        .single();

      if (data) {
        setShareData(data);
      } else {
        setShareData(null);
      }
    } catch (err) {
      console.error('Error fetching share settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = crypto.randomUUID().replace(/-/g, '');
      const path = [user.id, item.path].join('/');

      const { data, error } = await supabase
        .from('shared_files')
        .insert({
          user_id: user.id,
          file_path: path,
          is_folder: item.isFolder,
          share_token: token,
          is_public: false,
          is_downloadable: true,
          allowed_emails: []
        })
        .select()
        .single();

      if (error) throw error;
      setShareData(data);
    } catch (err) {
      console.error('Error creating share link:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async (updates: any) => {
    if (!shareData) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('shared_files')
        .update(updates)
        .eq('id', shareData.id)
        .select()
        .single();

      if (error) throw error;
      setShareData(data);
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    if (shareData?.allowed_emails?.includes(newEmail)) return;

    const updatedEmails = [...(shareData?.allowed_emails || []), newEmail];
    updateSettings({ allowed_emails: updatedEmails });
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    const updatedEmails = shareData?.allowed_emails?.filter((e: string) => e !== emailToRemove) || [];
    updateSettings({ allowed_emails: updatedEmails });
  };

  const deleteShare = async () => {
    if (!shareData) return;
    if (!(await destructiveAction({ description: 'Are you sure you want to remove sharing? The link will no longer work.' }))) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_files')
        .delete()
        .eq('id', shareData.id);

      if (error) throw error;
      setShareData(null);
    } catch (err) {
      console.error('Error deleting share:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 border-l border-white/5 bg-[#0A0A0A] flex flex-col shrink-0 h-full overflow-y-auto"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10">
        <h2 className="font-bold text-lg truncate pr-4">{item.name}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sharing Settings</h3>
            <p className="text-[10px] text-gray-500 font-mono">Manage access & permissions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : !shareData ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-6">This item is currently private.</p>
            <button 
              onClick={createShareLink}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Link Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Shareable Link</label>
              <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-2">
                <LinkIcon className="w-4 h-4 text-gray-500 ml-2 shrink-0" />
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/share/${shareData.share_token}`}
                  className="bg-transparent flex-1 outline-none text-xs text-gray-400 font-mono"
                />
              </div>
              <button 
                onClick={handleCopy}
                className={`w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Access Control</label>
              
              <div 
                onClick={() => updateSettings({ is_public: !shareData.is_public })}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${shareData.is_public ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${shareData.is_public ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Public Access</div>
                    <div className="text-[10px] text-gray-500">Anyone with the link can view</div>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${shareData.is_public ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${shareData.is_public ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div 
                onClick={() => updateSettings({ is_downloadable: !shareData.is_downloadable })}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${shareData.is_downloadable ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${shareData.is_downloadable ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'}`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Allow Downloads</div>
                    <div className="text-[10px] text-gray-500">Viewers can download files</div>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${shareData.is_downloadable ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${shareData.is_downloadable ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            {/* Specific Emails */}
            {!shareData.is_public && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Restricted Access</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Invite by email..."
                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <button 
                    onClick={addEmail}
                    disabled={!newEmail || !newEmail.includes('@') || saving}
                    className="p-2 bg-white text-black hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {shareData.allowed_emails?.length === 0 ? (
                    <div className="text-center py-4">
                      <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">No one invited yet</p>
                    </div>
                  ) : (
                    shareData.allowed_emails?.map((email: string) => (
                      <div key={email} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 capitalize">
                            {email[0]}
                          </div>
                          <span className="text-xs truncate text-gray-300">{email}</span>
                        </div>
                        <button 
                          onClick={() => removeEmail(email)}
                          disabled={saving}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/5">
              <button 
                onClick={deleteShare}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove Link
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
