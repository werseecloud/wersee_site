import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Search, MoreVertical, Phone, Video, 
  Image, Paperclip, Smile, Send, Check, CheckCheck,
  Archive, Star, Clock, AlertCircle, DollarSign, Truck,
  FileText, Briefcase, Package, Users, ChevronLeft,
  LayoutDashboard, CreditCard, Settings, Download, LogOut, Plus, X, Flag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ReportModal } from '../components/ui/ReportModal';

// --- Types ---
interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'product' | 'job' | 'community';
  status: 'active' | 'pending' | 'completed';
  avatar: string;
  listing_id?: string;
  listing_title?: string;
  listing_price?: number;
  listing_image?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  type: 'text' | 'image' | 'offer' | 'payment';
  status: 'sent' | 'delivered' | 'read';
  metadata?: any;
}

// --- Components ---

const ChatSidebar = ({ activeRoom, setActiveRoom, filter, setFilter, rooms, loading, onOpenConnect }: any) => {
  const filteredRooms = rooms.filter((r: any) => filter === 'all' || r.status === filter);
  const navigate = useNavigate();

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-black/5 flex flex-col h-full">
      <div className="p-4 border-b border-black/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          <button onClick={onOpenConnect} className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar border-b border-black/5">
        {['all', 'active', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading chats...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No conversations found.</div>
        ) : (
          filteredRooms.map((room: any) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-black/5 ${
                activeRoom?.id === room.id ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="relative">
                <img src={room.avatar || `https://ui-avatars.com/api/?name=${room.name}&background=random`} alt={room.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                {room.type === 'product' && <span className="absolute -bottom-1 -right-1 bg-orange-100 text-orange-600 p-0.5 rounded-full"><Package className="w-3 h-3" /></span>}
                {room.type === 'job' && <span className="absolute -bottom-1 -right-1 bg-blue-100 text-blue-600 p-0.5 rounded-full"><Briefcase className="w-3 h-3" /></span>}
                {room.type === 'community' && <span className="absolute -bottom-1 -right-1 bg-purple-100 text-purple-600 p-0.5 rounded-full"><Users className="w-3 h-3" /></span>}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-[#1D1D1F] truncate">{room.name}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{room.time}</span>
                </div>
                <p className={`text-sm truncate ${room.unread > 0 ? 'font-medium text-[#1D1D1F]' : 'text-gray-500'}`}>
                  {room.lastMessage}
                </p>
              </div>
              {room.unread > 0 && (
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {room.unread}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const ChatWindow = ({ room, user }: { room: ChatRoom, user: any }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', room.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === user.id ? 'me' : 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: m.type as any,
          status: m.is_read ? 'read' : 'sent',
          metadata: m.metadata
        })));
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${room.id}` }, payload => {
        const m = payload.new;
        setMessages(prev => {
          if (prev.some(msg => msg.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            text: m.content,
            sender: m.sender_id === user.id ? 'me' : 'them',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: m.type as any,
            status: m.is_read ? 'read' : 'sent',
            metadata: m.metadata
          }];
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [room.id, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // Check for canned responses
    let contentToSend = message;
    if (message === '/levertijd') contentToSend = "De standaard levertijd is 2-3 werkdagen.";
    
    const newMsg = {
      chat_id: room.id,
      sender_id: user.id,
      content: contentToSend,
      type: 'text'
    };

    setMessage(''); // Optimistic clear
    await supabase.from('messages').insert(newMsg);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7]">
      {/* Header */}
      <div className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img src={room.avatar || `https://ui-avatars.com/api/?name=${room.name}&background=random`} alt={room.name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
          <div>
            <h3 className="font-bold text-[#1D1D1F]">{room.name}</h3>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-[#1D1D1F]"><Phone className="w-5 h-5" /></button>
          <button className="hover:text-[#1D1D1F]"><Video className="w-5 h-5" /></button>
          <button onClick={() => setIsReportModalOpen(true)} className="hover:text-red-500" title="Report User"><Flag className="w-5 h-5" /></button>
          <button className="hover:text-[#1D1D1F]"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUserId={room.id}
        title={`Report ${room.name}`}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.sender === 'me' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-[#1D1D1F] rounded-tl-none'
              }`}>
                {msg.type === 'offer' ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs opacity-70 uppercase tracking-wider font-bold">Offer Received</span>
                    <div className="text-2xl font-bold">€{msg.metadata?.amount || '0.00'}</div>
                    {msg.sender === 'them' && (
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">Accept</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Decline</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-black/5">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-black/5 focus-within:ring-2 focus-within:ring-black/5 transition-all">
          <button className="p-2 text-gray-400 hover:text-[#1D1D1F] hover:bg-gray-200 rounded-xl transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message... (try /levertijd)" 
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
          />
          <button className="p-2 text-gray-400 hover:text-[#1D1D1F] hover:bg-gray-200 rounded-xl transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
           <button onClick={() => setMessage('/shipping-update ')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap">
             /shipping-update
           </button>
           <button onClick={() => setMessage('/payment-request ')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap">
             /payment-request
           </button>
           <button onClick={() => setMessage('/deliver-file ')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap">
             /deliver-file
           </button>
        </div>
      </div>
    </div>
  );
};

const ContextPanel = ({ room }: { room: ChatRoom }) => (
  <div className="w-80 bg-white border-l border-black/5 hidden xl:flex flex-col h-full overflow-y-auto">
    <div className="p-6 border-b border-black/5 text-center">
      <img src={room.avatar || `https://ui-avatars.com/api/?name=${room.name}&background=random`} alt={room.name} className="w-20 h-20 rounded-full mx-auto mb-4 shadow-md" referrerPolicy="no-referrer" />
      <h3 className="text-xl font-bold text-[#1D1D1F]">{room.name}</h3>
      <p className="text-sm text-gray-500">Customer</p>
      <div className="flex justify-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
      </div>
    </div>

    {room.listing_title && (
      <div className="p-6 border-b border-black/5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Related Listing</h4>
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
            {room.listing_image && <img src={room.listing_image} alt="Listing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          </div>
          <div>
            <h5 className="font-medium text-[#1D1D1F] line-clamp-2">{room.listing_title}</h5>
            {room.listing_price && <p className="text-sm font-bold text-[#1D1D1F] mt-1">€{room.listing_price}</p>}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            View Item
          </button>
          <button className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            Create Offer
          </button>
        </div>
      </div>
    )}

    <div className="p-6">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Private Notes</h4>
      <textarea 
        className="w-full h-32 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-200"
        placeholder="Add notes about this customer..."
      ></textarea>
    </div>
  </div>
);

export const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [filter, setFilter] = useState('all');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    const fetchRoleAndChats = async () => {
      if (!user) return;
      
      // Fetch role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileData?.role) {
        setRole(profileData.role as 'buyer' | 'seller');
      }

      // Fetch chats where user is buyer or seller
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, avatar_url),
          seller:profiles!seller_id(full_name, avatar_url),
          listing:listings(title, price, images)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        const formattedRooms = data.map((chat: any) => {
          const isSeller = chat.seller_id === user.id;
          const otherUser = isSeller ? chat.buyer : chat.seller;
          
          return {
            id: chat.id,
            name: otherUser?.full_name || 'Unknown User',
            lastMessage: 'Tap to view messages', // Would fetch last message in a real app
            time: new Date(chat.updated_at).toLocaleDateString(),
            unread: 0,
            type: chat.type || 'product',
            status: chat.status || 'active',
            avatar: otherUser?.avatar_url,
            listing_id: chat.listing_id,
            listing_title: chat.listing?.title,
            listing_price: chat.listing?.price,
            listing_image: chat.listing?.images?.[0]
          };
        });
        setRooms(formattedRooms);
      }
      setLoading(false);
    };

    fetchRoleAndChats();
  }, [user]);

  if (!user) return <div className="p-8 text-center">Please log in to view chats.</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Icon Sidebar */}
      <aside className="w-20 bg-white border-r border-black/5 hidden lg:flex flex-col items-center py-6 fixed inset-y-0 z-40 mt-16">
        <nav className="flex-1 space-y-4">
          <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="Overview">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="p-3 rounded-xl bg-[#1D1D1F] text-white shadow-md transition-all" title="Messages">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title={role === 'seller' ? "Orders" : "Purchases"}>
            {role === 'seller' ? <Package className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
          </button>
          {role === 'seller' && (
            <>
              <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="Jobs & Services">
                <Briefcase className="w-6 h-6" />
              </button>
              <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="Community">
                <Users className="w-6 h-6" />
              </button>
              <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="Finances">
                <CreditCard className="w-6 h-6" />
              </button>
            </>
          )}
          {role === 'buyer' && (
            <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="My Library">
              <Download className="w-6 h-6" />
            </button>
          )}
        </nav>
        <div className="space-y-4">
          <button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-[#1D1D1F] transition-all" title="Settings">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex lg:ml-20">
        <ChatSidebar 
          activeRoom={activeRoom} 
          setActiveRoom={setActiveRoom} 
          filter={filter} 
          setFilter={setFilter} 
          rooms={rooms}
          loading={loading}
          onOpenConnect={() => setIsConnectModalOpen(true)}
        />
        {activeRoom ? (
          <>
            <ChatWindow room={activeRoom} user={user} />
            <ContextPanel room={activeRoom} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#F5F5F7] p-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">Select a conversation</h2>
            <p className="text-gray-500 max-w-md">
              Choose a chat from the sidebar to start messaging, manage orders, or support your community.
            </p>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#1D1D1F]">Connect with sellers</h2>
                <button onClick={() => setIsConnectModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or username..." 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Search for a seller to start a conversation.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
