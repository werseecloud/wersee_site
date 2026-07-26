import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Plus, Trash2, ArrowRight, Check, Sparkles, Image as ImageIcon, Layers } from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { FileUpload } from '../FileUpload';
import { WizardLayout } from './WizardLayout';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { replaceStandaloneListingDraftUrl } from '../../lib/listingWizardRoute';

interface BundleWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const BundlePreview = ({ data, isDark, type = 'card' }: { data: any, isDark: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  const originalPrice = data.selectedProducts.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);
  const savings = originalPrice - Number(data.price || 0);

  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-indigo-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Exclusive Bundle Offer!</h2>
            <p className="text-indigo-100 text-sm">Get all these items together and save big.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className={`aspect-video w-full rounded-xl overflow-hidden relative ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              {data.thumbnail ? (
                <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <Package className={`w-12 h-12 ${isDark ? 'text-indigo-400' : 'text-indigo-200'}`} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                SAVE €{savings.toFixed(2)}
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Bundle Title'}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-600">€{data.price || '0.00'}</span>
                <span className="text-sm text-gray-400 line-through">€{originalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Included Items</p>
              <div className="grid grid-cols-2 gap-2">
                {data.selectedProducts.slice(0, 4).map((p: any, i: number) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Check className="w-3 h-3 text-green-500" /> {p.title}
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-center">
              Claim Bundle
            </button>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee Bundles</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col lg:flex-row ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className={`lg:w-1/2 p-8 space-y-8 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Bundle Checkout</h2>
            <div className="flex gap-4">
              <div className={`w-24 h-24 rounded-xl border flex-shrink-0 overflow-hidden relative ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5'}`}>
                {data.thumbnail ? (
                  <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-300 m-auto mt-8" />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{data.title || 'Bundle Title'}</h3>
                <p className="text-xs text-gray-500 mt-1">{data.selectedProducts.length} items included</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`font-black ${isDark ? 'text-white' : 'text-black'}`}>€{data.price}</span>
                  <span className="text-[10px] text-gray-400 line-through">€{originalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className={`space-y-2 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {data.selectedProducts.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-[10px] text-gray-500">
                  <span>{p.title}</span>
                  <span>€{p.price}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-4 font-bold text-green-500">
                <span>Bundle Discount</span>
                <span>-€{savings.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-xl font-black pt-4 border-t ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-black'}`}>
                <span>Total</span>
                <span>€{data.price}</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 p-8 space-y-6">
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Payment</h2>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                <p className="text-xs text-indigo-500 font-bold">You are saving €{savings.toFixed(2)} with this bundle!</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payment Details</label>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`}>
                  <div className="text-sm text-gray-400">Secure checkout powered by Wersee</div>
                </div>
              </div>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-[0.98]">
                Pay €{data.price}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="relative h-64 lg:h-96 bg-black">
          {data.thumbnail ? (
            <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
              <Package className="w-24 h-24 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold mb-4">
              <Layers className="w-3 h-3" /> BUNDLE
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">{data.title || 'Bundle Title'}</h1>
          </div>
        </div>

          <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>About this Bundle</h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {data.description || 'Bundle description will appear here...'}
              </p>
            </div>

            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {data.isAllAccess ? 'What\'s Included' : `Included Products (${data.selectedProducts.length})`}
              </h2>
              
              {data.isAllAccess ? (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">All-Access Pass</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Get instant access to all products in the <span className="font-bold">{data.allAccessCategory || 'selected'}</span> category.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.selectedProducts.map((product: any, i: number) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                        {product.thumbnail && <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <span className={`font-bold block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{product.title}</span>
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>€{product.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>€{data.price || '0.00'}</span>
                {originalPrice > 0 && (
                  <span className="text-lg text-gray-500 line-through">€{originalPrice.toFixed(2)}</span>
                )}
              </div>
              {savings > 0 && (
                <div className="text-sm font-bold text-green-500 mb-6">SAVE €{savings.toFixed(2)}</div>
              )}
              <button className={`w-full py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-black text-white hover:bg-gray-800'}`}>
                Buy Bundle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[9/16] max-h-[600px] rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="relative h-48 bg-black">
        {data.thumbnail ? (
          <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
            <Package className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold mb-2">
            <Layers className="w-2.5 h-2.5" /> BUNDLE
          </div>
          <h1 className="text-xl font-bold text-white leading-tight">{data.title || 'Bundle Title'}</h1>
        </div>
      </div>
      
      <div className="p-6 space-y-6 flex-1 overflow-hidden">
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {data.isAllAccess ? 'What\'s Included' : 'Included Items'}
          </div>
          <div className="space-y-2">
            {data.isAllAccess ? (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Sparkles className="w-5 h-5 shrink-0" />
                <span className="text-xs font-medium">All products in {data.allAccessCategory || 'category'}</span>
              </div>
            ) : (
              <>
                {data.selectedProducts.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded overflow-hidden shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      {p.thumbnail && <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />}
                    </div>
                    <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{p.title}</span>
                  </div>
                ))}
                {data.selectedProducts.length > 3 && (
                  <div className={`text-[10px] font-bold text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    + {data.selectedProducts.length - 3} more items
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className={`mt-auto p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase">Bundle Price</span>
            <span className="font-bold">€{data.price || '0.00'}</span>
          </div>
          {savings > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase block">Save</span>
              <span className="font-bold">€{savings.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BundleWizard: React.FC<BundleWizardProps> = ({ onClose, onCreated, draftId }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    thumbnail: '',
    selectedProducts: [] as any[],
    isAllAccess: false,
    allAccessCategory: '',
  });

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

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
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: Number(formData.price) || 0,
          type: 'bundle',
          image_url: formData.thumbnail,
          images: formData.thumbnail ? [formData.thumbnail] : [],
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

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      const data = await DatabaseService.get<any>('listings', {
        select: 'id, title, price, thumbnail, type, category',
        eq: { seller_id: user.id },
        neq: { type: 'bundle' }
      });
      
      if (data) {
        setAvailableProducts(data);
        const uniqueCategories = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean)));
        setCategories(uniqueCategories as string[]);
      }
    };
    fetchProducts();
  }, [user]);

  const handleNext = async () => {
    setError('');
    if (step === 1 && !formData.title) {
      setError('Bundle name is required');
      toast.error('Bundle name is required');
      return;
    }

    // If it's the first step and no draftId, create the draft
    if (step === 1 && !draftId && user) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 10);

        const data = await DatabaseService.insert('listings', {
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: Number(formData.price) || 0,
          type: 'bundle',
          image_url: formData.thumbnail,
          images: formData.thumbnail ? [formData.thumbnail] : [],
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          replaceStandaloneListingDraftUrl('bundle', data.id);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    if (step === 2) {
      if (formData.isAllAccess) {
        if (!formData.allAccessCategory) {
          setError('Please select a category for the All-Access Pass');
          toast.error('Please select a category');
          return;
        }
      } else if (formData.selectedProducts.length < 2) {
        setError('Please select at least 2 products for the bundle');
        toast.error('Select at least 2 products');
        return;
      }
    }
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const toggleProduct = (product: any) => {
    setFormData(prev => {
      const isSelected = prev.selectedProducts.find(p => p.id === product.id);
      if (isSelected) {
        return { ...prev, selectedProducts: prev.selectedProducts.filter(p => p.id !== product.id) };
      } else {
        return { ...prev, selectedProducts: [...prev.selectedProducts, product] };
      }
    });
  };

  const calculateOriginalPrice = () => {
    return formData.selectedProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);
  };

  const handleAiGenerate = async (prompt: string) => {
    setLoading(true);
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a product bundle listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy bundle title",
          "description": "A detailed, engaging bundle description",
          "price": "49.99"
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
            price: data.price || (calculateOriginalPrice() * 0.8).toFixed(2),
          }));
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create the bundle listing
      const bundleData = await DatabaseService.insert('listings', {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        type: 'bundle',
        image_url: formData.thumbnail,
        images: formData.thumbnail ? [formData.thumbnail] : [],
        status: 'published',
        metadata: {
          is_all_access: formData.isAllAccess,
          all_access_category: formData.allAccessCategory
        }
      });

      // 2. Create bundle items (only if not an all-access pass)
      if (!formData.isAllAccess && formData.selectedProducts.length > 0) {
        const bundleItems = formData.selectedProducts.map(p => ({
          bundle_id: bundleData.id,
          listing_id: p.id,
        }));

        await DatabaseService.insert('bundle_items', bundleItems);
      }

      if (onCreated) {
        onCreated(bundleData.id);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  return (
    <WizardLayout
      title="Create Bundle"
      currentStep={step}
      totalSteps={3}
      onClose={onClose}
      onBack={() => step > 1 ? setStep(step - 1) : onClose()}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 3}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <BundlePreview data={formData} isDark={isDarkPreview} type={type} />}
      aiKind="bundle"
      aiCurrentDraft={{ title: formData.title, description: formData.description, category: formData.allAccessCategory || 'Bundles', price: Number(formData.price) || 0 }}
      onAiApply={(patch) => setFormData((current) => ({ ...current, ...(typeof patch.title === 'string' ? { title: patch.title } : {}), ...(typeof patch.description === 'string' ? { description: patch.description } : {}), ...(typeof patch.price === 'number' ? { price: String(patch.price) } : {}) }))}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Bundle Name *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., The Ultimate Creator Pack"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what's included in this bundle..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>Bundle Thumbnail</label>
            <FileUpload
              bucket="product-images"
              onUpload={(url) => setFormData(prev => ({ ...prev, thumbnail: url }))}
              label="Upload Thumbnail"
              darkMode={isDark}
            />
            {formData.thumbnail && (
              <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-white/10 w-48">
                <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Select Products</h3>
            <p className="text-sm text-gray-500">Choose the items to include in this bundle.</p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.isAllAccess}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllAccess: e.target.checked, selectedProducts: [] }))}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-black'}`}>Make this an All-Access Pass</span>
                <span className="text-sm text-gray-500">Instead of selecting specific products, give access to all products in a category.</span>
              </div>
            </label>
          </div>

          {formData.isAllAccess ? (
            <div className="space-y-4">
              <label className={labelClass}>Select Category for All-Access</label>
              <select
                value={formData.allAccessCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, allAccessCategory: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select a category...</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-500 mt-2">You don't have any categories set up in your products yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableProducts.map(product => {
                const isSelected = formData.selectedProducts.some(p => p.id === product.id);
                return (
                  <div 
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>
                        {product.title}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>
                        €{product.price} • {product.type}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
              {availableProducts.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                  No products available to bundle. Create some products first!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Pricing</h3>
            <p className="text-sm text-gray-500">Set a special price for this bundle.</p>
          </div>

          <div className={`p-6 rounded-2xl space-y-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Original Total Value:</span>
              <span className={`font-medium line-through ${isDark ? 'text-white' : 'text-gray-900'}`}>€{calculateOriginalPrice().toFixed(2)}</span>
            </div>
            
            <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <label className={labelClass}>Bundle Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  className={`${inputClass} pl-8 font-medium text-lg`}
                />
              </div>
              {formData.price && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  Buyers save €{(calculateOriginalPrice() - Number(formData.price)).toFixed(2)}!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
