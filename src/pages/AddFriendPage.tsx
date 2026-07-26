import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type PublicProfile = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

export const AddFriendPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('This friend link is missing a user.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, name, username, avatar_url')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        console.error('Error loading friend profile:', err);
        setError('This friend link is invalid or the profile is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const displayName = profile?.full_name || profile?.name || profile?.username || 'this person';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || userId || 'wersee'}`;

  const handleAddFriend = async () => {
    if (!userId || !profile) return;

    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (user.id === userId) {
      navigate('/workspace/chats');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
        });

      if (error) {
        if (error.code === '23505') {
          setSuccess(true);
          return;
        }
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.message || 'Could not send this friend request.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <SEO title="Add Friend" description="Add a friend on Wersee and start chatting securely." url={userId ? `/add/${userId}` : '/add'} noIndex />
        <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
        <p className="text-gray-400">Loading friend link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <SEO
        title={profile ? `Add ${displayName} as a Friend` : 'Add Friend'}
        description="Connect on Wersee to chat, collaborate, and share updates securely."
        url={userId ? `/add/${userId}` : '/add'}
        noIndex
        keywords="Wersee friend request, add friend, secure chat, creator collaboration"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: profile ? `Add ${displayName} on Wersee` : 'Add Friend on Wersee',
          description: 'A private Wersee friend request page for secure chat connections.',
          url: `https://wersee.com${userId ? `/add/${userId}` : '/add'}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Wersee',
            url: 'https://wersee.com',
          },
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Friend Link Error</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Go Home
            </button>
          </>
        ) : success ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Friend Request Sent</h1>
            <p className="text-gray-400 mb-8">{displayName} can accept your request from Wersee Chats.</p>
            <button
              onClick={() => navigate('/workspace/chats')}
              className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Open Chats
            </button>
          </>
        ) : (
          <>
            <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 border border-white/10" />
            <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
              <UserPlus className="w-6 h-6 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Add {displayName}</h1>
            <p className="text-gray-400 mb-8">Send a friend request to start a private chat on Wersee.</p>
            <button
              onClick={handleAddFriend}
              disabled={sending}
              className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : user ? 'Send Friend Request' : 'Log in & Add Friend'}
              {!sending && <ArrowRight className="w-5 h-5" />}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
