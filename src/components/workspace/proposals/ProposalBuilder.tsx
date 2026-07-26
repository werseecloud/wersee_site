import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Save,
  Send,
  Plus,
  Trash2,
  Sparkles,
  FileSignature,
  Loader2,
  ArrowLeft,
  Target,
  BarChart3,
  Lightbulb,
  Combine,
  Flag,
  Shield,
  Download,
  Copy,
  CheckCircle2,
  Eye,
  Settings,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../../lib/geminiClient";
import { Select } from '../../ui/Select';
import { ProposalPDFPreview } from '../../public/ProposalPDFPreview';
import { ThinkingAnimation, ReasoningStep } from '../../ThinkingAnimation';

import { appToast } from '@/lib/feedback';
const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  { id: 'understand', label: 'Understand', content: '', status: 'pending', icon: Target },
  { id: 'analyze', label: 'Analyze', content: '', status: 'pending', icon: BarChart3 },
  { id: 'reason', label: 'Reason', content: '', status: 'pending', icon: Lightbulb },
  { id: 'synthesize', label: 'Synthesize', content: '', status: 'pending', icon: Combine },
  { id: 'conclude', label: 'Conclude', content: '', status: 'pending', icon: Flag },
];

interface ProposalBuilderProps {
  proposalId: string | null;
  onClose: () => void;
}

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ proposalId, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', company_name: '' });
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    type: 'project',
    currency: 'EUR',
    validUntil: '',
    terms: '',
    status: 'draft' as 'draft' | 'sent'
  });
  
  const [deliverables, setDeliverables] = useState<any[]>([
    { title: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);
  
  const [milestones, setMilestones] = useState<any[]>([
    { title: '', description: '', amount: 0, due_date: '' }
  ]);

  const getUserBusiness = async () => {
    const { data, error } = await supabase.rpc('ensure_finance_business');
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.business_id) throw new Error('We could not prepare your business profile.');
    return result as { business_id: string; username: string };
  };

  useEffect(() => {
    fetchClients();
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, proposal_deliverables(*), proposal_milestones(*)')
        .eq('id', proposalId)
        .single();
        
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          clientId: data.client_id || '',
          type: data.type || 'project',
          currency: data.currency || 'EUR',
          validUntil: data.valid_until || '',
          terms: data.terms || data.terms_conditions || '',
          status: data.status || 'draft'
        });
        
        if (data.proposal_deliverables?.length > 0) {
          setDeliverables(data.proposal_deliverables
            .map((item: any) => ({
              ...item,
              quantity: item.quantity || 1,
              unit_price: Number(item.unit_price ?? item.price ?? 0),
              total_price: Number(item.total_price ?? item.price ?? 0)
            }))
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
        }
        
        if (data.proposal_milestones?.length > 0) {
          setMilestones(data.proposal_milestones.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
        }
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { business_id: businessId } = await getUserBusiness();
      if (!businessId) return;

      const { data, error } = await supabase
        .from('crm_contacts')
        .select('id, name, company:crm_companies(name)')
        .eq('business_id', businessId)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleUpdateDeliverable = (index: number, field: string, value: any) => {
    const newDeliverables = [...deliverables];
    newDeliverables[index] = { ...newDeliverables[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newDeliverables[index].total_price = newDeliverables[index].quantity * newDeliverables[index].unit_price;
    }
    setDeliverables(newDeliverables);
  };

  const calculateTotal = () => {
    return deliverables.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const handleAIGenerate = async () => {
    if (!formData.title) {
      appToast("Please enter a proposal title first.");
      return;
    }
    try {
      setIsGeneratingAI(true);
      setReasoningSteps(INITIAL_REASONING_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));
      
      const updateStep = (id: string, status: 'active' | 'completed', content: string) => {
        setReasoningSteps(prev => prev.map(s => 
          s.id === id ? { ...s, status, content } : s
        ));
      };

      // Step 1: Understand
      updateStep('understand', 'active', 'Analyzing project title: ' + formData.title);
      await new Promise(r => setTimeout(r, 800));
      updateStep('understand', 'completed', 'Project context established.');

      // Step 2: Analyze
      updateStep('analyze', 'active', 'Identifying industry standards for ' + formData.type + ' proposals...');
      await new Promise(r => setTimeout(r, 1000));
      updateStep('analyze', 'completed', 'Standard value propositions identified.');

      // Step 3: Reason
      updateStep('reason', 'active', 'Drafting persuasive executive summary...');
      
      const ai = (() => { const client = getGeminiClient(); if (!client) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return client; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional executive summary for a proposal titled "${formData.title}". 
        The summary should be concise, persuasive, and outline the general goals and scope of such a project. 
        Keep it under 150 words.`,
      });
      
      updateStep('reason', 'completed', 'Summary drafted successfully.');

      // Step 4: Synthesize
      updateStep('synthesize', 'active', 'Refining tone and clarity...');
      await new Promise(r => setTimeout(r, 600));
      updateStep('synthesize', 'completed', 'Tone refinement complete.');

      // Step 5: Conclude
      updateStep('conclude', 'active', 'Finalizing...');
      await new Promise(r => setTimeout(r, 400));
      
      setFormData(prev => ({ ...prev, description: response.text || '' }));
      updateStep('conclude', 'completed', 'Summary added to proposal.');
    } catch (error) {
      console.error("Error generating AI content:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { business_id: businessId, username } = await getUserBusiness();

      const totalAmount = calculateTotal();
      const payload = {
        business_id: businessId,
        title: formData.title,
        description: formData.description,
        client_id: formData.clientId || null,
        type: formData.type,
        status: status,
        currency: formData.currency,
        total_amount: totalAmount,
        valid_until: formData.validUntil || null,
        terms: formData.terms,
        terms_conditions: formData.terms
      };

      let currentProposalId = proposalId;

      if (proposalId) {
        const { error } = await supabase
          .from('proposals')
          .update(payload)
          .eq('id', proposalId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('proposals')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        currentProposalId = data.id;
      }

      // Save Deliverables
      if (currentProposalId) {
        // Delete existing and re-insert for simplicity in builder
        const { error: deleteDeliverablesError } = await supabase.from('proposal_deliverables').delete().eq('proposal_id', currentProposalId);
        if (deleteDeliverablesError) throw deleteDeliverablesError;
        
        const deliverablesData = deliverables
          .filter(d => d.title)
          .map((d, index) => ({
            proposal_id: currentProposalId,
            title: d.title,
            description: d.description,
            quantity: d.quantity,
            unit_price: d.unit_price,
            price: d.unit_price,
            total_price: d.total_price,
            sort_order: index
          }));

        if (deliverablesData.length > 0) {
          const { error: deliverablesError } = await supabase.from('proposal_deliverables').insert(deliverablesData);
          if (deliverablesError) throw deliverablesError;
        }

        // Save Milestones
        const { error: deleteMilestonesError } = await supabase.from('proposal_milestones').delete().eq('proposal_id', currentProposalId);
        if (deleteMilestonesError) throw deleteMilestonesError;
        const milestonesData = milestones
          .filter(m => m.title)
          .map((m, index) => ({
            proposal_id: currentProposalId,
            title: m.title,
            description: m.description,
            amount: m.amount,
            due_date: m.due_date || null,
            sort_order: index
          }));

        if (milestonesData.length > 0) {
          const { error: milestonesError } = await supabase.from('proposal_milestones').insert(milestonesData);
          if (milestonesError) throw milestonesError;
        }
      }

      if (status === 'sent') {
        const cleanUsername = (username || user.user_metadata?.username || user.email?.split('@')[0] || '').replace(/^@/, '');
        const url = cleanUsername
          ? `${window.location.origin}/${encodeURIComponent(`@${cleanUsername}`)}/proposal/${currentProposalId}`
          : `${window.location.origin}/proposal/${currentProposalId}`;
        await navigator.clipboard.writeText(url);
        appToast('Proposal link copied — tip: send it directly in your client chat.');
        onClose();
      } else {
        appToast('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      appToast(error instanceof Error ? error.message : 'Failed to save proposal.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0A] flex flex-col overflow-hidden font-sans text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#141414] border-b border-white/5 shrink-0 shadow-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step >= s ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-8 rounded-full transition-all ${step > s ? 'bg-emerald-500' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>
          <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            {step === 1 ? 'Setup' : step === 2 ? 'Pricing' : 'Review'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => handleSave('sent')}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Proposal
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Left Panel: Editor */}
        <div className="w-full lg:w-1/2 overflow-y-auto p-8 lg:p-12 z-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Proposal Setup</h2>
                  <p className="text-gray-500 text-sm">Define the core details of your project proposal.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Proposal Title</label>
                    <input 
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="e.g., Website Redesign for Acme Corp"
                    />
                  </div>

                  <div className="space-y-2">
                    <Select
                      label="Client"
                      value={formData.clientId}
                      onChange={(val) => setFormData({ ...formData, clientId: val })}
                      options={[
                        { value: '', label: 'Select a client...' },
                        ...clients.map(c => ({ value: c.id, label: c.name }))
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Type"
                      value={formData.type}
                      onChange={(val) => setFormData({ ...formData, type: val })}
                      options={[
                        { value: 'project', label: 'Project' },
                        { value: 'retainer', label: 'Retainer' },
                        { value: 'service', label: 'Service' }
                      ]}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Valid Until</label>
                      <input 
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Executive Summary</label>
                      <button 
                        onClick={handleAIGenerate}
                        disabled={isGeneratingAI}
                        className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI ASSIST
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {isGeneratingAI && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <ThinkingAnimation steps={reasoningSteps} isDark={true} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      placeholder="Describe the project goals and scope..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Pricing & Deliverables</h2>
                    <p className="text-gray-500 text-sm">Break down the project costs and milestones.</p>
                  </div>
                  <div className="w-32">
                    <Select
                      value={formData.currency}
                      onChange={(val) => setFormData({ ...formData, currency: val })}
                      options={[
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'GBP', label: 'GBP (£)' }
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {deliverables.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative group">
                      <button 
                        onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))}
                        className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Item Name</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateDeliverable(idx, 'title', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="e.g., UI Design"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateDeliverable(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Price</label>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateDeliverable(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total</label>
                          <div className="w-full px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-sm font-bold">
                            {item.total_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setDeliverables([...deliverables, { title: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }])}
                    className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-gray-500 hover:text-white hover:border-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Line Item
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Payment Milestones</h3>
                  <div className="space-y-4">
                    {milestones.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => {
                              const newM = [...milestones];
                              newM[idx].title = e.target.value;
                              setMilestones(newM);
                            }}
                            placeholder="Milestone name"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={m.amount}
                            onChange={(e) => {
                              const newM = [...milestones];
                              newM[idx].amount = parseFloat(e.target.value) || 0;
                              setMilestones(newM);
                            }}
                            placeholder="Amount"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="date"
                            value={m.due_date}
                            onChange={(e) => {
                              const newM = [...milestones];
                              newM[idx].due_date = e.target.value;
                              setMilestones(newM);
                            }}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setMilestones([...milestones, { title: '', description: '', amount: 0, due_date: '' }])}
                      className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add Milestone
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Final Review</h2>
                  <p className="text-gray-500 text-sm">Review your proposal and add terms before sending.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Terms & Conditions</label>
                    <textarea 
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-mono text-xs"
                      placeholder="Standard terms and conditions..."
                    />
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">Total Proposal Value</span>
                      <span className="text-2xl font-black text-white">{formData.currency} {calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Shield className="w-4 h-4" />
                      <span>This document is legally binding once signed.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Preview */}
        <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] border-l border-white/5 flex-col items-center overflow-y-auto p-12 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />
          
          <div className="flex gap-3 mb-8 z-10">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
              {(['mobile', 'desktop'] as const).map(d => (
                <button 
                  key={d}
                  onClick={() => setPreviewDevice(d)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${previewDevice === d ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={`w-full transition-all duration-500 flex justify-center z-10 ${previewDevice === 'desktop' ? 'max-w-3xl' : 'max-w-md'}`}>
            <ProposalPDFPreview 
              formData={formData}
              deliverables={deliverables}
              milestones={milestones}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
