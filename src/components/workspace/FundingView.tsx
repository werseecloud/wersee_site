import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { appToast } from '@/lib/feedback';
export function FundingView({ businessId }: { businessId?: string }) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [capTable, setCapTable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [equityOffered, setEquityOffered] = useState('');
  const [minInvestment, setMinInvestment] = useState('100');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [businessId, user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      let effectiveBusinessId = businessId;
      if (!effectiveBusinessId) {
        const { data: bData } = await supabase.from('businesses').select('id').eq('user_id', user.id).limit(1).maybeSingle();
        if (bData) effectiveBusinessId = bData.id;
      } else {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
        let query = supabase.from('businesses').select('id');
        if (isUUID) {
          query = query.or(`slug.eq.${businessId},id.eq.${businessId}`);
        } else {
          query = query.eq('slug', businessId);
        }
        const { data: bData } = await query.maybeSingle();
        if (bData) effectiveBusinessId = bData.id;
      }

      if (!effectiveBusinessId) {
        setLoading(false);
        return;
      }

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('startup_campaigns')
        .select('*')
        .eq('business_id', effectiveBusinessId)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch cap table
      const { data: capData, error: capError } = await supabase
        .from('cap_tables')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('business_id', effectiveBusinessId)
        .order('equity_percentage', { ascending: false });

      if (capError) throw capError;
      setCapTable(capData || []);

    } catch (err) {
      console.error('Error fetching funding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let effectiveBusinessId = businessId;
    if (!effectiveBusinessId) {
      const { data: bData } = await supabase.from('businesses').select('id').eq('user_id', user.id).limit(1).maybeSingle();
      if (bData) effectiveBusinessId = bData.id;
    } else {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
      let query = supabase.from('businesses').select('id');
      if (isUUID) {
        query = query.or(`slug.eq.${businessId},id.eq.${businessId}`);
      } else {
        query = query.eq('slug', businessId);
      }
      const { data: bData } = await query.maybeSingle();
      if (bData) effectiveBusinessId = bData.id;
    }

    if (!effectiveBusinessId) {
      appToast('You must create a business first before starting a funding campaign.');
      return;
    }

    try {
      const { error } = await supabase
        .from('startup_campaigns')
        .insert({
          business_id: effectiveBusinessId,
          title,
          pitch,
          funding_goal: Number(fundingGoal),
          equity_offered: Number(equityOffered),
          min_investment: Number(minInvestment),
          status: 'active'
        });

      if (error) throw error;
      
      setShowCreateModal(false);
      setTitle('');
      setPitch('');
      setFundingGoal('');
      setEquityOffered('');
      fetchData();
    } catch (err) {
      console.error('Error creating campaign:', err);
      appToast('Failed to create campaign');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Funding & Cap Table</h1>
          <p className="text-gray-400">Manage your fundraising campaigns and view your shareholders.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaigns List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Your Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-gray-400 mb-4">No funding campaigns yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-emerald-400 font-medium hover:text-emerald-300"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const progress = Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100);
                return (
                  <div key={campaign.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{campaign.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          campaign.status === 'funded' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {campaign.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Raised</p>
                        <p className="font-bold text-white">€{campaign.amount_raised.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{progress.toFixed(1)}% of €{campaign.funding_goal.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
                      <div>
                        <p className="text-gray-400">Equity</p>
                        <p className="font-medium text-white">{campaign.equity_offered}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Investors</p>
                        <p className="font-medium text-white">{campaign.investors_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Min. Invest</p>
                        <p className="font-medium text-white">€{campaign.min_investment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cap Table */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Cap Table</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {capTable.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No external shareholders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-sm">
                      <th className="p-4 font-medium text-gray-400">Investor</th>
                      <th className="p-4 font-medium text-gray-400">Total Invested</th>
                      <th className="p-4 font-medium text-gray-400">Equity %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capTable.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {entry.users?.raw_user_meta_data?.full_name || 'Anonymous Investor'}
                              </p>
                              <p className="text-xs text-gray-500">{entry.users?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-white text-sm">€{Number(entry.total_investment).toLocaleString()}</td>
                        <td className="p-4 text-emerald-400 font-medium text-sm">{Number(entry.equity_percentage).toFixed(4)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create Funding Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Seed Round 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pitch</label>
                <textarea
                  required
                  rows={4}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Describe your vision, traction, and why people should invest..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Funding Goal (€)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Equity Offered (%)</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={equityOffered}
                    onChange={(e) => setEquityOffered(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Min. Investment (€)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={minInvestment}
                  onChange={(e) => setMinInvestment(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                <p className="text-sm text-blue-200">
                  <strong>Note:</strong> This will create a simulated campaign. Real money will not be collected, and shares are simulated for MVP testing purposes.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
