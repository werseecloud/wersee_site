import React, { useState } from 'react';
import { X, Save, MapPin, Globe, User, Image as ImageIcon, Twitter, Instagram, Linkedin, Youtube, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { FileUpload } from '../FileUpload';
import { supabase } from '../../lib/supabase';
import { motion } from 'motion/react';

import { appToast } from '@/lib/feedback';
interface ProfileBuilderProps {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ProfileBuilder = ({ initialData, onSave, onCancel }: ProfileBuilderProps) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || initialData?.name || '',
    username: initialData?.username || '',
    bio: initialData?.bio || '',
    location: initialData?.location || '',
    website: initialData?.website || '',
    avatar_url: initialData?.avatar_url || '',
    banner_url: initialData?.banner_url || initialData?.cover_url || '',
    socials: initialData?.socials || { twitter: '', instagram: '', linkedin: '', youtube: '' }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const updates = {
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      onSave(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      appToast('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border ${
          isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`px-8 py-6 border-b flex items-center justify-between ${
          isDark ? 'border-white/5 bg-[#0A0A0A]' : 'border-gray-100 bg-white'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Edit Profile</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customize how others see you on Wersee.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className={`p-2.5 rounded-full transition-all ${
                isDark 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-black'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${
                isDark 
                  ? 'bg-white text-black hover:bg-gray-200 shadow-white/5' 
                  : 'bg-black text-white hover:bg-gray-800 shadow-black/10'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
          <div className="p-6 sm:p-10 space-y-12">
            
            {/* Visual Identity Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Visual Identity</h3>
                <div className="h-px flex-1 bg-white/5 mx-6" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#C9A84C]">Step 01</span>
              </div>
              
              <div className="rounded-[2.5rem] border border-white/10 overflow-hidden relative group bg-[#0A0A0A] shadow-2xl">
                {/* Banner */}
                <div className="h-48 sm:h-72 relative bg-[#111] overflow-hidden">
                  {formData.banner_url ? (
                    <img src={formData.banner_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-black flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                    <FileUpload
                      bucket="profile-images"
                      onUpload={(url) => setFormData({ ...formData, banner_url: url })}
                      label="Change Cover"
                      accept=".jpg,.png,.webp"
                      maxSizeMB={5}
                      darkMode={true}
                      compact
                    />
                  </div>
                </div>

                {/* Avatar */}
                <div className="px-6 sm:px-10 pb-10 relative">
                  <div className="absolute -top-12 sm:-top-20 left-6 sm:left-10">
                    <div className="relative group/avatar">
                      <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[3rem] border-4 border-[#0A0A0A] overflow-hidden shadow-2xl bg-[#1A1A1A]">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C9A84C] to-[#8A6D2D]">
                            <span className="text-3xl sm:text-5xl font-black text-white italic uppercase">{formData.full_name?.[0] || 'U'}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm cursor-pointer">
                        <FileUpload
                          bucket="profile-images"
                          onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
                          label=""
                          accept=".jpg,.png,.webp"
                          maxSizeMB={2}
                          darkMode={true}
                          compact
                          iconOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-16 sm:pt-24">
                    <h4 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">
                      {formData.full_name || 'Your Name'}
                    </h4>
                    <p className="text-sm font-bold text-[#C9A84C] tracking-widest">
                      @{formData.username || 'username'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Basic Info */}
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Core Details</h3>
                  <div className="h-px flex-1 bg-white/5 mx-6" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#C9A84C]">Step 02</span>
                </div>

                <div className="p-8 rounded-[2.5rem] border border-white/10 bg-[#0A0A0A] space-y-6 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Display Name</label>
                      <input 
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#C9A84C]">@</span>
                        <input 
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                          className="w-full pl-10 bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Bio / Story</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={5}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-medium outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all resize-none leading-relaxed"
                      placeholder="Tell the world who you are..."
                    />
                    <div className="flex justify-end pr-2">
                      <span className={`text-[10px] font-black ${formData.bio.length > 160 ? 'text-red-500' : 'text-gray-600'}`}>
                        {formData.bio.length} / 160
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full pl-12 bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full pl-12 bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Socials */}
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Social Presence</h3>
                  <div className="h-px flex-1 bg-white/5 mx-6" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#C9A84C]">Step 03</span>
                </div>

                <div className="p-8 rounded-[2.5rem] border border-white/10 bg-[#0A0A0A] space-y-5 shadow-xl">
                  {[
                    { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: '@username' },
                    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
                    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'Profile URL' },
                    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'Channel URL' }
                  ].map((platform) => (
                    <div key={platform.key} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">{platform.label}</label>
                      <div className="relative">
                        <platform.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="text"
                          value={formData.socials?.[platform.key] || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            socials: { ...formData.socials, [platform.key]: e.target.value } 
                          })}
                          className="w-full pl-12 bg-white/5 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                          placeholder={platform.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
