import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, Search, Settings, UserPlus, Users, 
  Image as ImageIcon, Paperclip, Smile, ArrowUp, 
  MoreVertical, Check, Copy, Edit3, Bot, FileText, MessageSquare,
  Pin, Reply, ThumbsUp, Heart, Smile as SmileIcon, X, AtSign, ChevronDown, Mic, ChevronLeft, CreditCard,
  Phone, Video, Link2
} from 'lucide-react';
import { getOrCreateTeamChat, supabase, invokeApiRunner } from '../../lib/supabase';
import { checkMessageForForbiddenLinks } from '../../services/chatAiService';
import { encryptMessage, decryptMessage } from '../../services/cryptoService';
import { ChatInviteModal } from './ChatInviteModal';
import { CreateTeamChatModal } from './CreateTeamChatModal';
import { VoiceRecorder } from '../VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';
import { Skeleton } from '../ui/Skeleton';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { hapticFeedback } from '../../lib/haptics';
import { CallView } from '../community/CallView';

import { appToast, destructiveAction } from '@/lib/feedback';
export const WorkspaceChats = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isTeamSwitcherOpen, setIsTeamSwitcherOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('online');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'friend' | 'customer' | 'team'>('all');
  const [loading, setLoading] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  
  // Modals state
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAutoMsgOpen, setIsAutoMsgOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTeamChatOpen, setIsCreateTeamChatOpen] = useState(false);
  const [editingAliasFor, setEditingAliasFor] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [chatAction, setChatAction] = useState<'none' | 'paylink' | 'invoice'>('none');
  const [actionData, setActionData] = useState({ name: '', amount: '', email: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeCall, setActiveCall] = useState<{ id: string, type: 'voice' | 'video', name: string } | null>(null);

  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFriendRequests = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        status,
        sender:profiles!sender_id(id, full_name, name, avatar_url)
      `)
      .eq('receiver_id', currentUser.id)
      .eq('status', 'pending');
    
    if (!error && data) {
      setFriendRequests(data);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', currentUser.id);
    
    if (!error && data) {
      setBlockedUsers(data.map(b => b.blocked_id));
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: friendId
        });
      if (error) {
        if (error.code === '23505') {
          appToast('Friend request already sent.');
        } else {
          throw error;
        }
      } else {
        appToast('Friend request sent!');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
      // Create DM chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({ is_group: false })
        .select()
        .single();

      if (createError) throw createError;

      await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: senderId }
        ]);

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      fetchInitialData();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleBlockUser = async (userIdToBlock: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('blocked_users').insert({
        blocker_id: currentUser.id,
        blocked_id: userIdToBlock
      });
      setBlockedUsers(prev => [...prev, userIdToBlock]);
      appToast('User blocked.');
      setActiveChat(null);
    } catch (err) {
      console.error('Error blocking user:', err);
    }
  };
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [threadReplies, setThreadReplies] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${query}%`)
      .neq('id', currentUser?.id)
      .limit(5);
      
    if (error) {
      console.error('Search error:', error);
    } else {
      setSearchResults(data || []);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const activeChannelRef = useRef<any>(null);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (msg: any) => {
    if (
      'Notification' in window && 
      Notification.permission === 'granted' && 
      document.hidden &&
      msg.sender_id !== currentUser?.id
    ) {
      new Notification(`New message from ${msg.sender?.full_name || 'Member'}`, {
        body: msg.content,
        icon: msg.sender?.avatar_url || '/favicon.ico'
      });
    }
  };

  const handleTyping = () => {
    if (!activeChat || !currentUser || !presenceChannelRef.current) return;
    
    presenceChannelRef.current.track({
      user_id: currentUser.id,
      name: currentUser.name || currentUser.full_name,
      typing: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: currentUser.id,
          name: currentUser.name || currentUser.full_name,
          typing: false
        });
      }
    }, 2000);
  };

  useEffect(() => {
    if (activeChat && currentUser) {
      fetchMessages(activeChat);
      fetchPinnedMessages(activeChat);

      // Reset unread count
      supabase.rpc('reset_unread_count', { p_chat_id: activeChat, p_user_id: currentUser.id }).then(() => {
        setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
      });
      
      // Subscribe to Realtime Broadcast for the active chat
      const channel = supabase
        .channel(`chat:${activeChat}`, {
          config: {
            broadcast: { self: true },
            presence: { key: currentUser.id }
          }
        })
        .on('broadcast', { event: 'message' }, async (payload) => {
          const msg = payload.payload;
          
          // Decrypt if encrypted
          if (msg.is_encrypted) {
            msg.content = await decryptMessage(msg.content, activeChat);
          }

          if (!msg.parent_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              const newMessages = [...prev, msg].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              return newMessages;
            });
            scrollToBottom();
            showNotification(msg);
          } else {
            // Update thread replies
            setThreadReplies(prev => {
              const currentReplies = prev[msg.parent_id] || [];
              if (currentReplies.some(m => m.id === msg.id)) return prev;
              return {
                ...prev,
                [msg.parent_id]: [...currentReplies, msg].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              };
            });
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const typing: string[] = [];
          for (const id in state) {
            if (id !== currentUser.id) {
              const userState: any = state[id][0];
              if (userState?.typing) {
                typing.push(userState.name);
              }
            }
          }
          setTypingUsers(prev => ({ ...prev, [activeChat]: typing }));
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChat}`
        }, async (payload) => {
          // Fallback for database changes or updates/deletes
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchMessages(activeChat);
          }
        })
        .subscribe((status) => {
          setIsRealtimeActive(status === 'SUBSCRIBED');
        });

      activeChannelRef.current = channel;
      presenceChannelRef.current = channel;

      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        supabase.removeChannel(channel);
        activeChannelRef.current = null;
        presenceChannelRef.current = null;
        setIsRealtimeActive(false);
      };
    }
  }, [activeChat, replyingTo, currentUser]);

  // Global subscription for chat list updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const chatChannel = supabase
      .channel('global_chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        // Refresh chat list when user is added/removed from chats
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats'
      }, (payload) => {
        // If a chat the user is in gets updated (e.g. name change, last_message)
        // We check if the chat is in our current list
        const allChatIds = [...friends.map(f => f.chat_id), ...groups.map(g => g.id), ...teams.map(t => t.id)];
        if (allChatIds.includes(payload.new.id)) {
          fetchInitialData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser?.id, friends.length, groups.length, teams.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all initial data in parallel using direct Supabase queries
      const [profileRes, blockedRes, teamMembersRes, chatsRes, participantsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('team_members').select('team_id').eq('user_id', user.id),
        supabase.from('chat_participants').select('chat_id').eq('user_id', user.id),
        supabase.from('chat_participants').select('*, chat:chats(*), profile:profiles(*)').eq('user_id', user.id)
      ]);
      
      const profile = profileRes.data;
      setCurrentUser(profile || { id: user.id, full_name: 'Unknown', avatar_url: '' });
      
      if (blockedRes.data) {
        setBlockedUsers(blockedRes.data.map((b: any) => b.blocked_id));
      }

      // Also fetch friend requests in parallel (independent)
      fetchFriendRequests();

      // 1. Sync Team Chats
      const teamMembers = teamMembersRes.data;
      if (teamMembers && teamMembers.length > 0) {
        await Promise.all(teamMembers.map((tm: any) => 
          getOrCreateTeamChat(tm.team_id)
        ));
      }

      // 2. Process chats
      const chatIds = chatsRes.data?.map((c: any) => c.chat_id) || [];
      const unreadMap: Record<string, number> = {};
      chatsRes.data?.forEach((c: any) => {
        if (c.unread_count) unreadMap[c.chat_id] = c.unread_count;
      });
      setUnreadCounts(unreadMap);

      let chats: any[] = [];
      let allParticipants: any[] = [];

      if (chatIds.length > 0) {
        const [allPartsRes, allChatsRes] = await Promise.all([
          supabase.from('chat_participants').select('*, profile:profiles(*)').in('chat_id', chatIds),
          supabase.from('chats').select('*, teams(*)').in('id', chatIds)
        ]);
        
        allParticipants = allPartsRes.data || [];
        chats = allChatsRes.data || [];
        setParticipants(allParticipants);
        setChats(chats);
      }

      const formattedFriends: any[] = [];
      const formattedGroups: any[] = [];
      const formattedTeams: any[] = [];

      chats.forEach((chatInfo: any) => {
        const chatParticipants = allParticipants.filter((p: any) => p.chat_id === chatInfo.id && p.user_id !== user.id);
        
        if (chatInfo.team_id) {
          // It's a team chat
          const teamData: any = chatInfo.teams;
          formattedTeams.push({
            id: chatInfo.id,
            name: teamData?.name || chatInfo.name || 'Team Chat',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${teamData?.name || 'Team'}`,
            is_team: true,
            team_id: chatInfo.team_id,
            owner_id: teamData?.owner_id,
            last_message: chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatInfo.is_group || chatParticipants.length > 1) {
          // It's a group chat
          formattedGroups.push({
            id: chatInfo.id,
            name: chatInfo.name || 'Group Chat',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${chatInfo.name || 'Group'}`,
            is_team: false,
            last_message: chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatParticipants.length === 1) {
          // It's a DM
          const p = chatParticipants[0];
          const prof: any = p.profiles;
          formattedFriends.push({
            chat_id: chatInfo.id,
            id: p.user_id,
            name: prof?.name || prof?.full_name || 'Unknown User',
            avatar: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
            status: 'online',
            type: 'friend',
            alias: '',
            last_message: chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatParticipants.length === 0 && !chatInfo.is_group) {
          // Self chat
          formattedFriends.push({
            chat_id: chatInfo.id,
            id: user.id,
            name: 'You (Notes)',
            avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            status: 'online',
            type: 'friend',
            alias: '',
            last_message: chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        }
      });

      setFriends(formattedFriends);
      setGroups(formattedGroups);
      setTeams(formattedTeams);
      
      if (!activeChat) {
        if (formattedTeams.length > 0) {
          setActiveChat(formattedTeams[0].id);
          setSelectedTeamId(formattedTeams[0].team_id);
        } else if (formattedFriends.length > 0) {
          setActiveChat(formattedFriends[0].chat_id);
        } else if (formattedGroups.length > 0) {
          setActiveChat(formattedGroups[0].id);
        }
      } else {
        // If active chat is a team chat, set selectedTeamId
        const activeTeam = formattedTeams.find(t => t.id === activeChat);
        if (activeTeam) setSelectedTeamId(activeTeam.team_id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      // Fetch messages including threads
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles (
            id,
            name,
            full_name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
        
      if (data) {
        // Decrypt messages
        const decryptedMessages = await Promise.all(data.map(async (msg) => {
          if (msg.is_encrypted) {
            return {
              ...msg,
              content: await decryptMessage(msg.content, chatId)
            };
          }
          return msg;
        }));
        const uniqueMessages = Array.from(new Map(decryptedMessages.map((m: any) => [m.id, m])).values());
        setMessages(uniqueMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPinnedMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_pinned', true);
    
    if (data) {
      const uniquePinned = Array.from(new Map(data.map((m: any) => [m.id, m])).values());
      setPinnedMessages(uniquePinned);
    }
  };

  const handlePinMessage = async (msgId: string, isPinned: boolean) => {
    await supabase.from('messages').update({ is_pinned: !isPinned }).eq('id', msgId);
    fetchPinnedMessages(activeChat!);
    fetchMessages(activeChat!);
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    let msg = messages.find(m => m.id === msgId);
    
    // If not found in main messages, check thread replies
    if (!msg) {
      for (const parentId in threadReplies) {
        msg = threadReplies[parentId].find(m => m.id === msgId);
        if (msg) break;
      }
    }

    if (!msg) return;

    const reactions = msg.reactions || {};
    const userReactions = reactions[emoji] || [];
    
    let newReactions;
    if (userReactions.includes(currentUser.id)) {
      newReactions = userReactions.filter((id: string) => id !== currentUser.id);
    } else {
      newReactions = [...userReactions, currentUser.id];
    }
    
    const updatedReactions = { ...reactions, [emoji]: newReactions };
    await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', msgId);
    
    // If it was a thread message, we might need to refresh that specific thread
    if (msg.parent_id) {
      fetchThreadMessages(msg.parent_id);
    } else {
      fetchMessages(activeChat!);
    }
  };

  const handleSendMessage = async (parent_id: string | null = null, text: string | null = null, imageUrl: string | null = null, audioUrl: string | null = null) => {
    const msgText = text || message;
    if (!msgText.trim() && !imageUrl && !audioUrl || !activeChat || !currentUser) return;

    if (!parent_id) setMessage('');

    // AI Link Detection
    let finalContent = msgText;
    if (msgText) {
      const { safe, cleanedContent, reason } = await checkMessageForForbiddenLinks(msgText);
      if (!safe) {
        appToast(`Message modified: ${reason}`);
      }
      finalContent = cleanedContent;
    }

    // Encrypt content
    const encryptedContent = finalContent ? await encryptMessage(finalContent, activeChat) : '';

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat,
          sender_id: currentUser.id,
          content: encryptedContent,
          parent_id: parent_id,
          is_encrypted: !!encryptedContent,
          image_url: imageUrl,
          audio_url: audioUrl
        })
        .select(`
          *,
          sender:profiles (
            id,
            name,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Broadcast the message for real-time using the active channel
      if (activeChannelRef.current && isRealtimeActive) {
        await activeChannelRef.current.send({
          type: 'broadcast',
          event: 'message',
          payload: data
        });
      }
      
      if (parent_id) {
        // Refresh thread if active
        fetchThreadMessages(parent_id);
      }
      
      // Update chat updated_at and last_message
      await supabase
        .from('chats')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: finalContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', activeChat);
        
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendAction = async () => {
    if (!activeChat || !currentUser) return;
    setIsActionLoading(true);

    try {
      const accountId = localStorage.getItem(`stripe_account_id_${currentUser.id}`);

      let messageContent = '';

      if (chatAction === 'paylink') {
        const stripeResData = await invokeApiRunner('quick-pay-create', {
          accountId: accountId || null,
          name: actionData.name,
          price: parseFloat(actionData.amount),
          currency: 'eur',
          description: `Payment for ${actionData.name}`
        });

        if (stripeResData.error) {
          throw new Error(stripeResData.error || 'Failed to create payment link');
        }

        const slug = `pay-${Date.now().toString().slice(-6)}`;
        await supabase.from('quick_pay_links').insert({
          user_id: currentUser.id,
          username: currentUser.username || currentUser.full_name,
          name: actionData.name,
          slug,
          product_name: actionData.name,
          price: parseFloat(actionData.amount),
          currency: 'eur',
          stripe_account_id: accountId,
          stripe_product_id: stripeResData.stripe_product_id,
          stripe_price_id: stripeResData.stripe_price_id,
          stripe_url: stripeResData.url
        });

        const linkUrl = `${window.location.origin}/${currentUser.username || currentUser.full_name}/quick-pay/${slug}`;
        messageContent = `[PAYMENT_LINK] I've created a payment link for ${actionData.name} (€${actionData.amount}): ${linkUrl}`;
      } else if (chatAction === 'invoice') {
        const resData = await invokeApiRunner('create-invoice', {
          customer_name: actionData.name,
          customer_email: actionData.email,
          items: [{ description: actionData.name, amount: parseFloat(actionData.amount), quantity: 1 }],
          currency: 'eur',
          payment_methods: ['card', 'ideal'],
          accountId: accountId || null,
          draftOnly: false
        });

        if (resData.error) {
          throw new Error(resData.error || 'Failed to create invoice');
        }

        const slug = `inv-${Date.now().toString().slice(-6)}`;
        await supabase.from('invoices').insert({
          user_id: currentUser.id,
          username: currentUser.username || currentUser.full_name,
          stripe_invoice_id: resData.id,
          invoice_number: resData.number,
          customer_name: actionData.name,
          customer_email: actionData.email,
          amount_due: parseFloat(actionData.amount),
          currency: 'eur',
          status: 'open',
          slug,
          stripe_account_id: accountId,
          hosted_invoice_url: resData.hosted_invoice_url,
          invoice_pdf: resData.invoice_pdf
        });

        const linkUrl = `${window.location.origin}/pay/invoice/${slug}`;
        messageContent = `[INVOICE] I've sent an invoice for ${actionData.name} (€${actionData.amount}). You can pay it here: ${linkUrl}`;
      }

      await handleSendMessage(null, messageContent);
      setChatAction('none');
      setActionData({ name: '', amount: '', email: '' });
    } catch (error: any) {
      console.error('Error creating action:', error);
      appToast(error.message || 'Failed to create. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchThreadMessages = async (parentId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`*, sender:profiles(full_name, avatar_url)`)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const decrypted = await Promise.all(data.map(async (msg) => {
        if (msg.is_encrypted) {
          return {
            ...msg,
            content: await decryptMessage(msg.content, activeChat!)
          };
        }
        return msg;
      }));
      setThreadReplies(prev => ({ ...prev, [parentId]: decrypted }));
    }
  };

  const handleOpenThread = (msg: any) => {
    setReplyingTo(replyingTo === msg.id ? null : msg.id);
    if (!threadReplies[msg.id]) {
      fetchThreadMessages(msg.id);
    }
  };

  const handleTeamSelect = (team: any) => {
    hapticFeedback('light');
    setActiveChat(team.id);
    setSelectedTeamId(team.team_id);
    setIsTeamSwitcherOpen(false);
    setFilter('team');
    setIsSidebarOpen(false);
  };

  const filteredFriends = friends.filter(f => (filter === 'all' || f.type === filter) && !blockedUsers.includes(f.id));
  const filteredGroups = groups.filter(g => filter === 'all' || filter === 'customer'); // Groups are usually for customers/communities
  const filteredTeams = teams.filter(t => filter === 'all' || filter === 'team');
  
  const myTeams = teams.filter(t => t.owner_id === currentUser?.id);
  const joinedTeams = teams.filter(t => t.owner_id !== currentUser?.id);

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !currentUser) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${activeChat}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      handleSendMessage(null, '', publicUrl);
      setIsAttachmentMenuOpen(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      appToast('Error uploading image');
    }
  };

  return (
    <div className="flex h-full w-full bg-black overflow-hidden font-sans relative">
      
      {/* Inner Sidebar */}
      <div className={`${
        activeChat && !isSidebarOpen ? 'hidden' : 'flex'
      } md:flex w-full md:w-72 bg-[#0A0A0A] border-r border-white/5 flex-col overflow-hidden shrink-0 z-30 absolute md:relative inset-0 md:inset-auto`}>
        
        {/* Sleek Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowRequests(true)}
                className="relative p-2 bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors"
                title="Friend Requests"
              >
                <Users className="w-5 h-5" />
                {friendRequests.length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-[#0A0A0A] rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setIsAddFriendOpen(true)}
                className="p-2 bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors"
                title="New Chat"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search people" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Stories / Quick Contacts Row */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 mb-4">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors relative overflow-hidden"
              >
                {currentUser?.avatar_url ? (
                  <>
                    <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    </div>
                  </>
                ) : (
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                )}
              </button>
              <span className="text-xs text-gray-500 font-medium">Status</span>
            </div>
            
            {/* Mock Stories from friends */}
            {filteredFriends.slice(0, 5).map((friend, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer" onClick={() => { setActiveChat(friend.chat_id); setIsSidebarOpen(false); }}>
                <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-tr from-blue-500 to-purple-500">
                  <div className="w-full h-full rounded-2xl border-2 border-[#0A0A0A] overflow-hidden bg-gray-800">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-medium truncate w-16 text-center">{friend.alias || friend.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar mb-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('friend')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'friend' ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'}`}
          >
            Personal
          </button>
          <button 
            onClick={() => setFilter('team')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'team' ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'}`}
          >
            Work
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-6 space-y-1">
          {/* Render Friends */}
          {(filter === 'all' || filter === 'friend') && filteredFriends.map(friend => (
            <button
              key={friend.chat_id}
              onClick={() => { 
                hapticFeedback('light');
                setActiveChat(friend.chat_id); 
                setIsSidebarOpen(false); 
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-colors ${
                activeChat === friend.chat_id ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]/50'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0A] ${getStatusColor(friend.status)}`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-base text-white truncate">
                    {friend.alias || friend.name}
                  </div>
                  {friend.last_message_at && (
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {new Date(friend.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-400 truncate">
                    {typingUsers[friend.chat_id]?.length > 0 ? (
                      <span className="text-blue-400">Typing...</span>
                    ) : (
                      friend.last_message || 'No messages yet'
                    )}
                  </div>
                  {unreadCounts[friend.chat_id] > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {unreadCounts[friend.chat_id]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Render Teams */}
          {(filter === 'all' || filter === 'team') && [...filteredTeams, ...myTeams].map(team => (
            <button
              key={team.id}
              onClick={() => { setActiveChat(team.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-colors ${
                activeChat === team.id ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]/50'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-base text-white truncate">
                    {team.name}
                  </div>
                  {team.last_message_at && (
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {new Date(team.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-400 truncate">
                    {typingUsers[team.id]?.length > 0 ? (
                      <span className="text-blue-400">Typing...</span>
                    ) : (
                      team.last_message || 'Team Channel'
                    )}
                  </div>
                  {unreadCounts[team.id] > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {unreadCounts[team.id]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Render Groups */}
          {(filter === 'all' || filter === 'team') && filteredGroups.map(group => (
            <button
              key={group.id}
              onClick={() => { setActiveChat(group.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-colors ${
                activeChat === group.id ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]/50'
              }`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 shrink-0">
                <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-base text-white truncate">
                    {group.name}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-400 truncate">
                    {typingUsers[group.id]?.length > 0 ? (
                      <span className="text-blue-400">Typing...</span>
                    ) : (
                      'Group Chat'
                    )}
                  </div>
                  {unreadCounts[group.id] > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {unreadCounts[group.id]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-row relative bg-black ${
        activeChat && !isSidebarOpen ? 'fixed inset-0 z-[60] md:relative md:inset-auto md:z-auto' : ''
      }`}>
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col w-full h-full relative"
            >
              {activeCall ? (
                <div className="flex-1 flex flex-col h-full relative z-50">
                  <CallView 
                    channel={{ id: activeCall.id, type: activeCall.type, name: activeCall.name }} 
                    user={currentUser} 
                    onEndCall={() => setActiveCall(null)}
                  />
                </div>
              ) : (
              <>
                {/* Header */}
                <div className="h-16 md:h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0 bg-black/80 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => {
                        hapticFeedback('medium');
                        setIsSidebarOpen(true);
                        setActiveChat(null);
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-colors md:hidden"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-800 shrink-0">
                      <img 
                        src={
                          friends.find(f => f.chat_id === activeChat)?.avatar || 
                          teams.find(t => t.id === activeChat)?.avatar ||
                          groups.find(g => g.id === activeChat)?.avatar || 
                          'https://picsum.photos/seed/chat/100'
                        } 
                        alt="Chat Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-white truncate">
                        {friends.find(f => f.chat_id === activeChat)?.alias || 
                         friends.find(f => f.chat_id === activeChat)?.name || 
                         teams.find(t => t.id === activeChat)?.name ||
                         groups.find(g => g.id === activeChat)?.name || 'Chat'}
                      </h3>
                      <div className="flex items-center gap-3">
                        {isRealtimeActive && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Realtime
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-4">
                    {friends.find(f => f.chat_id === activeChat) && (
                      <button 
                        onClick={async () => {
                          const friend = friends.find(f => f.chat_id === activeChat);
                          if (friend && await destructiveAction({ description: `Are you sure you want to block ${friend.name}?` })) {
                            handleBlockUser(friend.id);
                          }
                        }}
                        className="p-2 md:p-2.5 text-red-400 hover:text-red-300 transition-colors rounded-xl hover:bg-red-500/10"
                        title="Block User"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        const chatName = friends.find(f => f.chat_id === activeChat)?.alias || 
                                         friends.find(f => f.chat_id === activeChat)?.name || 
                                         teams.find(t => t.id === activeChat)?.name ||
                                         groups.find(g => g.id === activeChat)?.name || 'Chat';
                        setActiveCall({ id: activeChat, type: 'voice', name: chatName });
                        handleSendMessage(null, "Started a voice call 📞");
                      }}
                      className="p-2 md:p-2.5 text-indigo-400 hover:text-indigo-300 transition-colors rounded-xl hover:bg-indigo-500/10"
                      title="Start Voice Call"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        const chatName = friends.find(f => f.chat_id === activeChat)?.alias || 
                                         friends.find(f => f.chat_id === activeChat)?.name || 
                                         teams.find(t => t.id === activeChat)?.name ||
                                         groups.find(g => g.id === activeChat)?.name || 'Chat';
                        setActiveCall({ id: activeChat, type: 'video', name: chatName });
                        handleSendMessage(null, "Started a video call 🎥");
                      }}
                      className="p-2 md:p-2.5 text-indigo-400 hover:text-indigo-300 transition-colors rounded-xl hover:bg-indigo-500/10"
                      title="Start Video Call"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={async () => {
                        hapticFeedback('light');
                        try {
                          const token = crypto.randomUUID().replace(/-/g, '');
                          const { error } = await supabase.from('chat_invites').insert({
                            chat_id: activeChat,
                            token: token,
                            created_by: currentUser.id
                          });
                          if (!error) {
                            const inviteLink = `${window.location.origin}/chat/invite/${token}`;
                            await navigator.clipboard.writeText(inviteLink);
                            appToast('Invite link copied to clipboard!');
                          } else {
                            appToast('Could not generate invite link.');
                          }
                        } catch (err) {
                          console.error('Error getting invite link:', err);
                        }
                      }}
                      className="p-2 md:p-2.5 text-emerald-400 hover:text-emerald-300 transition-colors rounded-xl hover:bg-emerald-500/10"
                      title="Copy Invite Link"
                    >
                      <Link2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        setIsInviteModalOpen(true);
                      }}
                      className="p-2 md:p-2.5 text-indigo-400 hover:text-indigo-300 transition-colors rounded-xl hover:bg-indigo-500/10"
                      title="Invite to Chat"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button className="p-2 md:p-2.5 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide flex flex-col justify-start pb-24 md:pb-8">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  const senderAvatar = isMine ? (currentUser?.avatar_url || 'https://picsum.photos/seed/you/100') : (msg.sender?.avatar_url || 'https://picsum.photos/seed/user/100');
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const replies = threadReplies[msg.id] || [];

                  return (
                    <div key={msg.id} className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}>
                      {msg.is_pinned && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 ml-12">
                          <Pin className="w-3 h-3" /> Pinned
                        </div>
                      )}
                      <div className={`flex items-end gap-2 md:gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="relative">
                          <div 
                            className={`relative p-3 md:p-4 max-w-[85vw] md:max-w-md shadow-md ${
                              isMine 
                                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                : 'bg-[#262626] text-white border border-white/5 rounded-2xl rounded-tl-sm'
                            }`}
                          >
                            {!isMine && (
                              <div className="font-bold text-[11px] mb-1 text-indigo-400">
                                {msg.sender?.name || msg.sender?.full_name || 'Member'}
                              </div>
                            )}
                            {msg.audio_url && (
                              <div className="mb-2">
                                <AudioPlayer src={msg.audio_url} />
                              </div>
                            )}
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            
                            {msg.image_url && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                <img 
                                  src={msg.image_url} 
                                  alt="Attachment" 
                                  className="max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(msg.image_url, '_blank')}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                              <span className="text-[10px] opacity-70">{time}</span>
                              {isMine && <Check className="w-3 h-3 opacity-70" />}
                            </div>

                            {/* Reactions Display */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
                                {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => users.length > 0 && (
                                  <button 
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all ${
                                      users.includes(currentUser.id) 
                                        ? 'bg-white/20 border-white/30 text-white' 
                                        : 'bg-black/20 border-white/5 text-gray-400 hover:bg-black/30'
                                    }`}
                                  >
                                    {emoji} {users.length}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Actions */}
                          <div className={`absolute top-0 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#1A1A1A] border border-white/10 p-1 rounded-xl shadow-xl z-20`}>
                            <div className="flex items-center border-r border-white/10 pr-1 mr-1">
                              <button onClick={() => handleReaction(msg.id, '👍')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReaction(msg.id, '❤️')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><Heart className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReaction(msg.id, '🔥')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">🔥</button>
                              <button onClick={() => handleReaction(msg.id, '😂')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">😂</button>
                              <button onClick={() => handleReaction(msg.id, '😮')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">😮</button>
                            </div>
                            <button onClick={() => handleOpenThread(msg)} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><Reply className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handlePinMessage(msg.id, msg.is_pinned)} className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${msg.is_pinned ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}><Pin className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>

                      {/* Inline Thread Replies */}
                      {(replies.length > 0 || replyingTo === msg.id) && (
                        <div className={`mt-2 ml-10 md:ml-12 w-full max-w-md space-y-2 ${isMine ? 'mr-10 md:mr-12 ml-0' : ''}`}>
                          {replies.map(reply => (
                            <div key={reply.id} className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                              <img src={reply.sender?.avatar_url || 'https://picsum.photos/seed/user/100'} alt="" className="w-6 h-6 rounded-lg shrink-0" />
                              <div className={`p-3 rounded-2xl text-xs bg-white/5 border border-white/10 text-gray-300 ${isMine ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                <div className="flex items-center gap-2 mb-1 opacity-60">
                                  <span className="font-bold">{reply.sender?.full_name || 'Member'}</span>
                                  <span>{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {reply.audio_url && (
                                <div className="mb-2">
                                  <AudioPlayer src={reply.audio_url} />
                                </div>
                              )}
                              <p className="leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                          
                          {replyingTo === msg.id && (
                            <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <Reply className="w-3 h-3 text-indigo-400" />
                              </div>
                              <div className="flex-1 relative">
                                <input 
                                  type="text"
                                  autoFocus
                                  placeholder="Reply to thread..."
                                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                  onKeyDown={(e: any) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                      handleSendMessage(msg.id, e.target.value);
                                      e.target.value = '';
                                    }
                                    if (e.key === 'Escape') setReplyingTo(null);
                                  }}
                                />
                                <button 
                                  onClick={() => setReplyingTo(null)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {typingUsers[activeChat]?.length > 0 && (
                  <div className="flex items-end gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                      <span className="text-xs text-gray-500">...</span>
                    </div>
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {typingUsers[activeChat].join(', ')} {typingUsers[activeChat].length > 1 ? 'are' : 'is'} typing
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-2 md:p-6 shrink-0 bg-[#0A0A0A] md:bg-gradient-to-t md:from-black md:via-black/90 md:to-transparent z-20 pb-[max(env(safe-area-inset-bottom,16px),16px)]">
                <div className="relative max-w-4xl mx-auto">
                  <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-2 flex items-end gap-2 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                    <div className="flex items-center gap-1 pb-1 pl-1">
                      <div className="relative">
                        <button 
                          onClick={() => {
                            hapticFeedback('light');
                            setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
                          }} 
                          className={`p-3 rounded-2xl transition-all active:scale-95 ${
                            isAttachmentMenuOpen ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                          title="Add"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {isAttachmentMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full left-0 mb-4 w-48 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  fileInputRef.current?.click();
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <ImageIcon className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-white">Add image</span>
                              </button>
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  setChatAction('paylink');
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium text-white">Create Pay Link</span>
                              </button>
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  setChatAction('invoice');
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">Create Invoice</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      
                      <button className="p-3 text-gray-400 hover:text-white rounded-2xl hover:bg-white/5 transition-all active:scale-95" title="Emojis">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative flex-1 min-h-[48px] flex items-center">
                      {isRecording ? (
                        <VoiceRecorder 
                          onSend={(url, duration) => {
                            hapticFeedback('medium');
                            setIsRecording(false);
                            handleSendMessage(null, null, null, url);
                          }}
                          onCancel={() => {
                            hapticFeedback('light');
                            setIsRecording(false);
                          }}
                        />
                      ) : chatAction !== 'none' ? (
                        <div className="flex flex-col w-full gap-2 p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {chatAction === 'paylink' ? 'Create Pay Link' : 'Create Invoice'}
                            </span>
                            <button onClick={() => setChatAction('none')} className="text-gray-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Item Name"
                            value={actionData.name}
                            onChange={(e) => setActionData({ ...actionData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                          />
                          <input
                            type="number"
                            placeholder="Amount (€)"
                            value={actionData.amount}
                            onChange={(e) => setActionData({ ...actionData, amount: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                          />
                          {chatAction === 'invoice' && (
                            <input
                              type="email"
                              placeholder="Customer Email"
                              value={actionData.email}
                              onChange={(e) => setActionData({ ...actionData, email: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          )}
                          <button
                            onClick={() => handleSendAction()}
                            disabled={isActionLoading || !actionData.name || !actionData.amount || (chatAction === 'invoice' && !actionData.email)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors mt-1"
                          >
                            {isActionLoading ? 'Creating...' : 'Send'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={message}
                            onChange={(e) => {
                              setMessage(e.target.value);
                              if (e.target.value.endsWith('@')) {
                                setShowMentions(true);
                              } else if (!e.target.value.includes('@')) {
                                setShowMentions(false);
                              }
                              // Auto-resize
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                              
                              // Typing indicator
                              if (activeChat) {
                                supabase.rpc('update_typing_status', { p_chat_id: activeChat, p_user_id: currentUser.id });
                                if ((window as any).typingTimeout) clearTimeout((window as any).typingTimeout);
                                (window as any).typingTimeout = setTimeout(() => {
                                  // We don't have a direct way to clear typing status via RPC easily without a new function, 
                                  // but the SQL function uses updated_at. The frontend can just stop sending updates.
                                  // The realtime listener should handle timeouts, but we can also just let it expire.
                                }, 2000);
                              }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-transparent text-white py-3 px-2 focus:outline-none transition-all font-medium placeholder:text-gray-600 resize-none max-h-[200px] scrollbar-hide text-[15px]"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                hapticFeedback('medium');
                                handleSendMessage();
                                // Reset height
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                              }
                            }}
                          />
                          
                          {/* Mentions UI */}
                          <AnimatePresence>
                            {showMentions && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-4 w-72 bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                              >
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                  <AtSign className="w-4 h-4 text-indigo-400" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">Mention Member</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                  {friends.map(f => (
                                    <button 
                                      key={f.id}
                                      onClick={() => {
                                        hapticFeedback('light');
                                        setMessage(prev => prev + f.name + ' ');
                                        setShowMentions(false);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-2xl transition-all text-left group"
                                    >
                                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                                        <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white font-bold truncate">{f.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-tight">Member</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>

                    <div className="pb-1 pr-1 flex items-center gap-2">
                      {!message.trim() && !isRecording && (
                        <button 
                          onClick={() => {
                            hapticFeedback('light');
                            setIsRecording(true);
                          }}
                          className="p-3 rounded-2xl transition-all flex items-center justify-center bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 active:scale-95"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                      
                      {!isRecording && (
                        <button 
                          onClick={() => {
                            hapticFeedback('medium');
                            handleSendMessage();
                          }}
                          disabled={!message.trim()}
                          className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                            message.trim() 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20' 
                              : 'bg-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">End-to-end encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">Select a chat to start messaging</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Modals --- */}

      {/* Add Friend Modal */}
      <BottomSheetModal 
        isOpen={isAddFriendOpen} 
        onClose={() => setIsAddFriendOpen(false)}
        maxWidth="max-w-md"
        title="Add Friend"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Invite Link</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={currentUser ? `${window.location.origin}/add/${currentUser.id}` : 'Loading...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
              />
              <button 
                onClick={() => {
                  hapticFeedback('light');
                  navigator.clipboard.writeText(currentUser ? `${window.location.origin}/add/${currentUser.id}` : '');
                }}
                className="px-4 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
          </div>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Search Username</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white/30"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-white">{user.full_name || user.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        hapticFeedback('medium');
                        handleSendFriendRequest(user.id);
                      }}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={() => setIsAddFriendOpen(false)} className="px-5 py-2.5 text-white font-medium hover:bg-white/5 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => hapticFeedback('medium')}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Send Request
          </button>
        </div>
      </BottomSheetModal>

      {/* Create Group Modal */}
      <BottomSheetModal 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)}
        maxWidth="max-w-md"
        title="Create Group Chat"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Group Name</label>
            <input 
              type="text" 
              placeholder="e.g. Project Alpha Team"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Select Friends</label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-2 border border-white/10">
              {friends.map(f => (
                <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-600 bg-transparent" />
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                    <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white font-medium">{f.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={() => setIsCreateGroupOpen(false)} className="px-5 py-2.5 text-white font-medium hover:bg-white/5 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => hapticFeedback('medium')}
            className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Create Group
          </button>
        </div>
      </BottomSheetModal>

      {/* Edit Alias Modal */}
      <BottomSheetModal 
        isOpen={!!editingAliasFor} 
        onClose={() => setEditingAliasFor(null)}
        maxWidth="max-w-sm"
        title="Set Nickname"
      >
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">Only you will see this name.</p>
          <input 
            type="text" 
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            placeholder="Enter nickname"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            autoFocus
          />
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={() => setEditingAliasFor(null)} className="px-5 py-2.5 text-white font-medium hover:bg-white/5 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => {
              hapticFeedback('medium');
              // Update alias logic here
              setEditingAliasFor(null);
            }} 
            className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Save
          </button>
        </div>
      </BottomSheetModal>

      {/* Automated Messages Modal */}
      <BottomSheetModal 
        isOpen={isAutoMsgOpen} 
        onClose={() => setIsAutoMsgOpen(false)}
        maxWidth="max-w-lg"
        title="Automated Messages"
      >
        <div className="p-6 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">Away Message</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
            <p className="text-sm text-gray-400 mb-3">Sent automatically when your status is Away or Offline.</p>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 resize-none h-24"
              defaultValue="Hi! I'm currently away, but I'll get back to you as soon as possible."
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">Welcome Message (Customers)</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
            <p className="text-sm text-gray-400 mb-3">Sent to new customers when they first message you.</p>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 resize-none h-24"
              defaultValue="Thanks for reaching out! How can I help you with your order today?"
            />
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button 
            onClick={() => {
              hapticFeedback('medium');
              setIsAutoMsgOpen(false);
            }} 
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </BottomSheetModal>

      {/* Chat Invite Modal */}
      <ChatInviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        chatId={activeChat || ''}
        chatName={
          friends.find(f => f.chat_id === activeChat)?.name || 
          teams.find(t => t.id === activeChat)?.name ||
          groups.find(g => g.id === activeChat)?.name || 'Chat'
        }
      />

      {/* Create Team Chat Modal */}
      <CreateTeamChatModal 
        isOpen={isCreateTeamChatOpen}
        onClose={() => setIsCreateTeamChatOpen(false)}
        onChatCreated={(chatId) => {
          setActiveChat(chatId);
          setIsSidebarOpen(false);
          fetchInitialData();
        }}
      />

      {/* Friend Requests Modal */}
      <BottomSheetModal
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        maxWidth="max-w-md"
        title="Friend Requests"
      >
        <div className="p-6">
          {friendRequests.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No pending friend requests.
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <img 
                      src={req.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender.id}`} 
                      alt={req.sender.full_name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-white">{req.sender.full_name || req.sender.name}</div>
                      <div className="text-xs text-gray-400">Wants to connect</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id, req.sender_id)}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheetModal>

    </div>
  );
};
