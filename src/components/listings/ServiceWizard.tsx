import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle, AlertCircle, Clock, Users, Package } from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { WizardLayout } from './WizardLayout';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { replaceStandaloneListingDraftUrl } from '../../lib/listingWizardRoute';

interface ServiceWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const ServicePreview = ({ data, isDark, type = 'card' }: { data: any, isDark: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-black p-8 text-white text-center">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Service Booking!</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">A new client is interested in your services.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <Users className={`w-8 h-8 ${isDark ? 'text-white' : 'text-black'}`} />
              </div>
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Service Title'}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{data.category || 'Consulting'}</p>
              </div>
            </div>
            <div className={`py-4 border-y ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Starting from</span>
                <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.packages[0]?.price || '0.00'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You have a new inquiry for your {data.title} service. Review the details and respond to the client.
              </p>
              <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                Review Inquiry
              </button>
            </div>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee Services</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isDark ? 'bg-black' : 'bg-[#F8F9FA]'}`}>
        <div className={`w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-100'}`}>
          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Book Service</h2>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>Service</div>
            </div>

            <div className={`p-8 rounded-3xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <Users className={`w-7 h-7 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div>
                  <h3 className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Service Title'}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{data.packages[0]?.name}</p>
                </div>
              </div>
              <div className={`flex justify-between items-center pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.packages[0]?.price}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Requirements</label>
                <textarea 
                  className={`w-full p-6 rounded-3xl border outline-none h-32 resize-none font-medium placeholder:text-gray-300 ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                  placeholder="Tell us more about your needs..."
                />
              </div>
              <button className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-[0.98] ${isDark ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'}`}>
                Confirm Booking
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
        <div className={`p-10 lg:p-16 flex flex-col justify-end border-b ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-8 self-start ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {data.category}
          </div>
          <h1 className={`text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Service Title'}</h1>
        </div>
        
        <div className="p-10 lg:p-16 space-y-16 flex-1">
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose Your Package</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.packages.map((pkg: any, pIndex: number) => (
                <div key={pIndex} className={`p-8 rounded-[2.5rem] border transition-all group ${isDark ? 'bg-white/5 border-white/10 hover:border-white' : 'bg-gray-50 border-gray-100 hover:border-black'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</span>
                    <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>€{pkg.price}</span>
                  </div>
                  <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.description || 'Package description...'}</p>
                  <div className="space-y-4 mb-10">
                    {pkg.features.map((feat: string, i: number) => (
                      feat && <div key={i} className="text-xs font-bold text-gray-400 flex items-center gap-3">
                        <CheckCircle className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} /> {feat}
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-4 border rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isDark ? 'bg-transparent border-white/20 text-white group-hover:bg-white group-hover:text-black group-hover:border-white' : 'bg-white border-gray-200 text-black group-hover:bg-black group-hover:text-white group-hover:border-black'}`}>
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
        <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
          {data.category}
        </div>
        <h2 className={`text-4xl font-black tracking-tighter mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {data.title || 'Service Title'}
        </h2>

        <div className="space-y-8">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Packages</h4>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.packages[0].name}</span>
                <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.packages[0].price}</span>
              </div>
              <p className="text-gray-400 text-xs mb-4">{data.packages[0].description || 'Package description...'}</p>
              <div className="space-y-2">
                {data.packages[0].features.map((feat: string, i: number) => (
                  feat && <div key={i} className="text-[10px] font-black text-gray-400 flex items-center gap-2">
                    <CheckCircle className={`w-3 h-3 ${isDark ? 'text-white' : 'text-black'}`} /> {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {data.addons.length > 0 && data.addons[0].name && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Add-ons</h4>
              <div className="space-y-2">
                {data.addons.map((addon: any, i: number) => (
                  addon.name && <div key={i} className={`flex justify-between items-center py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{addon.name}</span>
                    <span className="text-sm font-bold text-gray-400">+€{addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`p-10 border-t flex items-center justify-between ${isDark ? 'bg-black border-white/5' : 'bg-white border-gray-50'}`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Starting Price
        </span>
        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          €{data.packages[0].price || '0.00'}
        </span>
      </div>
    </div>
  );
};

export const ServiceWizard = ({ onClose, onCreated, draftId }: ServiceWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Graphic Design',
    serviceType: 'fixed', // fixed, subscription
    packages: [
      { name: 'Basic', price: '', description: '', deliveryTime: '3', revisions: '1', features: [''] }
    ],
    addons: [{ name: 'Fast Delivery', price: '25' }],
    requirements: [{ question: 'Please describe your needs', type: 'text' }],
    capacityPerWeek: '5',
    availability: '',
    revisionPolicy: 'limited', // limited, unlimited
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
          description: formData.packages[0].description,
          price: parseFloat(formData.packages[0].price) || 0,
          category: formData.category,
          type: 'service',
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
      toast.error("Service Title is required.");
      return;
    }

    // If it's the first step and no draftId, create the draft
    if (step === 1 && !draftId && user) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 10);

        const data = await DatabaseService.insert('listings', {
          title: formData.title,
          description: formData.packages[0].description,
          price: parseFloat(formData.packages[0].price) || 0,
          category: formData.category,
          type: 'service',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          replaceStandaloneListingDraftUrl('service', data.id);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    if (step < 6) {
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
        description: formData.packages[0].description, // Use basic package desc as main
        price: parseFloat(formData.packages[0].price) || 0, // Base price
        category: formData.category,
        type: 'service',
        user_id: user?.id,
        seller_id: user?.id,
        status: 'published',
        metadata: {
          ...formData,
        }
      });

      if (onCreated && data) {
        onCreated(data.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating service:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Package Builder
  const addPackage = () => {
    if (formData.packages.length < 3) {
      setFormData(prev => ({
        ...prev,
        packages: [...prev.packages, { name: 'New Package', price: '', description: '', deliveryTime: '3', revisions: '1', features: [''] }]
      }));
    }
  };

  const updatePackage = (index: number, field: string, value: any) => {
    const newPackages = [...formData.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const addFeature = (pkgIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[pkgIndex].features.push('');
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const updateFeature = (pkgIndex: number, featIndex: number, value: string) => {
    const newPackages = [...formData.packages];
    newPackages[pkgIndex].features[featIndex] = value;
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a service listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy service title",
          "category": "Graphic Design",
          "packages": [
            {
              "name": "Basic",
              "price": "49",
              "description": "A detailed description of the basic package",
              "deliveryTime": "3",
              "revisions": "1",
              "features": ["Feature 1", "Feature 2", "Feature 3"]
            }
          ]
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
            category: data.category || prev.category,
            packages: data.packages || prev.packages
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
      title="Offer a Service"
      currentStep={step}
      totalSteps={6}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 6}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <ServicePreview data={formData} isDark={isDarkPreview} type={type} />}
      aiKind="service"
      aiCurrentDraft={{ title: formData.title, description: formData.packages[0]?.description || '', category: formData.category, price: Number(formData.packages[0]?.price) || 0, features: formData.packages[0]?.features || [] }}
      onAiApply={(patch) => setFormData((current) => ({ ...current, ...(typeof patch.title === 'string' ? { title: patch.title } : {}), ...(typeof patch.category === 'string' ? { category: patch.category } : {}), packages: current.packages.map((item, index) => index === 0 ? { ...item, ...(typeof patch.description === 'string' ? { description: patch.description } : {}), ...(typeof patch.price === 'number' ? { price: String(patch.price) } : {}), ...(Array.isArray(patch.features) ? { features: patch.features as string[] } : {}) } : item) }))}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Service Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Professional Logo Design"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={inputClass}
            >
              <option value="Graphic Design">Graphic Design</option>
              <option value="Writing">Writing</option>
              <option value="Marketing">Marketing</option>
              <option value="Programming">Programming</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Service Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateField('serviceType', 'fixed')}
                className={`p-6 rounded-3xl border-2 text-left transition-all group ${
                  formData.serviceType === 'fixed'
                    ? 'border-white bg-white/10 shadow-2xl shadow-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="font-black italic uppercase tracking-tighter text-white text-lg">Fixed Package</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">One-time delivery</div>
              </button>
              <button
                onClick={() => updateField('serviceType', 'subscription')}
                className={`p-6 rounded-3xl border-2 text-left transition-all group ${
                  formData.serviceType === 'subscription'
                    ? 'border-white bg-white/10 shadow-2xl shadow-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="font-black italic uppercase tracking-tighter text-white text-lg">Subscription</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Monthly retainer</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Packages</h3>
            {formData.packages.length < 3 && (
              <button onClick={addPackage} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                + Add Package
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-2">
            {formData.packages.map((pkg, pIndex) => (
              <div key={pIndex} className={`p-4 rounded-xl border shadow-sm min-w-[250px] ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'
              }`}>
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePackage(pIndex, 'name', e.target.value)}
                  className={`w-full font-bold text-lg mb-2 border-b border-transparent outline-none ${
                    isDark ? 'bg-transparent text-white focus:border-white/20' : 'bg-transparent text-black focus:border-gray-300'
                  }`}
                  placeholder="Package Name"
                />
                <div className="relative mb-3">
                  <span className={`absolute left-2 top-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>€</span>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => updatePackage(pIndex, 'price', e.target.value)}
                    className={`w-full pl-6 p-2 rounded-lg text-sm outline-none ${
                      isDark ? 'bg-[#1A1A1A] text-white' : 'bg-gray-50 text-black'
                    }`}
                    placeholder="Price"
                  />
                </div>
                <textarea
                  value={pkg.description}
                  onChange={(e) => updatePackage(pIndex, 'description', e.target.value)}
                  className={`w-full p-2 rounded-lg text-sm mb-3 resize-none outline-none ${
                    isDark ? 'bg-[#1A1A1A] text-white' : 'bg-gray-50 text-black'
                  }`}
                  rows={3}
                  placeholder="Description..."
                />
                <div className="space-y-2 mb-3">
                  {pkg.features.map((feat, fIndex) => (
                    <div key={fIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => updateFeature(pIndex, fIndex, e.target.value)}
                        className={`flex-1 text-xs border-b outline-none ${
                          isDark 
                            ? 'bg-transparent text-gray-300 border-white/10 focus:border-white/30' 
                            : 'bg-transparent text-gray-600 border-gray-100 focus:border-gray-300'
                        }`}
                        placeholder="Feature"
                      />
                    </div>
                  ))}
                  <button onClick={() => addFeature(pIndex)} className="text-xs text-blue-500 hover:underline">
                    + Add Feature
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Add-ons (Upselling)</h3>
          <div className="space-y-3">
            {formData.addons.map((addon, index) => (
              <div key={index} className={`flex gap-3 items-center p-3 rounded-xl ${
                isDark ? 'bg-[#141414]' : 'bg-gray-50'
              }`}>
                <input
                  type="text"
                  value={addon.name}
                  onChange={(e) => {
                    const newAddons = [...formData.addons];
                    newAddons[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, addons: newAddons }));
                  }}
                  placeholder="Add-on Name (e.g. Fast Delivery)"
                  className={`flex-1 p-2 rounded-lg border outline-none ${
                    isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200 text-black'
                  }`}
                />
                <div className="relative w-24">
                  <span className={`absolute left-2 top-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>€</span>
                  <input
                    type="number"
                    value={addon.price}
                    onChange={(e) => {
                      const newAddons = [...formData.addons];
                      newAddons[index].price = e.target.value;
                      setFormData(prev => ({ ...prev, addons: newAddons }));
                    }}
                    className={`w-full pl-6 p-2 rounded-lg border outline-none ${
                      isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200 text-black'
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    const newAddons = formData.addons.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, addons: newAddons }));
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', price: '' }] }))}
              className="flex items-center gap-2 text-sm font-medium text-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Extra Service
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Requirements for Client</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>What do you need to start working?</p>
          
          <div className="space-y-3">
            {formData.requirements.map((req, index) => (
              <div key={index} className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <input
                  type="text"
                  value={req.question}
                  onChange={(e) => {
                    const newReqs = [...formData.requirements];
                    newReqs[index].question = e.target.value;
                    setFormData(prev => ({ ...prev, requirements: newReqs }));
                  }}
                  className={`w-full font-medium mb-2 bg-transparent outline-none ${isDark ? 'text-white' : 'text-black'}`}
                  placeholder="Question for client..."
                />
                <select
                  value={req.type}
                  onChange={(e) => {
                    const newReqs = [...formData.requirements];
                    newReqs[index].type = e.target.value;
                    setFormData(prev => ({ ...prev, requirements: newReqs }));
                  }}
                  className={`text-sm p-2 rounded-lg border outline-none ${
                    isDark ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-gray-200 text-black'
                  }`}
                >
                  <option value="text">Free Text</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
            ))}
            <button
              onClick={() => setFormData(prev => ({ ...prev, requirements: [...prev.requirements, { question: '', type: 'text' }] }))}
              className="flex items-center gap-2 text-sm font-medium text-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Capacity</label>
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              isDark ? 'bg-[#141414]' : 'bg-gray-50'
            }`}>
              <Users className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="number"
                value={formData.capacityPerWeek}
                onChange={(e) => updateField('capacityPerWeek', e.target.value)}
                className={`bg-transparent outline-none font-medium w-20 ${isDark ? 'text-white' : 'text-black'}`}
              />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>orders per week</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Available Moments</label>
            <textarea
              value={formData.availability || ''}
              onChange={(e) => updateField('availability', e.target.value)}
              placeholder="e.g. Intake calls on Mon/Wed/Fri, delivery starts within 2 business days"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Revision Policy</label>
            <select
              value={formData.revisionPolicy}
              onChange={(e) => updateField('revisionPolicy', e.target.value)}
              className={inputClass}
            >
              <option value="limited">Limited Revisions (Specified in package)</option>
              <option value="unlimited">Unlimited Revisions</option>
            </select>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>Service Ready</h3>
            <p className={`mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              You are responsible for the quality of the delivered service.
            </p>
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              <AlertCircle className="w-4 h-4" />
              <span>Payments are held in escrow until the client approves the work.</span>
            </div>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
