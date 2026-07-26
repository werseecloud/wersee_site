import React, { useState, useEffect } from 'react';
import { Globe, Plus, Layout, Type, Image as ImageIcon, MousePointer2, Save, Eye, Rocket, Trash2, ChevronUp, ChevronDown, Settings, Loader2, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

import { appToast } from '@/lib/feedback';
interface Section {
  id: string;
  type: 'hero' | 'features' | 'content' | 'cta' | 'footer';
  content: any;
}

interface Website {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const WebsitesBuilderView = () => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [currentWebsite, setCurrentWebsite] = useState<Website | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState('');

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user]);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.get<Website>('websites', {
        eq: { user_id: user?.id },
        order: { column: 'created_at', ascending: false }
      });

      setWebsites(Array.isArray(data) ? data.filter(Boolean) : []);
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (websiteId: string) => {
    try {
      const data = await DatabaseService.get<Section>('website_sections', {
        eq: { website_id: websiteId },
        order: { column: 'order_index', ascending: true }
      });

      setSections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleCreateWebsite = async () => {
    if (!newWebsiteName) return;
    setSaving(true);
    try {
      const newSite = await DatabaseService.insert<Website>('websites', { 
        name: newWebsiteName, 
        user_id: user?.id,
        status: 'draft'
      });

      if (!newSite?.id) throw new Error('Website was created without a usable response.');
      setWebsites([newSite, ...websites]);
      handleSelectWebsite(newSite);
      setIsAdding(false);
      setNewWebsiteName('');
      appToast('Website created.', 'success');
    } catch (error) {
      console.error('Error creating website:', error);
      appToast('The website could not be created.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectWebsite = (website: Website) => {
    setCurrentWebsite(website);
    fetchSections(website.id);
  };

  const handleSave = async () => {
    if (!currentWebsite) return false;
    setSaving(true);
    try {
      // Delete existing sections and re-insert (simplest way for a builder)
      await DatabaseService.delete('website_sections', currentWebsite.id, 'website_id');

      const sectionsToInsert = sections.map((s, index) => ({
        website_id: currentWebsite.id,
        type: s.type,
        content: s.content,
        order_index: index
      }));

      if (sectionsToInsert.length > 0) {
        await DatabaseService.insert('website_sections', sectionsToInsert);
      }

      appToast('Website saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving website:', error);
      appToast('Failed to save website.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentWebsite) return;
    setSaving(true);
    try {
      const saved = await handleSave();
      if (!saved) return;
      const updated = await DatabaseService.update<Website>('websites', currentWebsite.id, {
        status: 'published',
        updated_at: new Date().toISOString(),
      });
      if (!updated) throw new Error('Website publish returned no row.');
      setCurrentWebsite(updated);
      setWebsites((current) => current.map((site) => site.id === updated.id ? updated : site));
      appToast('Website published.', 'success');
    } catch (error) {
      console.error('Error publishing website:', error);
      appToast('The website could not be published.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getDefaultContent(type)
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  const getDefaultContent = (type: Section['type']) => {
    switch (type) {
      case 'hero':
        return { title: 'Welcome to My Website', subtitle: 'Built with Wersee Builder', buttonText: 'Get Started' };
      case 'features':
        return { items: [{ title: 'Feature 1', desc: 'Description of feature 1' }, { title: 'Feature 2', desc: 'Description of feature 2' }] };
      case 'content':
        return { text: 'Add your content here...' };
      case 'cta':
        return { title: 'Ready to start?', buttonText: 'Join Now' };
      case 'footer':
        return { copyright: '© 2026 My Business' };
      default:
        return {};
    }
  };

  const updateSection = (id: string, content: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (activeSection === id) setActiveSection(null);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!currentWebsite) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Websites</h1>
              <p className="text-gray-400">Manage and build your online presence.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Create Website
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdding(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Create New Website</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Website Name</label>
                    <input 
                      type="text"
                      value={newWebsiteName}
                      onChange={(e) => setNewWebsiteName(e.target.value)}
                      placeholder="e.g. My Portfolio"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateWebsite}
                      disabled={saving || !newWebsiteName}
                      className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((site) => (
            <div 
              key={site.id}
              onClick={() => handleSelectWebsite(site)}
              className="p-6 bg-[#111] border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Globe className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{site.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{site.status}</p>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-bold">Created {new Date(site.created_at).toLocaleDateString()}</span>
                <button className="text-indigo-400 text-xs font-bold hover:underline">Edit Site</button>
              </div>
            </div>
          ))}
          {websites.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No websites yet</h3>
              <p className="text-gray-500">Click the button above to create your first website.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-white/5 bg-[#111] px-4 md:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setCurrentWebsite(null)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Globe className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-none">{currentWebsite.name}</h1>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status: {currentWebsite.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              isPreview ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> <span className="hidden md:inline">{isPreview ? 'Exit Preview' : 'Live Preview'}</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="p-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} <span className="hidden md:inline">Save</span>
          </button>
          <button onClick={() => void handlePublish()} disabled={saving} className="p-2 md:px-4 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
            <Rocket className="w-4 h-4" /> <span className="hidden md:inline">Publish</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Components */}
        {!isPreview && (
          <aside className="hidden md:block w-72 border-r border-white/5 bg-[#111] p-6 space-y-8 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Add Sections</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'hero', icon: Layout, label: 'Hero' },
                  { type: 'features', icon: MousePointer2, label: 'Features' },
                  { type: 'content', icon: Type, label: 'Content' },
                  { type: 'cta', icon: MousePointer2, label: 'CTA' },
                  { type: 'footer', icon: Layout, label: 'Footer' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addSection(item.type as Section['type'])}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                  >
                    <item.icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-400" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {sections.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Page Structure</h3>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div 
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                        activeSection === section.id ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layout className="w-4 h-4 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-wider">{section.type}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }} className="p-1 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }} className="p-1 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Mobile Component Picker (Floating Button) */}
        {!isPreview && (
          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Section
            </button>
          </div>
        )}

        {/* Mobile Add Section Modal */}
        <AnimatePresence>
          {isAdding && window.innerWidth < 768 && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdding(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full bg-[#111] rounded-t-3xl p-6 border-t border-white/10"
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-bold text-white mb-6">Add Section</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { type: 'hero', icon: Layout, label: 'Hero' },
                    { type: 'features', icon: MousePointer2, label: 'Features' },
                    { type: 'content', icon: Type, label: 'Content' },
                    { type: 'cta', icon: MousePointer2, label: 'CTA' },
                    { type: 'footer', icon: Layout, label: 'Footer' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => {
                        addSection(item.type as Section['type']);
                        setIsAdding(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <item.icon className="w-6 h-6 text-indigo-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <main className="flex-1 bg-[#050505] overflow-y-auto p-4 md:p-12 scrollbar-hide">
          <div className={`mx-auto transition-all duration-500 ${isPreview ? 'max-w-7xl' : 'max-w-4xl'} bg-white text-black min-h-full rounded-2xl shadow-2xl overflow-hidden`}>
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <Globe className="w-16 h-16 mb-6 opacity-20" />
                <h2 className="text-2xl font-bold mb-2">Your Canvas is Empty</h2>
                <p>Start adding sections from the sidebar to build your site.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sections.map((section) => (
                  <div key={section.id} className="relative group/section">
                    {!isPreview && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover/section:opacity-100 transition-opacity flex items-center gap-2 z-20">
                        <button onClick={() => removeSection(section.id)} className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Section Renderers */}
                    {section.type === 'hero' && (
                      <div className="py-24 px-12 text-center bg-gray-50">
                        <h1 className="text-5xl font-black mb-6">{section.content.title}</h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{section.content.subtitle}</p>
                        <button className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:scale-105 transition-transform">
                          {section.content.buttonText}
                        </button>
                      </div>
                    )}

                    {section.type === 'features' && (
                      <div className="py-20 px-12 grid grid-cols-2 gap-12">
                        {section.content.items.map((item: any, i: number) => (
                          <div key={i} className="space-y-4">
                            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                              <Layout className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.type === 'content' && (
                      <div className="py-20 px-12 prose max-w-none">
                        <p className="text-lg leading-relaxed">{section.content.text}</p>
                      </div>
                    )}

                    {section.type === 'cta' && (
                      <div className="py-20 px-12 bg-black text-white text-center">
                        <h2 className="text-4xl font-bold mb-8">{section.content.title}</h2>
                        <button className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                          {section.content.buttonText}
                        </button>
                      </div>
                    )}

                    {section.type === 'footer' && (
                      <div className="py-12 px-12 border-t border-gray-100 text-center text-gray-500 text-sm">
                        {section.content.copyright}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Properties / Bottom Sheet */}
        <AnimatePresence>
          {!isPreview && activeSection && (
            <motion.aside 
              initial={window.innerWidth < 768 ? { y: '100%' } : { x: 300, opacity: 0 }}
              animate={window.innerWidth < 768 ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={window.innerWidth < 768 ? { y: '100%' } : { x: 300, opacity: 0 }}
              className="fixed md:absolute bottom-0 md:bottom-auto md:top-0 right-0 w-full md:w-80 h-[80vh] md:h-full border-t md:border-l border-white/5 bg-[#111] p-6 overflow-y-auto z-40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Properties</h3>
                </div>
                <button onClick={() => setActiveSection(null)} className="md:hidden p-2 text-gray-400 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

            {sections.find(s => s.id === activeSection)?.type === 'hero' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
                  <input 
                    type="text"
                    value={sections.find(s => s.id === activeSection)?.content.title}
                    onChange={(e) => updateSection(activeSection, { ...sections.find(s => s.id === activeSection)?.content, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Subtitle</label>
                  <textarea 
                    value={sections.find(s => s.id === activeSection)?.content.subtitle}
                    onChange={(e) => updateSection(activeSection, { ...sections.find(s => s.id === activeSection)?.content, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Button Text</label>
                  <input 
                    type="text"
                    value={sections.find(s => s.id === activeSection)?.content.buttonText}
                    onChange={(e) => updateSection(activeSection, { ...sections.find(s => s.id === activeSection)?.content, buttonText: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            )}

            {sections.find(s => s.id === activeSection)?.type === 'content' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Text Content</label>
                  <textarea 
                    value={sections.find(s => s.id === activeSection)?.content.text}
                    onChange={(e) => updateSection(activeSection, { ...sections.find(s => s.id === activeSection)?.content, text: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                    rows={10}
                  />
                </div>
              </div>
            )}
            
            {/* Add more property editors for other section types */}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};
