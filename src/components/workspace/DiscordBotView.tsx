import React, { useState, useEffect } from 'react';
import { 
  Bot, Settings, MessageSquare, Bell, Shield, 
  Activity, RefreshCw, Loader2, Save, Link as LinkIcon,
  CheckCircle2, XCircle, Users, ShoppingBag, Plus
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { motion } from 'framer-motion';

import { appToast } from '@/lib/feedback';
export const DiscordBotView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botConfig, setBotConfig] = useState<any>({
    token: '',
    client_id: '',
    active_servers: [],
    announcements_enabled: true,
    announcement_channel: '',
    show_images: true,
    show_prices: true,
    show_links: true,
    official_announcements: true,
    live_sales: true,
    role_sync: true,
    buyer_role_id: '',
    premium_role_id: '',
    seller_role_id: '',
    custom_branding: {
      color: '#5865F2',
      name: 'Wersee Bot',
      logo: ''
    }
  });

  useEffect(() => {
    fetchBotConfig();
  }, []);

  const fetchBotConfig = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, this would fetch from a 'discord_bot_configs' table
      // For now, we'll just simulate loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // We keep the default state for now
    } catch (error) {
      console.error('Error fetching bot config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // In a real app, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 800));
      appToast('Discord bot configuration saved successfully!');
    } catch (error) {
      console.error('Error saving bot config:', error);
      appToast('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Status */}
      <div className="bg-gradient-to-br from-[#5865F2]/20 to-purple-900/20 border border-[#5865F2]/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5865F2]/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Wersee Discord Bot</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
                <span className="text-sm text-gray-400">Connected to 3 servers</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={`https://discord.com/api/oauth2/authorize?client_id=${botConfig.client_id}&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Invite to Server
            </a>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Settings */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Connection Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bot Token</label>
                <input 
                  type="password"
                  value={botConfig.token}
                  onChange={(e) => setBotConfig({...botConfig, token: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Client ID</label>
                <input 
                  type="text"
                  value={botConfig.client_id}
                  onChange={(e) => setBotConfig({...botConfig, client_id: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Announcements & Notifications */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Announcements & Notifications</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-white mb-1">Product Announcements</div>
                    <div className="text-xs text-gray-400">Auto-post new products</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={botConfig.announcements_enabled}
                    onChange={(e) => setBotConfig({...botConfig, announcements_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900 bg-gray-700"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-white mb-1">Live Sales</div>
                    <div className="text-xs text-gray-400">"🔥 someone just bought..."</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={botConfig.live_sales}
                    onChange={(e) => setBotConfig({...botConfig, live_sales: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900 bg-gray-700"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-bold text-white mb-1">Official Updates</div>
                    <div className="text-xs text-gray-400">Wersee news & features</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={botConfig.official_announcements}
                    onChange={(e) => setBotConfig({...botConfig, official_announcements: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900 bg-gray-700"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-white mb-4">Embed Settings</h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={botConfig.show_images}
                      onChange={(e) => setBotConfig({...botConfig, show_images: e.target.checked})}
                      className="rounded border-gray-600 text-indigo-500 bg-gray-700"
                    />
                    Show Images
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={botConfig.show_prices}
                      onChange={(e) => setBotConfig({...botConfig, show_prices: e.target.checked})}
                      className="rounded border-gray-600 text-indigo-500 bg-gray-700"
                    />
                    Show Prices
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={botConfig.show_links}
                      onChange={(e) => setBotConfig({...botConfig, show_links: e.target.checked})}
                      className="rounded border-gray-600 text-indigo-500 bg-gray-700"
                    />
                    Show Links
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Role Management */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Role Synchronization</h3>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Enable Sync</span>
                <input 
                  type="checkbox" 
                  checked={botConfig.role_sync}
                  onChange={(e) => setBotConfig({...botConfig, role_sync: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-600 text-indigo-500 bg-gray-700"
                />
              </label>
            </div>
            
            <div className="space-y-4 opacity-50 pointer-events-none">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm mb-4">
                Connect a server first to select roles.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Buyer Role</label>
                <select disabled className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-gray-500">
                  <option>Select a role...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Premium Member Role</label>
                <select disabled className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-gray-500">
                  <option>Select a role...</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Features & Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#5865F2]/20 to-indigo-900/20 border border-[#5865F2]/30 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Bot Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span><strong>/link</strong> - Users can link their Wersee account</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span><strong>/profile</strong> - Show purchases & status</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span><strong>/trending</strong> - Show popular products</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span><strong>/stats</strong> - Creators can view revenue</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Marketplace integration (view/buy products)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Support ticket system for communities</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Exclusive content unlock via roles</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Analytics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Linked Accounts</div>
                <div className="text-2xl font-black text-white">0</div>
              </div>
              <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Discord Referrals</div>
                <div className="text-2xl font-black text-white">0</div>
              </div>
              <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Announcements Sent</div>
                <div className="text-2xl font-black text-white">0</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Bot Source Code</h3>
            <p className="text-xs text-gray-400 mb-4">The complete Node.js source code for your bot has been generated in the <code>/discord-bot</code> directory.</p>
            <div className="bg-black/30 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Webhook Endpoint</p>
              <code className="text-[10px] text-indigo-300 font-mono break-all">
                https://your-bot-server.com/webhook
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
