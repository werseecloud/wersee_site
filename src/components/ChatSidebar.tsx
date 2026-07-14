import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, MessageSquare, 
  Clock, CheckCircle2, Bot,
  User, Home, Settings, LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatSidebarProps {
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  chats: any[];
  className?: string;
}

export const ChatSidebar = ({ activeChatId, onSelectChat, chats, className = '' }: ChatSidebarProps) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name, name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <div className={`w-80 flex flex-col border-r transition-colors ${
      isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-gray-50 border-black/5'
    } ${className}`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Home className="w-4 h-4" />
            Return Home
          </button>
          <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search chats..."
            className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs outline-none transition-all ${
              isDark 
                ? 'bg-white/5 border border-white/10 text-white focus:border-white/30' 
                : 'bg-white border border-gray-200 text-black focus:border-black'
            }`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <button className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all border-2 border-dashed ${
          isDark ? 'border-white/10 hover:border-white/30 text-gray-500' : 'border-black/5 hover:border-black/20 text-gray-400'
        }`}>
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold">New Support Chat</span>
        </button>

        <div className="h-4" />

        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-4 rounded-2xl text-left transition-all group relative ${
              activeChatId === chat.id
                ? (isDark ? 'bg-white/10' : 'bg-white shadow-lg border border-black/5')
                : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100')
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  chat.type === 'ai' 
                    ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                    : (isDark ? 'bg-white/10 text-white' : 'bg-black text-white')
                }`}>
                  {chat.type === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1A1A1A] rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold truncate">{chat.name}</h4>
                  <span className="text-[10px] text-gray-500">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
            </div>
            {chat.unread > 0 && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {chat.unread}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile?.full_name || profile?.name || user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Free Member</p>
          </div>
          <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
