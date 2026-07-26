import React, { useState, useEffect } from 'react';
import { Handshake, Plus, Users, MessageSquare, Trash2, Clock, Search, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Partnership {
  id: string;
  partner_name: string;
  type: 'creator' | 'business' | 'agency';
  status: 'active' | 'pending' | 'negotiating';
  revenue: number;
  start_date: string;
  avatar?: string | null;
  proposal?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const PartnershipsView = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'creator' | 'business' | 'agency'>('creator');
  const [newProposal, setNewProposal] = useState('');

  useEffect(() => {
    if (user) {
      fetchPartnerships();
    }
  }, [user]);

  const fetchPartnerships = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.get<Partnership>('partnerships', {
        eq: { user_id: user?.id },
        order: { column: 'created_at', ascending: false }
      });
      setPartnerships((Array.isArray(data) ? data : []).filter(Boolean));
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartnership = async () => {
    const partnerName = newName.trim();
    if (!partnerName || !user?.id) return;
    setSubmitting(true);
    try {
      const newPartner = await DatabaseService.insert<Partnership>('partnerships', {
        partner_name: partnerName,
        type: newType,
        user_id: user.id,
        status: 'pending',
        revenue: 0,
        start_date: new Date().toISOString().split('T')[0],
        avatar: null,
        proposal: newProposal.trim() || null
      });
      if (!newPartner) throw new Error('The partnership was not returned after saving.');
      setPartnerships(current => [newPartner, ...current.filter(Boolean)]);
      setIsAdding(false);
      setNewName('');
      setNewProposal('');
      toast.success('Partnership saved');
    } catch (error: any) {
      console.error('Error creating partnership:', error);
      toast.error(error?.message || 'Something went wrong while saving the partnership.');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePartnership = async (id: string) => {
    setSubmitting(true);
    try {
      await DatabaseService.delete('partnerships', id);
      setPartnerships(current => current.filter(p => p?.id !== id));
      setConfirmDeleteId(null);
      toast.success('Partnership deleted');
    } catch (error) {
      console.error('Error deleting partnership:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPartnerships = partnerships.filter((p): p is Partnership => Boolean(
    p?.id && p?.partner_name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )
  );
  const activePartnerships = partnerships.filter(p => p?.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Partnerships</h1>
            <p className="text-gray-400">Manage collaborations with creators and businesses.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Partnership
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredPartnerships.map((partner) => (
              <div key={partner.id} className="p-4 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  {partner.avatar ? (
                    <img src={partner.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black">
                      {partner.partner_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white">{partner.partner_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{partner.type}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="text-[10px] text-gray-500 font-bold">Since {partner.start_date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Revenue</p>
                    <p className="text-sm font-bold text-white">€{Number(partner.revenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      partner.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {partner.status}
                    </span>
                    <button className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(partner.id)}
                      className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPartnerships.length === 0 && (
              <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">No partnerships found</h3>
                <p className="text-gray-500">Try a different search or add a new partner.</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDeleteId(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <h2 className="text-xl font-bold text-white mb-4">Confirm Deletion</h2>
                <p className="text-gray-400 mb-8">Are you sure you want to delete this partnership? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => deletePartnership(confirmDeleteId)}
                    disabled={submitting}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {partnerships.slice(0, 5).map((partnership) => (
                <div key={partnership.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {partnership.status === 'active'
                        ? `Partnership with ${partnership.partner_name} is active`
                        : partnership.status === 'negotiating'
                          ? `Negotiation opened with ${partnership.partner_name}`
                          : `Proposal created for ${partnership.partner_name}`}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">
                      {partnership.updated_at || partnership.created_at
                        ? formatDistanceToNow(new Date(partnership.updated_at || partnership.created_at!), { addSuffix: true })
                        : new Date(partnership.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {partnerships.length === 0 && (
                <p className="py-3 text-center text-xs text-gray-500">Partnership activity will appear here.</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Partner Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total</p>
                <p className="text-xl font-bold text-white">{partnerships.length}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Growth</p>
                <p className="text-xl font-bold text-emerald-400">{activePartnerships}</p>
              </div>
            </div>
          </div>
        </div>
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
              <h2 className="text-2xl font-bold text-white mb-6">Partner Collaboration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Partner Name / Email</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Search for creators or enter email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Partnership Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['creator', 'business', 'agency'] as const).map((type) => (
                      <button 
                        key={type} 
                        onClick={() => setNewType(type)}
                        className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                          newType === type 
                            ? 'bg-indigo-500 border-indigo-500 text-white' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-indigo-500/50'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Initial Proposal</label>
                  <textarea 
                    placeholder="Describe the collaboration..."
                    value={newProposal}
                    onChange={(event) => setNewProposal(event.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsAdding(false)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Cancel</button>
                <button 
                  onClick={handleCreatePartnership}
                  disabled={submitting || !newName}
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Invite'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
