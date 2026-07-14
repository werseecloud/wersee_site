import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings, ArrowUp, FileText, Share2, MessageCircle, Zap, Rss, GraduationCap, Menu, X as XIcon, Mic, Video, Radio } from 'lucide-react';

import { ErrorModal } from '../components/workspace/ErrorModal';
import { ChannelView } from '../components/community/ChannelView';

interface Channel {
  id: string;
  name: string;
  type: 'chat' | 'announcements' | 'rules' | 'links' | 'feed' | 'docs' | 'course' | 'voice' | 'video' | 'stream';
  description?: string;
}

export const CommunityView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [community, setCommunity] = useState<any>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, { count: number, mentions: number }>>({});
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    if (id) {
      // Avoid redundant fetches for the same ID
      if (lastFetchedIdRef.current === id && community) {
        return;
      }
      fetchCommunityData();
    } else {
      // No community ID — stop loading and show empty state
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (community && user) {
      setIsOwner(community.owner_id === user.id);
    } else {
      setIsOwner(false);
    }
  }, [community, user]);

  useEffect(() => {
    if (community) {
      const unsubscribe = subscribeToGlobalMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [community?.id, activeChannel?.id]);

  const subscribeToGlobalMessages = () => {
    if (!community) return;

    // Subscribe to all messages in the community to track unread counts
    const subscription = supabase
      .channel(`community_global_messages:${community.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Check if the message belongs to this community (via channel)
          const isOurChannel = channels.some(c => c.id === newMessage.channel_id);
          if (!isOurChannel) return;

          if (newMessage.channel_id !== activeChannel?.id) {
            // Update unread counts for other channels
            setUnreadCounts(prev => {
              const current = prev[newMessage.channel_id] || { count: 0, mentions: 0 };
              const fullName = user?.user_metadata?.full_name || '';
              const isMention = newMessage.content.includes(`@${fullName}`) || 
                                newMessage.content.includes('@everyone') ||
                                newMessage.content.includes('@here');
              
              return {
                ...prev,
                [newMessage.channel_id]: {
                  count: current.count + 1,
                  mentions: current.mentions + (isMention ? 1 : 0)
                }
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchCommunityData = async (isRetry = false) => {
    if (isFetchingRef.current && !isRetry) return;
    
    try {
      isFetchingRef.current = true;
      if (!community) setLoading(true);
      setError(null);
      lastFetchedIdRef.current = id || null;
      
      const { data: comm, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();
        
      if (commError) throw commError;

      const { data: chans, error: chansError } = await supabase
        .from('community_channels')
        .select('*')
        .eq('community_id', id)
        .order('created_at', { ascending: true });

      if (chansError) throw chansError;

      setCommunity(comm);
      
      if (chans && chans.length > 0) {
        setChannels(chans);
        // Only set active channel if none is selected or if we're switching communities
        if (!activeChannel || !chans.find(c => c.id === activeChannel.id)) {
          setActiveChannel(chans[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching community:', error);
      setError(error.message || 'Failed to load community');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleChannelClick = (channel: Channel) => {
    setActiveChannel(channel);
    setUnreadCounts(prev => ({
      ...prev,
      [channel.id]: { count: 0, mentions: 0 }
    }));
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  if (loading) {
    return <div className="min-h-[100dvh] bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  const renderChannelContent = () => {
    if (!activeChannel) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-[48px] flex items-center justify-center mx-auto border border-white/10">
              <MessageCircle className="w-12 h-12 text-white/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Select a Channel</h2>
              <p className="text-white/40 font-medium">Choose a channel from the sidebar to start interacting with the community.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ChannelView 
        activeChannel={activeChannel}
        community={community}
        user={user}
        isOwner={isOwner}
        onFileTooLarge={() => setShowErrorModal(true)}
      />
    );
  };

  if (!community) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-6 px-4 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10">
          <MessageCircle className="w-10 h-10 text-white/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">{id ? 'Community not found' : 'Community'}</h2>
          <p className="text-white/40 max-w-sm">{id ? 'This community does not exist or you may not have access.' : 'Join or select a community to get started.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] bg-black font-sans overflow-hidden relative">
      {/* Left Sidebar - Hidden on mobile by default, can be toggled or shown as drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[300px] bg-[#d9d9d9] flex flex-col rounded-r-[40px] overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col gap-4 h-full relative">
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 bg-black/5 rounded-full text-black hover:bg-black/10 transition-colors z-10"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Banner */}
          <div className="w-full h-32 bg-[#c4c4c4] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative group">
            {community.settings?.bannerUrl ? (
              <img src={community.settings.bannerUrl} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-black/50 font-bold text-lg">[banner community]</span>
            )}
            {isOwner && (
              <button 
                onClick={() => navigate(`/dashboard?tab=community&id=${community.id}`)}
                className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Community Name */}
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-2xl font-black text-black leading-tight">
              {community.name || '[community name]'}
            </h1>
          </div>

          {/* Online Users */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-3 h-3 bg-[#00ff00] rounded-full"></div>
            <span className="text-sm font-medium text-black/70">[users]</span>
          </div>

          {/* Special Channels */}
          <div className="flex flex-col gap-2 mt-2 shrink-0">
            {channels.filter(c => ['announcements', 'feed', 'course', 'docs', 'rules', 'links', 'voice', 'video', 'stream'].includes(c.type)).map(channel => {
              const isActive = activeChannel?.id === channel.id;
              let Icon = MessageCircle;
              let activeBg = 'bg-black text-white shadow-lg';
              let inactiveBg = 'text-black/80 hover:bg-black/5';
              let iconColor = 'text-black';

              switch (channel.type) {
                case 'announcements':
                  Icon = Zap;
                  activeBg = 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20';
                  inactiveBg = 'bg-[#c4c4c4] text-black/80 hover:bg-[#b0b0b0]';
                  iconColor = isActive ? 'text-white' : 'text-indigo-600';
                  break;
                case 'feed':
                  Icon = Rss;
                  activeBg = 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
                  inactiveBg = 'text-black/80 hover:bg-orange-500/5';
                  iconColor = isActive ? 'text-white' : 'text-orange-500';
                  break;
                case 'course':
                  Icon = GraduationCap;
                  activeBg = 'bg-slate-800 text-white shadow-lg';
                  inactiveBg = 'text-black/80 hover:bg-slate-800/5';
                  iconColor = isActive ? 'text-white' : 'text-slate-800';
                  break;
                case 'docs':
                  Icon = FileText;
                  activeBg = 'bg-blue-600 text-white shadow-lg shadow-blue-500/20';
                  inactiveBg = 'text-black/80 hover:bg-blue-500/5';
                  iconColor = isActive ? 'text-white' : 'text-blue-600';
                  break;
                case 'voice':
                  Icon = Mic;
                  activeBg = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                  inactiveBg = 'text-black/80 hover:bg-emerald-500/5';
                  iconColor = isActive ? 'text-white' : 'text-emerald-500';
                  break;
                case 'video':
                  Icon = Video;
                  activeBg = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
                  inactiveBg = 'text-black/80 hover:bg-rose-500/5';
                  iconColor = isActive ? 'text-white' : 'text-rose-500';
                  break;
                case 'stream':
                  Icon = Radio;
                  activeBg = 'bg-purple-500 text-white shadow-lg shadow-purple-500/20';
                  inactiveBg = 'text-black/80 hover:bg-purple-500/5';
                  iconColor = isActive ? 'text-white' : 'text-purple-500';
                  break;
                case 'rules':
                  Icon = FileText;
                  break;
                case 'links':
                  Icon = Share2;
                  break;
              }

              return (
                <button 
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full py-3 px-4 rounded-xl text-left text-sm font-bold transition-all flex items-center justify-between group ${
                    isActive ? activeBg : inactiveBg
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    {channel.name}
                  </div>
                  {unreadCounts[channel.id]?.count > 0 && (
                    <div className="flex items-center gap-1">
                      {unreadCounts[channel.id].mentions > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                          {unreadCounts[channel.id].mentions}
                        </span>
                      )}
                      <span className={`${isActive ? 'bg-white/20' : 'bg-black/10'} text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                        {unreadCounts[channel.id].count}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-full h-px bg-black/10 my-2 shrink-0"></div>

          {/* Regular Channels */}
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-2">
            {channels.filter(c => c.type === 'chat' || !c.type).map(channel => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full py-2 px-4 text-left text-sm font-medium rounded-xl transition-all flex items-center justify-between group ${
                  activeChannel?.id === channel.id 
                    ? 'bg-black/10 text-black' 
                    : 'text-black/60 hover:bg-black/5 hover:text-black/80'
                }`}
              >
                <span className="truncate flex-1"># {channel.name}</span>
                {unreadCounts[channel.id]?.count > 0 && (
                  <div className="flex items-center gap-1">
                    {unreadCounts[channel.id].mentions > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                        {unreadCounts[channel.id].mentions}
                      </span>
                    )}
                    <span className="bg-black/10 text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCounts[channel.id].count}
                    </span>
                  </div>
                )}
              </button>
            ))}
            {channels.length === 0 && (
              <>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
                <div className="py-2 px-4 text-sm font-medium text-black/60">[maded channel]</div>
              </>
            )}
          </div>
          
          {/* Owner Settings Button at bottom of sidebar */}
          {isOwner && (
            <div className="pt-4 mt-auto border-t border-black/10 shrink-0">
               <button 
                onClick={() => navigate(`/dashboard?tab=community&id=${community.id}`)}
                className="w-full py-3 px-4 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-black/80 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Community Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#0A0A0A] relative transition-all duration-300 ${!activeChannel ? 'hidden lg:flex' : 'flex'}`}>
        {/* Mobile Header */}
        {!loading && community && (
          <div className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-black/50 backdrop-blur-md sticky top-0 z-20">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-white truncate block">{activeChannel?.name || community.name}</span>
              {activeChannel && <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">{activeChannel.type || 'chat'}</span>}
            </div>
            {activeChannel && (
              <button 
                onClick={() => setActiveChannel(null)}
                className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <ArrowUp className="w-5 h-5 -rotate-90" />
              </button>
            )}
          </div>
        )}
        {renderChannelContent()}
      </div>

      <ErrorModal 
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="File Too Large"
        message="The file you selected exceeds the 50MB limit. Please choose a smaller file to upload."
      />
    </div>
  );
};
