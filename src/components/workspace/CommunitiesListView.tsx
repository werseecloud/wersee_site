import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, ChevronRight, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CommunitiesListViewProps {
  onNavigate: (view: string) => void;
}

export const CommunitiesListView: React.FC<CommunitiesListViewProps> = ({ onNavigate }) => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch owned communities
      const { data: owned } = await supabase
        .from('communities')
        .select('*')
        .eq('owner_id', user.id);

      // Fetch joined communities
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      const joinedIds = memberships?.map(m => m.community_id) || [];
      
      let all = owned || [];
      
      if (joinedIds.length > 0) {
        const { data: joined } = await supabase
          .from('communities')
          .select('*')
          .in('id', joinedIds);
        
        if (joined) {
          const combined = [...all, ...joined];
          all = Array.from(new Map(combined.map(c => [c.id, c])).values());
        }
      }

      setCommunities(all);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Communities</h1>
          <p className="text-gray-500 text-sm">Manage and explore your communities</p>
        </div>
        <button 
          onClick={() => onNavigate('create-community')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Community
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Search communities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCommunities.map((community) => (
            <motion.button
              key={community.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(`community_${community.id}`)}
              className="group relative bg-[#1A1A1A] border border-white/5 rounded-3xl p-5 text-left transition-all hover:bg-white/[0.02] hover:border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {community.banner_url ? (
                    <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{community.name}</h3>
                    {community.owner_id === supabase.auth.getUser().then(({data}) => data.user?.id) && (
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {community.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Star className="w-3.5 h-3.5" />
                      <span>Premium</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors self-center" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#1A1A1A] border border-dashed border-white/10 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No communities found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            {searchQuery ? `No results for "${searchQuery}"` : "You haven't joined or created any communities yet."}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => onNavigate('create-community')}
              className="px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              Create Your First Community
            </button>
          )}
        </div>
      )}
    </div>
  );
};
