import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, Search, UserPlus, Users, ArrowUp,
  MoreVertical, Check, Copy, Edit3, FileText, MessageSquare,
  Pin, Reply, ThumbsUp, Heart, X, AtSign, ChevronDown, Mic, ChevronLeft, CreditCard,
  Phone, Video, Link2, Bell, BellRing, CheckCheck, FolderOpen, Loader2, Settings2, Mail,
  ExternalLink, Clock3, ImagePlus
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
import { useSearchParams } from 'react-router-dom';
import { ChatAttachmentCard } from './ChatAttachmentCard';
import {
  CHAT_ATTACHMENT_ACCEPT,
  type ChatAttachment,
  hydrateChatMessageAttachments,
  serializableChatAttachment,
  uploadChatAttachment,
} from '../../services/chatFiles';
import './workspaceChats.css';

import { appToast, destructiveAction } from '@/lib/feedback';
import { requestPushNotifications } from '../../hooks/useNotifications';
import { PublicDmInbox } from './PublicDmInbox';
import { PublicDmSettingsModal } from './PublicDmSettingsModal';
import { parseUsernameRouteValue, routes } from '../../routing/routes';

type ChatCall = {
  id: string;
  type: 'voice' | 'video';
  name: string;
  startedAt?: string;
  initiatedBy?: string;
  autoCloseAt?: string;
};

const CALL_MESSAGE_PREFIX = '[WERSEE_CALL]';
const RICH_MESSAGE_PREFIX = '[WERSEE_RICH]';

type ChatCallRecord = {
  id: string;
  chat_id: string;
  initiated_by: string;
  type: ChatCall['type'];
  name: string;
  status: 'active' | 'ended' | 'missed' | 'cancelled';
  auto_close_at: string;
  connected_at: string | null;
  ended_at: string | null;
  ended_reason: string | null;
  created_at: string;
};

type ChatRichMessage = {
  kind: 'quick_link' | 'payment_link' | 'invoice';
  title: string;
  url: string;
  amount?: number;
  currency?: string;
  subtitle?: string;
};

const encodeRichMessage = (value: ChatRichMessage) =>
  `${RICH_MESSAGE_PREFIX}${JSON.stringify(value)}`;

const parseRichMessage = (content?: string | null): ChatRichMessage | null => {
  if (!content) return null;

  if (content.startsWith(RICH_MESSAGE_PREFIX)) {
    try {
      const value = JSON.parse(content.slice(RICH_MESSAGE_PREFIX.length)) as Partial<ChatRichMessage>;
      if (
        !['quick_link', 'payment_link', 'invoice'].includes(value.kind || '') ||
        typeof value.title !== 'string' ||
        typeof value.url !== 'string'
      ) return null;
      const parsedUrl = new URL(value.url, window.location.origin);
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) return null;
      return {
        kind: value.kind as ChatRichMessage['kind'],
        title: value.title,
        url: parsedUrl.toString(),
        amount: typeof value.amount === 'number' ? value.amount : undefined,
        currency: typeof value.currency === 'string' ? value.currency : undefined,
        subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
      };
    } catch {
      return null;
    }
  }

  const legacyType = content.startsWith('[PAYMENT_LINK]')
    ? 'payment_link'
    : content.startsWith('[INVOICE]')
      ? 'invoice'
      : null;
  const legacyUrl = content.match(/https?:\/\/[^\s)]+/i)?.[0];
  if (!legacyType || !legacyUrl) return null;

  return {
    kind: legacyType,
    title: legacyType === 'invoice' ? 'Invoice' : 'Payment link',
    url: legacyUrl.replace(/[,.!?]+$/, ''),
    subtitle: content.replace(/^\[[A-Z_]+\]\s*/, '').replace(legacyUrl, '').trim(),
  };
};

const parseCallMessage = (content?: string | null): ChatCall | null => {
  if (!content?.startsWith(CALL_MESSAGE_PREFIX)) return null;

  try {
    const value = JSON.parse(content.slice(CALL_MESSAGE_PREFIX.length)) as Partial<ChatCall>;
    if (
      typeof value.id !== 'string' ||
      !['voice', 'video'].includes(value.type || '') ||
      typeof value.name !== 'string'
    ) {
      return null;
    }

    return {
      id: value.id,
      type: value.type as ChatCall['type'],
      name: value.name,
      startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
      initiatedBy: typeof value.initiatedBy === 'string' ? value.initiatedBy : undefined,
      autoCloseAt: typeof value.autoCloseAt === 'string' ? value.autoCloseAt : undefined,
    };
  } catch {
    return null;
  }
};

const normalizeQuickLinkUrl = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) throw new Error('Add a link first.');

  const withProtocol = value.startsWith('/')
    ? new URL(value, window.location.origin).toString()
    : /^[a-z][a-z\d+.-]*:/i.test(value)
      ? value
      : `https://${value}`;
  const parsedUrl = new URL(withProtocol);

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    throw new Error('Use a valid http(s) link.');
  }

  if (parsedUrl.hostname === 'wersee.com' || parsedUrl.hostname.endsWith('.wersee.com')) {
    parsedUrl.protocol = 'https:';
  }

  return parsedUrl.toString();
};

function LinkedMessageText({ content }: { content: string }) {
  const urlPattern = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const parts = content.split(urlPattern);

  return (
    <p className="whitespace-pre-wrap text-[14px] leading-relaxed md:text-[15px]">
      {parts.map((part, index) => {
        if (!/^(?:https?:\/\/|www\.)/i.test(part)) return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;

        const cleanUrl = part.replace(/[),.!?]+$/, '');
        const suffix = part.slice(cleanUrl.length);
        const href = /^www\./i.test(cleanUrl) ? `https://${cleanUrl}` : cleanUrl;
        let isWerseeLink = false;
        try {
          const hostname = new URL(href).hostname;
          isWerseeLink = hostname === 'wersee.com' || hostname.endsWith('.wersee.com');
        } catch {
          return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        }

        return (
          <React.Fragment key={`${part}-${index}`}>
            <a
              href={href}
              target={isWerseeLink ? '_self' : '_blank'}
              rel={isWerseeLink ? undefined : 'noopener noreferrer'}
              className="chat-message-link break-all font-semibold underline decoration-current/35 underline-offset-2 hover:decoration-current"
            >
              {cleanUrl}
            </a>
            {suffix}
          </React.Fragment>
        );
      })}
    </p>
  );
}

