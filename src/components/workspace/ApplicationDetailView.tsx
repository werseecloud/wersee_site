import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Briefcase, FileText, CheckCircle2, AlertCircle, MessageSquare, Bot } from 'lucide-react';
import { motion } from 'motion/react';

export const ApplicationDetailView = ({ applicationId, user, onBack }: { applicationId: string, user: any, onBack: () => void }) => {
  const [application, setApplication] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const { data: appData } = await supabase
        .from('job_applications')
        .select('*, listings(title, description), profiles!job_applications_user_id_fkey(full_name, avatar_url)')
        .eq('id', applicationId)
        .single();
      
      setApplication(appData);

      const { data: msgData } = await supabase
        .from('job_application_messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      
      setMessages(msgData || []);
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading application...</div>;
  }

  if (!application) {
    return <div className="p-8 text-center text-white">Application not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Application Review</h1>
          <p className="text-gray-400 text-sm">Reviewing candidate for {application.listings?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Candidate Info & AI Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-2xl border border-indigo-500/20">
                {application.profiles?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{application.profiles?.full_name || 'Anonymous'}</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  application.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {application.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </span>
              </div>
              
              {application.scores && Object.keys(application.scores).length > 0 && (
                <>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-400">Skill Score</span>
                    <span className="text-sm font-bold text-white">{application.scores.skill || 0}/100</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-400">Fit Score</span>
                    <span className="text-sm font-bold text-white">{application.scores.fit || 0}/100</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-400">Effort Level</span>
                    <span className="text-sm font-bold text-white">{application.scores.effort || 'Unknown'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {application.ai_summary && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-indigo-400">AI Summary</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {application.ai_summary}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Chat Transcript */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-black text-white">Interview Transcript</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-white rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-10">No messages yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Sparkles icon since it wasn't imported
const Sparkles = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
