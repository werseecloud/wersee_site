import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TrendingUp, Shield, Users, ArrowRight, Activity } from 'lucide-react';

interface InvestmentsProps {
  isWorkspace?: boolean;
}

export function Investments({ isWorkspace = false }: InvestmentsProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('startup_campaigns')
        .select(`
          *,
          businesses:business_id (
            name,
            logo_url,
            description
          )
        `)
        .in('status', ['active', 'funded'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isWorkspace ? '' : 'min-h-screen bg-black pt-24'} text-white pb-12 px-4 sm:px-6 lg:px-8`}>
      <div className={isWorkspace ? '' : 'max-w-7xl mx-auto'}>
        <div className={isWorkspace ? 'mb-8' : 'text-center mb-16'}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={isWorkspace ? 'text-3xl font-bold mb-2' : 'text-4xl md:text-6xl font-bold mb-6'}
          >
            Invest in the <span className="text-emerald-400">Future</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={isWorkspace ? 'text-gray-400' : 'text-xl text-gray-400 max-w-3xl mx-auto'}
          >
            Discover and invest in promising startups. Own a piece of the next big thing with our frictionless, digital-first investment platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Simulated Ownership</h3>
            <p className="text-gray-400 text-sm">Experience startup investing with our simulated shares system. No complex paperwork required.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Scoring</h3>
            <p className="text-gray-400 text-sm">Make informed decisions with our AI-powered risk assessment and growth predictions.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Transparent</h3>
            <p className="text-gray-400 text-sm">Real-time cap tables and automated digital contracts keep your investments secure.</p>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Active Campaigns</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-gray-400">No active campaigns at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100);
              
              return (
                <Link 
                  key={campaign.id} 
                  to={`/investments/${campaign.id}`}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {campaign.businesses?.logo_url ? (
                        <img src={campaign.businesses.logo_url} alt={campaign.businesses.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold">{campaign.businesses?.name?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.businesses?.name || 'Unknown Business'}</h3>
                        <p className="text-sm text-gray-400">{campaign.title}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-6 line-clamp-2">
                      {campaign.pitch}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-emerald-400 font-medium">€{campaign.amount_raised.toLocaleString()} raised</span>
                          <span className="text-gray-400">of €{campaign.funding_goal.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Equity Offered</p>
                          <p className="font-semibold">{campaign.equity_offered}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Min. Investment</p>
                          <p className="font-semibold">€{campaign.min_investment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 px-6 py-4 flex items-center justify-between group-hover:bg-emerald-500/10 transition-colors">
                    <span className="text-sm font-medium">View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
