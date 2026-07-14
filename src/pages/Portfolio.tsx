import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PieChart, ArrowUpRight, Briefcase, Activity } from 'lucide-react';

interface PortfolioProps {
  isWorkspace?: boolean;
}

export function Portfolio({ isWorkspace = false }: PortfolioProps) {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [capTables, setCapTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      // Fetch user's cap table entries
      const { data: capData, error: capError } = await supabase
        .from('cap_tables')
        .select(`
          *,
          businesses:business_id (
            name,
            logo_url
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (capError) throw capError;
      setCapTables(capData || []);

      // Fetch recent investment transactions
      const { data: invData, error: invError } = await supabase
        .from('investments')
        .select(`
          *,
          campaigns:campaign_id (
            title,
            businesses:business_id (
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (invError) throw invError;
      setInvestments(invData || []);

    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`${isWorkspace ? '' : 'min-h-screen bg-black'} flex items-center justify-center text-white`}>
        <p>Please log in to view your portfolio.</p>
      </div>
    );
  }

  const totalInvested = capTables.reduce((sum, entry) => sum + Number(entry.total_investment), 0);

  return (
    <div className={`${isWorkspace ? '' : 'min-h-screen bg-black pt-24'} text-white pb-12 px-4 sm:px-6 lg:px-8`}>
      <div className={isWorkspace ? '' : 'max-w-7xl mx-auto'}>
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Your Portfolio</h1>
          <p className="text-gray-400">Track your simulated startup investments and equity.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overview Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Invested</p>
                    <p className="text-2xl font-bold">€{totalInvested.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Companies Owned</p>
                    <p className="text-2xl font-bold">{capTables.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Portfolio Status</p>
                    <p className="text-2xl font-bold text-emerald-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cap Table */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Your Equity (Cap Table)</h2>
              {capTables.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-gray-400 mb-4">You haven't made any investments yet.</p>
                  <Link 
                    to="/investments"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Explore Startups <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="p-4 font-medium text-gray-400">Company</th>
                          <th className="p-4 font-medium text-gray-400">Total Invested</th>
                          <th className="p-4 font-medium text-gray-400">Equity %</th>
                          <th className="p-4 font-medium text-gray-400">First Investment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capTables.map((entry) => (
                          <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {entry.businesses?.logo_url ? (
                                  <img src={entry.businesses.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-bold">
                                    {entry.businesses?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <span className="font-medium">{entry.businesses?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="p-4">€{Number(entry.total_investment).toLocaleString()}</td>
                            <td className="p-4 text-emerald-400 font-medium">{Number(entry.equity_percentage).toFixed(4)}%</td>
                            <td className="p-4 text-gray-400 text-sm">{new Date(entry.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                {investments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center">No recent activity.</p>
                ) : (
                  <div className="space-y-6">
                    {investments.map((inv) => (
                      <div key={inv.id} className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Invested in {inv.campaigns?.businesses?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-emerald-400 font-medium text-sm">€{Number(inv.amount).toLocaleString()}</span>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-gray-400 text-xs">{new Date(inv.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
