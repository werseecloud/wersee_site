import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, X, Minus, Maximize2, 
  User, Bot, ShieldCheck, Clock,
  ImageIcon, Plus, Smile,
  MoreHorizontal, Camera, Video,
  FileText, CreditCard, RefreshCw, ArrowUpCircle,
  CheckCircle2, Star, AlertCircle, Layout,
  Search, Terminal, Globe, Zap, ChevronDown,
  Home, Settings, Target, BarChart3, Lightbulb, Combine, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getGeminiClient, requireGeminiClient } from "../lib/geminiClient";
import { PageWrapper } from '../components/PageWrapper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatInput } from '../components/ChatInput';
import { ContextModal } from '../components/ContextModal';
import { ChatSettingsModal } from '../components/ChatSettingsModal';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import ReactMarkdown from 'react-markdown';
import { ThinkingAnimation, ReasoningStep } from '../components/ThinkingAnimation';

type MessageType = 'text' | 'context' | 'snapshot' | 'action' | 'video' | 'system';

interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'agent' | 'system';
  type: MessageType;
  timestamp: Date;
  metadata?: any;
  status?: 'sent' | 'delivered' | 'seen';
  seenAt?: Date;
  device?: string;
}

const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  { id: 'understand', label: 'Understand', content: '', status: 'pending', icon: Target },
  { id: 'analyze', label: 'Analyze', content: '', status: 'pending', icon: BarChart3 },
  { id: 'reason', label: 'Reason', content: '', status: 'pending', icon: Lightbulb },
  { id: 'synthesize', label: 'Synthesize', content: '', status: 'pending', icon: Combine },
  { id: 'conclude', label: 'Conclude', content: '', status: 'pending', icon: Flag },
];

