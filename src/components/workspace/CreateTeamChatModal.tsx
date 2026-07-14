import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, Check, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { hapticFeedback } from '../../lib/haptics';

interface CreateTeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const CreateTeamChatModal = ({ isOpen, onClose, onChatCreated }: CreateTeamChatModalProps) => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMyTeams();
    }
  }, [isOpen]);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      setTeams(data || []);
      if (data && data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTeamMembers = async (teamId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          email,
          profiles (
            id,
            name,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) throw error;
      
      const formattedMembers = data?.map((m: any) => ({
        id: m.user_id,
        name: m.profiles?.name || m.profiles?.full_name || m.email,
        avatar: m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id || m.email}`
      })).filter(m => m.id) || [];

      setMembers(formattedMembers);
      // Automatically select all by default if requested, or just leave empty
      setSelectedMembers([]);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const handleCreate = async () => {
    if (!selectedTeamId) {
      setError('Please select a team.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedTeam = teams.find(t => t.id === selectedTeamId);

      // Create a new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: `${selectedTeam.name} Chat`,
          team_id: selectedTeamId,
          is_group: true
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const participants = [...new Set([...selectedMembers, user.id])].map(userId => ({
        chat_id: chat.id,
        user_id: userId
      }));

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (partError) throw partError;

      onChatCreated(chat.id);
      onClose();
    } catch (err: any) {
      console.error('Error creating team chat:', err);
      setError(err.message || 'Failed to create team chat.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Team Chat</h3>
              <p className="text-xs text-gray-500">Start a group chat with your team</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Team</label>
            <div className="grid grid-cols-1 gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    hapticFeedback('light');
                    setSelectedTeamId(team.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    selectedTeamId === team.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTeamId === team.id ? 'bg-indigo-500 text-white' : 'bg-white/10'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm">{team.name}</span>
                  {selectedTeamId === team.id && <Check className="w-4 h-4 ml-auto text-indigo-400" />}
                </button>
              ))}
              {teams.length === 0 && !loading && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  You don't own any teams yet.
                </div>
              )}
            </div>
          </div>

          {selectedTeamId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Members</label>
                <button 
                  onClick={selectAll}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      hapticFeedback('light');
                      toggleMember(member.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      selectedMembers.includes(member.id) ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 shrink-0">
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-white font-medium">{member.name}</span>
                    <div className={`ml-auto w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      selectedMembers.includes(member.id) 
                        ? 'bg-indigo-500 border-indigo-500' 
                        : 'border-white/20'
                    }`}>
                      {selectedMembers.includes(member.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No members found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 shrink-0 bg-[#141414]">
          <button
            onClick={() => {
              hapticFeedback('medium');
              handleCreate();
            }}
            disabled={loading || !selectedTeamId}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Team Chat'}
          </button>
        </div>
      </div>
    </BottomSheetModal>
  );
};
