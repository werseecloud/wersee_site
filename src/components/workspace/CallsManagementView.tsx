import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Briefcase, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PortalCalls } from './portals/PortalCalls';

export const CallsManagementView = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses for calls:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (selectedBusiness) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <button
          onClick={() => setSelectedBusiness(null)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Businesses
        </button>
        <PortalCalls businessId={selectedBusiness.id} user={user} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <Phone className="w-8 h-8 text-indigo-400" />
          Call Scheduling
        </h1>
        <p className="text-gray-400">Manage discovery calls, consultations, and bookings for your businesses.</p>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Businesses Found</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            You need to create a business before you can manage call scheduling.
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
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group cursor-pointer"
              onClick={() => setSelectedBusiness(business)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-2xl border border-indigo-500/20">
                    {business.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{business.name}</h3>
                    <p className="text-sm text-gray-500">
                      Manage calls & bookings
                    </p>
                  </div>
                </div>
              </div>

              <button 
                className="w-full py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-all"
              >
                Manage Calls <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
