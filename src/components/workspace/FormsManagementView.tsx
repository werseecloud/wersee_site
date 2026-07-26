import React, { useState, useEffect } from 'react';
import { Plus, FileText, MoreVertical, Trash2, ExternalLink, Copy, Search, Loader2, ChevronRight, Layout, Settings, Save, X, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

import { appToast } from '@/lib/feedback';
interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  title?: string;
  description: string;
  slug: string;
  steps: FormStep[];
  status: 'draft' | 'active';
  created_at: string;
}

export const FormsManagementView = () => {
  const { user } = useAuth();
  const [forms, setFunnels] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.get<Form>('forms', {
        eq: { user_id: user?.id },
        order: { column: 'created_at', ascending: false }
      });

      const rows = Array.isArray(data) ? data : [];
      const uniqueForms = Array.from(new Map(rows.map((form: any) => [
        form.id,
        { ...form, name: form.name || form.title },
      ])).values()) as Form[];
      setFunnels(uniqueForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const slug = String(formData.get('slug') || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    if (!name || !slug) return;

    try {
      const newForm = await DatabaseService.insert<Form>('forms', { 
        title: name,
        name,
        slug, 
        user_id: user?.id,
        steps: [{ id: crypto.randomUUID(), title: 'Step 1', fields: [] }],
        status: 'draft'
      });

      if (!newForm?.id) throw new Error('Form was created without a usable response.');
      setFunnels([newForm, ...forms]);
      setIsCreating(false);
      setSelectedForm(newForm);
      appToast('Form created.', 'success');
    } catch (error) {
      console.error('Error creating form:', error);
      const code = (error as any)?.code;
      appToast(code === '23505' ? 'This form slug is already in use.' : 'The form could not be created. Please try again.', 'error');
    }
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;
    setSaving(true);
    try {
      await DatabaseService.update('forms', selectedForm.id, {
        title: selectedForm.name,
        name: selectedForm.name,
        description: selectedForm.description,
        steps: selectedForm.steps,
        status: selectedForm.status
      });

      setFunnels(forms.map(f => f.id === selectedForm.id ? selectedForm : f));
      appToast('Form saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving form:', error);
      appToast('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    if (!selectedForm) return;
    const newStep: FormStep = {
      id: crypto.randomUUID(),
      title: `Step ${selectedForm.steps.length + 1}`,
      fields: []
    };
    setSelectedForm({
      ...selectedForm,
      steps: [...selectedForm.steps, newStep]
    });
    setActiveStepIdx(selectedForm.steps.length);
  };

  const addField = (type: FormField['type']) => {
    if (!selectedForm) return;
    const newField: FormField = {
      id: crypto.randomUUID(),
      label: 'New Field',
      type,
      required: false,
      placeholder: ''
    };
    const updatedSteps = [...selectedForm.steps];
    updatedSteps[activeStepIdx].fields.push(newField);
    setSelectedForm({ ...selectedForm, steps: updatedSteps });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return;
    const updatedSteps = selectedForm.steps.map(step => ({
      ...step,
      fields: step.fields.map(field => field.id === fieldId ? { ...field, ...updates } : field)
    }));
    setSelectedForm({ ...selectedForm, steps: updatedSteps });
  };

  const removeField = (fieldId: string) => {
    if (!selectedForm) return;
    const updatedSteps = selectedForm.steps.map(step => ({
      ...step,
      fields: step.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedForm({ ...selectedForm, steps: updatedSteps });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (selectedForm) {
    return (
      <div className="h-full flex flex-col bg-[#0A0A0A]">
        {/* Editor Header */}
        <div className="h-16 border-b border-white/5 bg-[#111] px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedForm(null)}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{selectedForm.name}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Step-by-Step Form Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={selectedForm.status}
              onChange={(e) => setSelectedForm({ ...selectedForm, status: e.target.value as 'draft' | 'active' })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
            <button 
              onClick={handleSaveForm}
              disabled={saving}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Steps Sidebar */}
          <div className="w-64 border-r border-white/5 bg-[#0D0D0D] flex flex-col">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Form Steps</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {Array.from(new Map(selectedForm.steps.map(s => [s.id, s])).values()).map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeStepIdx === idx ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{step.title}</span>
                </button>
              ))}
              <button 
                onClick={addStep}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Step</span>
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0A]">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-[#111] border border-white/5 rounded-3xl p-8">
                <div className="mb-8">
                  <input 
                    type="text"
                    value={selectedForm.steps[activeStepIdx].title}
                    onChange={(e) => {
                      const updatedSteps = [...selectedForm.steps];
                      updatedSteps[activeStepIdx].title = e.target.value;
                      setSelectedForm({ ...selectedForm, steps: updatedSteps });
                    }}
                    className="text-2xl font-bold bg-transparent border-none text-white focus:outline-none w-full"
                    placeholder="Step Title"
                  />
                  <p className="text-sm text-gray-500 mt-1">Configure fields for this step.</p>
                </div>

                <div className="space-y-4">
                  {Array.from(new Map(selectedForm.steps[activeStepIdx].fields.map(f => [f.id, f])).values()).map((field) => (
                    <div key={field.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 space-y-4">
                          <input 
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="bg-transparent border-none text-white font-medium focus:outline-none w-full"
                            placeholder="Field Label"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <select 
                              value={field.type}
                              onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            >
                              <option value="text">Text Input</option>
                              <option value="email">Email Address</option>
                              <option value="number">Number</option>
                              <option value="textarea">Long Text</option>
                              <option value="select">Dropdown</option>
                              <option value="radio">Radio Buttons</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="rounded border-white/10 bg-white/5 text-indigo-500"
                              />
                              <span className="text-xs text-gray-400">Required</span>
                            </label>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeField(field.id)}
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
                    <button onClick={() => addField('text')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all">Text</button>
                    <button onClick={() => addField('email')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all">Email</button>
                    <button onClick={() => addField('textarea')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all">Long Text</button>
                    <button onClick={() => addField('select')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all">Dropdown</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Forms</h1>
            <p className="text-gray-400">Create step-by-step interactive forms.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Create Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from(new Map(forms.map(f => [f.id, f])).values()).map((form) => (
          <div 
            key={form.id}
            onClick={() => setSelectedForm(form)}
            className="p-6 bg-[#111] border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-colors">
              <FileText className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{form.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest font-bold ${form.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {form.status}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{form.steps.length} Steps</span>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 font-bold">/{form.slug}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/f/${form.slug}`;
                    navigator.clipboard.writeText(url);
                    appToast('URL copied to clipboard!');
                  }}
                  className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <button className="text-indigo-400 text-xs font-bold hover:underline">Edit Form</button>
            </div>
          </div>
        ))}
        {forms.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No forms yet</h3>
            <p className="text-gray-500">Click the button above to create your first step-by-step form.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create New Form</h2>
              <form onSubmit={handleCreateForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Form Name</label>
                  <input 
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                    placeholder="e.g. Customer Feedback"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Custom URL Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">/f/</span>
                    <input 
                      name="slug"
                      type="text"
                      required
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
                      placeholder="feedback-form"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
