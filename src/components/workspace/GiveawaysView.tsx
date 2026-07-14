import React, { useState, useEffect } from 'react';
import { Gift, Plus, Calendar, Users, Trophy, Trash2, ExternalLink, Timer, CheckCircle2, AlertCircle, Loader2, ChevronRight, Mail, Share2, BarChart3, Settings, ArrowLeft, Copy, UserPlus, MousePointer2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { appToast } from '@/lib/feedback';
interface Giveaway {
  id: string;
  title: string;
  prize: string;
  description: string;
  status: 'active' | 'ended' | 'draft';
  entries: number;
  end_date: string;
  is_verified?: boolean;
  winner?: string;
  auto_email_config?: {
    enabled: boolean;
    subject: string;
    body: string;
  };
  entry_actions?: any[];
}

interface Participant {
  id: string;
  name: string;
  email: string;
  username?: string;
  total_entries: number;
  created_at: string;
  referral_code: string;
}

export const GiveawaysView = () => {
  const { user } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'participants' | 'analytics' | 'settings' | 'joined'>('participants');
  const [joinedGiveaways, setJoinedGiveaways] = useState<Giveaway[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchGiveaways();
      fetchJoinedGiveaways();
    }
  }, [user]);

  const fetchJoinedGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaway_participants')
        .select('giveaway_id, giveaways(*)')
        .eq('email', user?.email);
      
      if (error) throw error;
      setJoinedGiveaways(data.map((p: any) => p.giveaways).filter(Boolean));
    } catch (error) {
      console.error('Error fetching joined giveaways:', error);
    }
  };

  useEffect(() => {
    if (selectedGiveaway) {
      fetchGiveawayData(selectedGiveaway.id);
    }
  }, [selectedGiveaway]);

  const fetchGiveaways = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiveaways(data || []);
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGiveawayData = async (id: string) => {
    try {
      // Fetch participants
      const { data: pData } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', id)
        .order('total_entries', { ascending: false });
      setParticipants(pData || []);

      // Fetch analytics
      const { data: aData } = await supabase
        .from('giveaway_analytics')
        .select('*')
        .eq('giveaway_id', id);
      setAnalytics(aData || []);
    } catch (error) {
      console.error('Error fetching giveaway data:', error);
    }
  };

  const handleCreateGiveaway = async () => {
    if (!newTitle || !newPrize || !newEndDate) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .insert([{
          title: newTitle,
          prize: newPrize,
          description: newDescription,
          end_date: newEndDate,
          user_id: user?.id,
          status: 'active',
          entries: 0
        }])
        .select()
        .single();

      if (error) throw error;
      setGiveaways([data, ...giveaways]);
      setIsAdding(false);
      setNewTitle('');
      setNewPrize('');
      setNewDescription('');
      setNewEndDate('');
    } catch (error) {
      console.error('Error creating giveaway:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateGiveawaySettings = async (updates: Partial<Giveaway>) => {
    if (!selectedGiveaway) return;
    try {
      const { error } = await supabase
        .from('giveaways')
        .update(updates)
        .eq('id', selectedGiveaway.id);
      if (error) throw error;
      setSelectedGiveaway({ ...selectedGiveaway, ...updates });
      setGiveaways(giveaways.map(g => g.id === selectedGiveaway.id ? { ...g, ...updates } : g));
      appToast('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating giveaway:', error);
    }
  };

  const deleteGiveaway = async (id: string) => {
    try {
      const { error } = await supabase.from('giveaways').delete().eq('id', id);
      if (error) throw error;
      setGiveaways(giveaways.filter(g => g.id !== id));
      if (selectedGiveaway?.id === id) setSelectedGiveaway(null);
    } catch (error) {
      console.error('Error deleting giveaway:', error);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/g/${id}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (selectedGiveaway) {
    const totalClicks = analytics.filter(a => a.event_type === 'click').length;
    const totalJoins = participants.length;
    const conversionRate = totalClicks > 0 ? ((totalJoins / totalClicks) * 100).toFixed(1) : '0';

    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedGiveaway(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Giveaways
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => copyLink(selectedGiveaway.id)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <a 
              href={`/g/${selectedGiveaway.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Preview Page
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-pink-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{selectedGiveaway.title}</h1>
                  <p className="text-gray-400">Prize: {selectedGiveaway.prize}</p>
                </div>
              </div>

              <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit">
                {[
                  { id: 'participants', label: 'Participants', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden">
              {activeTab === 'participants' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Participants ({participants.length})</h2>
                    <button className="text-sm font-bold text-pink-400 hover:text-pink-300">Export CSV</button>
                  </div>
                  <div className="space-y-4">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {p.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{p.total_entries}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Entries</p>
                        </div>
                      </div>
                    ))}
                    {participants.length === 0 && (
                      <div className="text-center py-12 text-gray-500">No participants yet.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <MousePointer2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Clicks</span>
                      </div>
                      <p className="text-3xl font-black text-white">{totalClicks}</p>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Joins</span>
                      </div>
                      <p className="text-3xl font-black text-white">{totalJoins}</p>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Conv. Rate</span>
                      </div>
                      <p className="text-3xl font-black text-emerald-400">{conversionRate}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Screen Progression</h3>
                    <div className="space-y-4">
                      {['screen_1', 'screen_2', 'screen_3'].map((screen, idx) => {
                        const count = analytics.filter(a => a.event_type === screen).length;
                        const percentage = totalClicks > 0 ? (count / totalClicks) * 100 : 0;
                        return (
                          <div key={screen} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                              <span className="text-gray-400">Step {idx + 1}: {screen.replace('_', ' ')}</span>
                              <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-pink-500 transition-all duration-1000" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Verification Status
                    </h3>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">Verified Prize</p>
                        <p className="text-xs text-gray-500">Show a "Verified Prize" badge on the giveaway page.</p>
                      </div>
                      <button 
                        onClick={() => updateGiveawaySettings({ is_verified: !selectedGiveaway.is_verified })}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          selectedGiveaway.is_verified ? 'bg-emerald-500' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          selectedGiveaway.is_verified ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-pink-400" />
                      Auto-Email Notification
                    </h3>
                    <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">Enable Auto-Email</p>
                          <p className="text-xs text-gray-500">Send a confirmation email to every participant.</p>
                        </div>
                        <button 
                          onClick={() => updateGiveawaySettings({ 
                            auto_email_config: { 
                              ...selectedGiveaway.auto_email_config!, 
                              enabled: !selectedGiveaway.auto_email_config?.enabled 
                            } 
                          })}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            selectedGiveaway.auto_email_config?.enabled ? 'bg-pink-500' : 'bg-gray-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            selectedGiveaway.auto_email_config?.enabled ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                      {selectedGiveaway.auto_email_config?.enabled && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Subject</label>
                            <input 
                              type="text"
                              value={selectedGiveaway.auto_email_config.subject}
                              onChange={(e) => updateGiveawaySettings({
                                auto_email_config: { ...selectedGiveaway.auto_email_config!, subject: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Body</label>
                            <textarea 
                              rows={4}
                              value={selectedGiveaway.auto_email_config.body}
                              onChange={(e) => updateGiveawaySettings({
                                auto_email_config: { ...selectedGiveaway.auto_email_config!, body: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-indigo-400" />
                      Entry Actions
                    </h3>
                    <div className="grid gap-4">
                      {selectedGiveaway.entry_actions?.map((action, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{action.label}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">+{action.points} Points</p>
                            </div>
                          </div>
                          <button className="text-xs font-bold text-gray-500 hover:text-white">Edit</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-8">
              <h3 className="text-lg font-bold text-white mb-6">Quick Stats</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {selectedGiveaway.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Entries</span>
                  <span className="text-sm font-bold text-white">{selectedGiveaway.entries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">End Date</span>
                  <span className="text-sm font-bold text-white">{selectedGiveaway.end_date}</span>
                </div>
              </div>
              <div className="pt-8 space-y-3">
                <button 
                  onClick={() => deleteGiveaway(selectedGiveaway.id)}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Giveaway
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Giveaways</h1>
            <p className="text-gray-400">Grow your audience with interactive giveaways.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20"
        >
          <Plus className="w-4 h-4" /> Create Giveaway
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {giveaways.map((giveaway) => (
          <div 
            key={giveaway.id} 
            onClick={() => setSelectedGiveaway(giveaway)}
            className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden group cursor-pointer hover:border-pink-500/30 transition-all"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    giveaway.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {giveaway.status}
                  </span>
                  <h3 className="text-xl font-bold text-white pt-2">{giveaway.title}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-pink-500/10 transition-colors">
                  <Trophy className="w-6 h-6 text-yellow-400 group-hover:text-pink-400 transition-colors" />
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Prize</p>
                <p className="text-lg font-bold text-white">{giveaway.prize}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Entries</p>
                    <p className="text-sm font-bold text-white">{giveaway.entries.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ends</p>
                    <p className="text-sm font-bold text-white">{giveaway.end_date}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); copyLink(giveaway.id); }}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
                <a 
                  href={`/g/${giveaway.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" /> View Page
                </a>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-all" />
            </div>
          </div>
        ))}
        {giveaways.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
            <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No giveaways yet</h3>
            <p className="text-gray-500">Click the button above to launch your first giveaway.</p>
          </div>
        )}
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
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[40px] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">New Giveaway</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Giveaway Title</label>
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Summer Community Special"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Prize Description</label>
                  <input 
                    type="text"
                    value={newPrize}
                    onChange={(e) => setNewPrize(e.target.value)}
                    placeholder="What can they win?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description (Optional)</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Tell them more about the giveaway..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Entry Method</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50 transition-all appearance-none">
                      <option>Multi-Action (Recommended)</option>
                      <option>Email Only</option>
                      <option>Social Only</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsAdding(false)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Cancel</button>
                <button 
                  onClick={handleCreateGiveaway}
                  disabled={submitting || !newTitle || !newPrize || !newEndDate}
                  className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
