import React, { useState, useEffect } from 'react';
import { Beaker, Plus, Play, Pause, Trash2, BarChart3, Globe, Layout, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { destructiveAction } from '@/lib/feedback';
interface Variant {
  id: string;
  name: string;
  traffic_weight: number;
  conversions: number;
  visitors: number;
}

interface Experiment {
  id: string;
  name: string;
  website_id: string;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  variants: Variant[];
}

interface Website {
  id: string;
  name: string;
}

export const ABTestingView = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, webRes] = await Promise.all([
        supabase.from('ab_experiments').select('*, variants:ab_variants(*)').order('created_at', { ascending: false }),
        supabase.from('websites').select('id, name')
      ]);

      if (expRes.error) throw expRes.error;
      if (webRes.error) throw webRes.error;

      setExperiments(expRes.data || []);
      setWebsites(webRes.data || []);
      if (webRes.data?.length > 0) setSelectedWebsiteId(webRes.data[0].id);
    } catch (error) {
      console.error('Error fetching A/B testing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async () => {
    if (!newName || !selectedWebsiteId) return;
    setSubmitting(true);
    try {
      const { data: exp, error: expError } = await supabase
        .from('ab_experiments')
        .insert([{ 
          name: newName, 
          website_id: selectedWebsiteId, 
          user_id: user?.id,
          status: 'active'
        }])
        .select()
        .single();

      if (expError) throw expError;

      // Create default variants
      const variants = [
        { experiment_id: exp.id, name: 'Control', traffic_weight: 50 },
        { experiment_id: exp.id, name: 'Variant A', traffic_weight: 50 }
      ];

      const { data: vars, error: varError } = await supabase
        .from('ab_variants')
        .insert(variants)
        .select();

      if (varError) throw varError;

      setExperiments([{ ...exp, variants: vars }, ...experiments]);
      setIsAdding(false);
      setNewName('');
    } catch (error) {
      console.error('Error creating experiment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setExperiments(experiments.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const deleteExperiment = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this experiment?' }))) return;
    try {
      const { error } = await supabase.from('ab_experiments').delete().eq('id', id);
      if (error) throw error;
      setExperiments(experiments.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting experiment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Beaker className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">A/B Testing</h1>
            <p className="text-gray-400">Optimize conversions with split testing experiments.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> New Experiment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {experiments.map((exp) => (
          <div key={exp.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{exp.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                    {websites.find(w => w.id === exp.website_id)?.name || 'Unknown Website'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  exp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {exp.status}
                </span>
                <button 
                  onClick={() => toggleStatus(exp.id, exp.status)}
                  className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  {exp.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => deleteExperiment(exp.id)}
                  className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {exp.variants?.map((variant, i) => {
                const rate = variant.visitors > 0 ? ((variant.conversions / variant.visitors) * 100).toFixed(1) : '0.0';
                // Simple logic for winner: highest conversion rate if visitors > 10
                const isWinner = exp.variants.length > 1 && 
                                variant.visitors > 10 && 
                                variant.conversions / variant.visitors === Math.max(...exp.variants.map(v => v.visitors > 0 ? v.conversions / v.visitors : 0));

                return (
                  <div key={variant.id} className={`p-6 rounded-2xl border transition-all ${
                    isWinner ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isWinner ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          {variant.name[0]}
                        </div>
                        <span className="font-bold text-white">{variant.name}</span>
                      </div>
                      {isWinner && (
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Winning
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Visitors</p>
                        <p className="text-xl font-bold text-white">{variant.visitors.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Conversions</p>
                        <p className="text-xl font-bold text-white">{variant.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rate</p>
                        <p className={`text-xl font-bold ${isWinner ? 'text-emerald-400' : 'text-white'}`}>{rate}%</p>
                      </div>
                    </div>

                    <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-gray-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {experiments.length === 0 && (
          <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <Beaker className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No experiments yet</h3>
            <p className="text-gray-500">Click the button above to start your first A/B test.</p>
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
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create Experiment</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Experiment Name</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Checkout Button Color"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Website</label>
                  <select 
                    value={selectedWebsiteId}
                    onChange={(e) => setSelectedWebsiteId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    {websites.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                    {websites.length === 0 && <option disabled>No websites found</option>}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsAdding(false)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Cancel</button>
                <button 
                  onClick={handleCreateExperiment}
                  disabled={submitting || !newName || !selectedWebsiteId}
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start Test'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
