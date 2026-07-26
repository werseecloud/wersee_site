import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MessageSquarePlus } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type InviteDetails = {
  valid?: boolean;
  error?: string;
  name?: string;
  type?: string;
  is_group?: boolean;
};

export const ChatInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!token) {
        setError('This chat invite link is missing a token.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_invite_details_v2', { token_input: token });

        if (error) throw error;
        if (!data?.valid || (data.type && data.type !== 'chat')) {
          throw new Error(data?.error || 'This chat invite is invalid or expired.');
        }

        setInviteDetails(data);
      } catch (err: any) {
        console.error('Error loading chat invite:', err);
        setError(err.message || 'This chat invite is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const chatName = inviteDetails?.name || 'this chat';

  const handleJoinChat = async () => {
    if (!token) return;

    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('accept_chat_invite', { token_input: token });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Could not join this chat.');

      setJoined(true);
      window.setTimeout(() => navigate('/workspace/chats'), 700);
    } catch (err: any) {
      console.error('Error accepting chat invite:', err);
      setError(err.message || 'Could not join this chat.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <SEO title="Chat Invite" description="Join a private Wersee chat invite." url={token ? `/chat/invite/${token}` : '/chat/invite'} noIndex />
        <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
        <p className="text-gray-400">Loading chat invite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <SEO
        title="Join Chat"
        description="Join a private Wersee chat to message, collaborate, and share securely."
        url={token ? `/chat/invite/${token}` : '/chat/invite'}
        noIndex
        keywords="Wersee chat invite, private chat, secure messaging, team collaboration"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Join a Wersee Chat',
          description: 'A private Wersee chat invite page for secure messaging and collaboration.',
          url: `https://wersee.com${token ? `/chat/invite/${token}` : '/chat/invite'}`,
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
            <h1 className="text-2xl font-bold text-white mb-3">Chat Invite Error</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Go Home
            </button>
          </>
        ) : joined ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Joined Chat</h1>
            <p className="text-gray-400 mb-8">Opening your Wersee chats...</p>
            <Loader2 className="w-6 h-6 text-white animate-spin mx-auto" />
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-indigo-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <MessageSquarePlus className="w-10 h-10 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Join {chatName}</h1>
            <p className="text-gray-400 mb-8">You've been invited to a private Wersee chat.</p>
            <button
              onClick={handleJoinChat}
              disabled={joining}
              className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : user ? 'Join Chat' : 'Log in & Join Chat'}
              {!joining && <ArrowRight className="w-5 h-5" />}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
