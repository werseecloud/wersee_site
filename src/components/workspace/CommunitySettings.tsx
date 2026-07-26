import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Users, Link as LinkIcon, Clock, Award, Plus, Trash2, Check, X, ChevronRight, Settings as SettingsIcon, BarChart3, Zap, CreditCard, LayoutTemplate, Globe, Palette, DollarSign } from 'lucide-react';

import { appToast, destructiveAction } from '@/lib/feedback';
interface CommunitySettingsProps {
  community: any;
  isOwner: boolean;
}

export function CommunitySettings({ community, isOwner }: CommunitySettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'onboarding' | 'trust' | 'invites' | 'analytics' | 'automation' | 'monetization'>('general');
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [trustLevels, setTrustLevels] = useState<any[]>(Array.isArray(community.trust_level_config) ? community.trust_level_config : []);
  const [editingTrustLevel, setEditingTrustLevel] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [editingInvite, setEditingInvite] = useState<any>(null);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [editingAutomationRule, setEditingAutomationRule] = useState<any>(null);
  const [monetizationTiers, setMonetizationTiers] = useState<any[]>([]);
  const [editingMonetizationTier, setEditingMonetizationTier] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    newMembers: 0,
    totalMessages: 0,
    activeUsers: 0
  });
  const [onboardingFlow, setOnboardingFlow] = useState(community.onboarding_flow || { steps: [] });
  const [generalSettings, setGeneralSettings] = useState({
    name: community.name || '',
    description: community.description || '',
    privacy_level: community.privacy_level || 'public',
    custom_domain: community.custom_domain || '',
    branding_config: community.branding_config || { primary_color: '#4f46e5' },
    landing_page_config: community.landing_page_config || { vibe: 'casual' }
  });

  const handleSaveOnboarding = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          onboarding_flow: onboardingFlow
        })
        .eq('id', community.id);

      if (error) throw error;
      appToast('Onboarding flow saved successfully!');
    } catch (error) {
      console.error('Error saving onboarding flow:', error);
      appToast('Error saving onboarding flow. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: generalSettings.name,
          description: generalSettings.description,
          privacy_level: generalSettings.privacy_level,
          custom_domain: generalSettings.custom_domain,
          branding_config: generalSettings.branding_config,
          landing_page_config: generalSettings.landing_page_config
        })
        .eq('id', community.id);

      if (error) throw error;
      appToast('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving general settings:', error);
      appToast('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrustLevel = async () => {
    if (!editingTrustLevel.role_id) return;
    setSaving(true);
    try {
      let newTrustLevels = [...trustLevels];
      if (editingTrustLevel.id === 'new') {
        newTrustLevels.push({
          id: crypto.randomUUID(),
          role_id: editingTrustLevel.role_id,
          required_messages: editingTrustLevel.required_messages,
          required_days: editingTrustLevel.required_days
        });
      } else {
        newTrustLevels = newTrustLevels.map(t => t.id === editingTrustLevel.id ? editingTrustLevel : t);
      }

      const { error } = await supabase
        .from('communities')
        .update({ trust_level_config: newTrustLevels })
        .eq('id', community.id);

      if (error) throw error;
      setTrustLevels(newTrustLevels);
      setEditingTrustLevel(null);
    } catch (error) {
      console.error('Error saving trust level:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrustLevel = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this trust level?' }))) return;
    try {
      const newTrustLevels = trustLevels.filter(t => t.id !== id);
      const { error } = await supabase
        .from('communities')
        .update({ trust_level_config: newTrustLevels })
        .eq('id', community.id);

      if (error) throw error;
      setTrustLevels(newTrustLevels);
      if (editingTrustLevel?.id === id) setEditingTrustLevel(null);
    } catch (error) {
      console.error('Error deleting trust level:', error);
    }
  };

  const PERMISSIONS = [
    { id: 'view_channels', label: 'View Channels', description: 'Allows members to view channels by default' },
    { id: 'send_messages', label: 'Send Messages', description: 'Allows members to send messages in text channels' },
    { id: 'manage_messages', label: 'Manage Messages', description: 'Allows members to delete messages by other members' },
    { id: 'manage_roles', label: 'Manage Roles', description: 'Allows members to create, edit, or delete roles lower than their highest role' },
    { id: 'manage_channels', label: 'Manage Channels', description: 'Allows members to create, edit, or delete channels' },
    { id: 'manage_settings', label: 'Manage Settings', description: 'Allows members to edit community settings, banner, and rules' },
    { id: 'kick_members', label: 'Kick Members', description: 'Allows members to remove other members from the community' },
    { id: 'ban_members', label: 'Ban Members', description: 'Allows members to permanently ban other members' },
    { id: 'administrator', label: 'Administrator', description: 'Grants all permissions and bypasses channel specific permissions' }
  ];

  const [onboardingConfig, setOnboardingConfig] = useState<any>((community.onboarding_config && typeof community.onboarding_config === 'object' && !Array.isArray(community.onboarding_config)) ? community.onboarding_config : {
    welcome_message: 'Welcome to our community!',
    recommended_channels: []
  });
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    fetchRoles();
    fetchChannels();
    fetchInvites();
    fetchAutomationRules();
    fetchMonetizationTiers();
    fetchAnalytics();
  }, [community.id]);

  const fetchAnalytics = async () => {
    try {
      // Total members
      const { count: totalMembers } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      // New members (30d)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newMembers } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)
        .gt('created_at', thirtyDaysAgo.toISOString());

      // Total messages
      const { data: channels } = await supabase
        .from('community_channels')
        .select('id')
        .eq('community_id', community.id);
      
      const channelIds = channels?.map(c => c.id) || [];
      let totalMessages = 0;
      if (channelIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('channel_id', channelIds);
        totalMessages = count || 0;
      }

      setAnalytics({
        totalMembers: totalMembers || 0,
        newMembers: newMembers || 0,
        totalMessages,
        activeUsers: Math.floor((totalMembers || 0) * 0.6) // Mock active users for now
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchMonetizationTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_monetization_tiers')
        .select('*')
        .eq('community_id', community.id);
      if (error) throw error;
      setMonetizationTiers(data || []);
    } catch (error) {
      console.error('Error fetching monetization tiers:', error);
    }
  };

  const handleSaveMonetizationTier = async () => {
    if (!editingMonetizationTier.name.trim() || !editingMonetizationTier.price) return;
    setSaving(true);
    try {
      if (editingMonetizationTier.id === 'new') {
        const { data, error } = await supabase
          .from('community_monetization_tiers')
          .insert({
            community_id: community.id,
            name: editingMonetizationTier.name,
            description: editingMonetizationTier.description,
            price: editingMonetizationTier.price,
            currency: editingMonetizationTier.currency,
            interval: editingMonetizationTier.interval,
            role_id: editingMonetizationTier.role_id || null,
            is_active: editingMonetizationTier.is_active
          })
          .select()
          .single();

        if (error) throw error;
        setMonetizationTiers([data, ...monetizationTiers]);
      } else {
        const { error } = await supabase
          .from('community_monetization_tiers')
          .update({
            name: editingMonetizationTier.name,
            description: editingMonetizationTier.description,
            price: editingMonetizationTier.price,
            currency: editingMonetizationTier.currency,
            interval: editingMonetizationTier.interval,
            role_id: editingMonetizationTier.role_id || null,
            is_active: editingMonetizationTier.is_active
          })
          .eq('id', editingMonetizationTier.id);

        if (error) throw error;
        setMonetizationTiers(monetizationTiers.map(t => t.id === editingMonetizationTier.id ? editingMonetizationTier : t));
      }
      setEditingMonetizationTier(null);
    } catch (error) {
      console.error('Error saving monetization tier:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonetizationTier = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this tier?' }))) return;
    try {
      const { error } = await supabase
        .from('community_monetization_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMonetizationTiers(monetizationTiers.filter(t => t.id !== id));
      if (editingMonetizationTier?.id === id) setEditingMonetizationTier(null);
    } catch (error) {
      console.error('Error deleting monetization tier:', error);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('community_automation_rules')
        .select('*')
        .eq('community_id', community.id);
      if (error) throw error;
      setAutomationRules(data || []);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  };

  const handleSaveAutomationRule = async () => {
    if (!editingAutomationRule.name.trim()) return;
    setSaving(true);
    try {
      if (editingAutomationRule.id === 'new') {
        const { data, error } = await supabase
          .from('community_automation_rules')
          .insert({
            community_id: community.id,
            name: editingAutomationRule.name,
            trigger_type: editingAutomationRule.trigger_type,
            conditions: editingAutomationRule.conditions,
            actions: editingAutomationRule.actions,
            is_active: editingAutomationRule.is_active
          })
          .select()
          .single();

        if (error) throw error;
        setAutomationRules([data, ...automationRules]);
      } else {
        const { error } = await supabase
          .from('community_automation_rules')
          .update({
            name: editingAutomationRule.name,
            trigger_type: editingAutomationRule.trigger_type,
            conditions: editingAutomationRule.conditions,
            actions: editingAutomationRule.actions,
            is_active: editingAutomationRule.is_active
          })
          .eq('id', editingAutomationRule.id);

        if (error) throw error;
        setAutomationRules(automationRules.map(r => r.id === editingAutomationRule.id ? editingAutomationRule : r));
      }
      setEditingAutomationRule(null);
    } catch (error) {
      console.error('Error saving automation rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAutomationRule = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this automation rule?' }))) return;
    try {
      const { error } = await supabase
        .from('community_automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAutomationRules(automationRules.filter(r => r.id !== id));
      if (editingAutomationRule?.id === id) setEditingAutomationRule(null);
    } catch (error) {
      console.error('Error deleting automation rule:', error);
    }
  };

  useEffect(() => {
    // Sync config from community prop
    setTrustLevels(Array.isArray(community.trust_level_config) ? community.trust_level_config : []);
    setOnboardingConfig((community.onboarding_config && typeof community.onboarding_config === 'object' && !Array.isArray(community.onboarding_config)) ? community.onboarding_config : {
      welcome_message: 'Welcome to our community!',
      recommended_channels: []
    });
  }, [community.trust_level_config, community.onboarding_config]);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('community_invites')
        .select('*')
        .eq('community_id', community.id);
      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const handleSaveInvite = async () => {
    if (!editingInvite.role_id) return;
    setSaving(true);
    try {
      if (editingInvite.id === 'new') {
        const { data, error } = await supabase
          .from('community_invites')
          .insert({
            community_id: community.id,
            creator_id: (await supabase.auth.getUser()).data.user?.id,
            role_id: editingInvite.role_id,
            expires_at: editingInvite.expires_at || null,
            max_uses: editingInvite.max_uses || null
          })
          .select()
          .single();

        if (error) throw error;
        setInvites([data, ...invites]);
      } else {
        const { error } = await supabase
          .from('community_invites')
          .update({
            role_id: editingInvite.role_id,
            expires_at: editingInvite.expires_at || null,
            max_uses: editingInvite.max_uses || null
          })
          .eq('id', editingInvite.id);

        if (error) throw error;
        setInvites(invites.map(i => i.id === editingInvite.id ? editingInvite : i));
      }
      setEditingInvite(null);
    } catch (error) {
      console.error('Error saving invite:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this invite?' }))) return;
    try {
      const { error } = await supabase
        .from('community_invites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInvites(invites.filter(i => i.id !== id));
      if (editingInvite?.id === id) setEditingInvite(null);
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .eq('community_id', community.id);
      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('community_roles')
        .select('*')
        .eq('community_id', community.id)
        .order('hierarchy_level', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingRole.name.trim()) return;
    setSaving(true);
    try {
      if (editingRole.id === 'new') {
        const { data, error } = await supabase
          .from('community_roles')
          .insert({
            community_id: community.id,
            name: editingRole.name,
            color: editingRole.color,
            hierarchy_level: editingRole.hierarchy_level,
            permissions: editingRole.permissions
          })
          .select()
          .single();

        if (error) throw error;
        setRoles([data, ...roles].sort((a, b) => b.hierarchy_level - a.hierarchy_level));
      } else {
        const { error } = await supabase
          .from('community_roles')
          .update({
            name: editingRole.name,
            color: editingRole.color,
            hierarchy_level: editingRole.hierarchy_level,
            permissions: editingRole.permissions
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r).sort((a, b) => b.hierarchy_level - a.hierarchy_level));
      }
      setEditingRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this role?' }))) return;
    try {
      const { error } = await supabase
        .from('community_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      setRoles(roles.filter(r => r.id !== roleId));
      if (editingRole?.id === roleId) setEditingRole(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only community owners and authorized staff can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A]">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Community Settings</h1>
              <p className="text-sm text-gray-400">Manage roles, permissions, and onboarding</p>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-2 bg-[#0A0A0A] border-b border-white/5 mb-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {[
                { id: 'general', icon: SettingsIcon, label: 'General' },
                { id: 'roles', icon: Shield, label: 'Roles' },
                { id: 'onboarding', icon: Users, label: 'Onboarding' },
                { id: 'trust', icon: Award, label: 'Trust' },
                { id: 'invites', icon: LinkIcon, label: 'Invites' },
                { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                { id: 'automation', icon: Zap, label: 'Automation' },
                { id: 'monetization', icon: CreditCard, label: 'Monetization' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-gap-8 md:flex-row gap-8">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-64 shrink-0 space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'general'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'roles'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-5 h-5" />
                Roles & Permissions
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'onboarding'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-5 h-5" />
                User Onboarding
              </button>
              <button
                onClick={() => setActiveTab('trust')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'trust'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Award className="w-5 h-5" />
                Trust Levels
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'invites'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
                Custom Invites
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'automation'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-5 h-5" />
                Automation
              </button>
              <button
                onClick={() => setActiveTab('monetization')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'monetization'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Monetization
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-[#141414] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl min-h-[600px]">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-white">General Settings</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage your community's core identity and visibility.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Community Name</label>
                      <input 
                        type="text" 
                        value={generalSettings.name}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea 
                        value={generalSettings.description}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Privacy Level</label>
                        <select 
                          value={generalSettings.privacy_level}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, privacy_level: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                        >
                          <option value="public">Public (Discoverable)</option>
                          <option value="private">Private (Invite Only)</option>
                          <option value="hidden">Hidden (Unlisted)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 md:px-4 rounded-l-xl border border-r-0 border-white/10 bg-white/5 text-gray-400 text-xs md:text-sm">
                            wersee.gg/
                          </span>
                          <input 
                            type="text" 
                            value={generalSettings.custom_domain}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, custom_domain: e.target.value })}
                            placeholder="your-community"
                            className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        Branding & Theme
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={generalSettings.branding_config?.primary_color || '#4f46e5'}
                              onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                branding_config: { ...generalSettings.branding_config, primary_color: e.target.value }
                              })}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-sm text-gray-400">{generalSettings.branding_config?.primary_color || '#4f46e5'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Vibe (AI Theme)</label>
                          <select 
                            value={generalSettings.landing_page_config?.vibe || 'casual'}
                            onChange={(e) => setGeneralSettings({
                              ...generalSettings,
                              landing_page_config: { ...generalSettings.landing_page_config, vibe: e.target.value }
                            })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                          >
                            <option value="casual">Casual & Friendly</option>
                            <option value="startup">Startup & Professional</option>
                            <option value="gaming">Gaming & Esports</option>
                            <option value="creator">Creator & Artistic</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                        AI Landing Page
                      </h3>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 md:p-6">
                        <p className="text-sm text-indigo-200 mb-4">
                          Generate a beautiful, SEO-optimized landing page for your community using AI based on your description and vibe.
                        </p>
                        <button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                          Generate Landing Page
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-6 border-t border-white/10">
                    <button 
                      onClick={handleSaveGeneral}
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-white">Analytics & Insights</h2>
                    <p className="text-sm text-gray-400 mt-1">Understand your community's growth and engagement.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-1">Total Members</div>
                      <div className="text-2xl font-bold text-white">{analytics.totalMembers.toLocaleString()}</div>
                      <div className="text-xs text-emerald-400 mt-1">+{analytics.newMembers} new (30d)</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-1">Active Users (30d)</div>
                      <div className="text-2xl font-bold text-white">{analytics.activeUsers.toLocaleString()}</div>
                      <div className="text-xs text-emerald-400 mt-1">~60% engagement</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-1">Messages Sent</div>
                      <div className="text-2xl font-bold text-white">{analytics.totalMessages.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">Lifetime activity</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-1">Retention Rate</div>
                      <div className="text-2xl font-bold text-white">68%</div>
                      <div className="text-xs text-red-400 mt-1">-2% from last month</div>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      AI Insights: Why users leave
                    </h3>
                    <p className="text-sm text-indigo-200 mb-4">
                      Based on recent churn data, users who leave typically don't send a message within their first 24 hours. Consider improving your onboarding flow to encourage immediate interaction.
                    </p>
                    <button 
                      onClick={() => setActiveTab('onboarding')}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Review Onboarding Flow &rarr;
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'automation' && (
                <div className="space-y-8">
                  {editingAutomationRule ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingAutomationRule(null)}
                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-white">{editingAutomationRule.id === 'new' ? 'Create Automation' : 'Edit Automation'}</h2>
                            <p className="text-sm text-gray-400 mt-1">Configure trigger and actions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editingAutomationRule.id !== 'new' && (
                            <button 
                              onClick={() => handleDeleteAutomationRule(editingAutomationRule.id)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <button 
                            onClick={handleSaveAutomationRule}
                            disabled={saving || !editingAutomationRule.name.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save Rule'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Rule Name</label>
                          <input
                            type="text"
                            value={editingAutomationRule.name}
                            onChange={(e) => setEditingAutomationRule({ ...editingAutomationRule, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Welcome New Members"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Trigger Type</label>
                            <select
                              value={editingAutomationRule.trigger_type}
                              onChange={(e) => setEditingAutomationRule({ ...editingAutomationRule, trigger_type: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                              <option value="user_joined">User Joined</option>
                              <option value="message_sent">Message Sent</option>
                              <option value="role_assigned">Role Assigned</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => setEditingAutomationRule({ ...editingAutomationRule, is_active: !editingAutomationRule.is_active })}
                                className={`w-12 h-6 rounded-full relative transition-colors ${editingAutomationRule.is_active ? 'bg-indigo-600' : 'bg-white/10'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingAutomationRule.is_active ? 'right-1' : 'left-1'}`} />
                              </button>
                              <span className="text-sm text-gray-400">{editingAutomationRule.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6">
                          <h3 className="text-sm font-medium text-indigo-400 mb-4 uppercase tracking-wider">Logic (JSON)</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Conditions</label>
                              <textarea
                                value={JSON.stringify(editingAutomationRule.conditions, null, 2)}
                                onChange={(e) => {
                                  try {
                                    setEditingAutomationRule({ ...editingAutomationRule, conditions: JSON.parse(e.target.value) });
                                  } catch (err) {}
                                }}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-mono text-xs h-32 focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Actions</label>
                              <textarea
                                value={JSON.stringify(editingAutomationRule.actions, null, 2)}
                                onChange={(e) => {
                                  try {
                                    setEditingAutomationRule({ ...editingAutomationRule, actions: JSON.parse(e.target.value) });
                                  } catch (err) {}
                                }}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-mono text-xs h-32 focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Automation Flows</h2>
                          <p className="text-sm text-gray-400 mt-1">Zapier-style automations built right in. No bots needed.</p>
                        </div>
                        <button 
                          onClick={() => setEditingAutomationRule({
                            id: 'new',
                            name: '',
                            trigger_type: 'user_joined',
                            conditions: [],
                            actions: [{ type: 'assign_role', role_id: '' }],
                            is_active: true
                          })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Flow
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {Array.from(new Map(automationRules.map(r => [r.id, r])).values()).map(rule => (
                          <div 
                            key={rule.id}
                            onClick={() => setEditingAutomationRule(rule)}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer group"
                          >
                            <div>
                              <h3 className="text-white font-medium mb-1">{rule.name}</h3>
                              <p className="text-sm text-gray-400">Trigger: {rule.trigger_type.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-6 rounded-full relative ${rule.is_active ? 'bg-indigo-600' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full ${rule.is_active ? 'right-1' : 'left-1'}`}></div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        ))}
                        {automationRules.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No automation flows created yet.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'monetization' && (
                <div className="space-y-8">
                  {editingMonetizationTier ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingMonetizationTier(null)}
                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-white">{editingMonetizationTier.id === 'new' ? 'Create Tier' : 'Edit Tier'}</h2>
                            <p className="text-sm text-gray-400 mt-1">Set up subscription pricing</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editingMonetizationTier.id !== 'new' && (
                            <button 
                              onClick={() => handleDeleteMonetizationTier(editingMonetizationTier.id)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <button 
                            onClick={handleSaveMonetizationTier}
                            disabled={saving || !editingMonetizationTier.name.trim() || !editingMonetizationTier.price}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save Tier'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tier Name</label>
                            <input
                              type="text"
                              value={editingMonetizationTier.name}
                              onChange={(e) => setEditingMonetizationTier({ ...editingMonetizationTier, name: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="e.g. Premium Member"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Price ({editingMonetizationTier.currency})</label>
                            <input
                              type="number"
                              value={editingMonetizationTier.price}
                              onChange={(e) => setEditingMonetizationTier({ ...editingMonetizationTier, price: parseFloat(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="9.99"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                          <textarea
                            value={editingMonetizationTier.description || ''}
                            onChange={(e) => setEditingMonetizationTier({ ...editingMonetizationTier, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                            placeholder="What do members get with this tier?"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Billing Interval</label>
                            <select
                              value={editingMonetizationTier.interval}
                              onChange={(e) => setEditingMonetizationTier({ ...editingMonetizationTier, interval: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                              <option value="month">Monthly</option>
                              <option value="year">Yearly</option>
                              <option value="one_time">One-time Payment</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Assign Role (Optional)</label>
                            <select
                              value={editingMonetizationTier.role_id || ''}
                              onChange={(e) => setEditingMonetizationTier({ ...editingMonetizationTier, role_id: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                              <option value="">No Role</option>
                              {Array.from(new Map(roles.map(r => [r.id, r])).values()).map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Monetization</h2>
                          <p className="text-sm text-gray-400 mt-1">Turn your community into a business with subscriptions.</p>
                        </div>
                        <button 
                          onClick={() => setEditingMonetizationTier({
                            id: 'new',
                            name: '',
                            description: '',
                            price: 0,
                            currency: 'USD',
                            interval: 'month',
                            role_id: '',
                            is_active: true
                          })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Tier
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from(new Map(monetizationTiers.map(t => [t.id, t])).values()).map(tier => (
                          <div 
                            key={tier.id}
                            onClick={() => setEditingMonetizationTier(tier)}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{tier.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-white">${tier.price}</div>
                                <div className="text-xs text-gray-500 uppercase">{tier.interval}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${tier.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-gray-400'}`}>
                                {tier.is_active ? 'Active' : 'Draft'}
                              </span>
                              <SettingsIcon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {monetizationTiers.length === 0 && (
                        <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                          <h3 className="text-white font-medium mb-1">No tiers yet</h3>
                          <p className="text-sm text-gray-400 mb-6">Create your first subscription tier to start earning.</p>
                          <button 
                            onClick={() => setEditingMonetizationTier({
                              id: 'new',
                              name: '',
                              description: '',
                              price: 0,
                              currency: 'USD',
                              interval: 'month',
                              role_id: '',
                              is_active: true
                            })}
                            className="px-6 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
                          >
                            Get Started
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="space-y-8">
                  {editingRole ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingRole(null)}
                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-white">{editingRole.id === 'new' ? 'Create Role' : 'Edit Role'}</h2>
                            <p className="text-sm text-gray-400 mt-1">Configure role settings and permissions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editingRole.id !== 'new' && (
                            <button 
                              onClick={() => handleDeleteRole(editingRole.id)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                          <button 
                            onClick={handleSaveRole}
                            disabled={saving || !editingRole.name.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Save Role
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Role Name</label>
                            <input
                              type="text"
                              value={editingRole.name}
                              onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="e.g. Moderator"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Role Color</label>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl border border-white/10" style={{ backgroundColor: editingRole.color }} />
                              <input
                                type="color"
                                value={editingRole.color}
                                onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-2 cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Hierarchy Level (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingRole.hierarchy_level}
                              onChange={(e) => setEditingRole({ ...editingRole, hierarchy_level: parseInt(e.target.value) || 0 })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-2">Higher numbers have more authority over lower numbers.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-400 mb-2">Permissions</label>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {PERMISSIONS.map(permission => {
                              const isGranted = editingRole.permissions[permission.id] || editingRole.permissions.administrator;
                              const isAdministrator = permission.id !== 'administrator' && editingRole.permissions.administrator;
                              
                              return (
                                <div 
                                  key={permission.id}
                                  onClick={() => {
                                    if (isAdministrator) return;
                                    setEditingRole({
                                      ...editingRole,
                                      permissions: {
                                        ...editingRole.permissions,
                                        [permission.id]: !editingRole.permissions[permission.id]
                                      }
                                    });
                                  }}
                                  className={`p-4 rounded-xl border transition-colors ${
                                    isAdministrator ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' :
                                    isGranted ? 'bg-indigo-500/10 border-indigo-500/30 cursor-pointer' : 'bg-white/5 border-white/10 hover:border-white/20 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium ${isGranted ? 'text-indigo-400' : 'text-gray-300'}`}>
                                      {permission.label}
                                    </span>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                      isGranted ? 'bg-indigo-500 text-white' : 'border border-gray-600'
                                    }`}>
                                      {isGranted && <Check className="w-3 h-3" />}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">{permission.description}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Roles</h2>
                          <p className="text-sm text-gray-400 mt-1">Manage roles and their permissions</p>
                        </div>
                        <button 
                          onClick={() => setEditingRole({ id: 'new', name: '', color: '#9ca3af', hierarchy_level: 10, permissions: {} })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Role
                        </button>
                      </div>

                      {loading ? (
                        <div className="animate-pulse space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-white/5 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.from(new Map(roles.map(r => [r.id, r])).values()).map(role => (
                            <div 
                              key={role.id} 
                              onClick={() => setEditingRole(role)}
                              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                                <div>
                                  <h3 className="text-white font-medium">{role.name}</h3>
                                  <p className="text-xs text-gray-500">Level {role.hierarchy_level}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                          {roles.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No custom roles created yet.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'onboarding' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Custom Onboarding (Wersee Flow)</h2>
                      <p className="text-sm text-gray-400 mt-1">Create a dynamic, personalized onboarding experience.</p>
                    </div>
                    <button 
                      onClick={handleSaveOnboarding}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                  
                  <div className="space-y-8 max-w-3xl">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6">
                      <h3 className="text-sm font-medium text-indigo-400 mb-4 uppercase tracking-wider">Flow Configuration (JSON)</h3>
                      <p className="text-xs text-gray-500 mb-4">Edit the raw flow structure. A visual editor is coming soon.</p>
                      <textarea
                        value={JSON.stringify(onboardingFlow, null, 2)}
                        onChange={(e) => {
                          try {
                            setOnboardingFlow(JSON.parse(e.target.value));
                          } catch (err) {}
                        }}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white font-mono text-xs h-96 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trust' && (
                <div className="space-y-8">
                  {editingTrustLevel ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingTrustLevel(null)}
                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-white">{editingTrustLevel.id === 'new' ? 'Create Trust Level' : 'Edit Trust Level'}</h2>
                            <p className="text-sm text-gray-400 mt-1">Configure automatic role assignment</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {editingTrustLevel.id !== 'new' && (
                            <button 
                              onClick={() => handleDeleteTrustLevel(editingTrustLevel.id)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                          <button 
                            onClick={handleSaveTrustLevel}
                            disabled={saving || !editingTrustLevel.role_id}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 max-w-xl">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Role to Assign</label>
                          <select
                            value={editingTrustLevel.role_id}
                            onChange={(e) => setEditingTrustLevel({ ...editingTrustLevel, role_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                          >
                            <option value="">Select a role...</option>
                            {Array.from(new Map(roles.map(r => [r.id, r])).values()).map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Required Messages</label>
                          <input
                            type="number"
                            min="0"
                            value={editingTrustLevel.required_messages}
                            onChange={(e) => setEditingTrustLevel({ ...editingTrustLevel, required_messages: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-2">Number of messages the user must send to reach this level.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Required Days in Community</label>
                          <input
                            type="number"
                            min="0"
                            value={editingTrustLevel.required_days}
                            onChange={(e) => setEditingTrustLevel({ ...editingTrustLevel, required_days: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-2">Number of days since the user joined the community.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Trust Levels</h2>
                          <p className="text-sm text-gray-400 mt-1">Automatically assign roles based on activity</p>
                        </div>
                        <button 
                          onClick={() => setEditingTrustLevel({ id: 'new', role_id: '', required_messages: 10, required_days: 7 })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Level
                        </button>
                      </div>

                      <div className="space-y-4">
                        {Array.from(new Map(trustLevels.map(t => [t.id, t])).values()).map(level => {
                          const role = roles.find(r => r.id === level.role_id);
                          return (
                            <div 
                              key={level.id} 
                              onClick={() => setEditingTrustLevel(level)}
                              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <Award className="w-8 h-8 text-indigo-400" />
                                <div>
                                  <h3 className="text-white font-medium flex items-center gap-2">
                                    {role ? role.name : 'Unknown Role'}
                                    {role && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    Requires {level.required_messages} messages and {level.required_days} days
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                          );
                        })}
                        {trustLevels.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No trust levels configured yet.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {activeTab === 'invites' && (
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
                  {editingInvite ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setEditingInvite(null)}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <h2 className="text-xl font-bold text-white">{editingInvite.id === 'new' ? 'Create Invite' : 'Edit Invite'}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          {editingInvite.id !== 'new' && (
                            <button 
                              onClick={() => handleDeleteInvite(editingInvite.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={handleSaveInvite}
                            disabled={saving || !editingInvite.role_id}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Assign Role</label>
                          <select
                            value={editingInvite.role_id}
                            onChange={(e) => setEditingInvite({ ...editingInvite, role_id: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          >
                            <option value="">Select a role...</option>
                            {Array.from(new Map(roles.map(r => [r.id, r])).values()).map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-2">Users joining with this link will automatically receive this role.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Expiration Date (Optional)</label>
                          <input
                            type="datetime-local"
                            value={editingInvite.expires_at ? new Date(editingInvite.expires_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditingInvite({ ...editingInvite, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Max Uses (Optional)</label>
                          <input
                            type="number"
                            min="1"
                            value={editingInvite.max_uses || ''}
                            onChange={(e) => setEditingInvite({ ...editingInvite, max_uses: parseInt(e.target.value) || null })}
                            placeholder="Unlimited"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Custom Invites</h2>
                          <p className="text-sm text-gray-400 mt-1">Create invite links that assign specific roles</p>
                        </div>
                        <button 
                          onClick={() => setEditingInvite({ id: 'new', role_id: '', expires_at: null, max_uses: null })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Invite
                        </button>
                      </div>

                      <div className="space-y-4 mt-6">
                        {Array.from(new Map(invites.map(i => [i.id, i])).values()).map(invite => {
                          const role = roles.find(r => r.id === invite.role_id);
                          return (
                            <div 
                              key={invite.id} 
                              onClick={() => setEditingInvite(invite)}
                              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <LinkIcon className="w-8 h-8 text-indigo-400" />
                                <div>
                                  <h3 className="text-white font-medium flex items-center gap-2">
                                    {invite.id}
                                  </h3>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                    Role: {role ? role.name : 'Unknown Role'}
                                    {invite.max_uses && <span>• Max Uses: {invite.max_uses}</span>}
                                    {invite.expires_at && <span>• Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                          );
                        })}
                        {invites.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No custom invites created yet.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
