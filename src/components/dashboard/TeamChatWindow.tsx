import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Paperclip, Smile, MoreVertical, 
  MessageSquare, Loader2, User, Shield
} from 'lucide-react';
import { getOrCreateTeamChat, supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { checkMessageForForbiddenLinks } from '../../services/chatAiService';

import { appToast } from '@/lib/feedback';
interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

interface TeamChatWindowProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
}

export const TeamChatWindow = ({ teamId, teamName, onClose }: TeamChatWindowProps) => {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupChat = async () => {
      try {
        setLoading(true);
        const data = await getOrCreateTeamChat(teamId, teamName);
        if (!data) {
          setMessages([]);
          return;
        }
        setChatId(data);
        
        // Fetch existing messages
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(full_name, avatar_url)
          `)
          .eq('chat_id', data)
          .order('created_at', { ascending: true });
          
        if (msgError) throw msgError;
        setMessages(msgData || []);
        
        // Subscribe to new messages
        const channel = supabase
          .channel(`team_chat_${data}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${data}`
          }, async (payload) => {
            // Fetch sender info for the new message
            const { data: senderData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();
              
            const fullMsg = { ...payload.new, sender: senderData } as Message;
            setMessages(prev => [...prev, fullMsg]);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up team chat:', error);
      } finally {
        setLoading(false);
      }
    };

    setupChat();
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !chatId || !user || sending) return;

    setSending(true);
    
    // AI Link Detection
    const { safe, cleanedContent, reason } = await checkMessageForForbiddenLinks(newMessage);
    if (!safe) {
      appToast(`Message modified: ${reason}`);
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: cleanedContent
        });

      if (error) throw error;
      setNewMessage('');
      
      // Update chat updated_at
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
        
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#141414] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[60]"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{teamName} Chat</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Team Channel</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <MoreVertical className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id;
            const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && showAvatar && (
                  <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1">
                    {msg.sender?.full_name || 'Team Member'}
                  </span>
                )}
                <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMine && showAvatar ? (
                    <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {msg.sender?.avatar_url ? (
                        <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : !isMine ? (
                    <div className="w-6 shrink-0" />
                  ) : null}
                  
                  <div 
                    className={`max-w-[240px] px-4 py-2.5 rounded-2xl text-sm font-medium ${
                      isMine 
                        ? 'bg-white text-black rounded-tr-sm' 
                        : 'bg-white/5 text-white border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-white/5">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="relative flex-1">
            <input 
              data-mobile-keyboard-target="chat"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message team..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-2.5 rounded-xl transition-all ${
              newMessage.trim() && !sending
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
