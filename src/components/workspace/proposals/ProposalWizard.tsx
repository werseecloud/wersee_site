import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProposalPDFPreview } from '../../public/ProposalPDFPreview';
import { getGeminiClient, requireGeminiClient } from "../../../lib/geminiClient";
import { Select } from '../../ui/Select';

import { appToast } from '@/lib/feedback';
interface ProposalWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export const ProposalWizard: React.FC<ProposalWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', company_name: '' });
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState('project'); // project, retainer, service
  const [currency, setCurrency] = useState('EUR');
  const [validUntil, setValidUntil] = useState('');
  
  const [deliverables, setDeliverables] = useState<any[]>([
    { title: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);
  
  const [milestones, setMilestones] = useState<any[]>([
    { title: '', description: '', amount: 0, due_date: '' }
  ]);

  const [terms, setTerms] = useState('');
  const availableTerms: any[] = []; // Define availableTerms to fix linting error

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's business_id (either as team member or owner)
      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) return;

      const { data, error } = await supabase
        .from('crm_contacts')
        .select('id, name, company:crm_companies(name)')
        .eq('business_id', businessIdToUse)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateClient = async () => {
    try {
      if (!newClientData.name) return;
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get business ID
      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) throw new Error('No business found');

      // 1. Create company if provided
      let companyId = null;
      if (newClientData.company_name) {
        const { data: company, error: companyError } = await supabase
          .from('crm_companies')
          .insert({
            business_id: businessIdToUse,
            name: newClientData.company_name
          })
          .select()
          .single();
        
        if (!companyError && company) {
          companyId = company.id;
        }
      }

      // 2. Create contact
      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          business_id: businessIdToUse,
          name: newClientData.name,
          email: newClientData.email,
          company_id: companyId
        })
        .select()
        .single();

      if (contactError) throw contactError;

      setClientId(contact.id);
      setIsAddingClient(false);
      setNewClientData({ name: '', email: '', company_name: '' });
      await fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      appToast('Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, { title: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const handleUpdateDeliverable = (index: number, field: string, value: any) => {
    const newDeliverables = [...deliverables];
    newDeliverables[index] = { ...newDeliverables[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_price') {
      newDeliverables[index].total_price = newDeliverables[index].quantity * newDeliverables[index].unit_price;
    }
    
    setDeliverables(newDeliverables);
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: 0, due_date: '' }]);
  };

  const handleUpdateMilestone = (index: number, field: string, value: any) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setMilestones(newMilestones);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return deliverables.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIGenerate = async () => {
    if (!title) {
      appToast("Please enter a proposal title first.");
      return;
    }
    try {
      setIsGeneratingAI(true);
      const ai = (() => { const client = getGeminiClient(); if (!client) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return client; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional executive summary for a proposal titled "${title}". The summary should be concise, persuasive, and outline the general goals and scope of such a project. Keep it under 150 words.`,
      });
      setDescription(response.text || '');
    } catch (error) {
      console.error("Error generating AI content:", error);
      appToast("Failed to generate content. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's business_id (either as team member or owner)
      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) throw new Error('No business found');

      const totalAmount = calculateTotal();

      // 1. Create Proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          business_id: businessIdToUse,
          client_id: clientId || null,
          title,
          description,
          type,
          status,
          currency,
          total_amount: totalAmount,
          terms
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // 2. Create Deliverables
      if (deliverables.length > 0 && deliverables[0].title) {
        const deliverablesData = deliverables
          .filter(d => d.title)
          .map((d, index) => ({
            proposal_id: proposal.id,
            title: d.title,
            description: d.description,
            quantity: d.quantity,
            unit_price: d.unit_price,
            total_price: d.total_price,
            sort_order: index
          }));

        const { error: devError } = await supabase
          .from('proposal_deliverables')
          .insert(deliverablesData);

        if (devError) throw devError;
      }

      // 3. Create Milestones
      if (milestones.length > 0 && milestones[0].title) {
        const milestonesData = milestones
          .filter(m => m.title)
          .map((m, index) => ({
            proposal_id: proposal.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            due_date: m.due_date || null,
            sort_order: index
          }));

        const { error: milError } = await supabase
          .from('proposal_milestones')
          .insert(milestonesData);

        if (milError) throw milError;
      }

      onComplete();
    } catch (error) {
      console.error('Error saving proposal:', error);
      appToast('Failed to save proposal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Basic Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Proposal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Website Redesign Project"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-400">Client</label>
              <button 
                onClick={() => setIsAddingClient(!isAddingClient)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {isAddingClient ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {isAddingClient ? 'Cancel' : 'New Client'}
              </button>
            </div>

            {isAddingClient ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <input 
                  type="text"
                  placeholder="Client Name"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                />
                <input 
                  type="email"
                  placeholder="Email Address"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                />
                <input 
                  type="text"
                  placeholder="Company Name (Optional)"
                  value={newClientData.company_name}
                  onChange={(e) => setNewClientData({...newClientData, company_name: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                />
                <button 
                  onClick={handleCreateClient}
                  disabled={!newClientData.name || isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isSaving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            ) : (
              <Select
                label="Client"
                value={clientId}
                onChange={(val) => setClientId(val)}
                options={[
                  { value: '', label: 'Select a client...' },
                  ...clients.map(client => ({
                    value: client.id,
                    label: `${client.name} ${client.company?.name ? `(${client.company.name})` : ''}`
                  }))
                ]}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Select
                label="Proposal Type"
                value={type}
                onChange={(val) => setType(val)}
                options={[
                  { value: 'project', label: 'Project' },
                  { value: 'retainer', label: 'Retainer' },
                  { value: 'service', label: 'Service' }
                ]}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-400">Executive Summary</label>
              <button 
                onClick={handleAIGenerate}
                disabled={isGeneratingAI}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
              >
                {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isGeneratingAI ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Briefly describe the project goals and scope..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Deliverables & Pricing</h3>
        <div className="flex items-center gap-2 w-32">
          <Select
            value={currency}
            onChange={(val) => setCurrency(val)}
            options={[
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'GBP', label: 'GBP (£)' }
            ]}
          />
        </div>
      </div>

      <div className="space-y-4">
        {deliverables.map((item, index) => (
          <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
            <button 
              onClick={() => handleRemoveDeliverable(index)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-xs font-medium text-gray-400 mb-1">Item Name</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateDeliverable(index, 'title', e.target.value)}
                  placeholder="e.g., Homepage Design"
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleUpdateDeliverable(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateDeliverable(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
                <div className="w-full px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-white text-sm font-medium">
                  {item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="col-span-12">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleUpdateDeliverable(index, 'description', e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddDeliverable}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </button>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10">
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-white">
            {currency} {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Milestones & Terms</h3>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400">Payment Milestones (Optional)</label>
        {milestones.map((item, index) => (
          <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
            <button 
              onClick={() => handleRemoveMilestone(index)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-xs font-medium text-gray-400 mb-1">Milestone Name</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateMilestone(index, 'title', e.target.value)}
                  placeholder="e.g., 50% Upfront Deposit"
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  value={item.amount}
                  onChange={(e) => handleUpdateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={item.due_date}
                  onChange={(e) => handleUpdateMilestone(index, 'due_date', e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddMilestone}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-400">Terms & Conditions</label>
          {availableTerms.length > 0 && (
            <div className="w-48">
              <Select
                value=""
                onChange={(val) => {
                  const selectedTerm = availableTerms.find(t => t.id === val);
                  if (selectedTerm) {
                    setTerms(selectedTerm.content);
                  }
                }}
                options={[
                  { value: '', label: 'Load saved terms...' },
                  ...availableTerms.map(t => ({ value: t.id, label: t.title }))
                ]}
              />
            </div>
          )}
        </div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={6}
          placeholder="Enter your standard terms and conditions..."
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-[#0A0A0A] flex flex-col overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Proposal</h2>
              <p className="text-sm text-gray-400">Step {step} of 3</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Wizard Steps */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* PDF Preview */}
          <div className="w-1/2 p-6 bg-gray-100 overflow-y-auto flex items-start justify-center">
            <ProposalPDFPreview 
              formData={{ title, description, currency, terms }}
              deliverables={deliverables}
              milestones={milestones}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20 flex items-center justify-between shrink-0">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              step === 1 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {step === 3 ? (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isSaving || !title}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('sent')}
                  disabled={isSaving || !title}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Proposal
                </button>
              </>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !title}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
