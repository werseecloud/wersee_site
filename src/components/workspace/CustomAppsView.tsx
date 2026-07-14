import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Layout, Plus, Code, Trash2, ExternalLink, Save, AppWindow, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExtensionBuilder } from './ExtensionBuilder';
import { AppBuilder } from './AppBuilder';

import { appToast, destructiveAction } from '@/lib/feedback';
interface CustomApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  is_public: boolean;
}

interface InstalledExtension {
  id: string;
  extension: {
    id: string;
    name: string;
    description: string;
  };
  config: any;
  enabled: boolean;
  created_at: string;
}

interface CustomAppsViewProps {
  businessId?: string;
}

export const CustomAppsView: React.FC<CustomAppsViewProps> = ({ businessId }) => {
  const [apps, setApps] = useState<CustomApp[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'app' | 'extension' | 'store'>('app');
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [isCreatingExtension, setIsCreatingExtension] = useState(false);
  const [editingApp, setEditingApp] = useState<CustomApp | null>(null);
  const [marketplaceApps, setMarketplaceApps] = useState<any[]>([]);
  const [marketplaceExtensions, setMarketplaceExtensions] = useState<any[]>([]);
  const [marketplaceTab, setMarketplaceTab] = useState<'apps' | 'extensions'>('apps');
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'app') {
      fetchApps();
    } else if (activeTab === 'extension') {
      fetchExtensions();
    } else {
      fetchMarketplace();
    }
  }, [businessId, activeTab, marketplaceTab]);

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      if (marketplaceTab === 'apps') {
        const { data, error } = await supabase
          .from('apps')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMarketplaceApps(data || []);
      } else {
        const { data, error } = await supabase
          .from('extensions')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMarketplaceExtensions(data || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallApp = async (app: any) => {
    setInstallingId(app.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('installed_apps')
        .insert([{
          user_id: user.id,
          business_id: businessId,
          app_id: app.id,
          config: app.config_schema || {},
          enabled: true
        }]);

      if (error) {
        if (error.code === '23505') {
          appToast('This app is already installed.');
        } else {
          throw error;
        }
      } else {
        appToast(`${app.name} installed successfully!`);
        setActiveTab('app');
      }
    } catch (err) {
      console.error('Error installing app:', err);
      appToast('Failed to install app.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleInstallExtension = async (ext: any) => {
    setInstallingId(ext.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ownerId = businessId || user.id;

      const { error } = await supabase
        .from('installed_extensions')
        .insert([{
          owner_id: ownerId,
          extension_id: ext.id,
          config: ext.config_schema || {},
          enabled: true
        }]);

      if (error) {
        if (error.code === '23505') {
          appToast('This extension is already installed.');
        } else {
          throw error;
        }
      } else {
        appToast(`${ext.name} installed successfully!`);
        setActiveTab('extension');
      }
    } catch (err) {
      console.error('Error installing extension:', err);
      appToast('Failed to install extension.');
    } finally {
      setInstallingId(null);
    }
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('developer_id', user.id);
        } else {
          query = query.is('business_id', null);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setApps(data || []);
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ownerId = businessId || user.id;

      const { data, error } = await supabase
        .from('installed_extensions')
        .select(`
          id,
          config,
          enabled,
          created_at,
          extension:extensions(id, name, description)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback if table doesn't exist yet
        console.error('Error fetching extensions:', error);
        setInstalledExtensions([]);
      } else {
        // @ts-ignore
        setInstalledExtensions(data || []);
      }
    } catch (err) {
      console.error('Error fetching extensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this app?' }))) return;

    try {
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setApps(apps.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error deleting app:', err);
    }
  };

  const handleDeleteExtension = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to uninstall this extension?' }))) return;

    try {
      const { error } = await supabase
        .from('installed_extensions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInstalledExtensions(installedExtensions.filter(ext => ext.id !== id));
    } catch (err) {
      console.error('Error deleting extension:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {activeTab === 'app' ? 'Custom Apps' : 'Extensions'}
          </h1>
          <p className="text-gray-400">
            {activeTab === 'app' 
              ? 'Build and manage standalone mini-SaaS tools.' 
              : 'Add functionality to your existing features using the visual builder.'}
          </p>
        </div>
        <button
          onClick={() => activeTab === 'app' ? setIsCreatingApp(true) : setIsCreatingExtension(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Create {activeTab === 'app' ? 'App' : 'Extension'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('app')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'app' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          My Apps
        </button>
        <button
          onClick={() => setActiveTab('extension')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'extension' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Extensions
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'store' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Marketplace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {activeTab === 'store' ? (
            <div className="col-span-full space-y-6">
              <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                  onClick={() => setMarketplaceTab('apps')}
                  className={`text-sm font-bold transition-colors ${marketplaceTab === 'apps' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Apps
                </button>
                <button
                  onClick={() => setMarketplaceTab('extensions')}
                  className={`text-sm font-bold transition-colors ${marketplaceTab === 'extensions' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Extensions
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceTab === 'apps' ? (
                  marketplaceApps.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500">No apps published yet.</div>
                  ) : (
                    marketplaceApps.map((app) => (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-indigo-500/10">
                            {app.icon_url ? <img src={app.icon_url} className="w-6 h-6" /> : <AppWindow className="w-6 h-6 text-indigo-400" />}
                          </div>
                          <div className="px-2 py-1 bg-indigo-500/20 rounded-lg text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            {app.category || 'App'}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{app.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-sm font-bold text-white">
                            {app.price > 0 ? `€${app.price}` : 'Free'}
                          </span>
                          <button 
                            onClick={() => handleInstallApp(app)}
                            disabled={installingId === app.id}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {installingId === app.id ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                            Install
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )
                ) : (
                  marketplaceExtensions.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500">No extensions published yet.</div>
                  ) : (
                    marketplaceExtensions.map((ext) => (
                      <motion.div
                        key={ext.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-emerald-500/10">
                            {ext.icon_url ? <img src={ext.icon_url} className="w-6 h-6" /> : <Zap className="w-6 h-6 text-emerald-400" />}
                          </div>
                          <div className="px-2 py-1 bg-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            {ext.category || 'Extension'}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{ext.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{ext.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-sm font-bold text-white">
                            {ext.price > 0 ? `€${ext.price}` : 'Free'}
                          </span>
                          <button 
                            onClick={() => handleInstallExtension(ext)}
                            disabled={installingId === ext.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {installingId === ext.id ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                            Install
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )
                )}
              </div>
            </div>
          ) : activeTab === 'app' ? (
            apps.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10">
                    <AppWindow className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingApp(app)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{app.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">
                    Created {new Date(app.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => window.open(`/app/${app.slug}`, '_blank')}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors text-indigo-400 hover:text-indigo-300"
                  >
                    View App
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            installedExtensions.map((ext) => (
              <motion.div
                key={ext.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteExtension(ext.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{ext.extension?.name || 'Unknown Extension'}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{ext.extension?.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">
                    Installed {new Date(ext.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${ext.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {ext.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {activeTab === 'app' && apps.length === 0 && !isCreatingApp && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
            <div className="p-4 bg-white/5 rounded-2xl mb-4">
              <Layout className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No custom apps yet</h3>
            <p className="text-gray-400 max-w-sm mb-6">Create your first custom app to build unique landing pages or tools for your business.</p>
            <button
              onClick={() => setIsCreatingApp(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              <Plus className="w-5 h-5" />
              Get Started
            </button>
          </div>
        )}

        {activeTab === 'extension' && installedExtensions.length === 0 && !isCreatingExtension && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
            <div className="p-4 bg-white/5 rounded-2xl mb-4">
              <Zap className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No extensions installed</h3>
            <p className="text-gray-400 max-w-sm mb-6">Automate workflows and add custom logic to your business with extensions.</p>
            <button
              onClick={() => setIsCreatingExtension(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              <Plus className="w-5 h-5" />
              Build Extension
            </button>
          </div>
        )}
      </div>

      {isCreatingExtension && (
        <ExtensionBuilder
          businessId={businessId}
          onClose={() => setIsCreatingExtension(false)}
          onSave={() => {
            setIsCreatingExtension(false);
            fetchExtensions();
          }}
        />
      )}

      {/* Create/Edit App Modal */}
      {(isCreatingApp || editingApp) && (
        <AppBuilder
          businessId={businessId}
          onClose={() => {
            setIsCreatingApp(false);
            setEditingApp(null);
          }}
          onSave={() => {
            setIsCreatingApp(false);
            setEditingApp(null);
            fetchApps();
          }}
          existingApp={editingApp}
        />
      )}
    </div>
  );
};