function ChatRichMessageCard({ message }: { message: ChatRichMessage }) {
  const icon = message.kind === 'invoice'
    ? <FileText className="h-5 w-5" aria-hidden="true" />
    : message.kind === 'payment_link'
      ? <CreditCard className="h-5 w-5" aria-hidden="true" />
      : <Link2 className="h-5 w-5" aria-hidden="true" />;
  const action = message.kind === 'invoice'
    ? 'View invoice'
    : message.kind === 'payment_link'
      ? 'Pay securely'
      : 'Open link';
  const eyebrow = message.kind === 'invoice'
    ? 'Invoice'
    : message.kind === 'payment_link'
      ? 'Payment link'
      : 'Quick link';
  const amount = typeof message.amount === 'number'
    ? new Intl.NumberFormat('en', {
        style: 'currency',
        currency: (message.currency || 'EUR').toUpperCase(),
      }).format(message.amount)
    : null;
  let hostname = '';
  let sameOrigin = false;
  try {
    const parsed = new URL(message.url, window.location.origin);
    hostname = parsed.hostname;
    sameOrigin = parsed.origin === window.location.origin;
  } catch {
    return null;
  }

  return (
    <a
      href={message.url}
      target={sameOrigin ? '_self' : '_blank'}
      rel={sameOrigin ? undefined : 'noopener noreferrer'}
      className="chat-rich-card group block min-w-[238px] rounded-2xl border p-3.5 no-underline transition-transform active:scale-[0.99]"
    >
      <span className="flex items-start gap-3">
        <span className="chat-rich-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.13em] opacity-60">{eyebrow}</span>
          <span className="mt-0.5 block truncate text-[14px] font-bold">{message.title}</span>
          {(amount || message.subtitle) && (
            <span className="mt-1 block line-clamp-2 text-[11px] leading-4 opacity-65">{amount || message.subtitle}</span>
          )}
        </span>
      </span>
      <span className="chat-rich-action mt-3 flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 text-xs font-bold">
        <span className="min-w-0 truncate opacity-70">{hostname}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {action}
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

const initialsFor = (name?: string) =>
  (name || 'W')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

function ChatAvatar({
  src,
  name,
  className = '',
  active = false,
}: {
  src?: string | null;
  name?: string;
  className?: string;
  active?: boolean;
}) {
  return (
    <span className={`chat-avatar relative inline-flex shrink-0 overflow-visible ${className}`}>
      <span className="chat-avatar-surface flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] text-sm font-bold">
        {src ? (
          <img src={src} alt={name || ''} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true">{initialsFor(name)}</span>
        )}
      </span>
      {active && (
        <span className="chat-online-dot absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px]" aria-label="Active now" />
      )}
    </span>
  );
}

export const WorkspaceChats = () => {
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get('chat');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isTeamSwitcherOpen, setIsTeamSwitcherOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(
    requestedChatId && /^[0-9a-f-]{36}$/i.test(requestedChatId) ? requestedChatId : null
  );
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('online');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'dm' | 'customer' | 'team'>(
    searchParams.get('section') === 'dms' ? 'dm' : 'all',
  );
  const [loading, setLoading] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  
  // Modals state
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isMobileCreateOpen, setIsMobileCreateOpen] = useState(false);
  const [isAutoMsgOpen, setIsAutoMsgOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTeamChatOpen, setIsCreateTeamChatOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingAliasFor, setEditingAliasFor] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [chatAction, setChatAction] = useState<'none' | 'paylink' | 'invoice' | 'quicklink'>('none');
  const [actionData, setActionData] = useState({ name: '', amount: '', email: '', url: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [showPublicDmSettings, setShowPublicDmSettings] = useState(false);
  const [chatBrandingEditor, setChatBrandingEditor] = useState<{
    chatId: string;
    name: string;
    description: string;
    logoUrl: string;
  } | null>(null);
  const [chatBrandingFile, setChatBrandingFile] = useState<File | null>(null);
  const [isSavingChatBranding, setIsSavingChatBranding] = useState(false);
  const [publicDmUnread, setPublicDmUnread] = useState(0);
  const [activeCall, setActiveCall] = useState<ChatCall | null>(null);
  const [callStates, setCallStates] = useState<Record<string, ChatCallRecord>>({});
  const [activeMemberCount, setActiveMemberCount] = useState(0);
  const [presenceByUser, setPresenceByUser] = useState<Record<string, any>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'denied' : Notification.permission
  );

  useEffect(() => {
    if (requestedChatId && /^[0-9a-f-]{36}$/i.test(requestedChatId)) {
      setActiveChat(requestedChatId);
      setIsSidebarOpen(false);
    }
  }, [requestedChatId]);

  useEffect(() => {
    if (searchParams.get('section') === 'dms') setFilter('dm');
  }, [searchParams]);

  useEffect(() => {
    if (!activeChat || !currentUser?.id) {
      setCallStates({});
      return;
    }

    let alive = true;
    const upsertCallState = (record: ChatCallRecord) => {
      if (!alive) return;
      setCallStates((current) => ({ ...current, [record.id]: record }));
      if (record.status !== 'active') {
        setActiveCall((current) => {
          if (current?.id !== record.id) return current;
          const label = record.status === 'missed'
            ? 'The call closed because fewer than two people joined.'
            : 'The call has ended.';
          appToast(label);
          return null;
        });
      }
    };

    void supabase
      .from('chat_calls')
      .select('*')
      .eq('chat_id', activeChat)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error('Call states could not be loaded:', error);
          return;
        }
        const next = Object.fromEntries(
          ((data || []) as ChatCallRecord[]).map((record) => [record.id, record]),
        );
        setCallStates(next);
      });

    const channel = supabase
      .channel(`chat-calls-${activeChat}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_calls', filter: `chat_id=eq.${activeChat}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id;
            if (id) {
              setCallStates((current) => {
                const next = { ...current };
                delete next[id];
                return next;
              });
            }
            return;
          }
          upsertCallState(payload.new as ChatCallRecord);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [activeChat, currentUser?.id]);

  useEffect(() => {
    const handleMobileChatNavigation = (event: Event) => {
      const section = (event as CustomEvent<{ section?: string }>).detail?.section;
      if (section === 'groups') {
        setFilter('team');
        setActiveChat(null);
        setIsSidebarOpen(true);
      } else if (section === 'add') {
        setIsMobileCreateOpen(true);
      } else if (section === 'chats') {
        setFilter('all');
        setActiveChat(null);
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('wersee:chat-mobile-nav', handleMobileChatNavigation);
    return () => window.removeEventListener('wersee:chat-mobile-nav', handleMobileChatNavigation);
  }, []);

  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFriendRequests = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        status,
        sender:profiles!sender_id(id, full_name, name, avatar_url)
      `)
      .eq('receiver_id', userId)
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
      appToast('Friend request could not be sent.');
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!currentUser) return;
    try {
      const { data: chatId, error } = await supabase.rpc('accept_friend_request_and_get_chat', {
        p_request_id: requestId,
      });
      if (error) throw error;

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      setActiveChat(chatId as string);
      setIsSidebarOpen(false);
      await fetchInitialData();
      appToast('Friend request accepted.');
    } catch (err) {
      console.error('Error accepting request:', err);
      appToast('Friend request could not be accepted.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
      if (error) throw error;
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      appToast('Friend request could not be rejected.');
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
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
        .or(`name.ilike.%${query}%,full_name.ilike.%${query}%,username.ilike.%${query}%`)
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
  
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      appToast('Browser notifications are not supported on this device.');
      return;
    }
    const permission = currentUser?.id
      ? await requestPushNotifications(currentUser.id)
      : await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') appToast('Chat notifications are enabled.');
  };

  const showNotification = (msg: any) => {
    if (
      'Notification' in window && 
      Notification.permission === 'granted' && 
      document.hidden &&
      msg.sender_id !== currentUser?.id
    ) {
      new Notification(`New message from ${msg.sender?.full_name || 'Member'}`, {
        body: msg.type === 'voice'
          ? 'Voice message'
          : msg.type === 'file' || msg.type === 'spreadsheet' || msg.type === 'pdf'
            ? 'Shared a file'
            : msg.is_encrypted
              ? 'Encrypted message'
              : msg.content || 'New chat message',
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
      supabase.rpc('mark_chat_read', { p_chat_id: activeChat }).then(() => {
        setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
      });
      
      // Subscribe to Realtime Broadcast for the active chat
      const channel = supabase
        .channel(`chat:${activeChat}`, {
          config: {
            private: true,
            broadcast: { self: true },
            presence: { key: currentUser.id }
          }
        })
        .on('broadcast', { event: 'message' }, async (payload) => {
          let msg = payload.payload;
          
          // Decrypt if encrypted
          if (msg.is_encrypted) {
            msg.content = await decryptMessage(msg.content, activeChat);
          }
          [msg] = await hydrateChatMessageAttachments([msg]);

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
          let onlineCount = 0;
          for (const id in state) {
            onlineCount += state[id]?.length || 0;
            if (id !== currentUser.id) {
              const userState: any = state[id][0];
              if (userState?.typing) {
                typing.push(userState.name);
              }
            }
          }
          setActiveMemberCount(onlineCount);
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
        .subscribe(async (status) => {
          setIsRealtimeActive(status === 'SUBSCRIBED');
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: currentUser.id,
              name: currentUser.name || currentUser.full_name || 'Member',
              typing: false,
              online_at: new Date().toISOString(),
            });
          }
        });

      activeChannelRef.current = channel;
      presenceChannelRef.current = channel;

      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        supabase.removeChannel(channel);
        activeChannelRef.current = null;
        presenceChannelRef.current = null;
        setIsRealtimeActive(false);
        setActiveMemberCount(0);
      };
    }
  }, [activeChat, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const syncPresence = async (nextStatus = document.hidden ? 'away' : status) => {
      await supabase.from('chat_user_presence').upsert({
        user_id: currentUser.id,
        status: nextStatus,
        active_chat_id: activeChat,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };
    const handleVisibility = () => void syncPresence(document.hidden ? 'away' : status);
    void syncPresence();
    const interval = window.setInterval(() => void syncPresence(), 45_000);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      void supabase.from('chat_user_presence').upsert({
        user_id: currentUser.id,
        status: 'offline',
        active_chat_id: null,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };
  }, [activeChat, currentUser?.id, status]);

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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const incoming = payload.new as any;
        if (incoming.sender_id === currentUser.id) return;
        if (incoming.chat_id !== activeChat) {
          setUnreadCounts((current) => ({
            ...current,
            [incoming.chat_id]: (current[incoming.chat_id] || 0) + 1,
          }));
        }
        showNotification(incoming);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_user_presence',
      }, (payload) => {
        const row = (payload.new || payload.old) as any;
        if (!row?.user_id) return;
        setPresenceByUser((current) => ({
          ...current,
          [row.user_id]: payload.eventType === 'DELETE' ? undefined : row,
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser?.id, activeChat, friends.length, groups.length, teams.length]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const friendRequestChannel = supabase
      .channel(`friend-requests:${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
      }, (payload) => {
        void fetchFriendRequests(currentUser.id);
        const nextStatus = (payload.new as { status?: string } | null)?.status;
        if (payload.eventType === 'UPDATE' && nextStatus === 'accepted') {
          void fetchInitialData();
        }
      })
      .subscribe((realtimeStatus) => {
        if (realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'TIMED_OUT') {
          console.warn('Friend request realtime channel degraded:', realtimeStatus);
        }
      });

    return () => {
      void supabase.removeChannel(friendRequestChannel);
    };
  }, [currentUser?.id]);

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
        supabase.from('chat_participants').select('chat_id, unread_count, alias').eq('user_id', user.id),
        supabase.from('chat_participants').select('*, chat:chats(*), profile:profiles(*)').eq('user_id', user.id)
      ]);
      
      const profile = profileRes.data;
      setCurrentUser(profile || { id: user.id, full_name: 'Unknown', avatar_url: '' });
      
      if (blockedRes.data) {
        setBlockedUsers(blockedRes.data.map((b: any) => b.blocked_id));
      }

      // Also fetch friend requests in parallel (independent)
      void fetchFriendRequests(user.id);

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
      let latestPresenceByUser = presenceByUser;

      if (chatIds.length > 0) {
        const [allPartsRes, allChatsRes] = await Promise.all([
          supabase.from('chat_participants').select('*, profile:profiles(*)').in('chat_id', chatIds),
          supabase.from('chats').select('*, teams(*)').in('id', chatIds)
        ]);
        
        allParticipants = allPartsRes.data || [];
        chats = allChatsRes.data || [];
        setParticipants(allParticipants);
        setChats(chats);

        const participantUserIds = Array.from(new Set(allParticipants.map((participant: any) => participant.user_id)));
        if (participantUserIds.length > 0) {
          const { data: presenceRows } = await supabase
            .from('chat_user_presence')
            .select('user_id, status, active_chat_id, last_seen_at')
            .in('user_id', participantUserIds);
          latestPresenceByUser = Object.fromEntries((presenceRows || []).map((row: any) => [row.user_id, row]));
          setPresenceByUser(latestPresenceByUser);
        }
      }

      const formattedFriends: any[] = [];
      const formattedGroups: any[] = [];
      const formattedTeams: any[] = [];

      chats.forEach((chatInfo: any) => {
        const chatParticipants = allParticipants.filter((p: any) => p.chat_id === chatInfo.id && p.user_id !== user.id);
        const branding = chatInfo.metadata?.branding || {};
        
        if (chatInfo.team_id) {
          // It's a team chat
          const teamData: any = chatInfo.teams;
          formattedTeams.push({
            id: chatInfo.id,
            name: branding.name || chatInfo.name || teamData?.name || 'Team Chat',
            subtitle: branding.description || `Team Channel${String(chatInfo.id || '').slice(0, 8) ? ` · ${String(chatInfo.id).slice(0, 8)}` : ''}`,
            avatar: branding.logo_url || null,
            description: branding.description || '',
            is_team: true,
            team_id: chatInfo.team_id,
            owner_id: teamData?.owner_id,
            last_message: chatInfo.metadata?.last_message_encrypted ? 'Encrypted message' : chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatInfo.is_group || chatParticipants.length > 1) {
          // It's a group chat
          formattedGroups.push({
            id: chatInfo.id,
            name: branding.name || chatInfo.name || 'Group Chat',
            avatar: branding.logo_url || null,
            description: branding.description || '',
            is_team: false,
            last_message: chatInfo.metadata?.last_message_encrypted ? 'Encrypted message' : chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatParticipants.length === 1) {
          // It's a DM
          const p = chatParticipants[0];
          const prof: any = p.profile || p.profiles;
          const ownMembership = chatsRes.data?.find((membership: any) => membership.chat_id === chatInfo.id);
          formattedFriends.push({
            chat_id: chatInfo.id,
            id: p.user_id,
            name: prof?.full_name || prof?.name || prof?.username || 'Unknown User',
            display_name: branding.name || '',
            username: prof?.username || '',
            avatar: branding.logo_url || prof?.avatar_url || null,
            description: branding.description || '',
            status: latestPresenceByUser[p.user_id]?.status || 'offline',
            type: 'friend',
            alias: ownMembership?.alias || '',
            last_message: chatInfo.metadata?.last_message_encrypted ? 'Encrypted message' : chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        } else if (chatParticipants.length === 0 && !chatInfo.is_group) {
          // Self chat
          formattedFriends.push({
            chat_id: chatInfo.id,
            id: user.id,
            name: 'You (Notes)',
            display_name: branding.name || '',
            avatar: branding.logo_url || profile?.avatar_url || null,
            description: branding.description || '',
            status: 'online',
            type: 'friend',
            alias: '',
            last_message: chatInfo.metadata?.last_message_encrypted ? 'Encrypted message' : chatInfo.last_message,
            last_message_at: chatInfo.last_message_at
          });
        }
      });

      setFriends(Array.from(new Map(formattedFriends.map((item) => [item.chat_id, item])).values()));
      setGroups(Array.from(new Map(formattedGroups.map((item) => [item.id, item])).values()));
      setTeams(Array.from(new Map(formattedTeams.map((item) => [item.id, item])).values()));
      
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
        setMessages(await hydrateChatMessageAttachments(uniqueMessages));
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

  const handleSendMessage = async (
    parent_id: string | null = null,
    text: string | null = null,
    imageUrl: string | null = null,
    audioUrl: string | null = null,
    attachments: ChatAttachment[] = [],
  ) => {
    const msgText = text || message;
    if ((!msgText.trim() && !imageUrl && !audioUrl && attachments.length === 0) || !activeChat || !currentUser) return null;

    if (!parent_id) setMessage('');

    let finalContent = msgText;
    const structuredMessage = parseRichMessage(msgText);
    if (structuredMessage?.kind === 'quick_link') {
      const { safe, reason } = await checkMessageForForbiddenLinks(structuredMessage.url);
      if (!safe) {
        appToast(reason || 'This payment link cannot be shared as a quick link.');
        return null;
      }
    } else if (msgText && !structuredMessage) {
      const { safe, cleanedContent, reason } = await checkMessageForForbiddenLinks(msgText);
      if (!safe) {
        appToast(`Message modified: ${reason}`);
      }
      finalContent = cleanedContent;
    }

    try {
      setIsSendingMessage(true);
      const encryptedContent = finalContent ? await encryptMessage(finalContent, activeChat) : '';
      const primaryAttachment = attachments[0];
      const callPreview = parseCallMessage(finalContent);
      const richPreview = parseRichMessage(finalContent);
      const listPreview = callPreview
        ? `${callPreview.type === 'video' ? 'Video' : 'Voice'} call`
        : richPreview
          ? `${richPreview.kind === 'invoice' ? 'Invoice' : richPreview.kind === 'payment_link' ? 'Payment link' : 'Quick link'} · ${richPreview.title}`
        : encryptedContent
        ? 'Encrypted message'
        : primaryAttachment?.kind === 'audio' || audioUrl
          ? 'Voice message'
          : primaryAttachment?.kind === 'image' || imageUrl
            ? 'Image attachment'
            : primaryAttachment
              ? `${primaryAttachment.name}`
              : finalContent;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat,
          sender_id: currentUser.id,
          content: encryptedContent,
          parent_id: parent_id,
          is_encrypted: !!encryptedContent,
          image_url: primaryAttachment ? null : imageUrl,
          audio_url: primaryAttachment ? null : audioUrl,
          attachments: attachments.map(serializableChatAttachment),
          type: primaryAttachment?.kind || (audioUrl ? 'voice' : imageUrl ? 'image' : 'text'),
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
      const hydratedData = {
        ...data,
        content: finalContent,
        resolvedAttachments: attachments,
      };

      // Broadcast the message for real-time using the active channel
      if (activeChannelRef.current && isRealtimeActive) {
        await activeChannelRef.current.send({
          type: 'broadcast',
          event: 'message',
          payload: hydratedData
        });
      }
      if (!parent_id) {
        setMessages((current) => current.some((item) => item.id === data.id)
          ? current
          : [...current, hydratedData]);
        scrollToBottom();
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
          last_message: listPreview,
          last_message_at: new Date().toISOString(),
          metadata: {
            ...(chats.find((chat) => chat.id === activeChat)?.metadata || {}),
            last_message_encrypted: Boolean(encryptedContent),
          },
        })
        .eq('id', activeChat);

      return hydratedData;
    } catch (error) {
      console.error('Error sending message:', error);
      if (attachments.length > 0) {
        await supabase.storage
          .from('chat-attachments')
          .remove(attachments.map((attachment) => attachment.path));
      }
      if (!parent_id && finalContent) setMessage(finalContent);
      appToast(error instanceof Error ? error.message : 'Could not send this message.');
      return null;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const startChatCall = async (type: ChatCall['type']) => {
    if (!activeChat || !currentUser?.id) return;

    const chatName = friends.find((friend) => friend.chat_id === activeChat)?.display_name ||
      friends.find((friend) => friend.chat_id === activeChat)?.alias ||
      friends.find((friend) => friend.chat_id === activeChat)?.name ||
      teams.find((team) => team.id === activeChat)?.name ||
      groups.find((group) => group.id === activeChat)?.name ||
      'Chat';
    const { data, error } = await supabase
      .from('chat_calls')
      .insert({
        chat_id: activeChat,
        initiated_by: currentUser.id,
        type,
        name: chatName,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Call could not be started:', error);
      appToast(error?.message || 'The call could not be started.');
      return;
    }

    const record = data as ChatCallRecord;
    const call: ChatCall = {
      id: record.id,
      type,
      name: chatName,
      startedAt: record.created_at,
      initiatedBy: record.initiated_by,
      autoCloseAt: record.auto_close_at,
    };

    setCallStates((current) => ({ ...current, [record.id]: record }));
    const sentMessage = await handleSendMessage(null, `${CALL_MESSAGE_PREFIX}${JSON.stringify(call)}`);
    if (!sentMessage) {
      await supabase.rpc('leave_chat_call', {
        p_call_id: record.id,
        p_end_for_everyone: true,
      });
      return;
    }
    setActiveCall(call);
  };

  const endActiveCall = async () => {
    const call = activeCall;
    if (!call || !currentUser?.id) return;
    setActiveCall(null);
    const record = callStates[call.id];
    const { error } = await supabase.rpc('leave_chat_call', {
      p_call_id: call.id,
      p_end_for_everyone: (record?.initiated_by || call.initiatedBy) === currentUser.id,
    });
    if (error) {
      console.error('Call could not be closed:', error);
      appToast('The call view closed, but its status could not be updated.');
    }
  };

  const handleSendAction = async () => {
    if (!activeChat || !currentUser) return;
    setIsActionLoading(true);

    try {
      const accountId = localStorage.getItem(`stripe_account_id_${currentUser.id}`);

      let messageContent = '';

      if (chatAction === 'quicklink') {
        const normalizedUrl = normalizeQuickLinkUrl(actionData.url);
        messageContent = encodeRichMessage({
          kind: 'quick_link',
          title: actionData.name || 'Quick link',
          url: normalizedUrl,
        });
      } else if (chatAction === 'paylink') {
        const publicUsername = parseUsernameRouteValue(currentUser.username);
        if (!publicUsername) throw new Error('Add a public username before creating a Wersee payment link.');

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
        const { error: quickPayInsertError } = await supabase.from('quick_pay_links').insert({
          user_id: currentUser.id,
          username: publicUsername,
          name: actionData.name,
          slug,
          product_name: actionData.name,
          price: parseFloat(actionData.amount),
          currency: 'eur',
          environment: 'live',
          stripe_account_id: accountId,
          stripe_product_id: stripeResData.stripe_product_id,
          stripe_price_id: stripeResData.stripe_price_id,
          settings: { stripe_url: stripeResData.url, is_sandbox: false }
        });
        if (quickPayInsertError) throw quickPayInsertError;

        const linkUrl = `${window.location.origin}${routes.quickPayByUsername({
          username: publicUsername,
          paymentSlug: slug,
        })}`;
        messageContent = encodeRichMessage({
          kind: 'payment_link',
          title: actionData.name,
          url: linkUrl,
          amount: parseFloat(actionData.amount),
          currency: 'EUR',
          subtitle: 'Secure Wersee payment',
        });
      } else if (chatAction === 'invoice') {
        const publicUsername = parseUsernameRouteValue(currentUser.username);
        if (!publicUsername) throw new Error('Add a public username before creating a Wersee invoice link.');

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
        const { error: invoiceInsertError } = await supabase.from('invoices').insert({
          user_id: currentUser.id,
          username: publicUsername,
          stripe_invoice_id: resData.id,
          invoice_number: resData.number,
          customer_name: actionData.name,
          customer_email: actionData.email,
          amount: parseFloat(actionData.amount),
          currency: 'eur',
          status: 'open',
          slug,
          hosted_url: resData.hosted_invoice_url,
          pdf_url: resData.invoice_pdf,
          metadata: { stripe_account_id: accountId }
        });
        if (invoiceInsertError) throw invoiceInsertError;

        const linkUrl = `${window.location.origin}${routes.invoicePaymentByUsername({
          username: publicUsername,
          invoiceId: slug,
        })}`;
        messageContent = encodeRichMessage({
          kind: 'invoice',
          title: actionData.name,
          url: linkUrl,
          amount: parseFloat(actionData.amount),
          currency: 'EUR',
          subtitle: `Invoice for ${actionData.email}`,
        });
      }

      const sentMessage = await handleSendMessage(null, messageContent);
      if (!sentMessage) return;
      setChatAction('none');
      setActionData({ name: '', amount: '', email: '', url: '' });
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
      const hydratedReplies = await hydrateChatMessageAttachments(decrypted);
      setThreadReplies(prev => ({ ...prev, [parentId]: hydratedReplies }));
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

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesSearch = (value: string) => !normalizedSearch || value.toLowerCase().includes(normalizedSearch);
  const filteredFriends = friends.filter(f => (
    (filter === 'all' || filter === 'dm') &&
    !blockedUsers.includes(f.id) &&
    matchesSearch(`${f.alias || ''} ${f.name || ''} ${f.username || ''}`)
  ));
  const filteredGroups = groups.filter(g => (
    (filter === 'all' || filter === 'team') &&
    matchesSearch(`${g.name || ''}`)
  ));
  const filteredTeams = teams.filter(t => (
    (filter === 'all' || filter === 'team') &&
    matchesSearch(`${t.name || ''} ${t.subtitle || ''} ${t.id || ''}`)
  ));
  
  const myTeams = teams.filter(t => t.owner_id === currentUser?.id);
  const joinedTeams = teams.filter(t => t.owner_id !== currentUser?.id);
  const groupCandidates = Array.from(
    new Map(friends.filter((friend) => friend.id !== currentUser?.id).map((friend) => [friend.id, friend])).values(),
  );
  const activeFriend = friends.find((friend) => friend.chat_id === activeChat);

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    event.target.value = '';
    if (files.length === 0 || !activeChat || !currentUser) return;

    setIsUploadingAttachment(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadChatAttachment({
        file,
        chatId: activeChat,
        userId: currentUser.id,
      })));
      await handleSendMessage(null, '', null, null, uploaded);
      setIsAttachmentMenuOpen(false);
    } catch (error) {
      console.error('Error uploading chat attachment:', error);
      appToast(error instanceof Error ? error.message : 'This file could not be shared.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser || isCreatingGroup) return;
    setIsCreatingGroup(true);
    try {
      const { data, error } = await supabase.rpc('create_group_chat', {
        p_name: groupName.trim(),
        p_member_ids: selectedGroupMemberIds,
      });
      if (error) throw error;

      setGroupName('');
      setSelectedGroupMemberIds([]);
      setIsCreateGroupOpen(false);
      await fetchInitialData();
      setActiveChat(data as string);
      setIsSidebarOpen(false);
      hapticFeedback('success');
      appToast('Group chat created.');
    } catch (error) {
      console.error('Error creating group chat:', error);
      appToast(error instanceof Error ? error.message : 'The group chat could not be created.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSaveAlias = async () => {
    if (!editingAliasFor || !currentUser) return;
    const alias = newAlias.trim();
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ alias: alias || null })
        .eq('chat_id', editingAliasFor)
        .eq('user_id', currentUser.id);
      if (error) throw error;

      setFriends((current) => current.map((friend) => (
        friend.chat_id === editingAliasFor ? { ...friend, alias } : friend
      )));
      setEditingAliasFor(null);
      setNewAlias('');
      appToast(alias ? 'Nickname saved.' : 'Nickname removed.');
    } catch (error) {
      console.error('Error saving chat nickname:', error);
      appToast(error instanceof Error ? error.message : 'The nickname could not be saved.');
    }
  };

  const openChatBranding = (chatId: string) => {
    const rawChat = chats.find((chat) => chat.id === chatId);
    const branding = rawChat?.metadata?.branding || {};
    const friend = friends.find((item) => item.chat_id === chatId);
    const team = teams.find((item) => item.id === chatId);
    const group = groups.find((item) => item.id === chatId);
    setChatBrandingFile(null);
    setChatBrandingEditor({
      chatId,
      name: branding.name || friend?.display_name || team?.name || group?.name || friend?.name || rawChat?.name || 'Chat',
      description: branding.description || friend?.description || team?.description || group?.description || '',
      logoUrl: branding.logo_url || friend?.avatar || team?.avatar || group?.avatar || '',
    });
  };

  const saveChatBranding = async () => {
    if (!chatBrandingEditor || !currentUser?.id || isSavingChatBranding) return;
    const name = chatBrandingEditor.name.trim().slice(0, 80);
    const description = chatBrandingEditor.description.trim().slice(0, 240);
    if (!name) {
      appToast('Add a chat name.');
      return;
    }
    if (chatBrandingFile && (
      chatBrandingFile.size > 2 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(chatBrandingFile.type)
    )) {
      appToast('Use a JPG, PNG, WEBP, or GIF logo up to 2 MB.');
      return;
    }

    setIsSavingChatBranding(true);
    try {
      const rawChat = chats.find((chat) => chat.id === chatBrandingEditor.chatId);
      let logoUrl = chatBrandingEditor.logoUrl.trim();
      if (chatBrandingFile) {
        const extension = chatBrandingFile.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
        const path = `${chatBrandingEditor.chatId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-branding')
          .upload(path, chatBrandingFile, {
            contentType: chatBrandingFile.type,
            cacheControl: '3600',
            upsert: false,
          });
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from('chat-branding').getPublicUrl(path).data.publicUrl;
      }

      const metadata = {
        ...(rawChat?.metadata || {}),
        branding: {
          name,
          description,
          logo_url: logoUrl || null,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString(),
        },
      };
      const { error: updateError } = await supabase
        .from('chats')
        .update({ name, metadata, updated_at: new Date().toISOString() })
        .eq('id', chatBrandingEditor.chatId);
      if (updateError) throw updateError;

      setChats((current) => current.map((chat) => (
        chat.id === chatBrandingEditor.chatId ? { ...chat, name, metadata } : chat
      )));
      setChatBrandingEditor(null);
      setChatBrandingFile(null);
      await fetchInitialData();
      appToast('Chat branding saved.');
    } catch (error) {
      console.error('Chat branding could not be saved:', error);
      appToast(error instanceof Error ? error.message : 'Chat branding could not be saved.');
    } finally {
      setIsSavingChatBranding(false);
    }
  };

  const isUserActive = (userId?: string) => {
    if (!userId) return false;
    const presence = presenceByUser[userId];
    if (!presence || presence.status === 'offline') return false;
    return Date.now() - new Date(presence.last_seen_at).getTime() < 120_000;
  };

  return (
    <div className="wersee-chats chat-shell flex h-full min-h-0 w-full overflow-hidden font-sans relative">
      
      {/* Inner Sidebar */}
      <div className={`${
        activeChat && !isSidebarOpen ? 'hidden' : 'flex'
      } chat-sidebar md:flex w-full md:w-[340px] border-r flex-col overflow-hidden shrink-0 z-30 absolute md:relative inset-0 md:inset-auto`}>
        
        {/* Sleek Header */}
        <div className="px-4 pb-2 pt-[max(18px,env(safe-area-inset-top))] md:p-5 md:pb-2">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="chat-title text-[28px] font-bold tracking-[-0.035em]">Chats</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 md:hidden"
                aria-label="Search chats"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className={`chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 ${
                  notificationPermission === 'granted' ? 'text-emerald-500' : ''
                }`}
                aria-label={notificationPermission === 'granted' ? 'Chat notifications enabled' : 'Enable chat notifications'}
              >
                {notificationPermission === 'granted'
                  ? <BellRing className="h-[18px] w-[18px]" />
                  : <Bell className="h-[18px] w-[18px]" />}
              </button>
              <button
                type="button"
                onClick={() => setShowPublicDmSettings(true)}
                className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                aria-label="Public DM settings"
                title="Public DM settings"
              >
                <Settings2 className="h-[18px] w-[18px]" />
              </button>
              <button 
                onClick={() => setShowRequests(true)}
                className="chat-icon-button relative hidden h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 md:flex"
                title="Friend Requests"
              >
                <Users className="h-[18px] w-[18px]" />
                {friendRequests.length > 0 && (
                  <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-current bg-blue-500"></span>
                )}
              </button>
              <button 
                onClick={() => setIsAddFriendOpen(true)}
                className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                title="New Chat"
              >
                <Edit3 className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-5">
            <Search className="chat-search-icon absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search chats" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input w-full rounded-[16px] py-3 pl-11 pr-4 text-[15px] outline-none transition-all"
            />
          </div>

          {/* Stories / Quick Contacts Row */}
          <div className="mb-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="chat-status-card relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[18px] border border-dashed transition-transform active:scale-95"
              >
                {currentUser?.avatar_url ? (
                  <>
                    <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <PlusCircle className="h-5 w-5 text-white" />
                    </div>
                  </>
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
              </button>
              <span className="chat-secondary-text text-[11px] font-medium">You</span>
            </div>
            
            {filteredFriends.slice(0, 5).map((friend) => (
              <button
                type="button"
                key={friend.chat_id}
                className="flex shrink-0 flex-col items-center gap-2"
                onClick={() => { setActiveChat(friend.chat_id); setIsSidebarOpen(false); }}
              >
                <ChatAvatar
                  src={friend.avatar}
                  name={friend.name}
                  active={isUserActive(friend.id)}
                  className={`h-[58px] w-[58px] rounded-[18px] ${isUserActive(friend.id) ? 'chat-active-avatar' : ''}`}
                />
                <span className="chat-secondary-text w-[62px] truncate text-center text-[11px] font-medium">
                  {isUserActive(friend.id) ? 'Active' : (friend.alias || friend.name.split(' ')[0])}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mb-1 flex items-center gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`chat-filter-pill rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${filter === 'all' ? 'is-active' : ''}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('dm')}
            className={`chat-filter-pill relative rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${filter === 'dm' ? 'is-active' : ''}`}
          >
            <Mail className="mr-1.5 inline h-3.5 w-3.5" />
            DMs
            {publicDmUnread > 0 && (
              <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] text-white">
                {publicDmUnread}
              </span>
            )}
          </button>
          <button 
            onClick={() => setFilter('team')}
            className={`chat-filter-pill rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${filter === 'team' ? 'is-active' : ''}`}
          >
            Groups
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-6 scrollbar-hide">
          <PublicDmInbox
            userId={currentUser?.id}
            visible={filter === 'all' || filter === 'dm'}
            searchQuery={searchQuery}
            onUnreadChange={setPublicDmUnread}
          />
          {/* Render Friends */}
          {(filter === 'all' || filter === 'dm') && filteredFriends.map(friend => (
            <div
              key={friend.chat_id}
              onClick={() => { 
                hapticFeedback('light');
                setActiveChat(friend.chat_id); 
                setIsSidebarOpen(false); 
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveChat(friend.chat_id);
                  setIsSidebarOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
              className={`chat-list-item flex w-full items-center gap-3 rounded-[18px] p-3 transition-all active:scale-[0.985] ${
                activeChat === friend.chat_id ? 'is-active' : ''
              }`}
            >
              <div className="group/chatlogo relative shrink-0">
                <ChatAvatar
                  src={friend.avatar}
                  name={friend.display_name || friend.alias || friend.name}
                  active={isUserActive(friend.id)}
                  className="h-[52px] w-[52px] rounded-full"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openChatBranding(friend.chat_id);
                  }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/chatlogo:opacity-100 focus:opacity-100"
                  aria-label={`Edit ${friend.display_name || friend.name} branding`}
                  title="Edit chat logo, name, and description"
                >
                  <Settings2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="chat-primary-text truncate text-[15px] font-semibold">
                    {friend.display_name || friend.alias || friend.name}
                  </div>
                  {friend.last_message_at && (
                    <span className="chat-tertiary-text ml-2 shrink-0 text-[11px]">
                      {new Date(friend.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="chat-secondary-text truncate text-[13px]">
                    {typingUsers[friend.chat_id]?.length > 0 ? (
                      <span className="text-blue-500">Typing…</span>
                    ) : (
                      friend.last_message || 'No messages yet'
                    )}
                  </div>
                  {unreadCounts[friend.chat_id] > 0 && (
                    <div className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                      {unreadCounts[friend.chat_id]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Render Teams */}
          {(filter === 'all' || filter === 'team') && filteredTeams.map(team => (
            <div
              key={team.id}
              onClick={() => { setActiveChat(team.id); setIsSidebarOpen(false); }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveChat(team.id);
                  setIsSidebarOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
              className={`chat-list-item flex w-full items-center gap-3 rounded-[18px] p-3 transition-all active:scale-[0.985] ${
                activeChat === team.id ? 'is-active' : ''
              }`}
            >
              <div className="group/chatlogo relative shrink-0">
                <ChatAvatar src={team.avatar} name={team.name} className="h-[52px] w-[52px] rounded-full" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openChatBranding(team.id);
                  }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/chatlogo:opacity-100 focus:opacity-100"
                  aria-label={`Edit ${team.name} branding`}
                  title="Edit chat logo, name, and description"
                >
                  <Settings2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="chat-primary-text truncate text-[15px] font-semibold">
                    {team.name}
                  </div>
                  {team.last_message_at && (
                    <span className="chat-tertiary-text ml-2 shrink-0 text-[11px]">
                      {new Date(team.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="chat-secondary-text truncate text-[13px]">
                    {typingUsers[team.id]?.length > 0 ? (
                      <span className="text-blue-400">Typing...</span>
                    ) : (
                      team.last_message || team.subtitle || 'Team Channel'
                    )}
                  </div>
                  {unreadCounts[team.id] > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {unreadCounts[team.id]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Render Groups */}
          {(filter === 'all' || filter === 'team') && filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => { setActiveChat(group.id); setIsSidebarOpen(false); }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveChat(group.id);
                  setIsSidebarOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
              className={`chat-list-item flex w-full items-center gap-3 rounded-[18px] p-3 transition-all active:scale-[0.985] ${
                activeChat === group.id ? 'is-active' : ''
              }`}
            >
              <div className="group/chatlogo relative shrink-0">
                <ChatAvatar src={group.avatar} name={group.name} className="h-[52px] w-[52px] rounded-full" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openChatBranding(group.id);
                  }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/chatlogo:opacity-100 focus:opacity-100"
                  aria-label={`Edit ${group.name} branding`}
                  title="Edit chat logo, name, and description"
                >
                  <Settings2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="chat-primary-text truncate text-[15px] font-semibold">
                    {group.name}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="chat-secondary-text truncate text-[13px]">
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
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`chat-main flex-1 flex flex-row relative ${
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
              className="flex-1 flex flex-col w-full h-full min-h-0 relative"
            >
              {activeCall ? (
                <div className="flex-1 flex flex-col h-full relative z-50">
                  <CallView 
                    channel={{ id: activeCall.id, chatId: activeChat, type: activeCall.type, name: activeCall.name }} 
                    user={currentUser} 
                    onEndCall={() => void endActiveCall()}
                  />
                </div>
              ) : (
              <>
                {/* Header */}
                <div className="chat-conversation-header flex h-[72px] shrink-0 items-center justify-between border-b px-3 pt-[env(safe-area-inset-top)] backdrop-blur-2xl md:h-20 md:px-7 md:pt-0 z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => {
                        hapticFeedback('medium');
                        setIsSidebarOpen(true);
                        setActiveChat(null);
                      }}
                      className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 md:hidden"
                      aria-label="Back to chats"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="group/chatlogo relative shrink-0">
                      <ChatAvatar
                        src={
                          friends.find(f => f.chat_id === activeChat)?.avatar ||
                          teams.find(t => t.id === activeChat)?.avatar ||
                          groups.find(g => g.id === activeChat)?.avatar
                        }
                        name={
                          friends.find(f => f.chat_id === activeChat)?.display_name ||
                          friends.find(f => f.chat_id === activeChat)?.name ||
                          teams.find(t => t.id === activeChat)?.name ||
                          groups.find(g => g.id === activeChat)?.name ||
                          'Chat'
                        }
                        active={activeMemberCount > 1}
                        className="h-10 w-10 rounded-full md:h-12 md:w-12"
                      />
                      <button
                        type="button"
                        onClick={() => activeChat && openChatBranding(activeChat)}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/chatlogo:opacity-100 focus:opacity-100"
                        aria-label="Edit chat branding"
                        title="Edit chat logo, name, and description"
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="min-w-0">
                      <h3 className="chat-primary-text max-w-[38vw] truncate text-[15px] font-bold md:max-w-none md:text-lg">
                        {friends.find(f => f.chat_id === activeChat)?.display_name ||
                         friends.find(f => f.chat_id === activeChat)?.alias || 
                         friends.find(f => f.chat_id === activeChat)?.name || 
                         teams.find(t => t.id === activeChat)?.name ||
                         groups.find(g => g.id === activeChat)?.name || 'Chat'}
                      </h3>
                      <p className={`mt-0.5 text-[11px] font-medium ${
                        activeMemberCount > 1 ? 'text-emerald-500' : 'chat-tertiary-text'
                      }`}>
                        {activeMemberCount > 1
                          ? `${activeMemberCount} people active`
                          : isRealtimeActive
                            ? 'Connected'
                            : 'Connecting…'}
                      </p>
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
                        className="chat-desktop-action p-2 md:p-2.5 text-red-400 hover:text-red-300 transition-colors rounded-xl hover:bg-red-500/10"
                        title="Block User"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        void startChatCall('voice');
                      }}
                      className="chat-desktop-action p-2 md:p-2.5 text-indigo-400 hover:text-indigo-300 transition-colors rounded-xl hover:bg-indigo-500/10"
                      title="Start Voice Call"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        void startChatCall('video');
                      }}
                      className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full text-indigo-500 transition-transform active:scale-90"
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
                      className="chat-desktop-action p-2 md:p-2.5 text-emerald-400 hover:text-emerald-300 transition-colors rounded-xl hover:bg-emerald-500/10"
                      title="Copy Invite Link"
                    >
                      <Link2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        setIsInviteModalOpen(true);
                      }}
                      className="chat-desktop-action p-2 md:p-2.5 text-indigo-400 hover:text-indigo-300 transition-colors rounded-xl hover:bg-indigo-500/10"
                      title="Invite to Chat"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        if (activeFriend) {
                          setEditingAliasFor(activeFriend.chat_id);
                          setNewAlias(activeFriend.alias || '');
                        } else {
                          setIsInviteModalOpen(true);
                        }
                      }}
                      className="chat-icon-button flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
                      aria-label={activeFriend ? 'Set chat nickname' : 'More chat options'}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              {/* Messages */}
              <div className="chat-message-list flex flex-1 flex-col justify-start space-y-4 overflow-y-auto px-3 py-5 pb-24 scrollbar-hide md:space-y-6 md:p-8">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  const senderAvatar = isMine ? currentUser?.avatar_url : msg.sender?.avatar_url;
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const replies = threadReplies[msg.id] || [];
                  const callMessage = parseCallMessage(msg.content);
                  const richMessage = parseRichMessage(msg.content);
                  const callRecord = callMessage ? callStates[callMessage.id] : undefined;
                  const fallbackDeadline = callMessage
                    ? Date.parse(callMessage.autoCloseAt || callMessage.startedAt || '') +
                      (callMessage.autoCloseAt ? 0 : 2 * 60 * 1000)
                    : Number.POSITIVE_INFINITY;
                  const callStatus = callRecord?.status ||
                    (Number.isFinite(fallbackDeadline) && fallbackDeadline <= Date.now() ? 'missed' : 'active');
                  const canJoinCall = callStatus === 'active';
                  const callStatusLabel = callStatus === 'missed'
                    ? 'Missed call'
                    : callStatus === 'cancelled'
                      ? 'Call cancelled'
                      : callStatus === 'ended'
                        ? 'Call ended'
                        : callRecord?.connected_at
                          ? 'Call in progress'
                          : 'Waiting for another person';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      {msg.is_pinned && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 ml-12">
                          <Pin className="w-3 h-3" /> Pinned
                        </div>
                      )}
                      <div className={`flex items-end gap-2 md:gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <ChatAvatar
                          src={senderAvatar}
                          name={isMine ? currentUser?.full_name : msg.sender?.full_name}
                          className="h-7 w-7 rounded-full md:h-9 md:w-9"
                        />
                        <div className="relative">
                          <div 
                            className={`chat-message-bubble relative max-w-[78vw] p-3 shadow-sm md:max-w-md md:p-4 ${
                              isMine 
                                ? 'is-mine rounded-[20px] rounded-br-[6px] text-white' 
                                : 'is-theirs rounded-[20px] rounded-bl-[6px] border'
                            }`}
                          >
                            {!isMine && (
                              <div className="font-bold text-[11px] mb-1 text-indigo-400">
                                {msg.sender?.name || msg.sender?.full_name || 'Member'}
                              </div>
                            )}
                            {msg.audio_url && (!msg.resolvedAttachments || msg.resolvedAttachments.length === 0) && (
                              <div className="mb-2">
                                <AudioPlayer src={msg.audio_url} />
                              </div>
                            )}
                            {callMessage ? (
                              <div className="chat-call-card min-w-[230px] rounded-2xl border p-3">
                                <div className="flex items-center gap-3">
                                  <span className="chat-call-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                                    {callMessage.type === 'video'
                                      ? <Video className="h-4.5 w-4.5" aria-hidden="true" />
                                      : <Phone className="h-4.5 w-4.5" aria-hidden="true" />}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[13px] font-bold">
                                      {callMessage.type === 'video' ? 'Video call' : 'Voice call'}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[11px] opacity-65">
                                      {isMine ? 'You started a call' : `${msg.sender?.name || msg.sender?.full_name || 'A member'} invited you`}
                                    </span>
                                  </span>
                                </div>
                                {canJoinCall ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hapticFeedback('medium');
                                      setActiveCall(callMessage);
                                    }}
                                    className="chat-call-join mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-transform active:scale-[0.98]"
                                  >
                                    {activeCall?.id === callMessage.id ? 'Return to call' : 'Join call'}
                                  </button>
                                ) : (
                                  <div className="chat-call-ended mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold">
                                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                    {callStatusLabel}
                                  </div>
                                )}
                                {canJoinCall && (
                                  <span className="mt-2 flex items-center gap-1.5 text-[10px] opacity-55">
                                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                                    {callStatusLabel}
                                  </span>
                                )}
                              </div>
                            ) : richMessage ? (
                              <ChatRichMessageCard message={richMessage} />
                            ) : msg.content ? (
                              <LinkedMessageText content={msg.content} />
                            ) : null}

                            {msg.resolvedAttachments?.map((attachment: ChatAttachment) => (
                              <ChatAttachmentCard key={attachment.path} attachment={attachment} />
                            ))}
                            
                            {msg.image_url && (!msg.resolvedAttachments || msg.resolvedAttachments.length === 0) && (
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
                              {isMine && (
                                <motion.span
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="inline-flex"
                                  title={msg.is_read ? 'Read' : 'Sent'}
                                >
                                  {msg.is_read
                                    ? <CheckCheck className="h-3.5 w-3.5" />
                                    : <Check className="h-3 w-3 opacity-70" />}
                                </motion.span>
                              )}
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
                              <ChatAvatar
                                src={reply.sender?.avatar_url}
                                name={reply.sender?.full_name}
                                className="h-6 w-6 rounded-lg"
                              />
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
                              {reply.content && <p className="leading-relaxed">{reply.content}</p>}
                              {reply.resolvedAttachments?.map((attachment: ChatAttachment) => (
                                <ChatAttachmentCard key={attachment.path} attachment={attachment} compact />
                              ))}
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
                    </motion.div>
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
              <div className="chat-composer-area z-20 shrink-0 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 md:p-6">
                <div className="relative max-w-4xl mx-auto">
                  <div className="chat-composer-shell flex items-end gap-2">
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <button 
                          onClick={() => {
                            hapticFeedback('light');
                            setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
                          }} 
                          className={`chat-add-button flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90 ${
                            isAttachmentMenuOpen ? 'is-active' : ''
                          }`}
                          title="Add to chat"
                          aria-expanded={isAttachmentMenuOpen}
                          aria-label="Add file, payment, invoice or quick link"
                        >
                          {isUploadingAttachment
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <PlusCircle className="h-5 w-5" />}
                        </button>

                        <AnimatePresence>
                          {isAttachmentMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="chat-attachment-menu absolute bottom-full left-0 z-50 mb-4 w-64 overflow-hidden rounded-[22px] border p-1.5 shadow-2xl backdrop-blur-2xl"
                            >
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  fileInputRef.current?.click();
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="chat-menu-item flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition-colors"
                              >
                                <FolderOpen className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium">Files & spreadsheets</span>
                              </button>
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  setChatAction('paylink');
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="chat-menu-item flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition-colors"
                              >
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium">Create pay link</span>
                              </button>
                              <button 
                                onClick={() => {
                                  hapticFeedback('light');
                                  setChatAction('invoice');
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="chat-menu-item flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition-colors"
                              >
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium">Create invoice</span>
                              </button>
                              <button
                                onClick={() => {
                                  hapticFeedback('light');
                                  setChatAction('quicklink');
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="chat-menu-item flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition-colors"
                              >
                                <Link2 className="h-4 w-4 text-violet-500" />
                                <span className="text-sm font-medium">Share quick link</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept={CHAT_ATTACHMENT_ACCEPT}
                        multiple
                        onChange={handleFileUpload}
                      />
                    </div>

                    <div className="chat-input-pill relative flex min-h-[52px] min-w-0 flex-1 items-center rounded-[26px] border px-1.5 shadow-2xl backdrop-blur-2xl transition-all">
                      {isRecording ? (
                        <VoiceRecorder
                          chatId={activeChat}
                          onSend={(url, duration, attachment) => {
                            hapticFeedback('medium');
                            setIsRecording(false);
                            handleSendMessage(null, null, null, attachment ? null : url, attachment ? [attachment] : []);
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
                              {chatAction === 'paylink'
                                ? 'Create Pay Link'
                                : chatAction === 'invoice'
                                  ? 'Create Invoice'
                                  : 'Share Quick Link'}
                            </span>
                            <button onClick={() => setChatAction('none')} className="text-gray-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={chatAction === 'quicklink' ? 'Link title' : 'Item name'}
                            value={actionData.name}
                            onChange={(e) => setActionData({ ...actionData, name: e.target.value })}
                            className="chat-action-input w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          />
                          {chatAction === 'quicklink' ? (
                            <input
                              type="url"
                              placeholder="https://"
                              value={actionData.url}
                              onChange={(e) => setActionData({ ...actionData, url: e.target.value })}
                              className="chat-action-input w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                          ) : (
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="Amount (€)"
                              value={actionData.amount}
                              onChange={(e) => setActionData({ ...actionData, amount: e.target.value })}
                              className="chat-action-input w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                          )}
                          {chatAction === 'invoice' && (
                            <input
                              type="email"
                              placeholder="Customer Email"
                              value={actionData.email}
                              onChange={(e) => setActionData({ ...actionData, email: e.target.value })}
                              className="chat-action-input w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                          )}
                          <button
                            onClick={() => handleSendAction()}
                            disabled={
                              isActionLoading ||
                              !actionData.name ||
                              (chatAction === 'quicklink'
                                ? !actionData.url
                                : !actionData.amount || (chatAction === 'invoice' && !actionData.email))
                            }
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors mt-1"
                          >
                            {isActionLoading ? 'Creating...' : 'Send'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <textarea
                            ref={composerInputRef}
                            data-mobile-keyboard-target="chat"
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
                              
                              handleTyping();
                            }}
                            placeholder="Type your message…"
                            className="chat-message-input max-h-[160px] w-full resize-none bg-transparent px-2 py-3 text-[16px] font-medium leading-6 outline-none scrollbar-hide md:text-[15px]"
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
                                      <ChatAvatar src={f.avatar} name={f.name} className="h-9 w-9 rounded-full" />
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

                    <div className="flex items-center">
                      {chatAction === 'none' && !isRecording && (
                        message.trim() ? (
                          <button 
                            onClick={() => {
                              hapticFeedback('medium');
                              void handleSendMessage();
                            }}
                            disabled={isSendingMessage}
                            className="chat-send-button is-ready flex h-11 w-11 items-center justify-center rounded-full text-white transition-all active:scale-90 disabled:opacity-60"
                            aria-label="Send message"
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              {isSendingMessage ? (
                                <motion.span key="sending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                </motion.span>
                              ) : (
                                <motion.span key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        ) : (
                        <button 
                          onClick={() => {
                            hapticFeedback('light');
                            setIsRecording(true);
                          }}
                          className="chat-mic-button flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
                          aria-label="Record voice message"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-3 hidden items-center justify-center gap-4 md:flex">
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

      <BottomSheetModal
        isOpen={isMobileCreateOpen}
        onClose={() => setIsMobileCreateOpen(false)}
        maxWidth="max-w-sm"
        title="New conversation"
      >
        <div className="grid gap-3 p-5">
          <button
            type="button"
            onClick={() => {
              hapticFeedback('medium');
              setIsMobileCreateOpen(false);
              setIsAddFriendOpen(true);
            }}
            className="chat-create-choice flex items-center gap-4 rounded-2xl border p-4 text-left transition-transform active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold">New conversation</span>
              <span className="mt-1 block text-xs opacity-55">Find someone and start a private chat.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              hapticFeedback('medium');
              setIsMobileCreateOpen(false);
              setIsCreateGroupOpen(true);
            }}
            className="chat-create-choice flex items-center gap-4 rounded-2xl border p-4 text-left transition-transform active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold">New group</span>
              <span className="mt-1 block text-xs opacity-55">Bring contacts together in one chat.</span>
            </span>
          </button>
        </div>
      </BottomSheetModal>

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
                      <ChatAvatar
                        src={user.avatar_url}
                        name={user.full_name || user.name}
                        className="h-8 w-8 rounded-full"
                      />
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
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Select Friends</label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-2 border border-white/10">
              {groupCandidates.map(f => (
                <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGroupMemberIds.includes(f.id)}
                    onChange={(event) => {
                      setSelectedGroupMemberIds((current) => (
                        event.target.checked
                          ? Array.from(new Set([...current, f.id]))
                          : current.filter((memberId) => memberId !== f.id)
                      ));
                    }}
                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-600 bg-transparent"
                  />
                  <ChatAvatar src={f.avatar} name={f.name} className="h-8 w-8 rounded-full" />
                  <span className="text-white font-medium">{f.name}</span>
                </label>
              ))}
              {groupCandidates.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  Add a contact before creating a group.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={() => setIsCreateGroupOpen(false)} className="px-5 py-2.5 text-white font-medium hover:bg-white/5 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => void handleCreateGroup()}
            disabled={isCreatingGroup || !groupName.trim() || selectedGroupMemberIds.length === 0}
            className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 font-bold text-black transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isCreatingGroup && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
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
            type="button"
            onClick={() => {
              hapticFeedback('medium');
              void handleSaveAlias();
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
          friends.find(f => f.chat_id === activeChat)?.display_name ||
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
                    <ChatAvatar
                      src={req.sender.avatar_url}
                      name={req.sender.full_name || req.sender.name}
                      className="h-10 w-10 rounded-full"
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

      <BottomSheetModal
        isOpen={Boolean(chatBrandingEditor)}
        onClose={() => {
          setChatBrandingEditor(null);
          setChatBrandingFile(null);
        }}
        maxWidth="max-w-lg"
        title="Chat branding"
      >
        {chatBrandingEditor && (
          <div className="space-y-5 p-5 md:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {chatBrandingEditor.logoUrl && !chatBrandingFile ? (
                  <img src={chatBrandingEditor.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-indigo-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
                  <ImagePlus className="h-4 w-4" />
                  {chatBrandingFile ? 'Choose another logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => setChatBrandingFile(event.target.files?.[0] || null)}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  {chatBrandingFile ? chatBrandingFile.name : 'JPG, PNG, WEBP, or GIF · max. 2 MB'}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Chat name</span>
              <input
                value={chatBrandingEditor.name}
                onChange={(event) => setChatBrandingEditor((current) => current ? {
                  ...current,
                  name: event.target.value.slice(0, 80),
                } : current)}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                placeholder="Chat name"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
                Description
                <span className="text-xs font-normal text-gray-600">{chatBrandingEditor.description.length}/240</span>
              </span>
              <textarea
                value={chatBrandingEditor.description}
                onChange={(event) => setChatBrandingEditor((current) => current ? {
                  ...current,
                  description: event.target.value.slice(0, 240),
                } : current)}
                className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                placeholder="What is this chat for?"
              />
            </label>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => {
                  setChatBrandingEditor(null);
                  setChatBrandingFile(null);
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveChatBranding()}
                disabled={isSavingChatBranding || !chatBrandingEditor.name.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-400 disabled:opacity-40"
              >
                {isSavingChatBranding && <Loader2 className="h-4 w-4 animate-spin" />}
                Save branding
              </button>
            </div>
          </div>
        )}
      </BottomSheetModal>

      <PublicDmSettingsModal
        isOpen={showPublicDmSettings}
        onClose={() => setShowPublicDmSettings(false)}
        userId={currentUser?.id}
      />

    </div>
  );
};
