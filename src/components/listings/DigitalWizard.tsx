import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, FileText, Video, Download, BookOpen, CheckCircle, Palette, MousePointer2, Sparkles, Star, ShieldCheck, Globe } from 'lucide-react';
import { WizardLayout } from './WizardLayout';
import { FileUpload } from '../FileUpload';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CourseBuilder } from '../dashboard/CourseBuilder';
import { DigitalProductBuilder } from '../dashboard/DigitalProductBuilder';
import { toast } from 'sonner';

interface DigitalWizardProps {
  onClose: () => void;
  isVirtual?: boolean;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const DigitalPreview = ({ data, isDark, isVirtual, type }: { data: any, isDark: boolean, isVirtual: boolean, type: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-blue-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Your Digital Content is Ready!</h2>
            <p className="text-blue-100 text-sm">Thank you for your purchase. You can now access your items.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                {data.digitalType === 'course' ? <Video className="w-8 h-8 text-blue-600" /> : <FileText className="w-8 h-8 text-blue-600" />}
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Product Title'}</h3>
                <p className="text-xs text-gray-500">{isVirtual ? 'Virtual Item' : data.digitalType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Click the button below to download your files or start the course.
              </p>
              <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-center">
                Access Content
              </button>
            </div>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee Digital</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Checkout</h2>
              <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">Digital</div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  {data.digitalType === 'course' ? <Video className="w-6 h-6 text-blue-500" /> : <FileText className="w-6 h-6 text-blue-500" />}
                </div>
                <div>
                  <h3 className="font-bold">{data.title || 'Product Title'}</h3>
                  <p className="text-xs text-gray-500">Instant Access</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total</span>
                <span className="text-xl font-black">€{data.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                <input 
                  type="email"
                  className={`w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-200'}`}
                  placeholder="Where should we send your content?"
                />
              </div>
              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                Complete Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className={`relative h-64 ${isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
          {data.coverUrl ? (
            <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                {data.digitalType === 'course' ? <Video className="w-8 h-8 opacity-50" /> : <FileText className="w-8 h-8 opacity-50" />}
              </div>
            </div>
          )}
        </div>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                {data.title || 'Product Title'}
              </h1>
              {data.collaborator && (
                <div className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Featuring: {data.collaborator}
                </div>
              )}
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              €{data.price || '0.00'}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>About this {isVirtual ? 'virtual item' : data.digitalType}</h3>
            <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {data.description || 'Product description will appear here...'}
            </p>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
            <button 
              style={{ 
                backgroundColor: data.customization.primaryColor,
                color: '#ffffff'
              }}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg opacity-90"
            >
              {data.customization.buttonText}
            </button>
            {data.customization.showTrustBadges && (
              <div className={`flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Secure Payment</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Top Rated</span>
              </div>
            )}
            {data.customization.checkoutMessage && (
              <p className={`text-center text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                "{data.customization.checkoutMessage}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[9/16] max-h-[600px] rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
      {/* Cover */}
      <div className={`relative h-64 ${isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
        {data.coverUrl ? (
          <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
              {data.digitalType === 'course' ? <Video className="w-8 h-8 opacity-50" /> : <FileText className="w-8 h-8 opacity-50" />}
            </div>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isDark ? 'bg-black/50 text-white backdrop-blur-md' : 'bg-white/90 text-black'}`}>
            {isVirtual ? 'Virtual Item' : data.digitalType === 'course' ? 'Online Course' : 'Digital Download'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 flex-1 overflow-hidden">
        <div>
          <h1 className={`text-xl font-bold mb-2 leading-tight ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
            {data.title || 'Product Title'}
          </h1>
          {data.collaborator && (
            <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              ft. {data.collaborator}
            </div>
          )}
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            €{data.price || '0.00'}
          </div>
        </div>

        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Description</div>
          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.description || 'Product description will appear here...'}
          </p>
        </div>

        {/* Custom Button Preview */}
        <div className="mt-auto space-y-4">
          <button 
            style={{ 
              backgroundColor: data.customization.primaryColor,
              color: '#ffffff'
            }}
            className="w-full py-3 rounded-xl font-bold text-sm shadow-lg opacity-90"
          >
            {data.customization.buttonText}
          </button>

          {data.customization.showTrustBadges && (
            <div className={`flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Top Rated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { ConversionOptimizationStep } from './steps/ConversionOptimizationStep';

export const DigitalWizard = ({ onClose, isVirtual = false, onCreated, draftId }: DigitalWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCourseBuilder, setShowCourseBuilder] = useState(false);
  const [showDigitalBuilder, setShowDigitalBuilder] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: isVirtual ? 'Virtual Item' : 'Digital',
    digitalType: isVirtual ? 'ebook' : 'ebook', // Default to file for virtual
    // Ebook fields
    mainFileUrl: '',
    previewFileUrl: '',
    coverUrl: '',
    pages: '',
    language: 'English',
    format: 'PDF',
    fileSize: '',
    versionHistory: '',
    license: '',
    updatesIncluded: '',
    deviceLimit: '',
    collaborator: '',
    // Course data (from CourseBuilder)
    course: null as any,
    // Sales Page Customization
    customization: {
      buttonText: 'Buy Now',
      primaryColor: '#000000',
      showTrustBadges: true,
      checkoutMessage: ''
    },
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
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          type: isVirtual ? 'virtual' : 'digital',
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
      toast.error("Product Title is required.");
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
          type: isVirtual ? 'virtual' : 'digital',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          window.history.replaceState(null, '', `/create/${isVirtual ? 'virtual' : 'digital'}/${data.id}`);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    const maxSteps = 5; // Step 1: Info, Step 2: Content, Step 3: Customization, Step 4: Optimization, Step 5: Review
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
      const data = await DatabaseService.insert('listings', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        type: isVirtual ? 'virtual' : 'digital',
        user_id: user?.id,
        seller_id: user?.id,
        status: 'published',
        metadata: {
          ...formData,
        }
      });

      // Fire extension event
      try {
        const { ExtensionEngine } = await import('../../services/extensionEngine');
        await ExtensionEngine.fireEvent(
          'product_created',
          {
            listing_id: data.id,
            title: data.title,
            type: data.type,
            price: data.price
          },
          user?.id || '',
          'business'
        );
      } catch (extErr) {
        console.error('Failed to fire extension event:', extErr);
      }

      if (onCreated && data) {
        onCreated(data.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating digital product:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomization = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customization: { ...prev.customization, [field]: value }
    }));
  };

  const showWizard = !showCourseBuilder && !showDigitalBuilder;

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a digital product listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy digital product title",
          "description": "A detailed, engaging product description",
          "price": "19.99",
          "category": "Software"
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
    <>
      {showWizard && (
        <WizardLayout
          title={isVirtual ? "Sell Virtual Item" : "Sell Digital Product"}
          currentStep={step}
          totalSteps={5}
          onClose={onClose}
          onBack={handleBack}
          onNext={handleNext}
          isFirstStep={step === 1}
          isLastStep={step === 5}
          loading={loading}
          variant="fullscreen"
          preview={(type, isDarkPreview) => <DigitalPreview data={formData} isDark={isDarkPreview} isVirtual={isVirtual} type={type} />}
          onAiGenerate={handleAiGenerate}
        >
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Product Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={isVirtual ? "e.g. Rare Skin for Game X" : "e.g. Ultimate Photography Guide"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Price (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Collaborator / Guest (Optional)</label>
                <input
                  type="text"
                  value={formData.collaborator}
                  onChange={(e) => updateField('collaborator', e.target.value)}
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </div>

              {!isVirtual && (
                <div>
                  <label className={labelClass}>What are you selling?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => updateField('digitalType', 'ebook')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        formData.digitalType === 'ebook'
                          ? (isDark ? 'border-white bg-white/10' : 'border-black bg-black/5')
                          : (isDark ? 'border-white/10 hover:border-white/20 bg-[#141414]' : 'border-gray-100 hover:border-gray-200 bg-white')
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                        <Download className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-black'}`}>E-book / File</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>PDF, Presets, Templates. Single file access.</p>
                    </button>

                    <button
                      onClick={() => updateField('digitalType', 'course')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        formData.digitalType === 'course'
                          ? (isDark ? 'border-white bg-white/10' : 'border-black bg-black/5')
                          : (isDark ? 'border-white/10 hover:border-white/20 bg-[#141414]' : 'border-gray-100 hover:border-gray-200 bg-white')
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                        <Video className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Online Course (Digital Product)</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Modules, Lessons, Video content. A structured digital learning experience.</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {formData.digitalType === 'ebook' ? (
                <div className="text-center py-12">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <FileText className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Digital Product Content</h3>
                  <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Upload your files, add a cover image, and configure product details.</p>
                  <button 
                    onClick={() => setShowDigitalBuilder(true)}
                    className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mx-auto ${
                      isDark 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {formData.mainFileUrl ? 'Edit Product Content' : 'Open Product Builder'}
                  </button>
                  {formData.mainFileUrl && (
                    <p className="mt-4 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Product content saved
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Sparkles className={`w-10 h-10 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Course Content</h3>
                  <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Use our advanced Course Builder to create modules, lessons, and customize your LMS.</p>
                  <button 
                    onClick={() => setShowCourseBuilder(true)}
                    className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mx-auto ${
                      isDark 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {formData.course ? 'Edit Course Content' : 'Open Course Builder'}
                  </button>
                  {formData.course && (
                    <p className="mt-4 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Course content saved
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Customize Sales Page</h3>
              
              <div className="space-y-6">
                <section className="space-y-4">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Button Customization</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Button Text</label>
                      <input 
                        type="text"
                        value={formData.customization.buttonText}
                        onChange={(e) => updateCustomization('buttonText', e.target.value)}
                        className={`w-full p-3 rounded-xl border outline-none ${
                          isDark 
                            ? 'bg-[#141414] border-white/10 text-white focus:border-white/30' 
                            : 'bg-white border-gray-200 focus:border-black'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Primary Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={formData.customization.primaryColor}
                          onChange={(e) => updateCustomization('primaryColor', e.target.value)}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                        />
                        <input 
                          type="text"
                          value={formData.customization.primaryColor}
                          onChange={(e) => updateCustomization('primaryColor', e.target.value)}
                          className={`flex-1 p-3 rounded-xl border font-mono text-sm outline-none ${
                            isDark 
                              ? 'bg-[#141414] border-white/10 text-white' 
                              : 'bg-white border-gray-200 text-black'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Checkout Experience</label>
                  <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>Show Trust Badges</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Display "Secure Payment" and "Instant Access"</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={formData.customization.showTrustBadges}
                      onChange={(e) => updateCustomization('showTrustBadges', e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Custom Checkout Message (Optional)</label>
                    <textarea 
                      value={formData.customization.checkoutMessage || ''}
                      onChange={(e) => updateCustomization('checkoutMessage', e.target.value)}
                      placeholder="e.g. Thanks for supporting my work!"
                      rows={2}
                      className={`w-full p-3 rounded-xl border outline-none resize-none ${
                        isDark 
                          ? 'bg-[#141414] border-white/10 text-white focus:border-white/30' 
                          : 'bg-white border-gray-200 focus:border-black'
                      }`}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {step === 4 && (
            <ConversionOptimizationStep
              personas={formData.personas}
              faq={formData.faq}
              onUpdatePersonas={(personas) => updateField('personas', personas)}
              onUpdateFAQ={(faq) => updateField('faq', faq)}
              productTitle={formData.title}
              productDescription={formData.description}
            />
          )}

          {step === 5 && (
            <div className="space-y-6 text-center py-12">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Ready to Publish</h3>
              <p className={`max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Your product is configured and ready for the world. Click publish to start selling.
              </p>
            </div>
          )}
        </WizardLayout>
      )}

      <AnimatePresence>
        {showCourseBuilder && (
          <CourseBuilder 
            initialData={formData.course}
            onSave={(data) => {
              updateField('course', data);
              setShowCourseBuilder(false);
            }}
            onCancel={() => setShowCourseBuilder(false)}
          />
        )}
        {showDigitalBuilder && (
          <DigitalProductBuilder 
            initialData={{
              mainFileUrl: formData.mainFileUrl,
              previewFileUrl: formData.previewFileUrl,
              coverUrl: formData.coverUrl,
              pages: formData.pages,
              language: formData.language,
              format: formData.format,
              fileSize: formData.fileSize,
              versionHistory: formData.versionHistory,
              license: formData.license,
              updatesIncluded: formData.updatesIncluded,
              deviceLimit: formData.deviceLimit
            }}
            onSave={(data) => {
              setFormData(prev => ({ ...prev, ...data }));
              setShowDigitalBuilder(false);
            }}
            onCancel={() => setShowDigitalBuilder(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

