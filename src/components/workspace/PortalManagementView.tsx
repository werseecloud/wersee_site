import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { ShieldCheck, ExternalLink, Users, FileText, Briefcase, ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortalManagementView = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses for portals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
          Team Portals
        </h1>
        <p className="text-gray-400">Manage your custom access screens for job applicants and team members.</p>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Businesses Found</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            You need to create a business before you can manage its team portal.
          </p>
          <Link 
            to="/workspace/create-business"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all"
          >
            Create Business <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map((business) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-2xl border border-indigo-500/20">
                    {business.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{business.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      portal/{business.slug || business.id}
                    </p>
                  </div>
                </div>
                <Link 
                  to={`/portal/${business.slug || business.id}`}
                  target="_blank"
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">
                    <Users className="w-3 h-3" /> Team
                  </div>
                  <div className="text-lg font-bold text-white">Active</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">
                    <FileText className="w-3 h-3" /> Docs
                  </div>
                  <div className="text-lg font-bold text-white">Shared</div>
                </div>
              </div>

              <Link 
                to={`/portal/${business.slug || business.id}`}
                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
              >
                Open Portal <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
