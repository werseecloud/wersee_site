import { supabase } from './supabase';

export const resolveCrmBusinessId = async (userId: string): Promise<string | null> => {
  const { data: memberships, error: membershipError } = await supabase
    .from('team_members')
    .select('business_id')
    .eq('user_id', userId)
    .not('business_id', 'is', null)
    .order('joined_at', { ascending: false })
    .limit(1);

  if (membershipError) throw membershipError;
  if (memberships?.[0]?.business_id) return memberships[0].business_id;

  const { data: businesses, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (businessError) throw businessError;
  return businesses?.[0]?.id || null;
};
