import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Package, Truck, Globe, ShieldCheck, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { WizardLayout } from './WizardLayout';
import { FileUpload } from '../FileUpload';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COUNTRIES } from '../../lib/countries';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";

interface ProductWizardProps {
  onClose: () => void;
  isAffiliate?: boolean;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const ProductPreview = ({ data, isDark, isAffiliate, type = 'card' }: { data: any, isDark: boolean, isAffiliate: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-black p-8 text-white text-center">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">New Product!</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Check out our latest addition to the shop.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className={`aspect-video w-full rounded-2xl flex items-center justify-center overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
              {data.thumbnail || data.images?.[0] ? (
                <img src={data.thumbnail || data.images?.[0]} alt={data.title} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div>
              <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Product Name'}</h3>
              <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.variations[0]?.price || '0.00'}</p>
            </div>
            <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.description || 'No description provided.'}
            </p>
            <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
              Shop Now
            </button>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee Shop</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isDark ? 'bg-black' : 'bg-[#F8F9FA]'}`}>
        <div className={`w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border flex flex-col lg:flex-row ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-100'}`}>
          <div className={`lg:w-1/2 p-10 space-y-8 ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
            <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Summary</h2>
            <div className="flex gap-6">
              <div className={`w-24 h-24 rounded-2xl border flex-shrink-0 overflow-hidden shadow-sm ${isDark ? 'bg-black border-white/10' : 'bg-white border-gray-100'}`}>
                {data.thumbnail || data.images?.[0] ? (
                  <img src={data.thumbnail || data.images?.[0]} alt={data.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-300 m-auto mt-8" />
                )}
              </div>
              <div className="flex-grow">
                <h3 className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Product Name'}</h3>
                <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.description}</p>
                <p className={`font-black text-xl mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.variations[0]?.price}</p>
              </div>
            </div>
            <div className={`space-y-3 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.variations[0]?.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                <span className="font-black text-emerald-600">Free</span>
              </div>
              <div className={`flex justify-between text-2xl font-black pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Total</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>€{data.variations[0]?.price}</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 p-10 space-y-8">
            <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Card Information</label>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="text-sm text-gray-300 font-mono">•••• •••• •••• ••••</div>
                </div>
              </div>
              <button className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-[0.98] ${isDark ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'}`}>
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          <div className={`flex items-center justify-center p-10 ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
            <div className={`w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-100'}`}>
              {data.thumbnail || data.images?.[0] ? (
                <img src={data.thumbnail || data.images?.[0]} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-200" />
                </div>
              )}
            </div>
          </div>
          <div className="p-10 lg:p-16 flex flex-col">
            <div className="mb-10">
              <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-8 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {data.category}
              </div>
              <h1 className={`text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Product Name'}</h1>
              <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                €{data.variations[0]?.price || '0.00'}
              </div>
            </div>

            <div className="space-y-10 flex-1">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</h4>
                <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {data.description || 'Product description will appear here...'}
                </p>
              </div>

              {!isAffiliate && data.hasVariations && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Options</h4>
                  <div className="flex gap-3 flex-wrap">
                    {data.variations.map((v: any, i: number) => (
                      v.name && <button key={i} className={`px-6 py-3 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all ${isDark ? 'border-white/10 text-white hover:border-white' : 'border-gray-200 text-black hover:border-black'}`}>{v.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12">
              <button className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-[0.98] ${isDark ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'}`}>
                {isAffiliate ? 'View on External Site' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className={`relative aspect-square m-6 rounded-[2.5rem] overflow-hidden border ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-100'}`}>
        {data.thumbnail || data.images?.[0] ? (
          <img src={data.thumbnail || data.images?.[0]} alt="Product" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}
        <div className="absolute top-6 left-6">
          <div className={`px-3 py-1 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-black'}`}>
            {data.category}
          </div>
        </div>
      </div>
      
      <div className="px-10 pb-10 space-y-6 flex-1">
        <div>
          <h1 className={`text-3xl font-black tracking-tighter mb-2 leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Product Name'}</h1>
          <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            €{data.variations[0]?.price || '0.00'}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</h4>
          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.description || 'Product description will appear here...'}
          </p>
        </div>

        {isAffiliate && (
          <div className={`mt-auto p-4 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">External Product</span>
          </div>
        )}
      </div>
    </div>
  );
};

import { ConversionOptimizationStep } from './steps/ConversionOptimizationStep';

export const ProductWizard = ({ onClose, isAffiliate = false, onCreated, draftId }: ProductWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Clothing',
    condition: 'new', // new, refurbished, used
    hasVariations: false,
    variations: [{ name: 'Default', stock: '', price: '', sku: '' }],
    originCountry: 'NL',
    shippingRegions: [{ name: 'Domestic', carrier: 'PostNL', time: '1-2 days', cost: '' }],
    taxType: 'standard', // standard, reduced, zero
    hsCode: '',
    returnPeriod: '14',
    returnShippingPayer: 'buyer', // buyer, seller
    warranty: '',
    thumbnail: '',
    galleryImages: [] as string[],
    images: [] as string[], // Keep for backward compatibility or final submission
    warehouseAddress: '',
    externalUrl: '',
    personas: [] as { role: string, description: string }[],
    faq: [] as { question: string, answer: string }[],
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
          price: parseFloat(formData.variations[0]?.price) || 0,
          category: formData.category,
          type: isAffiliate ? 'affiliate' : 'product',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
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
      toast.error("Product Name is required.");
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
          price: parseFloat(formData.variations[0]?.price) || 0,
          category: formData.category,
          type: isAffiliate ? 'affiliate' : 'product',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          window.history.replaceState(null, '', `/create/${isAffiliate ? 'affiliate' : 'product'}/${data.id}`);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    const maxSteps = isAffiliate ? 3 : 8;
    if (step < maxSteps) {
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
      // Combine thumbnail and gallery images
      const finalImages = isAffiliate 
        ? formData.images 
        : [formData.thumbnail, ...formData.galleryImages].filter(Boolean);

      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.variations[0]?.price) || 0,
        category: formData.category,
        type: isAffiliate ? 'affiliate' : 'product',
        user_id: user?.id,
        seller_id: user?.id,
        status: 'published',
        images: finalImages,
        metadata: {
          ...formData,
          shipping_origin: formData.originCountry,
          external_url: isAffiliate ? formData.externalUrl : undefined,
        }
      };

      let result;
      if (draftId) {
        result = await DatabaseService.update('listings', draftId, listingData);
      } else {
        result = await DatabaseService.insert('listings', listingData);
      }

      if (onCreated && result) {
        onCreated(result.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error("Failed to publish listing. Please try again.");
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
        ? `Improve this product title to be more catchy and professional for a marketplace: "${formData.title}". Return only the improved title.`
        : `Improve this product description to be more engaging and professional: "${formData.description}". Return only the improved description.`;

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

  const addVariation = () => {
    setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: '', stock: '', price: '', sku: '' }] }));
  };

  const updateVariation = (index: number, field: string, value: string) => {
    const newVariations = [...formData.variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    setFormData(prev => ({ ...prev, variations: newVariations }));
  };

  const removeVariation = (index: number) => {
    const newVariations = formData.variations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, variations: newVariations }));
  };

  const addShippingRegion = () => {
    setFormData(prev => ({ ...prev, shippingRegions: [...prev.shippingRegions, { name: '', carrier: '', time: '', cost: '' }] }));
  };

  const updateShippingRegion = (index: number, field: string, value: string) => {
    const newRegions = [...formData.shippingRegions];
    newRegions[index] = { ...newRegions[index], [field]: value };
    setFormData(prev => ({ ...prev, shippingRegions: newRegions }));
  };

  const removeShippingRegion = (index: number) => {
    const newRegions = formData.shippingRegions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, shippingRegions: newRegions }));
  };

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a product listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy product title",
          "description": "A detailed, engaging product description",
          "price": "29.99",
          "category": "Clothing"
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
            variations: [{ ...prev.variations[0], price: data.price || prev.variations[0].price }]
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
      title={isAffiliate ? "Post Affiliate Product" : "Sell a Product"}
      currentStep={step}
      totalSteps={isAffiliate ? 3 : 7}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === (isAffiliate ? 3 : 7)}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <ProductPreview data={formData} isDark={isDarkPreview} isAffiliate={isAffiliate} type={type} />}
      onAiGenerate={handleAiGenerate}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Product Name</label>
            <div className="relative">
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Handmade Leather Bag"
                className={`${inputClass} pr-12`}
              />
              <button 
                onClick={() => enhanceText('title')}
                disabled={aiLoading || !formData.title}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                title="Enhance with AI"
              >
                <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <div className="relative">
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe your product..."
                rows={4}
                className={`${inputClass} pr-12 resize-none`}
              />
              <button 
                onClick={() => enhanceText('description')}
                disabled={aiLoading || !formData.description}
                className="absolute right-3 top-3 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                title="Enhance with AI"
              >
                <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={inputClass}
            >
              <option value="Clothing">Clothing</option>
              <option value="Electronics">Electronics</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Beauty">Beauty</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          {!isAffiliate && (
            <div>
              <label className={labelClass}>Condition</label>
              <div className="grid grid-cols-3 gap-3">
                {['new', 'refurbished', 'used'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => updateField('condition', cond)}
                    className={`p-3 rounded-xl border-2 capitalize transition-all ${
                      formData.condition === cond
                        ? (isDark ? 'border-white bg-white/10 text-white' : 'border-black bg-black/5 font-medium')
                        : (isDark ? 'border-white/10 hover:border-white/20 text-gray-400' : 'border-gray-100 hover:border-gray-200 text-gray-600')
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              {formData.condition !== 'new' && (
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Different warranty rules apply for used goods.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isAffiliate && step === 2 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Affiliate Link</label>
            <div className="relative">
              <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="url"
                value={formData.externalUrl || ''}
                onChange={(e) => updateField('externalUrl', e.target.value)}
                placeholder="https://example.com/product/123"
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Price (€)</label>
            <input
              type="number"
              value={formData.variations[0].price}
              onChange={(e) => updateVariation(0, 'price', e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Product Photo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className={`relative aspect-square rounded-xl overflow-hidden border group ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== index);
                      updateField('images', newImages);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <div className="aspect-square">
                <FileUpload
                  bucket="product-images"
                  onUpload={(url) => updateField('images', [...formData.images, url])}
                  label="Add Photo"
                  darkMode={isDark}
                />
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm mt-6 ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>Ready to publish! Buyers will be redirected to your link.</p>
          </div>
        </div>
      )}

      {!isAffiliate && step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Variations</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Does this product have options like size or color?</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasVariations}
                onChange={(e) => updateField('hasVariations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          <div className="space-y-4">
            {formData.variations.map((variation, index) => (
              <div key={index} className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border relative group ${isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                <div className="col-span-2 sm:col-span-1">
                  <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Option Name</label>
                  <input
                    type="text"
                    value={variation.name || ''}
                    onChange={(e) => updateVariation(index, 'name', e.target.value)}
                    placeholder="e.g. Red, XL"
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock</label>
                  <input
                    type="number"
                    value={variation.stock || ''}
                    onChange={(e) => updateVariation(index, 'stock', e.target.value)}
                    placeholder="0"
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Price (€)</label>
                  <input
                    type="number"
                    value={variation.price || ''}
                    onChange={(e) => updateVariation(index, 'price', e.target.value)}
                    placeholder="0.00"
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SKU (Opt)</label>
                  <input
                    type="text"
                    value={variation.sku || ''}
                    onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                    placeholder="CODE-123"
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
                {formData.variations.length > 1 && (
                  <button
                    onClick={() => removeVariation(index)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {formData.hasVariations && (
              <button
                onClick={addVariation}
                className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'border-white/10 text-gray-400 hover:border-white hover:text-white' 
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Variation
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Shipping From</label>
            <select
              value={formData.originCountry}
              onChange={(e) => updateField('originCountry', e.target.value)}
              className={inputClass}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Shipping Profiles</label>
            <div className="space-y-4">
              {formData.shippingRegions.map((region, index) => (
                <div key={index} className={`p-4 rounded-xl border relative group space-y-3 ${isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Region Name</label>
                      <input
                        type="text"
                        value={region.name || ''}
                        onChange={(e) => updateShippingRegion(index, 'name', e.target.value)}
                        placeholder="e.g. Europe"
                        className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carrier</label>
                      <input
                        type="text"
                        value={region.carrier || ''}
                        onChange={(e) => updateShippingRegion(index, 'carrier', e.target.value)}
                        placeholder="e.g. DHL"
                        className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Est. Time</label>
                      <input
                        type="text"
                        value={region.time || ''}
                        onChange={(e) => updateShippingRegion(index, 'time', e.target.value)}
                        placeholder="3-5 days"
                        className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cost (€)</label>
                      <input
                        type="number"
                        value={region.cost || ''}
                        onChange={(e) => updateShippingRegion(index, 'cost', e.target.value)}
                        placeholder="0.00"
                        className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200'}`}
                      />
                    </div>
                  </div>
                  {formData.shippingRegions.length > 1 && (
                    <button
                      onClick={() => removeShippingRegion(index)}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addShippingRegion}
                className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'border-white/10 text-gray-400 hover:border-white hover:text-white' 
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Shipping Region
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>VAT Category</label>
            <select
              value={formData.taxType}
              onChange={(e) => updateField('taxType', e.target.value)}
              className={inputClass}
            >
              <option value="standard">Standard Rate (e.g. 21%)</option>
              <option value="reduced">Reduced Rate (e.g. 9% - Books, Food)</option>
              <option value="zero">Zero Rate (0%)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>HS Code (Optional)</label>
            <input
              type="text"
              value={formData.hsCode || ''}
              onChange={(e) => updateField('hsCode', e.target.value)}
              placeholder="e.g. 62052000"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-2">
              Harmonized System code helps customs calculate duties correctly.
            </p>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Return Period</label>
              <select
                value={formData.returnPeriod}
                onChange={(e) => updateField('returnPeriod', e.target.value)}
                className={inputClass}
              >
                <option value="14">14 Days (EU Min)</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Return Shipping</label>
              <select
                value={formData.returnShippingPayer}
                onChange={(e) => updateField('returnShippingPayer', e.target.value)}
                className={inputClass}
              >
                <option value="buyer">Buyer Pays</option>
                <option value="seller">Seller Pays</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Warranty Policy</label>
            <textarea
              value={formData.warranty || ''}
              onChange={(e) => updateField('warranty', e.target.value)}
              placeholder="Describe your warranty terms..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Product Thumbnail</label>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              This image will be shown on product cards and search results.
              <br />
              <span className="font-medium text-indigo-500">Recommended size: 1200x1200px (1:1 Aspect Ratio)</span>
            </p>
            <div className="aspect-square max-w-sm mx-auto">
              {formData.thumbnail ? (
                <div className={`relative w-full h-full rounded-xl overflow-hidden border group ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateField('thumbnail', '')}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <FileUpload
                  bucket="product-images"
                  onUpload={(url) => updateField('thumbnail', url)}
                  label="Upload Thumbnail"
                  darkMode={isDark}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Store Page Gallery</label>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Add more images to showcase your product from different angles. These will appear on the product detail page.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.galleryImages.map((url, index) => (
                <div key={index} className={`relative aspect-square rounded-xl overflow-hidden border group ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      const newImages = formData.galleryImages.filter((_, i) => i !== index);
                      updateField('galleryImages', newImages);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <div className="aspect-square">
                <FileUpload
                  bucket="product-images"
                  onUpload={(url) => updateField('galleryImages', [...formData.galleryImages, url])}
                  label="Add Photo"
                  darkMode={isDark}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Warehouse Address</label>
            <input
              type="text"
              value={formData.warehouseAddress || ''}
              onChange={(e) => updateField('warehouseAddress', e.target.value)}
              placeholder="Pickup address (optional)"
              className={inputClass}
            />
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm mt-6 ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>Ready to publish! Your product will be visible to thousands of buyers.</p>
          </div>
        </div>
      )}
      {(isAffiliate ? step === 3 : step === 8) && (
        <ConversionOptimizationStep
          personas={formData.personas}
          faq={formData.faq}
          onUpdatePersonas={(personas) => updateField('personas', personas)}
          onUpdateFAQ={(faq) => updateField('faq', faq)}
          productTitle={formData.title}
          productDescription={formData.description}
        />
      )}
    </WizardLayout>
  );
};
