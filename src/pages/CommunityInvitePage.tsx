import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CommunityInvitePage = () => {
  const { communityId, communityName, inviteCode, customUrl } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUserAndCommunity();
  }, [communityId, inviteCode, customUrl]);

  const checkUserAndCommunity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      let targetCommunityId = communityId;

      if (inviteCode) {
        // Resolve invite code
        const { data: inviteData, error: inviteError } = await supabase
          .from('community_invites')
          .select('community_id')
          .eq('code', inviteCode)
          .single();
        
        if (inviteError || !inviteData) throw new Error('Invalid or expired invite code');
        targetCommunityId = inviteData.community_id;
      } else if (customUrl) {
        // Resolve custom URL
        const { data: commData, error: commError } = await supabase
          .from('communities')
          .select('id')
          .eq('custom_url', customUrl)
          .single();
        
        if (commError || !commData) throw new Error('Community not found');
        targetCommunityId = commData.id;
      }

      if (!targetCommunityId) {
        throw new Error('Invalid invite link');
      }

      // Fetch community details
      const { data: comm, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', targetCommunityId)
        .single();

      if (commError) throw commError;
      setCommunity(comm);

      // Check if already a member
      if (user) {
        const { data: member } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', targetCommunityId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (member) {
          // Already a member, redirect
          navigate(`/community/${targetCommunityId}`);
        }
      }
    } catch (err: any) {
      console.error('Error fetching invite data:', err);
      setError(err.message || 'Failed to load community invite');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      // Redirect to login with return url
      const returnPath = inviteCode ? `/join/i/${inviteCode}` : customUrl ? `/c/${customUrl}` : `/join/c/${community?.id}/${encodeURIComponent(community?.name || '')}`;
      navigate(`/auth?returnUrl=${encodeURIComponent(returnPath)}`);
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Fire extension event
      try {
        const { ExtensionEngine } = await import('../services/extensionEngine');
        await ExtensionEngine.fireEvent(
          'user_joined',
          {
            user_id: user.id,
            community_id: community.id,
            role: 'member'
          },
          community.id,
          'community'
        );
      } catch (extErr) {
        console.error('Failed to fire extension event:', extErr);
      }

      // Redirect to community
      navigate(`/community/${community.id}`);
    } catch (err: any) {
      console.error('Error joining community:', err);
      setError(err.message || 'Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-white mb-2">Invite Invalid</h1>
          <p className="text-gray-400 mb-6">{error || "This invite link appears to be invalid or expired."}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-white/5 mb-6 overflow-hidden border border-white/10 shadow-lg">
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
                {community.name.charAt(0)}
              </div>
            )}
          </div>

          <p className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-2">You've been invited to join</p>
          <h1 className="text-3xl font-bold text-white mb-4">{community.name}</h1>
          
          <div className="flex items-center gap-6 mb-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span>{community.member_count || 1} Members</span>
            </div>
            {community.is_private && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Private Group</span>
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-white/10"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Join Community
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          {!user && (
            <p className="mt-4 text-xs text-gray-500">
              You'll need to sign in or create an account to join.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
