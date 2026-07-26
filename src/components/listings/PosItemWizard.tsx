import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Calculator, Sparkles, CheckCircle, Trash2, Plus, Info } from 'lucide-react';
import { WizardLayout } from './WizardLayout';
import { FileUpload } from '../FileUpload';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { toast } from 'sonner';

import { appToast } from '@/lib/feedback';
import { replaceStandaloneListingDraftUrl } from '../../lib/listingWizardRoute';
interface PosItemWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const PosItemPreview = ({ data, isDark, type = 'card' }: { data: any, isDark: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-emerald-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Inventory Update!</h2>
            <p className="text-emerald-100 text-sm">A new item has been added to the POS system.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                {data.image_url ? (
                  <img src={data.image_url} alt={data.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Item Name'}</h3>
                <p className="text-sm text-gray-500">SKU: {data.sku || 'N/A'}</p>
              </div>
            </div>
            <div className={`py-4 border-y ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Price</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.price || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stock Level</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stock || '0'} units</span>
              </div>
            </div>
            <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-center">
              Manage Inventory
            </button>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee POS</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>POS Checkout</h2>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Terminal</div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center overflow-hidden">
                  {data.image_url ? (
                    <img src={data.image_url} alt={data.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{data.title || 'Item Name'}</h3>
                  <p className="text-xs text-gray-500">Tax Included ({data.tax_rate}%)</p>
                </div>
              </div>
              <div className={`flex justify-between items-center pt-4 border-t ${isDark ? 'border-white/10 text-white' : 'border-gray-200 text-black'}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Amount Due</span>
                <span className="text-xl font-black">€{data.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className={`py-4 rounded-xl border-2 font-bold transition-all ${isDark ? 'border-white/10 text-white hover:border-white' : 'border-gray-200 text-black hover:border-black'}`}>Cash</button>
                <button className={`py-4 rounded-xl border-2 font-bold transition-all ${isDark ? 'border-white/10 text-white hover:border-white' : 'border-gray-200 text-black hover:border-black'}`}>Card</button>
              </div>
              <button className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`w-full h-full overflow-y-auto ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className={`aspect-square rounded-[3rem] overflow-hidden shadow-2xl border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
              {data.image_url ? (
                <img src={data.image_url} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <Package className={`w-24 h-24 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                  {data.category || 'General'}
                </div>
                <h1 className="text-5xl font-black leading-[0.9] tracking-tighter uppercase italic">{data.title || 'Item Name'}</h1>
                <div className="text-4xl font-black tracking-tighter text-emerald-500">
                  €{data.price || '0.00'}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Stock Status</span>
                  <span className="text-sm font-bold text-emerald-500">In Stock</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SKU</span>
                  <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.sku || 'N/A'}</span>
                </div>
              </div>

              <button className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
                Add to Cart
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Description</h2>
                <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {data.description || 'No description provided for this POS item.'}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Specifications</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Type', value: data.type },
                    { label: 'Tax Rate', value: `${data.tax_rate}%` },
                    { label: 'Stock', value: data.stock || 'Unlimited' }
                  ].map((spec, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{spec.label}</span>
                      <span className="text-sm font-bold capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-square max-w-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col mx-auto ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className={`relative h-1/2 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
        {data.image_url ? (
          <img src={data.image_url} alt="Product" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center`}>
            <Package className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          </div>
        )}
        <div className="absolute top-6 left-6">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${isDark ? 'bg-black/50 text-white' : 'bg-white/90 text-black'}`}>
            {data.category || 'General'}
          </div>
        </div>
      </div>
      
      <div className="p-8 flex flex-col justify-between flex-1">
        <div>
          <h1 className={`text-2xl font-black mb-2 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Item Name'}</h1>
          <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.description || 'No description provided.'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <div className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
            €{data.price || '0.00'}
          </div>
          <div className={`px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'}`}>
            POS Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export const PosItemWizard = ({ onClose, onCreated, draftId }: PosItemWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'General',
    image_url: '',
    sku: '',
    stock: '',
    type: 'physical' as 'physical' | 'digital',
    tax_rate: '21'
  });

  // Load draft if draftId is provided
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) return;
      setIsDraftLoading(true);
      try {
        const data = await DatabaseService.get('listings', {
          eq: { id: draftId },
          single: true
        });
        if (data && data.metadata) {
          setFormData(prev => ({ ...prev, ...data.metadata }));
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsDraftLoading(false);
      }
    };
    loadDraft();
  }, [draftId]);

  // Save draft on every step change
  useEffect(() => {
    const saveDraft = async () => {
      if (!user || !formData.title || loading) return;
      
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 10);

        const draftData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          type: formData.type,
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          image_url: formData.image_url,
          metadata: {
            ...formData,
            is_pos_item: true,
            created_via: 'pos_wizard'
          }
        };

        if (draftId) {
          await DatabaseService.update('listings', draftId, draftData);
        }
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    };
    
    if (step > 1) {
      saveDraft();
    }
  }, [step]);

  const handleNext = async () => {
    if (step === 1 && !formData.title) {
      toast.error("Item Name is required.");
      return;
    }

    // If it's the first step and no draftId, create the draft
    if (step === 1 && !draftId && user) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 10);

        const data = await DatabaseService.insert('listings', {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          type: formData.type,
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          image_url: formData.image_url,
          metadata: {
            ...formData,
            is_pos_item: true,
            created_via: 'pos_wizard'
          }
        });
        if (data) {
          // Update URL with the new draft ID
          replaceStandaloneListingDraftUrl('pos_item', data.id);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.insert('listings', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        type: formData.type,
        user_id: user?.id,
        seller_id: user?.id,
        status: 'active',
        image_url: formData.image_url,
        metadata: {
          ...formData,
          is_pos_item: true,
          created_via: 'pos_wizard'
        }
      });

      if (onCreated && data) {
        onCreated(data.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating POS item:', error);
      appToast('Failed to create item. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const enhanceText = async (field: 'title' | 'description') => {
    if (!formData[field]) return;
    setAiLoading(true);
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const prompt = field === 'title' 
        ? `Improve this POS item name to be short and clear: "${formData.title}". Return only the improved title.`
        : `Improve this POS item description for a receipt or terminal: "${formData.description}". Return only the improved description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      const text = response.text;
      if (text) {
        updateField(field, text.trim());
      }
    } catch (error) {
      console.error('AI Enhancement failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a POS item for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "Short Item Name",
          "description": "Brief description",
          "price": "19.99",
          "category": "Food"
        }`,
      });
      
      const text = response.text;
      if (text) {
        try {
          const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const data = JSON.parse(jsonStr);
          setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || prev.description,
            category: data.category || prev.category,
            price: data.price || prev.price
          }));
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
    }
  };

  return (
    <WizardLayout
      title="Create POS Item"
      currentStep={step}
      totalSteps={3}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 3}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <PosItemPreview data={formData} isDark={isDarkPreview} type={type} />}
      aiKind="pos_item"
      aiCurrentDraft={{ title: formData.title, description: formData.description, category: formData.category, price: Number(formData.price) || 0 }}
      onAiApply={(patch) => setFormData((current) => ({ ...current, ...(typeof patch.title === 'string' ? { title: patch.title } : {}), ...(typeof patch.description === 'string' ? { description: patch.description } : {}), ...(typeof patch.category === 'string' ? { category: patch.category } : {}), ...(typeof patch.price === 'number' ? { price: String(patch.price) } : {}) }))}
    >
      {step === 1 && (
        <div className="space-y-8">
          <div>
            <label className={labelClass}>Item Name</label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Espresso"
                className={`${inputClass} pr-12`}
              />
              <button 
                onClick={() => enhanceText('title')}
                disabled={aiLoading || !formData.title}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Price (€)</label>
            <div className="relative">
              <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0.00"
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={inputClass}
              >
                <option value="General">General</option>
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Retail">Retail</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value)}
                className={inputClass}
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div>
            <label className={labelClass}>Item Image</label>
            <div className="aspect-square max-w-sm mx-auto">
              {formData.image_url ? (
                <div className={`relative w-full h-full rounded-[2.5rem] overflow-hidden border group ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateField('image_url', '')}
                    className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ) : (
                <FileUpload
                  bucket="product-images"
                  onUpload={(url) => updateField('image_url', url)}
                  label="Upload Item Image"
                  darkMode={isDark}
                />
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description for the terminal..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SKU / Barcode</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stock Level</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                placeholder="Unlimited"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <select
              value={formData.tax_rate}
              onChange={(e) => updateField('tax_rate', e.target.value)}
              className={inputClass}
            >
              <option value="21">Standard (21%)</option>
              <option value="9">Reduced (9%)</option>
              <option value="0">Zero (0%)</option>
            </select>
          </div>

          <div className={`p-6 rounded-[2rem] flex items-start gap-4 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-emerald-500/20' : 'bg-white'}`}>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className={`font-black text-sm uppercase tracking-widest mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Ready for POS</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                This item will be instantly available across all your connected POS terminals.
              </p>
            </div>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
