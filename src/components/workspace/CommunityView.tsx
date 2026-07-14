import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, Megaphone, ScrollText, ArrowUp, Plus, Settings, Users, MoreVertical, 
  Loader2, Image as ImageIcon, Mic, Layout, MessageCircle, FileText, GraduationCap, Share2, Copy, Check,
  FolderPlus, MoreHorizontal, X, ChevronDown, ChevronRight, Search, Edit2, Gamepad2, Link, Zap, Lock, Menu, Video
} from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { VoiceRecorder } from '../VoiceRecorder';
import { CallView } from '../community/CallView';
import { CommunitySettings } from './CommunitySettings';
import { UserContextMenu } from './UserContextMenu';
import { ManageRolesModal } from './ManageRolesModal';
import { ChatInput } from './ChatInput';
import { MessageContextMenu } from './MessageContextMenu';
import { ErrorModal } from './ErrorModal';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { appToast } from '@/lib/feedback';
interface CommunityViewProps {
  communityId?: string;
  isOwner?: boolean;
  onEdit?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ communityId, isOwner = false, onEdit }) => {
  const [community, setCommunity] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // New State for Categories & Members
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('chat');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // New State for Apps, Rules, Banner, Invites
  const [apps, setApps] = useState<any[]>([]);
  const [activeApp, setActiveApp] = useState<any>(null);
  const [activeMainTab, setActiveMainTab] = useState<'channel' | 'apps' | 'settings'>('channel');
  const [showAppsLibraryModal, setShowAppsLibraryModal] = useState(false);
  const [showBannerEditModal, setShowBannerEditModal] = useState(false);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [showRulesEditModal, setShowRulesEditModal] = useState(false);
  const [rulesContent, setRulesContent] = useState('');
  const [customInviteUrl, setCustomInviteUrl] = useState('');
  const [showCustomInviteModal, setShowCustomInviteModal] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, user: any } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState<{ x: number, y: number, messageId: string, isMe: boolean, content: string } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [permissions, setPermissions] = useState<any>({});
  const [smartRooms, setSmartRooms] = useState<any[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [expandedPostComments, setExpandedPostComments] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastFetchedIdRef = useRef<string | null>(null);
  const smartRoomsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const communityDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSmartRooms = async () => {
    if (!communityId || channels.length === 0 || isFetchingRef.current) return;
    
    try {
      // Fetch message counts for each channel in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const channelIds = channels.map(c => c.id);
      const { data: messageCounts, error: countError } = await supabase
        .from('community_messages')
        .select('channel_id')
        .in('channel_id', channelIds)
        .gt('created_at', twentyFourHoursAgo);

      if (countError) throw countError;
      if (!isMountedRef.current) return;

      // Count messages per channel
      const counts: Record<string, number> = {};
      messageCounts?.forEach(msg => {
        counts[msg.channel_id] = (counts[msg.channel_id] || 0) + 1;
      });

      // Sort channels by activity
      const activeChannels = channels
        .filter(c => c.type === 'chat' || c.type === 'text')
        .map(c => ({
          ...c,
          activityScore: counts[c.id] || 0
        }))
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 3); // Top 3 smart rooms

      setSmartRooms(activeChannels);
    } catch (err) {
      console.error('Error fetching smart rooms:', err);
    }
  };

  const debouncedFetchSmartRooms = () => {
    if (smartRoomsTimeoutRef.current) {
      clearTimeout(smartRoomsTimeoutRef.current);
    }
    smartRoomsTimeoutRef.current = setTimeout(() => {
      fetchSmartRooms();
    }, 2000); // 2 second debounce
  };

  const debouncedFetchCommunityData = () => {
    if (communityDataTimeoutRef.current) {
      clearTimeout(communityDataTimeoutRef.current);
    }
    communityDataTimeoutRef.current = setTimeout(() => {
      fetchCommunityData();
    }, 1000); // 1 second debounce
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      debouncedFetchSmartRooms();
    }
    return () => {
      if (smartRoomsTimeoutRef.current) clearTimeout(smartRoomsTimeoutRef.current);
      if (communityDataTimeoutRef.current) clearTimeout(communityDataTimeoutRef.current);
    };
  }, [channels, communityId]);

  useEffect(() => {
    if (communityId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(communityId)) {
        console.error('Invalid community ID format:', communityId);
        setLoading(false);
        return;
      }

      // Avoid redundant fetches for the same ID if already loading or fetched
      if (lastFetchedIdRef.current === communityId && community) {
        return;
      }

      fetchCommunityData();
      getCurrentUser();
      
      // Subscribe to community structure changes
      const structureChannel = supabase
        .channel(`community_structure:${communityId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'community_categories', filter: `community_id=eq.${communityId}` },
          () => debouncedFetchCommunityData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'community_channels', filter: `community_id=eq.${communityId}` },
          () => debouncedFetchCommunityData()
        )
        .subscribe();

      // Subscribe to messages for smart rooms activity
      const messagesChannel = supabase
        .channel(`community_activity:${communityId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'community_messages' },
          () => debouncedFetchSmartRooms()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(structureChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [communityId]);

  useEffect(() => {
    if (currentUser && communityId) {
      checkUserRole();
    }
  }, [currentUser, communityId, isOwner]);

  const checkUserRole = async () => {
    if (!currentUser) return;
    
    // Check if user is a member first
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          role,
          community_roles (
            permissions
          )
        `)
        .eq('community_id', communityId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (data) {
        setIsMember(true);
        const rolesData = Array.isArray(data.community_roles) ? data.community_roles[0] : data.community_roles;
        const perms = rolesData?.permissions || {};
        setPermissions(perms);
        
        const isAdmin = data.role === 'admin' || perms.administrator === 'true' || perms.administrator === true;
        const isMod = data.role === 'moderator' || perms.manage_settings === 'true' || perms.manage_settings === true;
        setCanManageSettings(isAdmin || isMod || isOwner);
      } else if (isOwner) {
        // If owner but not in members, add them
        const { error: insertError } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: currentUser.id,
            role: 'owner'
          });
        
        // Ignore duplicate key errors (23505)
        if (!insertError || insertError.code === '23505') {
          setIsMember(true);
          setCanManageSettings(true);
          setPermissions({ administrator: true });
        }
      }
    } catch (e) {
      console.error('Error checking user role:', e);
    }
  };

  const hasPermission = (permission: string) => {
    if (isOwner) return true;
    if (permissions.administrator === 'true' || permissions.administrator === true) return true;
    return permissions[permission] === 'true' || permissions[permission] === true;
  };

  useEffect(() => {
    if (isMember && activeChannel && (activeChannel.type === 'chat' || activeChannel.type === 'text' || !activeChannel.type)) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [activeChannel, isMember]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchCommunityData = async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      lastFetchedIdRef.current = communityId || null;

      // Fetch all core community data in parallel
      const [commRes, appsRes, customAppsRes, rolesRes, catsRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', communityId).single(),
        supabase.from('community_apps').select('*').eq('community_id', communityId).eq('is_active', true),
        supabase.from('apps').select('*').eq('business_id', communityId),
        supabase.from('community_roles').select('*').eq('community_id', communityId),
        supabase.from('community_categories').select('*, channels:community_channels(*)').eq('community_id', communityId).order('position', { ascending: true })
      ]);

      if (commRes.error) throw commRes.error;
      if (!isMountedRef.current) return;

      const comm = commRes.data;
      if (JSON.stringify(comm) !== JSON.stringify(community)) {
        setCommunity(comm);
        setRulesContent(comm.rules || '');
        setNewBannerUrl(comm.banner_url || '');
      }

      // Process apps
      const allApps = [
        ...(appsRes.data || []),
        ...(customAppsRes.data || []).map(a => ({ ...a, type: 'custom' }))
      ];
      
      if (JSON.stringify(allApps) !== JSON.stringify(apps)) {
        setApps(allApps);
      }

      // Process roles
      if (rolesRes.data) setRoles(rolesRes.data);

      // Process categories and channels
      if (!catsRes.error && catsRes.data) {
        const cats = catsRes.data;
        if (JSON.stringify(cats) !== JSON.stringify(categories)) {
          setCategories(cats);
          // Expand all by default if categories changed
          const initialExpanded: Record<string, boolean> = {};
          cats.forEach((c: any) => initialExpanded[c.id] = true);
          setExpandedCategories(initialExpanded);
        }

        // Extract all channels from categories
        const allChannels = cats.flatMap((cat: any) => cat.channels || []);
        let currentChannels = allChannels;

        // Ensure Rules channel exists
        if (isOwner && !currentChannels.some((c: any) => c.type === 'rules')) {
          const { data: rulesChan } = await supabase
            .from('community_channels')
            .insert({
              community_id: communityId,
              name: 'Rules',
              type: 'rules',
              position: -1 // Always top
            })
            .select()
            .single();
          
          if (rulesChan) {
            currentChannels = [rulesChan, ...currentChannels];
          }
        }

        if (currentChannels.length > 0) {
          if (!isMountedRef.current) return;
          if (JSON.stringify(currentChannels) !== JSON.stringify(channels)) {
            setChannels(currentChannels);
            
            // Only set active channel if none is selected or if current one is gone
            const channelExists = activeChannel && currentChannels.some((c: any) => c.id === activeChannel.id);
            if (!channelExists) {
              const defaultChannel = currentChannels.find((c: any) => c.type === 'chat' || c.type === 'text' || !c.type) || currentChannels[0];
              setActiveChannel(defaultChannel);
            }
          }
        } else if (isOwner) {
          // Create default channel if none exist and user is owner
          const { data: newChan, error: createError } = await supabase
            .from('community_channels')
            .insert({
              community_id: communityId,
              name: 'general',
              type: 'chat'
            })
            .select()
            .single();
          
          if (!createError && newChan) {
            setChannels([newChan]);
            setActiveChannel(newChan);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchPosts = async () => {
    if (!activeChannel || activeChannel.type !== 'feed') return;
    
    try {
      const { data, error } = await supabase
        .from('community_feed_posts')
        .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPosts(data);
      
      // Also fetch user likes
      if (currentUser) {
        const { data: likes } = await supabase
          .from('community_post_likes')
          .select('post_id')
          .eq('user_id', currentUser.id);
        
        if (likes) {
          setUserLikes(new Set(likes.map(l => l.post_id)));
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !activeChannel || !currentUser) return;
    
    setIsPosting(true);
    try {
      const { data, error } = await supabase
        .from('community_feed_posts')
        .insert({
          channel_id: activeChannel.id,
          user_id: currentUser.id,
          content: newPostContent.trim()
        })
        .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      if (data) {
        setPosts([data, ...posts]);
        setNewPostContent('');
      }
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    
    const isLiked = userLikes.has(postId);
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        setUserLikes(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
      } else {
        const { error } = await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });
        
        if (error) throw error;
        
        setUserLikes(prev => new Set(prev).add(postId));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setPostComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleCommentPost = async (postId: string) => {
    const content = newCommentContent[postId];
    if (!content?.trim() || !currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: content.trim()
        })
        .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      if (data) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data]
        }));
        setNewCommentContent(prev => ({ ...prev, [postId]: '' }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (err) {
      console.error('Error commenting on post:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          user_id,
          role,
          joined_at,
          user:profiles (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('community_id', communityId);

      if (error) throw error;
      if (!isMountedRef.current) return;
      
      if (data) {
        setMembers(data.map((m: any) => ({ 
          ...m.user, 
          role: m.role, 
          joined_at: m.joined_at,
          user_id: m.user_id
        })));
      }
    } catch (e) {
      console.error('Error fetching members:', e);
    }
  };

  const fetchMessages = async () => {
    if (!activeChannel) return;
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        user:profiles!community_messages_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('channel_id', activeChannel.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else if (data && isMountedRef.current) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    if (!activeChannel) return;

    const subscription = supabase
      .channel(`community_channel:${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${activeChannel.id}`
        },
        async (payload) => {
          // Fetch the full message with user profile
          const { data, error } = await supabase
            .from('community_messages')
            .select(`
              *,
              user:profiles!community_messages_author_id_fkey (
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
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleJoinCommunity = async () => {
    if (!currentUser || !communityId) return;
    
    try {
      // Use insert instead of upsert to avoid RLS issues with UPDATE permission
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: currentUser.id,
          role: 'member'
        });

      // Ignore duplicate key errors (23505)
      if (error && error.code !== '23505') throw error;
      
      setIsMember(true);
      fetchMembers();
      checkUserRole();
    } catch (e) {
      console.error('Error joining community:', e);
    }
  };

  const handleMessageContextMenu = (e: React.MouseEvent, msg: any, isMe: boolean) => {
    e.preventDefault();
    setMessageContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: msg.id,
      isMe,
      content: msg.content
    });
  };

  useEffect(() => {
    if (activeChannel?.type === 'feed') {
      fetchPosts();
    }
  }, [activeChannel, currentUser]);

  const handleSendMessage = async (content: string, attachments?: any[], audioUrl?: string) => {
    if ((!content.trim() && !audioUrl && (!attachments || attachments.length === 0)) || !activeChannel || !currentUser) return;

    let metadata: any = {};

    if (attachments && attachments.length > 0) {
      const file = attachments[0].file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/community_media/${communityId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business_storage')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        appToast('Failed to upload file');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('business_storage')
        .getPublicUrl(filePath);

      metadata = {
        attachments: [{
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: publicUrl,
          name: file.name
        }]
      };
    }

    const newMessage = {
      channel_id: activeChannel.id,
      author_id: currentUser.id,
      content: content.trim(),
      audio_url: audioUrl,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    const { error } = await supabase
      .from('community_messages')
      .insert(newMessage);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('community_messages')
      .delete()
      .eq('id', messageId);
      
    if (error) {
      console.error('Error deleting message:', error);
      appToast('Failed to delete message');
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  const handleShareMessage = (messageId: string) => {
    const shareUrl = `${window.location.origin}/community/${communityId}/m/${messageId}`;
    if (navigator.share) {
      navigator.share({
        title: `Message from ${community?.name || 'Community'}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      appToast('Share link copied to clipboard!');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    const attemptAdd = async (retry = false) => {
      try {
        const { data, error } = await supabase
          .from('community_categories')
          .insert({
            community_id: communityId,
            name: newCategoryName.trim(),
            slug: slug,
            position: categories.length
          })
          .select()
          .single();

        if (error) {
          // Check for schema cache error
          if (!retry && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('Could not find'))) {
            console.log('Schema cache error detected, refreshing database...');
            // Wait a moment for schema reload
            await new Promise(resolve => setTimeout(resolve, 1000));
            return attemptAdd(true);
          }
          throw error;
        }

        setCategories([...categories, data]);
        setExpandedCategories(prev => ({ ...prev, [data.id]: true }));
        setNewCategoryName('');
        setShowAddCategoryModal(false);
      } catch (error) {
        console.error('Error adding category:', error);
      }
    };

    await attemptAdd();
  };

  const handleAddChannel = async () => {
    if (!newChannelName.trim()) return;

    const attemptAdd = async (retry = false) => {
      try {
        const { data, error } = await supabase
          .from('community_channels')
          .insert({
            community_id: communityId,
            category_id: targetCategoryId,
            name: newChannelName.trim(),
            type: newChannelType,
            position: channels.filter(c => c.category_id === targetCategoryId).length
          })
          .select()
          .single();

        if (error) {
           // Check for schema cache error
           if (!retry && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('Could not find'))) {
            console.log('Schema cache error detected, refreshing database...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return attemptAdd(true);
          }
          throw error;
        }

        setChannels([...channels, data]);
        setNewChannelName('');
        setShowAddChannelModal(false);
        setActiveChannel(data);
      } catch (error) {
        console.error('Error adding channel:', error);
      }
    };

    await attemptAdd();
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const copyInviteLink = () => {
    const link = customInviteUrl || `${window.location.origin}/join/c/${community.id}/${encodeURIComponent(community.name)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateBanner = async () => {
    if (!newBannerUrl.trim()) return;
    try {
      const { error } = await supabase
        .from('communities')
        .update({ banner_url: newBannerUrl.trim() })
        .eq('id', communityId);
      
      if (error) throw error;
      setCommunity({ ...community, banner_url: newBannerUrl.trim() });
      setShowBannerEditModal(false);
    } catch (e) {
      console.error('Error updating banner:', e);
    }
  };

  const handleUpdateRules = async () => {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ rules: rulesContent })
        .eq('id', communityId);
      
      if (error) throw error;
      setCommunity({ ...community, rules: rulesContent });
      setShowRulesEditModal(false);
    } catch (e) {
      console.error('Error updating rules:', e);
    }
  };

  const handleCreateCustomInvite = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('community_invites')
        .insert({
          community_id: communityId,
          code,
          created_by: currentUser?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      setCustomInviteUrl(`${window.location.origin}/join/i/${data.code}`);
    } catch (e) {
      console.error('Error creating invite:', e);
    }
  };

  const handleAddApp = async (appType: string, title: string, iconUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('community_apps')
        .insert({
          community_id: communityId,
          app_type: appType,
          title,
          icon_url: iconUrl
        })
        .select()
        .single();
      
      if (error) throw error;
      setApps([...apps, data]);
      setShowAppsLibraryModal(false);
    } catch (e) {
      console.error('Error adding app:', e);
    }
  };

  const renderFeedSpace = () => {
    return (
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0A0A0A]">
        {/* Create Post */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <input 
            type="text" 
            placeholder="Share an update..." 
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePost()}
            className="flex-1 bg-transparent text-white placeholder:text-gray-600 focus:outline-none"
          />
          <button 
            onClick={handleCreatePost}
            disabled={isPosting || !newPostContent.trim()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((post: any) => (
            post.type === 'ad' ? (
              <div key={post.id} className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-2 right-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Promoted
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{post.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{post.content}</p>
                <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center gap-1">
                  Learn More <ArrowUp className="w-4 h-4 rotate-45" />
                </button>
              </div>
            ) : (
              <div key={post.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                    {post.user?.avatar_url ? (
                      <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      post.user?.full_name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{post.user?.full_name || 'Unknown User'}</h4>
                    <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="mt-4 flex items-center gap-4 text-gray-500 text-sm">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${userLikes.has(post.id) ? 'text-emerald-400' : 'hover:text-white'}`}
                  >
                    <ArrowUp className={`w-4 h-4 ${userLikes.has(post.id) ? 'fill-emerald-400' : ''}`} /> {post.likes_count || 0}
                  </button>
                  <button 
                    onClick={() => {
                      if (expandedPostComments === post.id) {
                        setExpandedPostComments(null);
                      } else {
                        setExpandedPostComments(post.id);
                        if (!postComments[post.id]) {
                          fetchPostComments(post.id);
                        }
                      }
                    }}
                    className={`flex items-center gap-1.5 transition-colors ${expandedPostComments === post.id ? 'text-white' : 'hover:text-white'}`}
                  >
                    <MessageCircle className="w-4 h-4" /> {post.comments_count || 0} Comments
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/community/${communityId}/post/${post.id}`);
                      appToast('Link copied to clipboard!');
                    }}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                {/* Comments Section */}
                {expandedPostComments === post.id && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    <div className="space-y-4">
                      {postComments[post.id]?.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs font-bold overflow-hidden">
                            {comment.user?.avatar_url ? (
                              <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              comment.user?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="flex-1 bg-white/5 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-bold text-xs">{comment.user?.full_name}</span>
                              <span className="text-[10px] text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs font-bold overflow-hidden">
                        {currentUser?.avatar_url ? (
                          <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          currentUser?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Write a comment..."
                          value={newCommentContent[post.id] || ''}
                          onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleCommentPost(post.id)}
                          className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                        <button 
                          onClick={() => handleCommentPost(post.id)}
                          disabled={!newCommentContent[post.id]?.trim()}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  const renderDocSpace = () => {
    return (
      <div className="flex-1 flex overflow-hidden bg-[#0A0A0A]">
        {/* Doc Sidebar */}
        <div className="w-64 border-r border-white/5 bg-[#141414]/50 p-4 hidden lg:block">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Documents</h3>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-medium">Getting Started</button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">API Reference</button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white text-sm transition-colors">Community Guidelines</button>
          </div>
        </div>

        {/* Doc Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-6">Getting Started</h1>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p>Welcome to the community! This is a documentation space where you can share guides, tutorials, and resources.</p>
              <h3>How to use Spaces</h3>
              <p>Spaces allow you to organize your community into different sections:</p>
              <ul>
                <li><strong>Feed:</strong> For announcements and discussions.</li>
                <li><strong>Chat:</strong> For real-time collaboration.</li>
                <li><strong>Docs:</strong> For long-form content like this.</li>
              </ul>
            </div>

            {/* Contextual Ad */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sponsored</div>
                  <h4 className="text-white font-bold text-sm">Master React in 30 Days</h4>
                  <p className="text-gray-400 text-xs">Join 10,000+ students in this comprehensive course.</p>
                </div>
                <button className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                  View Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChannelList = (type: string, icon: React.ReactNode, label: string) => {
    const typeChannels = channels.filter(c => c.type === type || ((type === 'chat' || type === 'text') && !c.type));
    if (typeChannels.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="px-3 mb-2 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          {icon}
          {label}
        </div>
        <div className="space-y-0.5">
          {typeChannels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${
                activeChannel?.id === channel.id 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleContextMenuAction = (action: string, user: any) => {
    setContextMenu(null);
    switch (action) {
      case 'profile':
        break;
      case 'message':
        break;
      case 'roles':
        setSelectedUser(user);
        setShowManageRolesModal(true);
        break;
      case 'kick':
        setConfirmModal({
          show: true,
          title: 'Kick User',
          message: `Are you sure you want to kick ${user.full_name || user.name || 'this user'}?`,
          onConfirm: () => {
            setConfirmModal(null);
          }
        });
        break;
      case 'ban':
        setConfirmModal({
          show: true,
          title: 'Ban User',
          message: `Are you sure you want to ban ${user.full_name || user.name || 'this user'}?`,
          onConfirm: () => {
            setConfirmModal(null);
          }
        });
        break;
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Banner & Header */}
      <div className="mb-4">
        <div className="h-24 rounded-2xl overflow-hidden bg-white/5 relative mb-3 shadow-lg border border-white/5 group">
          <img 
            src={community.banner_url || `https://picsum.photos/seed/${community.id}/800/200`} 
            alt="Banner" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate drop-shadow-md">{community.name}</h2>
              <div className="flex items-center gap-1.5 text-[9px] text-gray-300 font-medium drop-shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                {members.length} Members
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  fetchMembers();
                  setShowMembersModal(true);
                }}
                className="p-1 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                title="Members"
              >
                <Users className="w-3 h-3" />
              </button>
              {hasPermission('manage_settings') && (
                <button 
                  onClick={() => {
                    setShowSettingsModal(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="p-1 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                  title="Settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Share2 className="w-3 h-3" />
            Invite
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('apps');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center justify-center gap-2 py-1.5 border rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
              activeMainTab === 'apps' 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-3 h-3" />
            Apps
          </button>
        </div>
      </div>

      {/* Categories & Channels */}
      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pb-6">
        {/* Uncategorized Channels */}
        <div className="space-y-0.5">
          {channels.filter(c => !c.category_id).map(channel => (
            <button
              key={channel.id}
              onClick={() => {
                setActiveChannel(channel);
                setActiveMainTab('channel');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group ${
                activeMainTab === 'channel' && activeChannel?.id === channel.id 
                  ? 'bg-white/10 text-white font-bold shadow-lg shadow-black/20 border border-white/5' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                activeMainTab === 'channel' && activeChannel?.id === channel.id ? 'bg-indigo-600/20 text-indigo-400' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
              }`}>
                {channel.type === 'feed' && <Layout className="w-3.5 h-3.5" />}
                {channel.type === 'announcement' && <Megaphone className="w-3.5 h-3.5" />}
                {(channel.type === 'chat' || channel.type === 'text') && <MessageCircle className="w-3.5 h-3.5" />}
                {channel.type === 'voice' && <Mic className="w-3.5 h-3.5" />}
                {channel.type === 'video' && <Video className="w-3.5 h-3.5" />}
                {channel.type === 'doc' && <FileText className="w-3.5 h-3.5" />}
                {channel.type === 'course' && <GraduationCap className="w-3.5 h-3.5" />}
                {channel.type === 'rules' && <ScrollText className="w-3.5 h-3.5" />}
              </div>
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        {/* Categories */}
        {categories.map(category => (
          <div key={category.id} className="space-y-1">
            <div 
              className="group flex items-center justify-between px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] hover:text-gray-300 cursor-pointer transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center gap-2">
                {expandedCategories[category.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {category.name}
              </div>
              {hasPermission('manage_channels') && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetCategoryId(category.id);
                    setShowAddChannelModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-1 hover:bg-white/5 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <AnimatePresence initial={false}>
              {expandedCategories[category.id] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {channels.filter(c => c.category_id === category.id).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setActiveMainTab('channel');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group ${
                        activeMainTab === 'channel' && activeChannel?.id === channel.id 
                          ? 'bg-white/10 text-white font-bold shadow-lg shadow-black/20 border border-white/5' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        activeMainTab === 'channel' && activeChannel?.id === channel.id ? 'bg-indigo-600/20 text-indigo-400' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
                      }`}>
                        {channel.type === 'feed' && <Layout className="w-3.5 h-3.5" />}
                        {channel.type === 'announcement' && <Megaphone className="w-3.5 h-3.5" />}
                        {(channel.type === 'chat' || channel.type === 'text') && <MessageCircle className="w-3.5 h-3.5" />}
                        {channel.type === 'voice' && <Mic className="w-3.5 h-3.5" />}
                        {channel.type === 'video' && <Video className="w-3.5 h-3.5" />}
                        {channel.type === 'doc' && <FileText className="w-3.5 h-3.5" />}
                        {channel.type === 'course' && <GraduationCap className="w-3.5 h-3.5" />}
                        {channel.type === 'rules' && <ScrollText className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {hasPermission('manage_channels') && (
          <button 
            onClick={() => setShowAddCategoryModal(true)}
            className="w-full flex items-center gap-2 px-3 py-3 text-[10px] font-bold text-gray-500 hover:text-white transition-colors border-t border-white/5 mt-4 pt-4 uppercase tracking-widest group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
            New Category
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col bg-[#0A0A0A] p-6 gap-6">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-6 flex-1">
          <Skeleton className="w-72 h-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0A0A0A] text-white">
        <p>Community not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#0A0A0A] font-sans text-white overflow-hidden">
      
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-72 bg-[#141414] flex flex-col shrink-0 z-10 border-r border-white/5 h-full">
        <div className="p-4 flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-[#141414] shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold text-white truncate">{community.name}</h2>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {renderSidebarContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative">
        {/* Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0A0A0A]/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2.5 text-gray-400 hover:text-white bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-gray-400">
                {activeMainTab === 'apps' ? (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Apps Library</h2>
                  </>
                ) : activeMainTab === 'settings' ? (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Community Settings</h2>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      activeChannel?.type === 'announcement' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'
                    }`}>
                      {activeChannel?.type === 'feed' && <Layout className="w-4 h-4" />}
                      {activeChannel?.type === 'announcement' && <Megaphone className="w-4 h-4" />}
                      {(activeChannel?.type === 'chat' || activeChannel?.type === 'text') && <MessageCircle className="w-4 h-4" />}
                      {activeChannel?.type === 'voice' && <Mic className="w-4 h-4" />}
                      {activeChannel?.type === 'video' && <Video className="w-4 h-4" />}
                      {activeChannel?.type === 'doc' && <FileText className="w-4 h-4" />}
                      {activeChannel?.type === 'course' && <GraduationCap className="w-4 h-4" />}
                      {activeChannel?.type === 'rules' && <ScrollText className="w-4 h-4" />}
                      {!activeChannel?.type && <MessageCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-white leading-tight">{activeChannel?.name || 'Select a channel'}</h2>
                      {activeChannel?.description && (
                        <p className="text-[10px] text-gray-500 font-medium truncate max-w-[200px] md:max-w-md">
                          {activeChannel.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {members.slice(0, 3).map((m, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0A0A0A] bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.full_name || i}`} alt="" referrerPolicy="no-referrer" />
                  )}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-[#0A0A0A] bg-white/5 flex items-center justify-center text-[8px] font-bold text-gray-500">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowMembersModal(true)}
              className="p-2.5 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
              title="Members"
            >
              <Users className="w-5 h-5" />
            </button>
            {hasPermission('manage_settings') && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="hidden sm:flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Invite
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeMainTab === 'apps' ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Apps Library</h2>
                  <p className="text-gray-400">Enhance your community with interactive apps and tools.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Wheel of Items</h4>
                  <p className="text-sm text-gray-400 mb-6">A spinning wheel app for giveaways and random selections.</p>
                  <button 
                    onClick={() => handleAddApp('wheel', 'Wheel of Items', '')}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Add to Community
                  </button>
                </div>
                
                <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Polls & Q&A</h4>
                  <p className="text-sm text-gray-400 mb-6">Engage your community with interactive polls and Q&A sessions.</p>
                  <button 
                    onClick={() => handleAddApp('polls', 'Polls & Q&A', '')}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Add to Community
                  </button>
                </div>

                <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group">
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Plus className="w-10 h-10 text-purple-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Custom App</h4>
                  <p className="text-sm text-gray-400 mb-6">Add your own custom app via URL.</p>
                  <div className="w-full flex flex-col gap-2">
                    <input 
                      type="text" 
                      id="customAppUrlMain"
                      placeholder="App URL (e.g. https://myapp.com)" 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20"
                    />
                    <button 
                      onClick={() => {
                        const urlInput = document.getElementById('customAppUrlMain') as HTMLInputElement;
                        if (urlInput && urlInput.value) {
                          handleAddApp('custom', 'Custom App', urlInput.value);
                        }
                      }}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Add Custom App
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeChannel?.type === 'feed' ? (
          renderFeedSpace()
        ) : activeChannel?.type === 'doc' ? (
          renderDocSpace()
        ) : activeChannel?.type === 'rules' ? (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <ScrollText className="w-8 h-8 text-indigo-500" />
                  Community Rules
                </h1>
                {isOwner && (
                  <button 
                    onClick={() => setShowRulesEditModal(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Rules
                  </button>
                )}
              </div>
              
              <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl">
                {community.rules ? (
                  <div className="prose prose-invert max-w-none text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {community.rules}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rules have been set for this community yet.</p>
                    {hasPermission('manage_settings') && (
                      <button 
                        onClick={() => setShowRulesEditModal(true)}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Set Rules Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeChannel?.type === 'voice' || activeChannel?.type === 'video' ? (
          <CallView 
            channel={activeChannel}
            user={currentUser}
            hideHeader={true}
            onEndCall={() => {
              const defaultChannel = channels.find((c: any) => c.type === 'chat' || c.type === 'text' || !c.type) || channels[0];
              setActiveChannel(defaultChannel);
            }}
          />
        ) : activeChannel?.type === 'chat' || activeChannel?.type === 'text' || activeChannel?.type === 'announcement' || !activeChannel?.type ? (
          !isMember ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Join to see the conversation</h3>
              <p className="text-gray-400 max-w-sm mb-8">You need to be a member of this community to view and send messages.</p>
              <button 
                onClick={handleJoinCommunity}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                Join Community
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col">
              <div className="flex-1" /> {/* Spacer to push messages to bottom */}
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 animate-pulse">
                    <MessageCircle className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome to #{activeChannel?.name}!</h3>
                  <p className="text-gray-400 max-w-sm">This is the beginning of the #{activeChannel?.name} channel. Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg) => {
                const isMine = msg.author_id === currentUser?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMine && (
                        <div className="relative group">
                          <img 
                            src={msg.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.author_id}`} 
                            className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-lg" 
                            alt="" 
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({ x: e.clientX, y: e.clientY, user: msg.user });
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full"></div>
                        </div>
                      )}
                      <div 
                        onContextMenu={(e) => handleMessageContextMenu(e, msg, isMine)}
                        className={`relative group p-4 sm:p-5 rounded-3xl text-sm sm:text-base shadow-xl backdrop-blur-md border transition-all ${
                        isMine 
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm border-indigo-400/30 hover:shadow-indigo-500/10' 
                          : 'bg-gradient-to-br from-[#1A1A1A] to-[#141414] text-gray-200 rounded-tl-sm border-white/5 hover:border-white/10'
                      }`}>
                        {!isMine && (
                          <div 
                            className="font-bold mb-1.5 text-[10px] text-indigo-400 uppercase tracking-[0.15em] cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-2"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({ x: e.clientX, y: e.clientY, user: msg.user });
                            }}
                          >
                            {msg.user?.full_name || 'User'}
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span className="text-gray-600 font-medium normal-case tracking-normal">Member</span>
                          </div>
                        )}
                        {msg.audio_url && (
                          <div className="mb-3 bg-black/20 p-2 rounded-xl border border-white/5">
                            <audio controls src={msg.audio_url} className="w-full max-w-[240px] h-8 rounded-lg" />
                          </div>
                        )}
                        {msg.metadata?.attachments?.map((attachment: any, index: number) => (
                          <div key={index} className="mb-3 rounded-xl overflow-hidden border border-white/10 max-w-sm">
                            {attachment.type === 'image' ? (
                              <img src={attachment.url} alt={attachment.name} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                            ) : attachment.type === 'video' ? (
                              <video src={attachment.url} controls className="w-full h-auto" />
                            ) : null}
                          </div>
                        ))}
                        {editingMessageId === msg.id ? (
                          <div className="w-full mt-2">
                            <input
                              type="text"
                              defaultValue={msg.content}
                              autoFocus
                              className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  const newContent = e.currentTarget.value.trim();
                                  if (newContent && newContent !== msg.content) {
                                    try {
                                      const { error } = await supabase
                                        .from('community_messages')
                                        .update({ content: newContent })
                                        .eq('id', msg.id)
                                        .eq('author_id', currentUser?.id);
                                      if (error) throw error;
                                      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: newContent } : m));
                                    } catch (err) {
                                      console.error('Error updating message:', err);
                                    }
                                  }
                                  setEditingMessageId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingMessageId(null);
                                }
                              }}
                              onBlur={() => setEditingMessageId(null)}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">Press Enter to save, Escape to cancel</div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content.split(/(<@[\w-]+>|@everyone|@admin|@owner)/g).map((part, i) => {
                              if (part === '@everyone' || part === '@admin' || part === '@owner') {
                                return <span key={i} className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-lg font-bold text-xs border border-indigo-500/20">{part}</span>;
                              }
                              
                              const userMentionMatch = part.match(/<@([\w-]+)>/);
                              if (userMentionMatch) {
                                const userId = userMentionMatch[1];
                                const member = members.find(m => m.user_id === userId);
                                const role = roles.find(r => r.id === userId);
                                const name = member ? (member.user?.full_name || 'User') : (role ? role.name : 'Unknown');
                                return <span key={i} className={`px-1.5 py-0.5 rounded-lg font-bold text-xs border ${
                                  role ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20'
                                }`}>@{name}</span>;
                              }
                              
                              return part;
                            })}
                          </p>
                        )}
                        
                        {/* Hover Timestamp */}
                        <div className={`absolute top-0 ${isMine ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                          <span className="text-[10px] font-bold text-gray-600 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${isMine ? 'mr-2' : 'ml-12'}`}>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <div className="flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 text-indigo-400" />
                          <Check className="w-2.5 h-2.5 text-indigo-400 -ml-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

            {/* Input Area */}
            {(!activeChannel || activeChannel.type !== 'announcement' || hasPermission('administrator')) && (
              <div className="shrink-0">
                {isRecording ? (
                  <div className="p-4 bg-[#0A0A0A] border-t border-white/5">
                    <div className="relative max-w-4xl mx-auto bg-[#141414] rounded-2xl p-2 flex items-center border border-white/10 shadow-2xl">
                      <VoiceRecorder 
                        bucket="business_storage"
                        onSend={(url, duration) => {
                          setIsRecording(false);
                          handleSendMessage('', undefined, url);
                        }}
                        onCancel={() => setIsRecording(false)}
                      />
                    </div>
                  </div>
                ) : (
                  <ChatInput 
                    onSendMessage={(content, attachments) => handleSendMessage(content, attachments)}
                    channelName={activeChannel?.name || 'channel'}
                    onFileTooLarge={() => setShowErrorModal(true)}
                    onStartRecording={() => setIsRecording(true)}
                    members={members}
                    roles={roles}
                  />
                )}
              </div>
            )}
          </>
        )) : activeChannel?.type === 'rules' ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                      <ScrollText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Community Rules</h2>
                      <p className="text-gray-400 text-sm">Please read and follow these guidelines</p>
                    </div>
                  </div>
                  {hasPermission('manage_settings') && (
                    <button 
                      onClick={() => setShowRulesEditModal(true)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Rules
                    </button>
                  )}
                </div>
                
                <div className="prose prose-invert max-w-none">
                  {community.rules ? (
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {community.rules}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No rules have been set for this community yet.</p>
                      {hasPermission('manage_settings') && (
                        <button 
                          onClick={() => setShowRulesEditModal(true)}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          Set Rules Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeChannel?.type === 'feed' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Community Feed</h3>
                    <p className="text-xs text-gray-500">Stay updated with the latest announcements</p>
                  </div>
                </div>
                {hasPermission('manage_settings') && (
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Announcement
                  </button>
                )}
              </div>
              
              {/* Sample Feed Items */}
              {[1, 2].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                    <div>
                      <div className="text-sm font-bold text-white">Admin</div>
                      <div className="text-[10px] text-gray-500">2 hours ago</div>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Welcome to our new community space!</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    We're excited to launch this new space for all our members. Feel free to explore the channels and join the conversation.
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      12 Comments
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" />
                      45 Likes
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeChannel?.type === 'doc' ? (
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-10 min-h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">{activeChannel?.name}</h2>
                </div>
                {hasPermission('manage_settings') && (
                  <button className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 leading-relaxed">
                  This document is currently empty. Start adding content to share information with your community.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{activeChannel?.name}</h3>
              <p className="max-w-md mx-auto text-gray-400">
                This is a {activeChannel?.type || 'custom'} space. 
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-2">Invite to {community.name}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Share this link to invite people to your community.
                </p>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 mb-4">
                  <div className="flex-1 truncate text-sm text-gray-300 font-mono">
                    {customInviteUrl || `${window.location.origin}/join/c/${community.id}/${encodeURIComponent(community.name)}`}
                  </div>
                  <button 
                    onClick={copyInviteLink}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {hasPermission('manage_settings') && (
                  <div className="mb-6">
                    <button 
                      onClick={handleCreateCustomInvite}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-indigo-400 hover:text-indigo-300"
                    >
                      <Link className="w-4 h-4" />
                      Generate Custom Invite Link
                    </button>
                  </div>
                )}

                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowAddCategoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">New Category</h3>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 mb-6"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowAddCategoryModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Add Channel Modal */}
        {showAddChannelModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowAddChannelModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">New Channel</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Channel Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'chat', label: 'Chat', icon: MessageCircle },
                        { id: 'feed', label: 'Feed', icon: Layout },
                        { id: 'voice', label: 'Voice', icon: Mic },
                        { id: 'video', label: 'Video', icon: Video },
                        { id: 'announcement', label: 'Announcements', icon: Megaphone },
                        { id: 'doc', label: 'Docs', icon: FileText },
                        { id: 'course', label: 'Course', icon: GraduationCap }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setNewChannelType(type.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                            newChannelType === type.id 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          <type.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Channel Name</label>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g. announcements"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowAddChannelModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddChannel}
                    disabled={!newChannelName.trim()}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Channel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Members Modal */}
        {showMembersModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowMembersModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden pointer-events-auto shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Members</h3>
                  <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search members..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-white/20 text-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, user: member });
                      }}
                    >
                      <img 
                        src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                        alt={member.full_name} 
                        className="w-10 h-10 rounded-full bg-white/10"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium text-sm">{member.full_name || 'Unknown User'}</h4>
                          {member.role === 'owner' && (
                            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Owner</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Joined {new Date(member.joined_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <button 
                        className="p-2 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({ x: e.clientX, y: e.clientY, user: member });
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Banner Edit Modal */}
        {showBannerEditModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowBannerEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Edit Banner</h3>
                <input
                  type="text"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  placeholder="Banner Image URL"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 mb-6"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowBannerEditModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateBanner}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Rules Edit Modal */}
        {showRulesEditModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowRulesEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden pointer-events-auto shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Edit Community Rules</h3>
                <textarea
                  value={rulesContent}
                  onChange={(e) => setRulesContent(e.target.value)}
                  placeholder="Enter your community rules here..."
                  className="w-full h-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 mb-6 resize-none font-mono text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowRulesEditModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateRules}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Save Rules
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Active App Modal */}
        {activeApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setActiveApp(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-4xl h-[80vh] overflow-hidden pointer-events-auto shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0A0A0A]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      {activeApp.icon_url ? (
                        <img src={activeApp.icon_url} alt={activeApp.title} className="w-6 h-6 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Gamepad2 className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">{activeApp.title}</h3>
                  </div>
                  <button 
                    onClick={() => setActiveApp(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 bg-black relative">
                  {activeApp.url ? (
                    <iframe 
                      src={activeApp.url} 
                      className="w-full h-full border-none"
                      title={activeApp.title}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                      <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
                      <h2 className="text-2xl font-bold text-white mb-2">{activeApp.title}</h2>
                      <p>This app is currently under development.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}

      </AnimatePresence>
      {/* Context Menu */}
      {contextMenu && (
        <UserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          user={contextMenu.user}
          permissions={{
            canManageRoles: hasPermission('manage_roles'),
            canKick: hasPermission('kick_members'),
            canBan: hasPermission('ban_members'),
            isOwner: isOwner
          }}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}

      {/* Manage Roles Modal */}
      {showManageRolesModal && selectedUser && (
        <ManageRolesModal
          communityId={communityId}
          user={selectedUser}
          onClose={() => setShowManageRolesModal(false)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            onClick={() => setConfirmModal(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden pointer-events-auto shadow-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-gray-400 mb-6">{confirmModal.message}</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      {/* Message Context Menu */}
      {messageContextMenu && (
        <MessageContextMenu
          x={messageContextMenu.x}
          y={messageContextMenu.y}
          messageId={messageContextMenu.messageId}
          isMe={messageContextMenu.isMe}
          content={messageContextMenu.content}
          onClose={() => setMessageContextMenu(null)}
          onCopy={(content) => {
            navigator.clipboard.writeText(content);
            setMessageContextMenu(null);
          }}
          onShare={(messageId) => {
            const url = `${window.location.origin}/share/message/${messageId}`;
            if (navigator.share) {
              navigator.share({
                title: 'Shared Message',
                text: 'Check out this message!',
                url: url
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
            setMessageContextMenu(null);
          }}
          onDelete={(messageId) => {
            setConfirmModal({
              show: true,
              title: 'Delete Message',
              message: 'Are you sure you want to delete this message? This action cannot be undone.',
              onConfirm: async () => {
                try {
                  const { error } = await supabase
                    .from('community_messages')
                    .delete()
                    .eq('id', messageId)
                    .eq('author_id', currentUser?.id);
                  if (error) throw error;
                  setMessages(prev => prev.filter(m => m.id !== messageId));
                } catch (e) {
                  console.error('Error deleting message:', e);
                }
                setConfirmModal(null);
                setMessageContextMenu(null);
              }
            });
          }}
          onEdit={(messageId) => {
            setEditingMessageId(messageId);
            setMessageContextMenu(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Community Settings</h2>
                  <p className="text-xs text-gray-500">Manage your community preferences and configuration.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CommunitySettings 
                community={community} 
                isOwner={isOwner} 
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="File Too Large"
        message="The file you selected exceeds the 50MB limit. Please choose a smaller file."
      />
    </div>
  );
};
