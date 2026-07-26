import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Eye, Layout, Users, Settings, Image as ImageIcon, Loader2, ArrowLeft, Lock, Globe, Hash, Megaphone, ArrowUp, ScrollText, Plus, Mic, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FileUpload } from '../FileUpload';

import { appToast } from '@/lib/feedback';
interface CommunityEditorProps {
  communityId: string;
  onClose: () => void;
}

export const CommunityEditor: React.FC<CommunityEditorProps> = ({ communityId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'settings'>('details');
  const [community, setCommunity] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cover_image: '',
    privacy: 'public', // public, private
    price: '', // if paid
    member_count: 0,
    custom_url: '',
  });

  useEffect(() => {
    fetchCommunity();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      setCommunity(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        cover_image: data.cover_image || '',
        privacy: data.privacy || 'public',
        price: data.price || '',
        member_count: data.member_count || 0,
        custom_url: data.custom_url || '',
      });
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: formData.name,
          description: formData.description,
          banner_url: formData.cover_image,
          price: formData.price ? parseFloat(formData.price) : null,
          custom_url: formData.custom_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', communityId);

      if (error) throw error;
      // Optional: Show success toast
    } catch (error) {
      console.error('Error saving community:', error);
      appToast('Failed to save community');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => (
    <div className="bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-[600px] flex font-sans relative">
      {/* Sidebar */}
      <div className="w-48 bg-[#d9d9d9] flex flex-col overflow-hidden shrink-0 z-10 rounded-r-[20px]">
        <div className="p-3 flex-1 flex flex-col overflow-y-auto scrollbar-hide gap-2">
          {/* Banner & Header */}
          <div className="w-full h-20 bg-[#c4c4c4] rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative">
            {formData.cover_image ? (
              <img src={formData.cover_image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-black/50 font-bold text-[10px]">[banner community]</span>
            )}
          </div>

          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-black text-black leading-tight truncate">{formData.name || '[community name]'}</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#00ff00]"></div>
            <span className="text-[10px] font-medium text-black/70">[users]</span>
          </div>

          {/* Special Channels */}
          <div className="flex flex-col gap-1 mt-1 shrink-0">
            <div className="w-full py-1.5 px-2 bg-[#c4c4c4] rounded-lg text-left text-[10px] font-medium text-black/80">
              [announcements]
            </div>
            <div className="w-full py-1.5 px-2 flex items-center gap-1 text-left text-[10px] font-medium text-black/80">
              <FileText className="w-3 h-3" />
              [rules]
            </div>
          </div>

          <div className="w-full h-px bg-black/10 my-1 shrink-0" />

          {/* Text Channels */}
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="px-1 mb-0.5 text-[8px] font-bold text-black/40 uppercase tracking-widest">channels</div>
            <div className="w-full py-1 px-2 rounded-lg bg-black/10 text-[10px] font-medium text-black">
              [general]
            </div>
            <div className="w-full py-1 px-2 rounded-lg text-[10px] font-medium text-black/60">
              [feedback]
            </div>
            <div className="w-full py-1 px-2 rounded-lg text-[10px] font-medium text-black/60">
              [random]
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-black">
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col justify-end">
          <div className="flex flex-col items-start max-w-[85%]">
            <div className="bg-[#b8b8b8] text-black p-3 rounded-[1.5rem] rounded-tl-sm text-[10px] font-medium shadow-sm min-w-[150px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-black rounded-md shrink-0"></div>
                <div className="font-black text-black text-xs">other message</div>
              </div>
              Welcome to {formData.name || 'Community'}!
            </div>
            <span className="text-[7px] font-bold text-gray-500 mt-1 px-2 uppercase tracking-widest">Inhoud</span>
          </div>
          
          <div className="flex flex-col items-end self-end max-w-[85%]">
            <div className="bg-[#9fb0a2] text-black p-3 rounded-[1.5rem] rounded-tr-sm text-[10px] font-medium shadow-sm min-w-[150px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-black rounded-md shrink-0"></div>
                <div className="font-black text-black text-xs">Your message</div>
              </div>
              Looks great!
            </div>
            <span className="text-[7px] font-bold text-gray-500 mt-1 px-2 uppercase tracking-widest">Inhoud</span>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 shrink-0">
          <div className="bg-[#333333] rounded-[1.5rem] p-1 flex items-center h-10 px-3">
            <div className="flex-1 text-[#9CA3AF] text-[10px] font-medium">type a message...</div>
            <div className="w-6 h-6 bg-[#d9d9d9] rounded-full flex items-center justify-center shrink-0">
               <ArrowUp className="w-3 h-3 text-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Edit Community</h1>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <span className="text-sm text-gray-500">{formData.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {saving ? 'Saving...' : 'All changes saved'}
          </span>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-white/10 bg-[#141414] p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'details' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4" /> Details
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-8 border-r border-white/10">
            <div className="max-w-2xl mx-auto space-y-8">
              {activeTab === 'details' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Community Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={6}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                    <FileUpload 
                      bucket="communities"
                      onUpload={(url) => setFormData({...formData, cover_image: url})}
                      label="Upload Cover Image"
                      accept="image/*"
                      darkMode={true}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Access & Privacy</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Custom URL</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 bg-[#141414] border border-white/10 rounded-l-xl p-4 border-r-0">wersee.com/c/</span>
                        <input 
                          type="text" 
                          value={formData.custom_url}
                          onChange={(e) => setFormData({...formData, custom_url: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                          placeholder="my-awesome-community"
                          className="flex-1 bg-[#141414] border border-white/10 rounded-r-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Create a memorable link for your community. Only lowercase letters, numbers, and hyphens.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Privacy</label>
                      <select 
                        value={formData.privacy}
                        onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                      >
                        <option value="public">Public (Anyone can join)</option>
                        <option value="private">Private (Invite only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Price (€)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="Leave empty for free"
                        className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-2">Set a price to charge for membership. Leave empty for free communities.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Preview Area */}
          <div className="w-[400px] bg-[#0A0A0A] p-8 hidden xl:block overflow-y-auto">
            <div className="sticky top-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</h3>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
