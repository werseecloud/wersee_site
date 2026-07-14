import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Loader2, Bot, User, 
  X, Maximize2, Minimize2, Trash2,
  CheckCircle, FileText, Folder, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  teamId: string;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ teamId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Fetch context (tasks, projects, wiki)
      const [tasks, projects, wiki] = await Promise.all([
        supabase.from('team_tasks').select('title, status, priority').eq('team_id', teamId).limit(10),
        supabase.from('projects').select('name, description').eq('team_id', teamId).limit(5),
        supabase.from('wiki_articles').select('title').eq('team_id', teamId).limit(5)
      ]);

      const context = `
        Current Team Context:
        Tasks: ${JSON.stringify(tasks.data)}
        Projects: ${JSON.stringify(projects.data)}
        Wiki Articles: ${JSON.stringify(wiki.data)}
      `;

      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are a Team Assistant. Use the following context to answer the user's request.
          Context: ${context}
          User Request: ${input}
          
          If the user asks to create a task, suggest a structure.
          If they ask for a summary, provide one.
          Be concise and professional.
        `,
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Log to database
      await supabase.from('ai_assistant_logs').insert({
        team_id: teamId,
        user_id: user?.id,
        prompt: input,
        response: response.text,
        type: 'chat'
      });

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-6 right-6 bg-[#141414] border border-white/10 rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden transition-all duration-300 ${
        isExpanded ? 'w-[600px] h-[700px]' : 'w-[400px] h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Team Assistant</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">AI Powered</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h4 className="text-white font-bold mb-2">How can I help your team?</h4>
            <p className="text-sm text-gray-500">
              I can summarize tasks, suggest project plans, or help you find information in the wiki.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div 
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-indigo-500/10 text-indigo-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-white/5 text-gray-500 text-sm">
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="relative">
          <input 
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
