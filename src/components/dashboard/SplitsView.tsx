import React, { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, Users, DollarSign, Shield, FileText, Plus, 
  Settings, TrendingUp, ArrowRight, CheckCircle, AlertCircle,
  Wallet, Banknote, Percent, UserPlus, Search, MoreHorizontal, Loader2,
  ChevronDown, Copy, Link as LinkIcon, Mail, Trash2, Lock, Zap, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { InviteMemberModal } from './InviteMemberModal';
import { teamService, Team, TeamMember, TeamInvite, RevenueSplit, SplitRecipient } from '../../services/teamService';
import { ConnectStripeModal } from './ConnectStripeModal';

import { appToast, destructiveAction } from '@/lib/feedback';
export const SplitsView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'management' | 'splits' | 'payouts'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const ownedTeam = teams.find(t => t.owner_id === user?.id);

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uniqueTeams = await teamService.fetchTeams(user.id);
      if (uniqueTeams.length > 0) {
        setTeams(uniqueTeams);
        if (!selectedTeam) setSelectedTeam(uniqueTeams[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedTeam]);

  const fetchMembers = useCallback(async () => {
    if (!selectedTeam) return;
    try {
      const data = await teamService.fetchMembers(selectedTeam.id);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchTeams();
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const name = `${user.email?.split('@')[0]}'s Team`;
      const slug = `team-${Math.random().toString(36).substring(7)}`;
      const newTeam = await teamService.createTeam(user.id, name, slug);
      
      setTeams([...teams, newTeam]);
      setSelectedTeam(newTeam);
    } catch (error) {
      console.error('Error creating team:', error);
      appToast('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (updatedTeam: Team) => {
    setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    if (selectedTeam?.id === updatedTeam.id) {
      setSelectedTeam(updatedTeam);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!selectedTeam) return;

    try {
      const data = await teamService.inviteMember(selectedTeam.id, email, role);
      setMembers([...members, data]);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      appToast('Failed to invite member. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Manage Team</h1>
          <p className="text-sm md:text-base text-gray-500 mb-4">Manage your team members, roles, and revenue splits.</p>
          
          {/* Team Switcher */}
          <div className="relative inline-block">
            <button 
              onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm md:text-base"
            >
              <span>{selectedTeam?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTeamSwitcher ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showTeamSwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#141414] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowTeamSwitcher(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between ${
                        selectedTeam?.id === team.id ? 'text-white bg-white/5' : 'text-gray-400'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-[10px] opacity-50">{team.owner_id === user?.id ? 'Owner' : 'Member'}</span>
                      </div>
                      {selectedTeam?.id === team.id && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </button>
                  ))}
                  {!ownedTeam && (
                    <div className="border-t border-white/10 p-2">
                      <button 
                        onClick={handleCreateTeam}
                        className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Team
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {selectedTeam?.owner_id === user?.id && (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10 text-sm md:text-base"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-full overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'management', label: 'Team', icon: Users },
          { id: 'splits', label: 'Splits', icon: Percent },
          { id: 'payouts', label: 'Payouts', icon: Banknote },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap flex-1 md:flex-none justify-center ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-sm' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab onInvite={() => setShowInviteModal(true)} membersCount={members.length} />}
          {activeTab === 'management' && (
            <ManagementAndGrowthTab 
              members={members} 
              team={selectedTeam} 
              onInvite={() => setShowInviteModal(true)} 
              onRefreshMembers={fetchMembers}
              onRefreshTeams={fetchTeams}
            />
          )}
          {activeTab === 'splits' && <SplitsTab teamId={selectedTeam?.id} members={members} />}
          {activeTab === 'payouts' && <PayoutsTab members={members} teamId={selectedTeam?.id} onRefreshMembers={fetchMembers} />}
        </motion.div>
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && selectedTeam && (
          <InviteMemberModal 
            teamId={selectedTeam.id}
            isOwner={selectedTeam.owner_id === user?.id}
            onClose={() => setShowInviteModal(false)} 
            onInvite={handleInvite} 
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && selectedTeam && (
          <TeamSettingsModal 
            team={selectedTeam}
            onClose={() => setShowSettingsModal(false)}
            onUpdate={handleUpdateTeam}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TeamSettingsModal = ({ team, onClose, onUpdate }: { team: Team, onClose: () => void, onUpdate: (team: Team) => void }) => {
  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({ name, slug })
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;
      onUpdate(data);
      onClose();
    } catch (err) {
      console.error(err);
      appToast('Failed to update team settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Team Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Team Slug (Unique ID)</label>
            <div className="relative">
              <input 
                type="text" 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2">Used for public links and identification.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading || !name}
              className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const OverviewTab = ({ onInvite, membersCount }: { onInvite: () => void, membersCount: number }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-[#141414] p-5 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
          <Users className="w-24 h-24 text-blue-500" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2.5 md:p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-white">Team Size</h3>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-white mb-1">{membersCount + 1}</p>
        <p className="text-xs md:text-sm text-gray-500">Active members</p>
      </div>

      <div className="bg-[#141414] p-5 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
          <DollarSign className="w-24 h-24 text-emerald-500" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2.5 md:p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-white">Total Payouts</h3>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-white mb-1">€0.00</p>
        <p className="text-xs md:text-sm text-gray-500">Paid out this month</p>
      </div>

      <div className="bg-[#141414] p-5 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
          <Percent className="w-24 h-24 text-purple-500" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2.5 md:p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <Percent className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="font-bold text-base md:text-lg text-white">Active Splits</h3>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-white mb-1">0</p>
        <p className="text-xs md:text-sm text-gray-500">Revenue rules configured</p>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="bg-[#141414] rounded-3xl border border-white/5 p-6">
      <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-500" />
        </div>
        <div>
          <p className="text-white font-medium">No activity yet</p>
          <p className="text-sm text-gray-500">Invite team members to start tracking activity.</p>
        </div>
      </div>
    </div>
  </div>
);

const ManagementAndGrowthTab = ({ 
  members, 
  team, 
  onInvite, 
  onRefreshMembers,
  onRefreshTeams
}: { 
  members: TeamMember[], 
  team: Team | null, 
  onInvite: () => void,
  onRefreshMembers: () => Promise<void>,
  onRefreshTeams: () => Promise<void>
}) => {
  const { user } = useAuth();
  const isOwner = user?.id === team?.owner_id;
  const [subTab, setSubTab] = useState<'members' | 'invites' | 'growth'>('members');
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (subTab === 'invites' && team) {
      fetchInvites();
    }
  }, [subTab, team]);

  const fetchInvites = async () => {
    if (!team) return;
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvites(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const deleteInvite = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to revoke this invite?' }))) return;
    try {
      const { error } = await supabase.from('team_invites').delete().eq('id', id);
      if (error) throw error;
      setInvites(invites.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      appToast('Failed to revoke invite');
    }
  };

  const handleLeave = async () => {
    if (!team || !user) return;
    if (!(await destructiveAction({ description: 'Are you sure you want to leave this team?' }))) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', user.id);

      if (error) throw error;
      await onRefreshTeams();
    } catch (err) {
      console.error(err);
      appToast('Failed to leave team');
    }
  };

  const handleConnectStripe = async (country: string) => {
    if (!selectedMember) return;
    try {
      const data = await invokeApiRunner('connect-create-account', {
        country,
        email: selectedMember.email,
        team_member_id: selectedMember.id
      });

      // Refresh local state
      await onRefreshMembers();
      appToast('Stripe account created successfully!');
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      appToast('Failed to connect Stripe account');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-4 md:gap-6 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'invites', label: 'Invites', icon: Mail },
          { id: 'growth', label: 'Growth', icon: TrendingUp },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`flex items-center gap-2 text-sm font-bold transition-colors whitespace-nowrap ${
              subTab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'members' && <span className="ml-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px]">{members.length + 1}</span>}
          </button>
        ))}
      </div>

      {subTab === 'members' && (
        <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg md:text-xl font-bold text-white">Member Management</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search members..." 
                className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 w-full"
              />
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {/* Owner Row (Always visible) */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  YOU
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">You ({isOwner ? 'Owner' : 'Member'})</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] md:text-xs font-bold border border-emerald-500/20 uppercase tracking-wider">
                  Active
                </span>
                <div className="flex items-center gap-2">
                  {!isOwner && (
                    <button 
                      onClick={handleLeave}
                      className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Leave
                    </button>
                  )}
                  {isOwner && (
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Members */}
            {members.map((member) => (
              <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {member.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{member.email.split('@')[0]}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 md:gap-4">
                  {/* Stripe Connection Status */}
                  {isOwner && (
                    member.stripe_account_id ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#635BFF]/10 text-[#635BFF] rounded-lg border border-[#635BFF]/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Connected</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-white/10 flex items-center gap-1 uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3" /> Payouts
                      </button>
                    )
                  )}

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    member.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {member.status}
                  </span>
                  <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">{member.role}</div>
                  <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Empty State (if no members) */}
            {members.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-gray-500" />
                </div>
                <h4 className="text-white font-bold mb-2">Grow your team</h4>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  Invite developers, designers, or support staff to your workspace. You can assign specific roles and permissions.
                </p>
                <button 
                  onClick={onInvite}
                  className="px-6 py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Invite New Member
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'invites' && (
        <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg md:text-xl font-bold text-white">Pending Invitations</h3>
            <button 
              onClick={onInvite}
              className="w-full sm:w-auto px-4 py-2 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Invite
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {loadingInvites ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" />
              </div>
            ) : invites.length > 0 ? (
              invites.map((invite) => (
                <div key={invite.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium capitalize truncate">{invite.role} Invite Link</p>
                      <p className="text-xs text-gray-500 truncate">
                        Created {new Date(invite.created_at).toLocaleDateString()} • {invite.uses} uses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      new Date(invite.expires_at) > new Date() 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {new Date(invite.expires_at) > new Date() ? 'Active' : 'Expired'}
                    </span>
                    <button 
                      onClick={() => deleteInvite(invite.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-gray-500" />
                </div>
                <h4 className="text-white font-bold mb-2">No pending invitations</h4>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  When you generate invite links or send email invites, they will appear here until accepted.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'growth' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Team Composition</h3>
            <div className="space-y-4">
              {[
                { label: 'Admins', count: 1, color: 'bg-blue-500' },
                { label: 'Developers', count: 0, color: 'bg-emerald-500' },
                { label: 'Designers', count: 0, color: 'bg-purple-500' },
                { label: 'Support', count: 0, color: 'bg-orange-500' },
              ].map((role) => (
                <div key={role.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{role.label}</span>
                    <span className="text-white font-bold">{role.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`${role.color} h-full`} style={{ width: `${(role.count / (members.length + 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-white mb-2">Growth Insights</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Your team has grown by <span className="text-white font-bold">0%</span> this month. Invite more members to see growth trends.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedMember && (
          <ConnectStripeModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
            onConnect={handleConnectStripe} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SplitsTab = ({ teamId, members }: { teamId?: string, members: TeamMember[] }) => {
  const [splits, setSplits] = useState<RevenueSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSplit, setEditingSplit] = useState<RevenueSplit | null>(null);

  useEffect(() => {
    if (!teamId) return;
    fetchSplits();
  }, [teamId]);

  const fetchSplits = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_splits')
        .select(`
          *,
          recipients:split_recipients(*)
        `)
        .eq('team_id', teamId)
        .order('is_global_default', { ascending: false });

      if (error) throw error;
      setSplits(data || []);
    } catch (err) {
      console.error('Error fetching splits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (splitData: Partial<RevenueSplit>, recipients: SplitRecipient[]) => {
    if (!teamId) return;
    
    try {
      let splitId = editingSplit?.id;

      if (splitId) {
        // Update existing split
        const { error: updateError } = await supabase
          .from('revenue_splits')
          .update({
            name: splitData.name,
            tax_buffer_enabled: splitData.tax_buffer_enabled,
            tax_percentage: splitData.tax_percentage,
            platform_fee_percentage: splitData.platform_fee_percentage
          })
          .eq('id', splitId);
        
        if (updateError) throw updateError;
      } else {
        // Create new split
        const { data: newSplit, error: createError } = await supabase
          .from('revenue_splits')
          .insert({
            team_id: teamId,
            name: splitData.name,
            tax_buffer_enabled: splitData.tax_buffer_enabled,
            tax_percentage: splitData.tax_percentage,
            platform_fee_percentage: splitData.platform_fee_percentage,
            is_global_default: splits.length === 0 // First one is default
          })
          .select()
          .single();
        
        if (createError) throw createError;
        splitId = newSplit.id;
      }

      // Update recipients (delete all and re-insert for simplicity)
      if (splitId) {
        await supabase.from('split_recipients').delete().eq('split_id', splitId);
        
        if (recipients.length > 0) {
          const { error: recipientError } = await supabase
            .from('split_recipients')
            .insert(recipients.map(r => ({
              split_id: splitId,
              team_member_id: r.team_member_id,
              percentage: r.percentage
            })));
            
          if (recipientError) throw recipientError;
        }
      }

      setShowModal(false);
      setEditingSplit(null);
      fetchSplits();
    } catch (err) {
      console.error('Error saving split:', err);
      appToast('Failed to save split');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this split?' }))) return;
    try {
      const { error } = await supabase.from('revenue_splits').delete().eq('id', id);
      if (error) throw error;
      fetchSplits();
    } catch (err) {
      console.error(err);
      appToast('Failed to delete split');
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Revenue Splits</h3>
          <p className="text-gray-400 text-sm">Configure distribution among team members.</p>
        </div>
        <button 
          onClick={() => { setEditingSplit(null); setShowModal(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Split
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {splits.map(split => (
          <div key={split.id} className="bg-[#141414] p-5 md:p-6 rounded-3xl border border-white/5 relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 md:p-3 rounded-2xl border ${split.is_global_default ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  <Percent className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">{split.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">{split.is_global_default ? 'Global Default' : 'Custom Rule'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setEditingSplit(split); setShowModal(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {!split.is_global_default && (
                  <button 
                    onClick={() => handleDelete(split.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 mb-6">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-400">Platform Fee</span>
                <span className="text-white font-mono">{split.platform_fee_percentage}%</span>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-400">Tax Buffer</span>
                <span className="text-white font-mono">{split.tax_percentage}%</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center justify-between text-xs md:text-sm font-bold">
                <span className="text-white">Net Pool</span>
                <span className="text-white font-mono">
                  {(100 - (split.platform_fee_percentage || 0) - (split.tax_percentage || 0)).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {split.recipients?.map((recipient: any) => {
                const member = members.find(m => m.id === recipient.team_member_id);
                return (
                  <div key={recipient.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-white flex-shrink-0">
                      {member?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] md:text-sm mb-1">
                        <span className="text-white truncate pr-2">{member?.email || 'Unknown'}</span>
                        <span className="text-white font-mono flex-shrink-0">{recipient.percentage}%</span>
                      </div>
                      <div className="h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${recipient.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!split.recipients || split.recipients.length === 0) && (
                <p className="text-xs md:text-sm text-gray-500 italic text-center py-2">No recipients configured</p>
              )}
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <button 
          onClick={() => { setEditingSplit(null); setShowModal(true); }}
          className="bg-[#141414] p-6 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors group min-h-[200px] md:min-h-[300px]"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 md:w-8 md:h-8 text-gray-500 group-hover:text-white" />
          </div>
          <h3 className="font-bold text-white mb-2 text-sm md:text-base">Create New Split</h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-xs">
            Define a new revenue distribution rule for specific products.
          </p>
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <SplitModal 
            split={editingSplit} 
            members={members}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SplitModal = ({ split, members, onClose, onSave }: { split: RevenueSplit | null, members: TeamMember[], onClose: () => void, onSave: (data: any, recipients: any[]) => Promise<void> }) => {
  const [name, setName] = useState(split?.name || '');
  const [taxEnabled, setTaxEnabled] = useState(split?.tax_buffer_enabled ?? true);
  const [taxPercent, setTaxPercent] = useState(split?.tax_percentage || 21);
  const [platformFee, setPlatformFee] = useState(split?.platform_fee_percentage || 5);
  const [recipients, setRecipients] = useState<SplitRecipient[]>(split?.recipients || []);
  const [saving, setSaving] = useState(false);

  const addRecipient = () => {
    if (members.length === 0) return;
    setRecipients([...recipients, { team_member_id: members[0].id, percentage: 0 }]);
  };

  const updateRecipient = (index: number, field: keyof SplitRecipient, value: any) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    setRecipients(newRecipients);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const totalPercentage = recipients.reduce((sum, r) => sum + Number(r.percentage), 0);
  const isValid = totalPercentage === 100 && name.length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onSave({
      name,
      tax_buffer_enabled: taxEnabled,
      tax_percentage: Number(taxPercent),
      platform_fee_percentage: Number(platformFee)
    }, recipients);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{split ? 'Edit Split' : 'New Split'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Split Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Global Default" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Tax Buffer (%)</label>
                <button 
                  onClick={() => setTaxEnabled(!taxEnabled)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-colors ${taxEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-gray-500'}`}
                >
                  {taxEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <input 
                type="number" 
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                disabled={!taxEnabled}
                className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors ${!taxEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Platform Fee (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={platformFee}
                  disabled
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Fixed platform fee</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-white">Recipients</h4>
              <button 
                onClick={addRecipient}
                className="text-sm text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <select 
                    value={recipient.team_member_id}
                    onChange={(e) => updateRecipient(index, 'team_member_id', e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
                    ))}
                  </select>
                  <div className="relative w-24">
                    <input 
                      type="number" 
                      value={recipient.percentage}
                      onChange={(e) => updateRecipient(index, 'percentage', Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-right pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                  <button 
                    onClick={() => removeRecipient(index)}
                    className="p-3 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {recipients.length === 0 && (
                <p className="text-gray-500 text-sm italic text-center py-4">No recipients added. Add members to distribute the net pool.</p>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
              <span className="text-gray-400 font-medium">Total Allocation</span>
              <span className={`font-mono font-bold ${totalPercentage === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPercentage}%
              </span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Split'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PayoutsTab = ({ 
  members, 
  teamId, 
  onRefreshMembers 
}: { 
  members: TeamMember[], 
  teamId?: string,
  onRefreshMembers: () => Promise<void>
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showOneOffModal, setShowOneOffModal] = useState(false);
  const salariedMembers = members.filter(m => m.fixed_salary && m.fixed_salary > 0);
  const totalPayroll = salariedMembers.reduce((sum, m) => sum + (m.fixed_salary || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Payouts & Salaries</h3>
          <p className="text-gray-400 text-sm">Manage recurring salaries and one-time payouts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => setShowOneOffModal(true)}
            className="flex-1 lg:flex-none px-3 md:px-4 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2 text-xs md:text-sm"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            One-off
          </button>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex-1 lg:flex-none px-3 md:px-4 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10 text-xs md:text-sm"
          >
            Salaries
          </button>
          <button 
            onClick={() => setShowRunModal(true)}
            disabled={salariedMembers.length === 0}
            className="w-full lg:w-auto px-4 md:px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
          >
            <DollarSign className="w-4 h-4" />
            Run Payroll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 md:p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-bold">Monthly Payroll</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">€{totalPayroll.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 md:p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-bold">Salaried Members</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{salariedMembers.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-2.5 md:p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-bold">Next Payout</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">Nov 1, 2024</h3>
            </div>
          </div>
        </div>
      </div>

      {salariedMembers.length > 0 ? (
        <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h4 className="font-bold text-white text-sm md:text-base">Active Salaries</h4>
          </div>
          <div className="divide-y divide-white/5">
            {salariedMembers.map(member => (
              <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {member.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm md:text-base truncate">{member.email}</p>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">{member.role} • {member.salary_interval}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:text-right gap-4">
                  <div className="sm:hidden text-gray-500 text-[10px] uppercase tracking-widest font-bold">Salary</div>
                  <div>
                    <p className="text-white font-bold text-sm md:text-base">€{member.fixed_salary?.toFixed(2)}</p>
                    {member.stripe_account_id ? (
                      <p className="text-[10px] text-emerald-400 flex items-center sm:justify-end gap-1 font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-500 flex items-center sm:justify-end gap-1 font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" /> No Payout
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-black/30 rounded-2xl border border-white/5">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Banknote className="w-8 h-8 text-emerald-500" />
          </div>
          <h4 className="text-white font-bold mb-2">No active payrolls</h4>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Set up recurring salaries for your team members or send one-time bonuses directly from your treasury.
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setShowOneOffModal(true)}
              className="px-6 py-2 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              One-off Payout
            </button>
            <button 
              onClick={() => setShowConfigModal(true)}
              className="px-6 py-2 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors border border-white/10"
            >
              Configure Salaries
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showConfigModal && (
          <ConfigureSalariesModal 
            members={members} 
            onClose={() => setShowConfigModal(false)} 
            onSave={async () => {
              setShowConfigModal(false);
              await onRefreshMembers();
            }} 
          />
        )}
        {showRunModal && (
          <RunPayrollModal 
            members={salariedMembers} 
            total={totalPayroll}
            teamId={teamId}
            onClose={() => setShowRunModal(false)}
            onSuccess={() => {
              setShowRunModal(false);
              appToast('Payroll processed successfully!');
            }}
          />
        )}
        {showOneOffModal && (
          <OneOffPayoutModal
            members={members}
            teamId={teamId}
            onClose={() => setShowOneOffModal(false)}
            onSuccess={() => {
              setShowOneOffModal(false);
              appToast('Payout sent successfully!');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const OneOffPayoutModal = ({ members, teamId, onClose, onSuccess }: { members: TeamMember[], teamId?: string, onClose: () => void, onSuccess: () => void }) => {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!teamId || !selectedMemberId || amount <= 0) return;
    
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    setLoading(true);
    setStatus('Processing payout...');

    try {
      // 1. Create Payout Record
      const { data: payoutRecord, error: dbError } = await supabase
        .from('payouts')
        .insert({
          team_id: teamId,
          recipient_member_id: member.id,
          amount: amount,
          currency: 'EUR',
          type: 'one-off',
          status: 'pending',
          description: description || 'One-off payout',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Trigger Stripe Payout if connected
      if (member.stripe_account_id) {
        try {
          await invokeApiRunner('connect-create-payout', {
            amount: amount,
            currency: 'eur',
            destination_account_id: member.stripe_account_id
          });

          await supabase.from('payouts').update({ status: 'paid' }).eq('id', payoutRecord.id);
          setStatus('Payout successful!');
        } catch (stripeError: any) {
          console.error(`Stripe payout failed:`, stripeError);
          await supabase.from('payouts').update({ status: 'failed', failure_message: stripeError.message }).eq('id', payoutRecord.id);
          setStatus('Failed to send via Stripe.');
          return;
        }
      } else {
        // Manual payout
        setStatus('Recorded as manual payout.');
      }

      onSuccess();

    } catch (error) {
      console.error('Error sending payout:', error);
      setStatus('Error processing payout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Send One-off Payout</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Recipient</label>
            <select 
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount (€)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
              placeholder="Bonus, Reimbursement, etc."
            />
          </div>
        </div>

        {status && (
          <div className="mb-4 text-center text-sm text-indigo-400 font-medium animate-pulse">
            {status}
          </div>
        )}

        <button 
          onClick={handleSend}
          disabled={loading || amount <= 0}
          className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Send Payout
        </button>
      </motion.div>
    </div>
  );
};

const ConfigureSalariesModal = ({ members, onClose, onSave }: { members: TeamMember[], onClose: () => void, onSave: () => void }) => {
  const [salaries, setSalaries] = useState<Record<string, { amount: number, interval: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initial: any = {};
    members.forEach(m => {
      initial[m.id] = {
        amount: m.fixed_salary || 0,
        interval: m.salary_interval || 'monthly'
      };
    });
    setSalaries(initial);
  }, [members]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(salaries).map(([id, data]) => ({
        id,
        fixed_salary: data.amount,
        salary_interval: data.amount > 0 ? data.interval : 'none'
      }));

      for (const update of updates) {
        await supabase
          .from('team_members')
          .update({ 
            fixed_salary: update.fixed_salary,
            salary_interval: update.salary_interval
          })
          .eq('id', update.id);
      }
      onSave();
    } catch (error) {
      console.error('Error saving salaries:', error);
      appToast('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Configure Salaries</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {member.email.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{member.email}</p>
                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                  <input 
                    type="number" 
                    value={salaries[member.id]?.amount || 0}
                    onChange={(e) => setSalaries({
                      ...salaries,
                      [member.id]: { ...salaries[member.id], amount: parseFloat(e.target.value) }
                    })}
                    className="w-32 bg-black border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <select 
                  value={salaries[member.id]?.interval || 'monthly'}
                  onChange={(e) => setSalaries({
                    ...salaries,
                    [member.id]: { ...salaries[member.id], interval: e.target.value }
                  })}
                  className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RunPayrollModal = ({ members, total, teamId, onClose, onSuccess }: { members: TeamMember[], total: number, teamId?: string, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleRun = async () => {
    if (!teamId) return;
    setLoading(true);
    setStatus('Initializing payout...');
    
    try {
      let successCount = 0;
      let failCount = 0;

      for (const member of members) {
        if (!member.fixed_salary || member.fixed_salary <= 0) continue;
        
        setStatus(`Processing payout for ${member.email}...`);

        try {
          // 1. Create Payout Record (Pending)
          const { data: payoutRecord, error: dbError } = await supabase
            .from('payouts')
            .insert({
              team_id: teamId,
              recipient_member_id: member.id,
              amount: member.fixed_salary,
              currency: 'EUR',
              type: 'salary',
              status: 'pending',
              description: `Salary payment for ${new Date().toLocaleString('default', { month: 'long' })}`,
              processed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (dbError) throw dbError;

          // 2. Trigger Stripe Payout if connected
          if (member.stripe_account_id) {
            try {
              await invokeApiRunner('connect-create-payout', {
                amount: member.fixed_salary,
                currency: 'eur',
                destination_account_id: member.stripe_account_id
              });

              // Update status to paid
              await supabase.from('payouts').update({ status: 'paid' }).eq('id', payoutRecord.id);
              successCount++;
            } catch (stripeError: any) {
              console.error(`Stripe payout failed for ${member.email}:`, stripeError);
              // Update status to failed
              await supabase.from('payouts').update({ status: 'failed', failure_message: stripeError.message }).eq('id', payoutRecord.id);
              failCount++;
            }
          } else {
            // No Stripe account, mark as manual/pending
            // For now, we'll consider it "processed" as a manual record
            successCount++;
          }
        } catch (err) {
          console.error(`Error processing member ${member.email}:`, err);
          failCount++;
        }
      }

      setStatus(`Completed: ${successCount} successful, ${failCount} failed.`);
      onSuccess();

    } catch (error) {
      console.error('Error running payroll:', error);
      appToast('Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-white">Confirm Payroll</h3>
          <p className="text-gray-400 mt-2">
            You are about to process salary payments for {members.length} team members.
          </p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Total Amount</span>
            <span className="text-2xl font-bold text-white">€{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Source</span>
            <span className="text-white">Team Wallet</span>
          </div>
        </div>

        {status && (
          <div className="mb-4 text-center text-sm text-indigo-400 font-medium animate-pulse">
            {status}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button 
            onClick={handleRun}
            disabled={loading}
            className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
};
