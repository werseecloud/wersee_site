import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id?: string;
  email: string;
  role: 'admin' | 'developer' | 'designer' | 'support';
  status: 'active' | 'invited' | 'inactive';
  joined_at: string;
  stripe_account_id?: string;
  fixed_salary?: number;
  salary_interval?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email?: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
  uses: number;
}

export interface RevenueSplit {
  id: string;
  team_id: string;
  name: string;
  is_global_default: boolean;
  tax_buffer_enabled: boolean;
  tax_percentage: number;
  platform_fee_percentage: number;
  recipients?: SplitRecipient[];
}

export interface SplitRecipient {
  id?: string;
  split_id?: string;
  team_member_id: string;
  percentage: number;
}

export const teamService = {
  async fetchTeams(userId: string) {
    const [ownedResponse, memberResponse] = await Promise.all([
      supabase.from('teams').select('*').eq('owner_id', userId),
      supabase.from('team_members').select('teams(*)').eq('user_id', userId)
    ]);

    if (ownedResponse.error) throw ownedResponse.error;
    if (memberResponse.error) throw memberResponse.error;

    const ownedTeams = ownedResponse.data || [];
    const memberTeams = (memberResponse.data || [])
      .map((m: any) => m.teams)
      .filter(Boolean);

    const allTeams = [...ownedTeams, ...memberTeams];
    const uniqueTeams = Array.from(new Map(allTeams.map(t => [t.id, t])).values());
    
    return uniqueTeams;
  },

  async fetchMembers(teamId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data || [];
  },

  async fetchInvites(teamId: string) {
    const { data, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async fetchSplits(teamId: string) {
    const { data, error } = await supabase
      .from('revenue_splits')
      .select(`
        *,
        recipients:split_recipients(*)
      `)
      .eq('team_id', teamId)
      .order('is_global_default', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTeam(userId: string, name: string, slug: string) {
    const idempotencyKey = `${userId}:${slug || name}`.toLowerCase();
    const { data: teamId, error: rpcError } = await supabase.rpc('create_team_workspace', {
      p_name: name,
      p_slug: slug,
      p_idempotency_key: idempotencyKey,
    });

    if (rpcError) throw rpcError;

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTeam(teamId: string, updates: Partial<Team>) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async inviteMember(teamId: string, email: string, role: string) {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{ team_id: teamId, email, role, status: 'invited' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInvite(inviteId: string) {
    const { error } = await supabase.from('team_invites').delete().eq('id', inviteId);
    if (error) throw error;
  },

  async leaveTeam(teamId: string, userId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async saveSplit(teamId: string, splitData: Partial<RevenueSplit>, recipients: SplitRecipient[], existingSplitId?: string, isFirstSplit: boolean = false) {
    let splitId = existingSplitId;

    if (splitId) {
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
      const { data: newSplit, error: createError } = await supabase
        .from('revenue_splits')
        .insert({
          team_id: teamId,
          name: splitData.name,
          tax_buffer_enabled: splitData.tax_buffer_enabled,
          tax_percentage: splitData.tax_percentage,
          platform_fee_percentage: splitData.platform_fee_percentage,
          is_global_default: isFirstSplit
        })
        .select()
        .single();
      
      if (createError) throw createError;
      splitId = newSplit.id;
    }

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

    return splitId;
  },

  async deleteSplit(splitId: string) {
    const { error } = await supabase.from('revenue_splits').delete().eq('id', splitId);
    if (error) throw error;
  },

  async updateSalaries(updates: { id: string, fixed_salary: number, salary_interval: string }[]) {
    for (const update of updates) {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          fixed_salary: update.fixed_salary,
          salary_interval: update.salary_interval
        })
        .eq('id', update.id);
      
      if (error) throw error;
    }
  }
};
