import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, 
  MessageSquare, Layout, Palette, Type, Settings,
  Eye, Monitor, Smartphone, CheckCircle2, Hash,
  Lock, Globe, Shield, Zap, Bell, 
  Image as ImageIcon, Video, FileText, HelpCircle,
  Folder, Smile, MoreVertical, Copy, Layers,
  PlusCircle, Search, Filter, Save, X
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'chat' | 'feed' | 'forum' | 'resource' | 'video' | 'voice' | 'stream';
  icon: string;
  access: 'public' | 'private' | 'paid' | 'subscription' | 'level' | 'admin';
  description?: string;
  config?: {
    isReadOnly?: boolean;
    slowMode?: number;
    sneakPeek?: boolean;
    levelRequired?: number;
  };
}

interface Category {
  id: string;
  title: string;
  isCollapsed?: boolean;
  channels: Channel[];
}

interface CommunityConfig {
  categories: Category[];
  design: {
    primaryColor: string;
    layout: 'sidebar' | 'grid';
    theme: 'light' | 'dark' | 'glass';
    bannerUrl?: string;
    logoUrl?: string;
  };
  settings: {
    isPublic: boolean;
    membershipApproval: boolean;
    welcomeMessage?: string;
  };
  apps: {
    id: string;
    name: string;
    type: 'embed' | 'link';
    url: string;
    icon: string;
  }[];
}