export const LiveChat = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [chats, setChats] = useState([
    { id: '1', name: 'Wersee Support', lastMessage: 'How can I help you today?', time: 'Now', unread: 0, type: 'ai', online: true },
    { id: '2', name: 'Technical Specialist', lastMessage: 'Your ticket #452 is being reviewed.', time: '2h ago', unread: 1, type: 'agent', online: false },
    { id: '3', name: 'Billing Department', lastMessage: 'Refund processed successfully.', time: 'Yesterday', unread: 0, type: 'agent', online: true }
  ]);
  
  const [activeChatId, setActiveChatId] = useState<string | null>('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm Wersee's support assistant. How can I help you today?",
      sender: 'agent',
      type: 'text',
      timestamp: new Date(),
      status: 'seen',
      seenAt: new Date()
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);
  const activeChannelRef = useRef<any>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, reasoningSteps]);

  // Supabase Integration
  useEffect(() => {
    if (!user || !activeChatId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setMessages(data.map(m => ({
          ...m,
          timestamp: new Date(m.created_at),
          sender: m.sender_type === 'user' ? 'user' : 'agent'
        })));
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`chat:${activeChatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages',
        filter: `chat_id=eq.${activeChatId}`
      }, (payload) => {
        const newMessage = payload.new as any;
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, {
            ...newMessage,
            timestamp: new Date(newMessage.created_at),
            sender: newMessage.sender_type === 'user' ? 'user' : 'agent'
          }];
        });
      })
      .subscribe();
    
    activeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      activeChannelRef.current = null;
    };
  }, [activeChatId, user]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
      status: 'sent',
      device: 'Web / Chrome'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setReasoningSteps(INITIAL_REASONING_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));

    // Save to Supabase if possible
    if (user && activeChatId) {
      await supabase.from('support_messages').insert({
        chat_id: activeChatId,
        user_id: user.id,
        text: text,
        sender_type: 'user',
        type: 'text'
      });
    }

    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      
      const prompt = `Before answering, work through this step-by-step:
1. UNDERSTAND: What is the core question being asked?
2. ANALYZE: What are the key factors/components involved?
3. REASON: What logical connections can I make?
4. SYNTHESIZE: How do these elements combine?
5. CONCLUDE: What is the most accurate/helpful response?

Important: Use the exact headers "1. UNDERSTAND:", "2. ANALYZE:", etc. for each step.
After completing all 5 steps, provide the final answer starting with "ANSWER:".

When writing the final answer, please:
- Use rich formatting: **bold**, *italic*, and headers (##, ###).
- Use bullet points or numbered lists for clarity.
- Use empty lines (white space) to separate paragraphs and sections.
- Use code blocks for technical details.
- Make the response comprehensive and easy to read.

Now answer: ${text}`;

      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional support agent for Wersee. You must follow the structured reasoning pattern before providing the final answer."
        }
      });

      let fullText = '';
      const currentReasoning = '';
      let finalAnswer = '';
      let isCapturingAnswer = false;

      for await (const chunk of streamResponse) {
        const chunkText = chunk.text || '';
        fullText += chunkText;

        // Parse reasoning steps
        const steps = [...INITIAL_REASONING_STEPS];
        const stepMarkers = [
          { id: 'understand', marker: /1\.\s*UNDERSTAND:/i },
          { id: 'analyze', marker: /2\.\s*ANALYZE:/i },
          { id: 'reason', marker: /3\.\s*REASON:/i },
          { id: 'synthesize', marker: /4\.\s*SYNTHESIZE:/i },
          { id: 'conclude', marker: /5\.\s*CONCLUDE:/i },
          { id: 'answer', marker: /ANSWER:/i }
        ];

        for (let i = 0; i < stepMarkers.length; i++) {
          const current = stepMarkers[i];
          const next = stepMarkers[i + 1];
          
          const currentMatch = fullText.match(current.marker);
          if (currentMatch) {
            const startIndex = currentMatch.index! + currentMatch[0].length;
            let endIndex = -1;
            
            if (next) {
              const nextMatch = fullText.match(next.marker);
              if (nextMatch) {
                endIndex = nextMatch.index!;
              }
            }
            
            const content = fullText.substring(startIndex, endIndex !== -1 ? endIndex : fullText.length).trim();
            
            if (current.id === 'answer') {
              finalAnswer = content;
              isCapturingAnswer = true;
            } else {
              const stepIdx = steps.findIndex(s => s.id === current.id);
              if (stepIdx !== -1) {
                steps[stepIdx].content = content;
                if (endIndex === -1) {
                  steps[stepIdx].status = 'active';
                } else {
                  steps[stepIdx].status = 'completed';
                }
              }
            }
          }
        }

        // Update steps state
        setReasoningSteps(prev => steps.map(s => {
          const updated = steps.find(us => us.id === s.id);
          return updated || s;
        }));

        if (isCapturingAnswer && finalAnswer) {
          // We don't update messages yet, we wait for the end or a significant chunk
        }
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: finalAnswer || "I've processed your request. How else can I help?",
        sender: 'agent',
        type: 'text',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);

      // Save AI response to Supabase
      if (user && activeChatId) {
        await supabase.from('support_messages').insert({
          chat_id: activeChatId,
          user_id: user.id,
          text: agentMessage.text,
          sender_type: 'agent',
          type: 'text'
        });
      }
    } catch (error) {
      console.error('AI Support Error:', error);
    } finally {
      setIsTyping(false);
      // We keep reasoning steps visible for a moment or until next message
    }
  };

  const handleSelectContext = (type: 'course' | 'page', item: any) => {
    const contextMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'context',
      timestamp: new Date(),
      metadata: {
        product: item.name,
        page: type === 'page' ? item.url : 'Course Viewer',
        error: 'None',
        tier: 'Pro Member',
        lastAction: type === 'course' ? `Watching: ${item.name}` : `Visited: ${item.name}`
      }
    };
    setMessages(prev => [...prev, contextMsg]);
    setIsContextModalOpen(false);
  };

  return (
    <PageWrapper>
      <SEO 
        title="Live Chat Support - Wersee"
        description="Chat with our support team for instant assistance with your account, orders, or sales."
        url="/live-chat"
        noIndex={true}
      />
      <div className={`min-h-[100dvh] flex transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-[#F5F5F7]'}`}>
        <ChatSidebar 
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          chats={chats}
          className={isFullscreen ? 'hidden' : ''}
        />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ${
            isDark ? 'bg-[#141414]' : 'bg-white'
          } ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}
        >
          <div className={`border-b transition-colors relative z-50 ${
            isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-gray-50 border-black/5'
          }`}>
            <div className="max-w-5xl mx-auto p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#1A1A1A] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg">
                      {chats.find(c => c.id === activeChatId)?.name || 'Wersee Support'}
                    </h2>
                    {isResolved ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Average response: 2 mins
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isResolved && (
                  <>
                    <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
                      <Zap className="w-3 h-3" /> Invite Specialist
                    </button>
                    <button onClick={() => setIsResolved(true)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                      Close Ticket
                    </button>
                  </>
                )}
                <div className={`w-px h-6 mx-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'} ${isFullscreen ? 'bg-blue-500/10 text-blue-500' : ''}`}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                >
                  <Maximize2 className={`w-5 h-5 transition-transform ${isFullscreen ? 'rotate-180 scale-110' : ''}`} />
                </button>
                <button onClick={() => setIsSettingsModalOpen(true)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/')} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                      msg.sender === 'user' 
                        ? (isDark ? 'bg-white/10 text-white' : 'bg-black text-white')
                        : msg.sender === 'system'
                        ? 'bg-gray-500/10 text-gray-500'
                        : (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : msg.sender === 'system' ? <Terminal className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      {msg.type === 'text' && (
                        <div className={`p-5 rounded-[1.8rem] text-base leading-relaxed ${
                          msg.sender === 'user'
                            ? (isDark ? 'bg-white text-black font-medium' : 'bg-black text-white font-medium')
                            : (isDark ? 'bg-[#1A1A1A] text-gray-200' : 'bg-gray-100 text-gray-800')
                        } ${msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none shadow-sm'}`}>
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      {/* ... other message types ... */}
                      
                      <div className={`flex items-center gap-2 text-[10px] font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'} ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 w-full">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <ThinkingAnimation steps={reasoningSteps} isDark={isDark} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ChatInput 
            onSendMessage={handleSendMessage}
            onOpenContext={() => setIsContextModalOpen(true)}
            isTyping={isTyping}
          />
        </motion.div>
      </div>

      <ContextModal 
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        onSelect={handleSelectContext}
      />
      <ChatSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </PageWrapper>
  );
};
