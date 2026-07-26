import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, Target, Users, Shield, TrendingUp, ArrowRight, Plus, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const RaiseCapitalView = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [fundingGoal, setFundingGoal] = useState<number>(10000);
  const [equityOffered, setEquityOffered] = useState<number>(5);
  const [pitch, setPitch] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setBusinesses(data || []);
      if (data && data.length > 0) setSelectedBusiness(data[0].id);
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('startup_campaigns')
        .insert({
          business_id: selectedBusiness,
          user_id: user.id,
          title,
          pitch,
          funding_goal: fundingGoal,
          equity_offered: equityOffered,
          amount_raised: 0,
          status: 'active',
          min_investment: 100
        });

      if (error) throw error;
      setShowCreateModal(false);
      // Refresh or show success
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2">Raise Capital</h2>
          <p className="text-gray-500 text-sm">Open your business to investors and scale faster.</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">Scale Fast</h3>
          <p className="text-sm text-gray-500">Get the capital you need to reach the next milestone.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">Community Owned</h3>
          <p className="text-sm text-gray-500">Turn your customers into your most loyal advocates.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">Secure Equity</h3>
          <p className="text-sm text-gray-500">Automated digital contracts and real-time cap tables.</p>
        </div>
      </div>

      {/* Active Campaigns List */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Active Campaigns</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            You haven't started any funding campaigns yet. Start one to raise capital for your business.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-gray-100 transition-all"
          >
            Start Campaign
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black">Start Campaign</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Business</label>
                <select 
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                  required
                >
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Campaign Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Seed Round 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Funding Goal (€)</label>
                  <input 
                    type="number"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Equity Offered (%)</label>
                  <input 
                    type="number"
                    value={equityOffered}
                    onChange={(e) => setEquityOffered(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pitch / Description</label>
                <textarea 
                  placeholder="Describe why people should invest in your business..."
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 transition-all min-h-[120px]"
                  required
                />
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-200/60 leading-relaxed">
                  By starting a campaign, you agree to our investment terms. Your campaign will be reviewed by our compliance team before going live.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Campaign'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
