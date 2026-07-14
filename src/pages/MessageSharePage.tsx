import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Share2, MessageCircle, Users } from 'lucide-react';

import { appToast } from '@/lib/feedback';
interface Message {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  community_id: string;
  channel_id: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export const MessageSharePage = () => {
  const { messageId } = useParams<{ messageId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState<Message | null>(null);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (messageId) {
      fetchMessageData();
    }
  }, [messageId]);

  const fetchMessageData = async () => {
    try {
      setLoading(true);
      const { data: msg, error: msgError } = await supabase
        .from('community_messages')
        .select(`
          *,
          user:profiles!community_messages_author_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', messageId)
        .single();

      if (msgError) throw msgError;
      setMessage(msg);

      // Fetch community info
      const { data: comm, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', msg.community_id)
        .single();

      if (!commError) {
        setCommunity(comm);
      }
    } catch (err: any) {
      console.error('Error fetching shared message:', err);
      setError('Message not found or has been deleted.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-full"></div>
          <p>Loading shared message...</p>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{error || 'Message not found'}</h1>
        <Link to="/" className="text-blue-400 hover:underline">Go back home</Link>
      </div>
    );
  }

  const shareUrl = window.location.href;
  const title = `${message.user?.full_name || 'User'} shared a message in ${community?.name || 'Community'}`;
  const description = message.content.substring(0, 160);
  const ogImage = community?.settings?.bannerUrl || message.user?.avatar_url || 'https://picsum.photos/seed/community/1200/630';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message.content,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      appToast('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-black/50 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4 sm:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 sm:px-8 max-w-2xl mx-auto">
        {/* Community Context */}
        {community && (
          <Link 
            to={`/community/${community.slug || community.id}`}
            className="flex items-center gap-3 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl overflow-hidden shrink-0">
              {community.settings?.logoUrl && (
                <img src={community.settings.logoUrl} alt={community.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{community.name}</h2>
              <p className="text-sm text-white/50 flex items-center gap-1">
                <Users className="w-3 h-3" />
                View Community
              </p>
            </div>
          </Link>
        )}

        {/* Message Card */}
        <div className="bg-[#b8b8b8] rounded-[40px] p-8 text-black shadow-2xl shadow-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-black rounded-2xl overflow-hidden shrink-0 shadow-lg">
              {message.user?.avatar_url && (
                <img src={message.user.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
            <div>
              <h3 className="font-black text-2xl leading-tight">
                {message.user?.full_name || 'User'}
              </h3>
              <p className="text-black/50 text-sm font-medium">
                {new Date(message.created_at).toLocaleDateString(undefined, { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="text-xl leading-relaxed whitespace-pre-wrap mb-8">
            {message.content}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-black/10">
            <div className="flex items-center gap-2 text-black/60 font-bold">
              <MessageCircle className="w-5 h-5" />
              <span>Shared Message</span>
            </div>
            <Link 
              to={`/community/${community?.slug || community?.id}`}
              className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform active:scale-95"
            >
              Join Conversation
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/30 text-sm">
          <p>Shared via Wersee Community</p>
        </div>
      </main>
    </div>
  );
};
