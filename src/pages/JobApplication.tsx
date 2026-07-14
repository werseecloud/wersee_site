import React, { useState, useEffect, useRef } from 'react';
// Test comment
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { Briefcase, Send, Bot, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { invokeApiRunner, supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, requireGeminiClient } from "../lib/geminiClient";
import { LocalizationService } from '../services/localizationService';
import { checkMessageForForbiddenLinks } from '../services/chatAiService';

let aiClient = getGeminiClient();

const getAiClient = () => {
  return aiClient;
};

export const JobApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      startApplication();
    } else if (!user) {
      navigate('/auth');
    }
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startApplication = async () => {
    try {
      // Fetch job details
      const { data: jobData } = await invokeApiRunner('business/get-listing', { id });
      setJob(jobData);

      // Start or resume application
      const response = await invokeApiRunner('jobs/apply/start', { jobId: id });
      if (response.success && response.data) {
        setApplication(response.data);
        fetchMessages(response.data.id);
      }
    } catch (error) {
      console.error('Error starting application:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (appId: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('job_application_messages')
        .select('*')
        .eq('application_id', appId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !application || sending) return;

    const userMsg = input.trim();
    setInput('');
    setSending(true);

    try {
      // 0. Check for forbidden links
      const linkCheck = await checkMessageForForbiddenLinks(userMsg);
      const finalUserMsg = linkCheck.cleanedContent;

      // 1. Save user message to database
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('job_application_messages')
        .insert({
          application_id: application.id,
          message: finalUserMsg,
          role: 'user'
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Update local state optimistically
      setMessages(prev => [...prev, savedUserMsg]);

      // 2. Fetch context for AI
      const { data: appWithContext } = await supabase
        .from('job_applications')
        .select('*, listings(title, description), job_application_flows(config, job_questions(*))')
        .eq('id', application.id)
        .single();

      const { data: allMessages } = await supabase
        .from('job_application_messages')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true });

      const jobTitle = appWithContext?.listings?.title || "a job";
      const jobDescription = appWithContext?.listings?.description || "";
      const questions = appWithContext?.job_application_flows?.job_questions || [];
      const chatHistory = allMessages?.map(m => `${m.role === 'ai' ? 'AI' : 'Candidate'}: ${m.message}`).join('\n') || "";
      
      // Detect locale from URL or navigator
      const urlParams = new URLSearchParams(window.location.search);
      const locale = urlParams.get('hl') || urlParams.get('locale') || navigator.language || 'en-US';

      // 3. Call Localization Service
      const aiMessage = await LocalizationService.getLocalizedResponse({
        locale,
        message: finalUserMsg,
        job_context: `Recruiter for "${jobTitle}". URL: ${window.location.href}. Description: "${jobDescription}". Questions to cover: ${questions.map((q: any) => q.question).join(', ')}`,
        chat_history: chatHistory
      });

      // 4. Save AI message to database
      const { data: savedAiMsg, error: aiMsgError } = await supabase
        .from('job_application_messages')
        .insert({
          application_id: application.id,
          message: aiMessage,
          role: 'ai'
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      // Update local state
      setMessages(prev => [...prev, savedAiMsg]);

      // 5. If complete, generate summary
      if (aiMessage.toLowerCase().includes("application is complete")) {
        setApplication(prev => ({ ...prev, status: 'completed' }));
        const ai = getAiClient();
        if (!ai) {
          await supabase.from('job_applications').update({
            status: 'completed'
          }).eq('id', application.id);
          return;
        }
        
        const summaryPrompt = `
          Analyze the following interview chat history for the position of "${jobTitle}".
          
          Chat History:
          ${chatHistory}
          AI: ${aiMessage}
          
          Provide a structured summary and scoring for the employer.
          Return ONLY a JSON object with the following structure:
          {
            "summary": "A short, clean summary of the candidate's experience, skills, and communication style.",
            "scores": {
              "skill": number (0-100),
              "fit": number (0-100),
              "effort": "High" | "Medium" | "Low"
            },
            "redFlags": ["list of any red flags, or empty array"]
          }
        `;

        const summaryResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: summaryPrompt,
          config: { responseMimeType: "application/json" }
        });

        let summaryText = summaryResponse.text || "{}";
        try {
          const result = JSON.parse(summaryText);
          await supabase.from('job_applications').update({
            ai_summary: result.summary,
            scores: result.scores,
            status: 'completed'
          }).eq('id', application.id);
        } catch (e) {
          console.error("Failed to parse summary JSON:", e);
        }
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-20 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Job not found</h1>
        <Link to="/jobs" className="text-indigo-400 hover:text-indigo-300">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <SEO 
        title={`Apply for ${job.title} | Wersee`}
        description={`Apply for the ${job.title} position at ${job.profiles?.full_name || 'Wersee'}`}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/jobs/${job.id}`} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white">{job.title}</h1>
            <p className="text-xs text-gray-500 font-medium">Application Interview</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
          <Briefcase className="w-5 h-5 text-indigo-400" />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white rounded-tr-sm' 
                  : 'bg-[#111] border border-white/10 text-gray-200 rounded-tl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
            </motion.div>
          ))}
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 text-gray-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#111] border border-white/10 rounded-2xl p-4 rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-[#0A0A0A] border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          {application?.status === 'completed' ? (
            <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold">
              Application Complete! The employer will review your profile.
            </div>
          ) : (
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                disabled={sending}
                className="w-full bg-[#111] border border-white/10 rounded-2xl pl-6 pr-16 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
};
