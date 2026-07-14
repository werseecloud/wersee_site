import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import InvestmentModal from '../components/investments/InvestmentModal';

export default function InvestmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
      fetchUpdates();
    }
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('startup_campaigns')
        .select(`
          *,
          businesses:business_id (
            name,
            logo_url,
            description,
            website
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (err) {
      console.error('Error fetching campaign:', err);
      navigate('/investments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('investment_updates')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (err) {
      console.error('Error fetching updates:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!campaign) return null;

  const progress = Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/investments')}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Investments
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-6 mb-8">
                {campaign.businesses?.logo_url ? (
                  <img src={campaign.businesses.logo_url} alt={campaign.businesses.name} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-bold">{campaign.businesses?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{campaign.businesses?.name || 'Unknown Business'}</h1>
                  <p className="text-xl text-gray-400">{campaign.title}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4">The Pitch</h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {campaign.pitch}
                </p>
              </div>
            </div>

            {/* Updates Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-semibold mb-6">Founder Updates</h3>
              {updates.length === 0 ? (
                <p className="text-gray-400 italic">No updates posted yet.</p>
              ) : (
                <div className="space-y-6">
                  {updates.map((update) => (
                    <div key={update.id} className="bg-emerald-500/5 rounded-xl px-6 py-4">
                      <h4 className="font-medium text-lg mb-2">{update.title}</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {new Date(update.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 whitespace-pre-wrap">{update.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-emerald-400">
                    €{campaign.amount_raised.toLocaleString()}
                  </span>
                  <span className="text-gray-400 mb-1">
                    raised of €{campaign.funding_goal.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{campaign.investors_count} investors</span>
                  <span>{progress.toFixed(1)}% funded</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Equity Offered</span>
                  <span className="font-semibold">{campaign.equity_offered}%</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Min. Investment</span>
                  <span className="font-semibold">€{campaign.min_investment}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Valuation (Cap)</span>
                  <span className="font-semibold">
                    €{((campaign.funding_goal / campaign.equity_offered) * 100).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    navigate('/auth');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors mb-4"
              >
                Invest Now
              </button>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/80">
                  This is a simulated investment for MVP purposes. No real money will be charged, and shares are simulated within the platform.
                </p>
              </div>
            </div>

            {/* AI Scoring */}
            {campaign.risk_score && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  AI Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Risk Score</span>
                      <span className={campaign.risk_score < 40 ? 'text-emerald-400' : campaign.risk_score < 70 ? 'text-yellow-400' : 'text-red-400'}>
                        {campaign.risk_score}/100
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${campaign.risk_score < 40 ? 'bg-emerald-500' : campaign.risk_score < 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${campaign.risk_score}%` }}
                      />
                    </div>
                  </div>
                  {campaign.growth_prediction && (
                    <div className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl">
                      "{campaign.growth_prediction}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <InvestmentModal 
          campaign={campaign} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCampaignDetails();
          }}
        />
      )}
    </div>
  );
}
