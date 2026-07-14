import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Layout, Save, Loader2, Image as ImageIcon, Type, Palette } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { appToast } from '@/lib/feedback';
export const SiteEditorView = () => {
  const { businessId } = useParams();
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get business first
      let bId = businessId;
      if (!bId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: bData } = await supabase.from('businesses').select('id').eq('user_id', user.id).limit(1).maybeSingle();
          if (bData) bId = bData.id;
        }
      } else {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
        let query = supabase.from('businesses').select('id');
        if (isUUID) {
          query = query.or(`slug.eq.${businessId},id.eq.${businessId}`);
        } else {
          query = query.eq('slug', businessId);
        }
        const { data: bData } = await query.maybeSingle();
        if (bData) bId = bData.id;
      }

      if (bId) {
        setBusiness({ id: bId });
        const { data: contentData, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('business_id', bId)
          .maybeSingle();
          
        if (error && error.code !== '42P01') throw error; // Ignore table not found if it hasn't been created yet
        
        if (contentData) {
          setSiteContent(contentData);
        } else {
          setSiteContent({
            hero_title: 'Welcome to our store',
            hero_subtitle: 'Discover our amazing products and services.',
            hero_image_url: '',
            about_text: 'We are a company dedicated to providing the best products.',
            about_image_url: '',
            features: [],
            theme_color: '#4F46E5',
            business_id: bId
          });
        }
      }
    } catch (err) {
      console.error('Error fetching site content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !siteContent) return;

    try {
      setSaving(true);
      
      if (siteContent.id) {
        await supabase.from('site_content').update(siteContent).eq('id', siteContent.id);
      } else {
        const { data, error } = await supabase.from('site_content').insert([siteContent]).select().single();
        if (error) throw error;
        setSiteContent(data);
      }
      
      appToast('Site content saved successfully!');
    } catch (err) {
      console.error('Error saving site content:', err);
      appToast('Failed to save site content.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Site Editor</h2>
          <p className="text-gray-400">Customize the appearance and content of your public storefront.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Hero Section */}
            <div className="bg-[#111] p-8 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Type className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Hero Section</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hero Title</label>
                  <input 
                    type="text" 
                    value={siteContent?.hero_title || ''} 
                    onChange={e => setSiteContent({...siteContent, hero_title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Main headline for your store"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hero Subtitle</label>
                  <textarea 
                    value={siteContent?.hero_subtitle || ''} 
                    onChange={e => setSiteContent({...siteContent, hero_subtitle: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                    placeholder="A brief description of what you offer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hero Image URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      value={siteContent?.hero_image_url || ''} 
                      onChange={e => setSiteContent({...siteContent, hero_image_url: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {siteContent?.hero_image_url ? (
                        <img src={siteContent.hero_image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-[#111] p-8 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Layout className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">About Section</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">About Text</label>
                  <textarea 
                    value={siteContent?.about_text || ''} 
                    onChange={e => setSiteContent({...siteContent, about_text: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 min-h-[150px]"
                    placeholder="Tell your story..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">About Image URL</label>
                  <div className="flex gap-3">
                    <input 
                      type="url" 
                      value={siteContent?.about_image_url || ''} 
                      onChange={e => setSiteContent({...siteContent, about_image_url: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="https://example.com/about.jpg"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {siteContent?.about_image_url ? (
                        <img src={siteContent.about_image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Palette className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Theme & Colors</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Primary Theme Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={siteContent?.theme_color || '#4F46E5'} 
                  onChange={e => setSiteContent({...siteContent, theme_color: e.target.value})}
                  className="w-12 h-12 rounded-xl border-0 bg-transparent cursor-pointer"
                />
                <input 
                  type="text" 
                  value={siteContent?.theme_color || '#4F46E5'} 
                  onChange={e => setSiteContent({...siteContent, theme_color: e.target.value})}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-3xl border border-indigo-500/20">
            <h3 className="text-lg font-bold text-white mb-2">Preview Your Site</h3>
            <p className="text-sm text-gray-400 mb-6">See how your storefront looks to customers with these changes.</p>
            <button 
              onClick={() => window.open(`/${business?.slug || business?.id}`, '_blank')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors border border-white/10"
            >
              Open Live Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
