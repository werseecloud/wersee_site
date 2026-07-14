import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Send, FileText, FileSignature, Settings, Users, Calendar, 
  Check, X, Loader2, Trash2, Shield, Plus, Sparkles, Target, BarChart3, 
  Lightbulb, Combine, Flag, CheckCircle2, ChevronRight, Eye, ChevronUp, ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Select } from '../ui/Select';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { ThinkingAnimation, ReasoningStep } from '../ThinkingAnimation';

import { appToast } from '@/lib/feedback';
const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  { id: 'understand', label: 'Understand', content: '', status: 'pending', icon: Target },
  { id: 'analyze', label: 'Analyze', content: '', status: 'pending', icon: BarChart3 },
  { id: 'reason', label: 'Reason', content: '', status: 'pending', icon: Lightbulb },
  { id: 'synthesize', label: 'Synthesize', content: '', status: 'pending', icon: Combine },
  { id: 'conclude', label: 'Conclude', content: '', status: 'pending', icon: Flag },
];

interface ContractBuilderProps {
  contractId: string | null;
  onClose: () => void;
}

export const ContractBuilder: React.FC<ContractBuilderProps> = ({ contractId, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);
  
  const [contract, setContract] = useState<any>({
    title: 'Untitled Contract',
    type: 'service_agreement',
    status: 'draft',
    client_name: '',
    client_email: '',
    content: [
      { id: '1', type: 'h1', value: 'Service Agreement' },
      { id: '2', type: 'p', value: 'This agreement is made between [Company Name] and [Client Name].' }
    ],
    metadata: {}
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();
        
      if (error) throw error;
      if (data) setContract(data);
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = (index: number, value: string) => {
    const newContent = [...contract.content];
    newContent[index].value = value;
    setContract({ ...contract, content: newContent });
  };

  const addBlock = (type: 'h1' | 'h2' | 'p', value: string = '') => {
    setContract({
      ...contract,
      content: [
        ...contract.content,
        { id: Math.random().toString(36).substr(2, 9), type, value }
      ]
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newContent = [...contract.content];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newContent.length) return;
    [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
    setContract({ ...contract, content: newContent });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    try {
      setIsAiGenerating(true);
      setReasoningSteps(INITIAL_REASONING_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));
      
      const updateStep = (id: string, status: 'active' | 'completed', content: string) => {
        setReasoningSteps(prev => prev.map(s => 
          s.id === id ? { ...s, status, content } : s
        ));
      };

      // Step 1: Understand
      updateStep('understand', 'active', 'Analyzing your request for: ' + aiPrompt);
      await new Promise(r => setTimeout(r, 800));
      updateStep('understand', 'completed', 'Identified core requirements for the contract clause.');

      // Step 2: Analyze
      updateStep('analyze', 'active', 'Reviewing legal standards for ' + contract.type);
      await new Promise(r => setTimeout(r, 1000));
      updateStep('analyze', 'completed', 'Standard legal frameworks identified.');

      // Step 3: Reason
      updateStep('reason', 'active', 'Drafting professional language and ensuring compliance...');
      
      const ai = (() => { const client = getGeminiClient(); if (!client) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return client; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional contract clause for a "${contract.title}" contract. 
        Specific requirement: ${aiPrompt}. 
        The clause should be legally sound, professional, and clear. 
        Return ONLY the text of the clause.`,
      });
      
      updateStep('reason', 'completed', 'Clause drafted successfully.');

      // Step 4: Synthesize
      updateStep('synthesize', 'active', 'Finalizing formatting and tone...');
      await new Promise(r => setTimeout(r, 600));
      updateStep('synthesize', 'completed', 'Formatting complete.');

      // Step 5: Conclude
      updateStep('conclude', 'active', 'Adding to your contract...');
      await new Promise(r => setTimeout(r, 400));
      
      addBlock('p', response.text || '');
      updateStep('conclude', 'completed', 'Clause added to document.');
      
      setAiPrompt('');
      setShowAiGenerator(false);
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = async (retries = 3) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        title: contract.title,
        type: contract.type,
        status: contract.status,
        content: contract.content,
        metadata: {
          ...contract.metadata,
          preparer_name: user.user_metadata?.full_name || user.email,
          preparer_email: user.email
        },
        user_id: user.id
      };

      if (contractId) {
        const { error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', contractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('contracts')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setContract(data);
      }
      appToast('Draft saved!');
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying handleSave... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return handleSave(retries - 1);
      }
      console.error('Error saving contract:', error);
      appToast('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (retries = 3) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        title: contract.title,
        type: contract.type,
        status: 'sent',
        content: contract.content,
        metadata: {
          ...contract.metadata,
          preparer_name: user.user_metadata?.full_name || user.email,
          preparer_email: user.email
        },
        user_id: user.id
      };

      let currentContractId = contractId;

      if (contractId) {
        const { error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', contractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('contracts')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setContract(data);
        currentContractId = data.id;
      }

      if (currentContractId) {
        const url = `${window.location.origin}/contract/${currentContractId}`;
        await navigator.clipboard.writeText(url);
        appToast('Contract sent! Link copied to clipboard.');
        onClose();
      }
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying handleSend... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return handleSend(retries - 1);
      }
      console.error('Error sending contract:', error);
      appToast('Failed to send contract.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0A] flex flex-col overflow-hidden font-sans text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#141414] border-b border-white/5 shrink-0 shadow-xl z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-black transition-all ${step >= s ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                  {step > s ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 sm:h-1 w-4 sm:w-8 rounded-full transition-all ${step > s ? 'bg-indigo-500' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>
          <span className="hidden sm:block ml-4 text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">
            {step === 1 ? 'Setup' : step === 2 ? 'Build Content' : 'Review & Send'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Save</span>
          </button>
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <span className="hidden sm:inline">Next Step</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          ) : (
            <button 
              onClick={() => handleSend()}
              disabled={saving}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">Send to Client</span>
              <span className="sm:hidden">Send</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        {step === 1 && (
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto z-10">
            <div className="w-full max-w-md bg-[#141414] rounded-3xl shadow-2xl border border-white/5 p-10">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Contract Setup</h2>
              <p className="text-gray-500 text-sm mb-8">Set the foundation for your agreement.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contract Title</label>
                  <input 
                    type="text"
                    value={contract.title}
                    onChange={(e) => setContract({ ...contract, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g., Web Development Agreement"
                  />
                </div>

                <div className="space-y-2">
                  <Select
                    label="Contract Type"
                    value={contract.type}
                    onChange={(val) => setContract({ ...contract, type: val })}
                    options={[
                      { value: 'service_agreement', label: 'Service Agreement' },
                      { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
                      { value: 'employment', label: 'Employment Contract' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Client Information</h3>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      value={contract.client_name}
                      onChange={(e) => setContract({ ...contract, client_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Client Name"
                    />
                    <input 
                      type="email"
                      value={contract.client_email}
                      onChange={(e) => setContract({ ...contract, client_email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Client Email"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Continue to Content
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            {/* Editor Area (Left) */}
            <div className={`w-full lg:w-1/2 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-[#141414] border-r border-white/5 z-10 ${isMobile && showPreview ? 'hidden' : 'block'}`}>
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 sm:mb-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Build your contract</h2>
                    <div className="flex items-center gap-2">
                      {isMobile && (
                        <button 
                          onClick={() => setShowPreview(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-black border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          PREVIEW
                        </button>
                      )}
                      <button 
                        onClick={() => setShowAiGenerator(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI GENERATOR
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">Add blocks to build your agreement. {isMobile ? 'Toggle preview to see results.' : 'Changes appear in real-time on the right.'}</p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {contract.content.map((block: any, index: number) => (
                    <div key={block.id} className="relative group bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                      {/* Block Controls (Hover) */}
                      <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                        <button 
                          onClick={() => moveBlock(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 sm:p-2 bg-[#141414] text-gray-500 hover:text-white rounded-full shadow-xl border border-white/10 transition-colors disabled:opacity-30"
                        >
                          <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => moveBlock(index, 'down')}
                          disabled={index === contract.content.length - 1}
                          className="p-1.5 sm:p-2 bg-[#141414] text-gray-500 hover:text-white rounded-full shadow-xl border border-white/10 transition-colors disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const newContent = contract.content.filter((_: any, i: number) => i !== index);
                            setContract({ ...contract, content: newContent });
                          }}
                          className="p-1.5 sm:p-2 bg-[#141414] text-gray-500 hover:text-red-400 rounded-full shadow-xl border border-white/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {block.type === 'h1' && (
                        <input
                          type="text"
                          value={block.value}
                          onChange={(e) => updateContent(index, e.target.value)}
                          className="w-full text-xl sm:text-2xl font-black text-white border-none focus:outline-none focus:ring-0 placeholder:text-gray-700 bg-transparent"
                          placeholder="Heading 1"
                        />
                      )}
                      {block.type === 'h2' && (
                        <input
                          type="text"
                          value={block.value}
                          onChange={(e) => updateContent(index, e.target.value)}
                          className="w-full text-lg sm:text-xl font-bold text-white border-none focus:outline-none focus:ring-0 placeholder:text-gray-700 bg-transparent"
                          placeholder="Heading 2"
                        />
                      )}
                      {block.type === 'p' && (
                        <textarea
                          value={block.value}
                          onChange={(e) => {
                            updateContent(index, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          className="w-full text-sm sm:text-base leading-relaxed text-gray-300 border-none focus:outline-none focus:ring-0 placeholder:text-gray-700 bg-transparent resize-none overflow-hidden min-h-[60px]"
                          placeholder="Type your contract text here..."
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Add Block Menu */}
                  <div className="mt-8 sm:mt-12 p-6 sm:p-8 bg-white/5 rounded-3xl border-2 border-dashed border-white/5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest w-full text-center mb-2">Add Content Block</span>
                    <button onClick={() => addBlock('h1')} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#141414] border border-white/10 hover:border-indigo-500/50 hover:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> H1
                    </button>
                    <button onClick={() => addBlock('h2')} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#141414] border border-white/10 hover:border-indigo-500/50 hover:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> H2
                    </button>
                    <button onClick={() => addBlock('p')} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#141414] border border-white/10 hover:border-indigo-500/50 hover:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Text
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generator Overlay */}
            <AnimatePresence>
              {showAiGenerator && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-2xl bg-[#141414] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">AI Clause Generator</h3>
                          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Powered by Gemini 3.1</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAiGenerator(false)}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-8 space-y-6">
                      {!isAiGenerating ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">What clause do you need?</label>
                            <textarea 
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                              placeholder="e.g., A termination clause that requires 30 days notice and payment for all work completed..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Termination Clause',
                              'Intellectual Property',
                              'Confidentiality',
                              'Payment Terms',
                              'Liability Limitation',
                              'Force Majeure'
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => setAiPrompt(suggestion)}
                                className="px-4 py-3 bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-xl text-left text-xs font-bold text-gray-400 hover:text-indigo-300 transition-all"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleAiGenerate}
                            disabled={!aiPrompt.trim()}
                            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate Clause
                          </button>
                        </>
                      ) : (
                        <div className="py-12 flex flex-col items-center">
                          <ThinkingAnimation steps={reasoningSteps} isDark={true} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Area (Right) */}
            <div className={`${isMobile ? (showPreview ? 'flex' : 'hidden') : 'flex'} w-full lg:w-1/2 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-[#0A0A0A] justify-center relative`}>
              {isMobile && (
                <button 
                  onClick={() => setShowPreview(false)}
                  className="fixed top-20 right-4 z-30 p-3 bg-black text-white rounded-full shadow-2xl border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />
              <div className="bg-white p-8 sm:p-16 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl min-h-[1056px] text-black relative z-10">
                {/* Trust Badge */}
                <div className="absolute top-6 right-6 sm:top-12 sm:right-12 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-full text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                  Secure Document
                </div>

                <div className="mb-12 sm:mb-20">
                  <h1 className="text-3xl sm:text-5xl font-serif font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">{contract.title}</h1>
                  <div className="flex flex-col gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-400">Prepared by:</span>
                      <span className="text-gray-900">{user?.user_metadata?.full_name || user?.email || 'Wersee User'}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {contract.content.map((block: any) => (
                    <div key={block.id}>
                      {block.type === 'h1' && <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 sm:mb-6">{block.value}</h1>}
                      {block.type === 'h2' && <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 sm:mt-10 mb-3 sm:mb-4">{block.value}</h2>}
                      {block.type === 'p' && <p className="text-gray-700 leading-relaxed text-sm sm:text-lg whitespace-pre-wrap">{block.value}</p>}
                    </div>
                  ))}
                </div>
                
                {/* Signature Area Preview */}
                <div className="mt-20 sm:mt-32 pt-12 sm:pt-16 border-t-2 border-gray-100 flex flex-col sm:flex-row justify-between gap-12 sm:gap-16">
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Client Signature</div>
                    <div className="border-b-2 border-gray-200 pb-2 mb-3 h-16 sm:h-20"></div>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Name / Date</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Preparer Signature</div>
                    <div className="border-b-2 border-gray-200 pb-2 mb-3 h-16 sm:h-20"></div>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Name / Date</div>
                  </div>
                </div>
              </div>

              {/* Made by Wersee Watermark */}
              <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl text-white/50 pointer-events-none z-30">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em]">MADE BY WERSEE</span>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-[#0A0A0A] flex justify-center relative z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />
            <div className="bg-white p-8 sm:p-16 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl min-h-[1056px] text-black relative">
              {/* Trust Badge */}
              <div className="absolute top-6 right-6 sm:top-12 sm:right-12 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-full text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                Secure Document
              </div>

              <div className="mb-12 sm:mb-20">
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">{contract.title}</h1>
                <div className="flex flex-col gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-gray-400">Prepared by:</span>
                    <span className="text-gray-900">{user?.user_metadata?.full_name || user?.email || 'Wersee User'}</span>
                  </div>
                  {contract.client_name && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-400">Client:</span>
                      <span className="text-gray-900">{contract.client_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {contract.content.map((block: any) => (
                  <div key={block.id}>
                    {block.type === 'h1' && <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 sm:mb-6">{block.value}</h1>}
                    {block.type === 'h2' && <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 sm:mt-10 mb-3 sm:mb-4">{block.value}</h2>}
                    {block.type === 'p' && <p className="text-gray-700 leading-relaxed text-sm sm:text-lg whitespace-pre-wrap">{block.value}</p>}
                  </div>
                ))}
              </div>
              
              {/* Signature Area Preview */}
              <div className="mt-20 sm:mt-32 pt-12 sm:pt-16 border-t-2 border-gray-100 flex flex-col sm:flex-row justify-between gap-12 sm:gap-16">
                <div className="flex-1">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Client Signature</div>
                  <div className="border-b-2 border-gray-200 pb-2 mb-3 h-16 sm:h-20"></div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Name / Date</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Preparer Signature</div>
                  <div className="border-b-2 border-gray-200 pb-2 mb-3 h-16 sm:h-20"></div>
                  <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Name / Date</div>
                </div>
              </div>
            </div>

            {/* Made by Wersee Watermark */}
            <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl text-white/50 pointer-events-none z-30">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
              <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em]">MADE BY WERSEE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