export const CommunityBuilder = ({ initialData, onSave }: { initialData?: any, onSave: (data: any) => void }) => {
  const [config, setConfig] = useState<CommunityConfig>(initialData || {
    categories: [
      {
        id: 'cat-1',
        title: 'START HERE',
        channels: [
          { id: 'ch-1', name: 'Welcome', type: 'feed', icon: '👋', access: 'public' },
          { id: 'ch-2', name: 'Rules', type: 'resource', icon: '📜', access: 'public', config: { isReadOnly: true } }
        ]
      },
      {
        id: 'cat-2',
        title: 'GENERAL',
        channels: [
          { id: 'ch-3', name: 'Main Chat', type: 'chat', icon: '💬', access: 'private' },
          { id: 'ch-4', name: 'Success Stories', type: 'feed', icon: '💰', access: 'private' }
        ]
      }
    ],
    design: {
      primaryColor: '#000000',
      layout: 'sidebar',
      theme: 'light'
    },
    settings: {
      isPublic: true,
      membershipApproval: false,
      welcomeMessage: 'Welcome to our community!'
    },
    apps: []
  });

  const [activeTab, setActiveTab] = useState<'structure' | 'design' | 'settings'>('structure');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const addCategory = () => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      title: 'New Category',
      channels: []
    };
    setConfig({ ...config, categories: [...config.categories, newCat] });
  };

  const addChannel = (catId: string) => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: 'new channel',
      type: 'chat',
      icon: '💬',
      access: 'private'
    };
    const newCategories = config.categories.map(cat => 
      cat.id === catId ? { ...cat, channels: [...cat.channels, newChannel] } : cat
    );
    setConfig({ ...config, categories: newCategories });
    setSelectedChannel(newChannel);
  };

  const updateChannel = (updatedChannel: Channel) => {
    const newCategories = config.categories.map(cat => ({
      ...cat,
      channels: cat.channels.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch)
    }));
    setConfig({ ...config, categories: newCategories });
    setSelectedChannel(updatedChannel);
  };

  const deleteChannel = (catId: string, chId: string) => {
    const newCategories = config.categories.map(cat => 
      cat.id === catId ? { ...cat, channels: cat.channels.filter(ch => ch.id !== chId) } : cat
    );
    setConfig({ ...config, categories: newCategories });
    if (selectedChannel?.id === chId) setSelectedChannel(null);
  };

  return (
    <div className="flex h-[80vh] bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-2xl">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-black/5 flex flex-col bg-[#FBFBFD]">
        <div className="p-6 border-b border-black/5">
          <h2 className="text-xl font-bold text-[#1D1D1F]">Community Builder</h2>
          <p className="text-xs text-gray-400 mt-1">Design your digital headquarters</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            {(['structure', 'design', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Channels</h3>
                <button onClick={addCategory} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {config.categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between group px-2">
                      <input 
                        value={category.title}
                        onChange={(e) => {
                          const newCats = config.categories.map(c => c.id === category.id ? { ...c, title: e.target.value } : c);
                          setConfig({ ...config, categories: newCats });
                        }}
                        className="bg-transparent font-bold text-xs text-gray-500 uppercase tracking-widest outline-none focus:text-black transition-colors"
                      />
                      <button onClick={() => addChannel(category.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {category.channels.map((channel) => (
                        <div
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all group cursor-pointer ${
                            selectedChannel?.id === channel.id ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-sm">{channel.icon}</span>
                          <span className="text-xs font-medium flex-1 text-left truncate">{channel.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {channel.access !== 'public' && <Lock className={`w-3 h-3 ${selectedChannel?.id === channel.id ? 'text-white/40' : 'text-gray-400'}`} />}
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteChannel(category.id, channel.id); }}
                              className="p-1 hover:bg-red-500 hover:text-white rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Color</label>
                <div className="flex flex-wrap gap-2">
                  {['#000000', '#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig({ ...config, design: { ...config.design, primaryColor: color } })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        config.design.primaryColor === color ? 'border-black scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'glass'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setConfig({ ...config, design: { ...config.design, theme } })}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                        config.design.theme === theme ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sidebar', 'grid'] as const).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setConfig({ ...config, design: { ...config.design, layout } })}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                        config.design.layout === layout ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Public Listing</p>
                    <p className="text-[10px] text-gray-400">Show in marketplace</p>
                  </div>
                  <button 
                    onClick={() => setConfig({ ...config, settings: { ...config.settings, isPublic: !config.settings.isPublic } })}
                    className={`w-10 h-5 rounded-full transition-all relative ${config.settings.isPublic ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.settings.isPublic ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Manual Approval</p>
                    <p className="text-[10px] text-gray-400">Approve new members</p>
                  </div>
                  <button 
                    onClick={() => setConfig({ ...config, settings: { ...config.settings, membershipApproval: !config.settings.membershipApproval } })}
                    className={`w-10 h-5 rounded-full transition-all relative ${config.settings.membershipApproval ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.settings.membershipApproval ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-black/5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Installed Apps</label>
                <div className="space-y-2">
                  {config.apps.map(app => (
                    <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-black/5">
                      <span className="text-lg">{app.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold">{app.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{app.url}</p>
                      </div>
                      <button 
                        onClick={() => setConfig({ ...config, apps: config.apps.filter(a => a.id !== app.id) })}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newApp = { id: Date.now().toString(), name: 'Custom App', type: 'embed' as const, url: 'https://', icon: '🧩' };
                      setConfig({ ...config, apps: [...config.apps, newApp] });
                    }}
                    className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-[10px] font-bold text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
                  >
                    + Add Custom App / Embed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/5 bg-white">
          <button 
            onClick={() => onSave(config)}
            className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Community
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Preview Toolbar */}
        <div className="h-14 border-b border-black/5 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview</span>
          </div>

          {selectedChannel && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Editing:</span>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-lg">{selectedChannel.icon} {selectedChannel.name}</span>
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
          <div 
            className={`bg-white shadow-2xl transition-all duration-500 overflow-hidden flex ${
              previewMode === 'desktop' ? 'w-full h-full rounded-3xl' : 'w-[375px] h-[667px] rounded-[3rem] border-[8px] border-gray-800'
            } ${config.design.theme === 'dark' ? 'bg-[#1D1D1F] text-white' : config.design.theme === 'glass' ? 'bg-white/80 backdrop-blur-xl' : 'bg-white'}`}
            style={{ borderColor: config.design.theme === 'dark' ? '#2C2C2E' : undefined }}
          >
            {/* Mock Community UI */}
            <div className={`w-64 border-r flex flex-col ${config.design.theme === 'dark' ? 'bg-[#1D1D1F] border-white/5' : 'bg-[#FBFBFD] border-black/5'}`}>
              <div className={`p-6 border-b ${config.design.theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                <div className="w-10 h-10 rounded-xl mb-3" style={{ backgroundColor: config.design.primaryColor }} />
                <h3 className="font-bold text-sm truncate">My Community</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {config.categories.map(cat => (
                  <div key={cat.id} className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{cat.title}</h4>
                    <div className="space-y-0.5">
                      {cat.channels.map(ch => (
                        <div 
                          key={ch.id} 
                          className={`flex items-center gap-3 p-2 rounded-xl text-xs font-medium transition-all ${
                            ch.id === selectedChannel?.id 
                              ? 'text-white shadow-lg' 
                              : config.design.theme === 'dark' ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5'
                          }`}
                          style={{ backgroundColor: ch.id === selectedChannel?.id ? config.design.primaryColor : undefined }}
                        >
                          <span>{ch.icon}</span>
                          <span className="flex-1 truncate">{ch.name}</span>
                          {ch.access !== 'public' && <Lock className="w-3 h-3 opacity-40" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {config.apps.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-black/5">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">APPS</h4>
                    <div className="space-y-0.5">
                      {config.apps.map(app => (
                        <div key={app.id} className="flex items-center gap-3 p-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-black/5">
                          <span>{app.icon}</span>
                          <span className="flex-1 truncate">{app.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <header className={`h-16 border-b flex items-center justify-between px-6 ${config.design.theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{selectedChannel?.icon || '👋'}</span>
                  <h3 className="font-bold text-sm">{selectedChannel?.name || 'Welcome'}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
                    ))}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-all"><Bell className="w-4 h-4 text-gray-400" /></button>
                </div>
              </header>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {selectedChannel?.type === 'chat' ? (
                  <div className="space-y-6">
                    {[1,2].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">Member {i}</span>
                            <span className="text-[10px] text-gray-400">12:4{i} PM</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${config.design.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            This is a preview of how messages will look in the {selectedChannel.name} channel.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className={`aspect-video rounded-2xl border border-dashed flex items-center justify-center ${config.design.theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-xs text-gray-400 font-medium italic">Content preview for {selectedChannel?.type} type</p>
                    </div>
                    <div className="space-y-3">
                      <div className={`h-4 w-1/3 rounded ${config.design.theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />
                      <div className={`h-3 w-full rounded ${config.design.theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                      <div className={`h-3 w-5/6 rounded ${config.design.theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                  </div>
                )}
              </div>

              {selectedChannel?.type === 'chat' && (
                <div className={`p-6 border-t ${config.design.theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                  <div className={`flex items-center gap-3 p-3 rounded-2xl ${config.design.theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <PlusCircle className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 text-xs text-gray-400">Message #{selectedChannel.name}</div>
                    <Smile className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Channel Settings Modal (Floating) */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 border-l border-black/5 bg-white p-6 space-y-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Channel Settings</h3>
              <button onClick={() => setSelectedChannel(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</label>
                <input 
                  value={selectedChannel.name}
                  onChange={(e) => updateChannel({ ...selectedChannel, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
                <select 
                  value={selectedChannel.type}
                  onChange={(e) => updateChannel({ ...selectedChannel, type: e.target.value as any })}
                  className="w-full p-3 bg-gray-50 border border-black/5 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="chat">💬 Chat Channel</option>
                  <option value="feed">📰 Feed Channel</option>
                  <option value="forum">❓ Forum/Question</option>
                  <option value="resource">📚 Resource Library</option>
                  <option value="video">🎥 Video Call</option>
                  <option value="voice">🎙️ Voice Call</option>
                  <option value="stream">📡 Live Stream</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Gating</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'public', icon: Globe, label: 'Public' },
                    { id: 'private', icon: Lock, label: 'Private' },
                    { id: 'paid', icon: Zap, label: 'Paid' },
                    { id: 'subscription', icon: Bell, label: 'Sub' },
                    { id: 'level', icon: Trophy, label: 'Level' },
                    { id: 'admin', icon: Shield, label: 'Admin' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateChannel({ ...selectedChannel, access: opt.id as any })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedChannel.access === opt.id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-100'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Sneak Peek</p>
                    <p className="text-[10px] text-gray-400">Show blurred preview to non-members</p>
                  </div>
                  <button 
                    onClick={() => updateChannel({ ...selectedChannel, config: { ...selectedChannel.config, sneakPeek: !selectedChannel.config?.sneakPeek } })}
                    className={`w-10 h-5 rounded-full transition-all relative ${selectedChannel.config?.sneakPeek ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedChannel.config?.sneakPeek ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Read-Only Mode</p>
                    <p className="text-[10px] text-gray-400">Only admins can post</p>
                  </div>
                  <button 
                    onClick={() => updateChannel({ ...selectedChannel, config: { ...selectedChannel.config, isReadOnly: !selectedChannel.config?.isReadOnly } })}
                    className={`w-10 h-5 rounded-full transition-all relative ${selectedChannel.config?.isReadOnly ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedChannel.config?.isReadOnly ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
