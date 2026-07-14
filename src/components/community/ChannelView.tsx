import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, FileText, Share2, Plus, Zap, Bot, BookOpen, Rss, Layout, GraduationCap, Download, Play, CheckCircle2, MoreVertical, Heart, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageItem } from './MessageItem';
import { ChatInput } from '../workspace/ChatInput';
import { MessageContextMenu } from '../workspace/MessageContextMenu';
import { CallView } from './CallView';
import { appToast } from '../../lib/feedback';

interface ChannelViewProps {
  activeChannel: any;
  community: any;
  user: any;
  isOwner: boolean;
  onFileTooLarge: () => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({ 
  activeChannel, 
  community, 
  user, 
  isOwner,
  onFileTooLarge
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChannel) {
      fetchMessages();
      const unsubscribe = subscribeToChannelMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [activeChannel.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          user:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChannelMessages = () => {
    const channel = supabase
      .channel(`channel-messages-${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${activeChannel.id}`
        },
        async (payload) => {
          // Fetch full message with user data
          const { data, error } = await supabase
            .from('community_messages')
            .select(`
              *,
              user:author_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${activeChannel.id}`
        },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!user) return;

    try {
      const metadata = attachments ? { attachments } : {};
      const { error } = await supabase
        .from('community_messages')
        .insert({
          channel_id: activeChannel.id,
          author_id: user.id,
          content,
          metadata
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleShareMessage = async (id: string) => {
    const shareUrl = `${window.location.origin}/community/${community.id}/m/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Message',
          text: 'Check out this message from our community.',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing message:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        appToast('Link copied to clipboard!', 'success');
      } catch (err) {
        console.error('Error sharing message:', err);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const renderContent = () => {
    if (loading && messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeChannel.type) {
      case 'voice':
      case 'video':
      case 'stream':
        return <CallView channel={activeChannel} user={user} />;

      case 'announcements':
        return (
          <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-12 pb-32">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-2">
                  <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter flex items-center gap-4">
                    <Zap className="w-10 h-10 lg:w-12 lg:h-12 text-yellow-400 fill-current" />
                    {activeChannel.name}
                  </h2>
                  <p className="text-white/40 text-lg font-medium">Official updates and news from the community.</p>
                </div>
                {isOwner && (
                  <button className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Post Announcement
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {messages.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <Zap className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl font-bold">No announcements yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#141414] border border-white/5 rounded-[32px] p-8 lg:p-10 shadow-2xl hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                          <Zap className="w-6 h-6 text-yellow-400 fill-current" />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-xl">{msg.user?.full_name || 'Admin'}</h3>
                          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-white/80 text-lg lg:text-xl leading-relaxed font-medium whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {msg.metadata?.attachments?.map((attachment: any, i: number) => (
                        <div key={i} className="mt-8 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                          {attachment.type === 'image' ? (
                            <img src={attachment.url} alt="" className="w-full h-auto" referrerPolicy="no-referrer" />
                          ) : attachment.type === 'video' ? (
                            <video src={attachment.url} controls className="w-full h-auto" />
                          ) : null}
                        </div>
                      ))}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'feed':
        return (
          <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full p-4 lg:p-8 space-y-6 pb-32">
              <div className="bg-[#141414] border border-white/5 rounded-[32px] p-6 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                    <Rss className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{activeChannel.name}</h2>
                </div>
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  channelName={activeChannel.name}
                  onFileTooLarge={onFileTooLarge}
                />
              </div>

              <div className="space-y-6">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#141414] border border-white/5 rounded-[32px] p-6 lg:p-8 shadow-2xl hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                          {msg.user?.avatar_url ? (
                            <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-white/20 font-bold">{msg.user?.full_name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{msg.user?.full_name || 'Member'}</h4>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-white/20 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-white/80 text-lg leading-relaxed mb-6 font-medium">
                      {msg.content}
                    </div>
                    {msg.metadata?.attachments?.map((attachment: any, i: number) => (
                      <div key={i} className="mb-6 rounded-2xl overflow-hidden border border-white/5">
                        {attachment.type === 'image' ? (
                          <img src={attachment.url} alt="" className="w-full h-auto" referrerPolicy="no-referrer" />
                        ) : attachment.type === 'video' ? (
                          <video src={attachment.url} controls className="w-full h-auto" />
                        ) : null}
                      </div>
                    ))}
                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                      <button className="flex items-center gap-2 text-white/40 hover:text-rose-500 transition-colors font-bold text-sm group">
                        <Heart className="w-5 h-5 group-hover:fill-current" />
                        <span>Like</span>
                      </button>
                      <button className="flex items-center gap-2 text-white/40 hover:text-indigo-400 transition-colors font-bold text-sm">
                        <MessageCircle className="w-5 h-5" />
                        <span>Comment</span>
                      </button>
                      <button className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors font-bold text-sm ml-auto">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'docs':
        return (
          <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full p-6 lg:p-12 space-y-8 pb-32">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <BookOpen className="w-10 h-10 text-indigo-500" />
                    {activeChannel.name}
                  </h2>
                  <p className="text-white/40 mt-2 font-medium text-lg">Resource library and documentation.</p>
                </div>
                {isOwner && (
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Upload Doc
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {messages.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-20">
                    <BookOpen className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl font-bold">No documents shared yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-[#141414] rounded-[32px] p-6 border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-white mb-2 truncate">{msg.content.split('\n')[0] || 'Untitled Document'}</h3>
                        <p className="text-xs text-white/30 mb-6 line-clamp-2">{msg.content.split('\n').slice(1).join('\n') || 'No description provided.'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full p-6 lg:p-12 pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="aspect-video bg-black rounded-[40px] border border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform relative z-10">
                      <Play className="w-8 h-8 text-black fill-current ml-1" />
                    </div>
                    <img src="https://picsum.photos/seed/course/1280/720" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">Module 01</span>
                      <h2 className="text-3xl font-black text-white tracking-tight">Introduction to the Masterclass</h2>
                    </div>
                    <p className="text-white/50 text-lg leading-relaxed font-medium">
                      In this first lesson, we'll cover the fundamentals and set the stage for your journey. 
                      You'll learn about the core principles and what to expect in the coming weeks.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-[#141414] rounded-[32px] border border-white/5">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">Lesson Completed!</h4>
                      <p className="text-xs text-white/40">You've finished this lesson. Ready for the next one?</p>
                    </div>
                    <button className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      Next Lesson
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#141414] rounded-[40px] border border-white/5 p-8 shadow-2xl">
                    <h3 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3">
                      <GraduationCap className="w-6 h-6 text-indigo-400" />
                      Course Content
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: 'Welcome & Overview', duration: '05:20', active: true },
                        { title: 'Setting Up Your Environment', duration: '12:45', active: false },
                        { title: 'Core Concepts Part 1', duration: '18:30', active: false },
                        { title: 'Core Concepts Part 2', duration: '22:15', active: false },
                        { title: 'Practical Exercise', duration: '45:00', active: false }
                      ].map((item, i) => (
                        <button 
                          key={i}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            item.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-white/40 hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            item.active ? 'bg-white/20' : 'bg-white/5'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-bold text-sm truncate">{item.title}</p>
                            <p className={`text-[10px] font-bold ${item.active ? 'text-white/60' : 'text-white/20'}`}>{item.duration}</p>
                          </div>
                          {item.active && <Play className="w-4 h-4 fill-current" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full py-20 px-8 space-y-16">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-black/5 rounded-[48px] flex items-center justify-center mx-auto mb-8 border border-black/5 rotate-6 hover:rotate-0 transition-transform duration-500">
                  <FileText className="w-12 h-12 text-black" />
                </div>
                <h1 className="text-5xl font-black text-black tracking-tighter">Community Rules</h1>
                <p className="text-black/40 text-xl max-w-md mx-auto leading-relaxed font-medium">Please read and follow these guidelines to keep our community healthy and productive.</p>
              </div>

              <div className="grid gap-4">
                {[
                  { title: 'Be Respectful', desc: 'Treat everyone with kindness and respect. No harassment or hate speech.' },
                  { title: 'No Spam', desc: 'Keep the channels clean. Avoid excessive self-promotion or repetitive messages.' },
                  { title: 'Stay On Topic', desc: 'Use the appropriate channels for your discussions.' },
                  { title: 'Privacy First', desc: 'Do not share personal information of yourself or others.' },
                  { title: 'Follow Admin Guidance', desc: 'Respect the decisions of moderators and admins.' }
                ].map((rule, i) => (
                  <div key={i} className="flex gap-8 p-8 bg-[#f9f9f9] hover:bg-black hover:text-white border border-black/5 rounded-[40px] group transition-all duration-500 cursor-default">
                    <div className="text-5xl font-black text-black/5 group-hover:text-white/20 transition-colors">0{i + 1}</div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black">{rule.title}</h3>
                      <p className="opacity-50 text-lg leading-relaxed font-medium group-hover:opacity-70">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-10 bg-black text-white rounded-[48px] text-center shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Ready to contribute?</h3>
                  <p className="text-white/50 mb-8 font-medium">By participating in this community, you agree to abide by these rules.</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full font-bold text-sm">
                    <Zap className="w-4 h-4 fill-current text-yellow-400" />
                    <span>Let's build something great!</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/30 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full -ml-32 -mb-32 group-hover:bg-yellow-500/20 transition-colors"></div>
              </div>
            </div>
          </div>
        );

      case 'links':
        return (
          <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full p-6 lg:p-12 space-y-8 pb-32">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-black tracking-tight flex items-center gap-3">
                    <Share2 className="w-10 h-10 text-emerald-600" />
                    {activeChannel.name}
                  </h2>
                  <p className="text-black/40 mt-2 font-medium text-lg">Useful links and external resources shared by the community.</p>
                </div>
                {isOwner && (
                  <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Link
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {messages.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-20">
                    <Share2 className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-xl font-bold">No links shared yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = msg.content.match(urlRegex);
                    const firstUrl = urls ? urls[0] : '#';
                    
                    return (
                      <div key={msg.id} className="bg-white rounded-[32px] p-6 border border-black/5 hover:shadow-xl transition-all group flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Share2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black truncate">{msg.content.split('\n')[0] || 'Shared Link'}</h3>
                            <p className="text-xs text-black/30 truncate">{firstUrl}</p>
                          </div>
                        </div>
                        <p className="text-sm text-black/60 mb-6 line-clamp-2 flex-1">
                          {msg.content.split('\n').slice(1).join('\n') || 'No description provided.'}
                        </p>
                        <a 
                          href={firstUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-black text-white rounded-2xl font-bold text-center hover:bg-black/80 transition-colors flex items-center justify-center gap-2"
                        >
                          Visit Link
                          <ArrowUp className="w-4 h-4 rotate-45" />
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <>
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 scrollbar-hide">
              <div className="max-w-5xl mx-auto flex flex-col gap-6 lg:gap-8">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center space-y-6">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 animate-pulse">
                      <MessageCircle className="w-10 h-10 lg:w-12 lg:h-12 text-white/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Welcome to #{activeChannel.name}</h3>
                      <p className="text-white/40 max-w-xs mx-auto font-medium text-sm lg:text-base">This is the start of the channel. Send a message to get things going!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageItem 
                      key={msg.id}
                      msg={msg}
                      user={user}
                      isMe={msg.author_id === user?.id}
                      onContextMenu={(e) => handleContextMenu(e, msg.id)}
                      onShare={handleShareMessage}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <ChatInput 
              onSendMessage={handleSendMessage} 
              channelName={activeChannel.name}
              onFileTooLarge={onFileTooLarge}
              members={community.members}
              roles={community.roles}
            />

            {contextMenu && (
              <MessageContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                messageId={contextMenu.messageId}
                isMe={isOwner || messages.find(m => m.id === contextMenu.messageId)?.author_id === user?.id}
                content={messages.find(m => m.id === contextMenu.messageId)?.content || ''}
                onClose={() => setContextMenu(null)}
                onCopy={(content) => navigator.clipboard.writeText(content)}
                onShare={() => handleShareMessage(contextMenu.messageId)}
                onDelete={() => handleDeleteMessage(contextMenu.messageId)}
              />
            )}
          </>
        );
    }
  };

  return renderContent();
};
