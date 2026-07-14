import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Zap, Globe, MessageSquare, Layout, Palette, Settings, Eye, Sparkles } from 'lucide-react';
import { WizardLayout } from './WizardLayout';
import { CommunityBuilder } from '../dashboard/CommunityBuilder';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

const CommunityPreview = ({ data, isDark, type = 'card' }: { data: any, isDark: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className={`w-full p-8 font-sans ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
        <div className={`max-w-xl mx-auto rounded-2xl shadow-sm overflow-hidden border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="bg-purple-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome to the Community!</h2>
            <p className="text-purple-100 text-sm">You've been invited to join an exclusive group.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                {data.title.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Your Community'}</h3>
                <p className="text-sm text-gray-500">{data.category || 'Lifestyle'}</p>
              </div>
            </div>
            <div className={`py-4 border-y ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Membership</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>€{data.price || '0.00'}/mo</span>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.description || 'Join our community to connect with like-minded individuals.'}
            </p>
            <button className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-center">
              Join Community
            </button>
          </div>
          <div className={`p-4 text-center border-t ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee Communities</p>
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
              <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Join Community</h2>
              <div className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[10px] font-black uppercase tracking-widest">Membership</div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center font-bold text-purple-500">
                  {data.title.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{data.title || 'Your Community'}</h3>
                  <p className="text-xs text-gray-500">Monthly Subscription</p>
                </div>
              </div>
              <div className={`flex justify-between items-center pt-4 border-t ${isDark ? 'border-white/10 text-white' : 'border-gray-200 text-black'}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Due Today</span>
                <span className="text-xl font-black">€{data.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payment Method</label>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`}>
                  <div className="text-sm text-gray-400 italic">Select payment method...</div>
                </div>
              </div>
              <button className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 active:scale-[0.98]">
                Start Membership
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
        {/* Page Header */}
        <div className={`h-64 lg:h-80 ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-br from-purple-50 to-blue-50'} p-8 lg:p-12 flex flex-col justify-end relative`}>
          <div className={`absolute top-8 right-8 px-4 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-black/20 text-white' : 'bg-white/50 text-black'}`}>
            {data.category}
          </div>
          <div className="flex items-center gap-6 mb-6">
            <div className={`w-24 h-24 rounded-3xl shadow-2xl flex items-center justify-center text-4xl ${isDark ? 'bg-[#2A2A2A] text-white' : 'bg-white text-black'}`}>
              {data.title.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className={`text-3xl lg:text-5xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Your Community'}</h1>
              <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Join {Math.floor(Math.random() * 1000) + 100} members</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>About this Community</h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {data.description || 'Community description will appear here...'}
              </p>
            </div>
            
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Explore Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.metadata.community.categories[0].channels.map((ch: any, i: number) => (
                   <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl transition-all border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                     <span className="text-2xl">{ch.icon}</span>
                     <div>
                       <span className={`text-base font-bold block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{ch.name}</span>
                       <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{ch.type.toUpperCase()} CHANNEL</span>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Membership</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>€{data.price}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/ month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Full Access', 'Community Support', 'Exclusive Content'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feat}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-black text-white hover:bg-gray-800'}`}>
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[9/16] max-h-[600px] rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
      {/* Mock Header */}
      <div className={`h-40 ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-br from-purple-50 to-blue-50'} p-6 flex flex-col justify-end relative`}>
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-black/20 text-white' : 'bg-white/50 text-black'}`}>
          {data.category}
        </div>
        <div className={`w-16 h-16 rounded-2xl mb-4 shadow-lg flex items-center justify-center text-2xl ${isDark ? 'bg-[#2A2A2A] text-white' : 'bg-white text-black'}`}>
          {data.title.charAt(0) || 'C'}
        </div>
        <h1 className={`text-xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Your Community'}</h1>
      </div>
      
      {/* Mock Content */}
      <div className="p-6 space-y-6 flex-1 overflow-hidden">
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>About</div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.description || 'Community description will appear here...'}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Channels</div>
          {data.metadata.community.categories[0].channels.map((ch: any, i: number) => (
             <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
               <span className="text-lg">{ch.icon}</span>
               <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{ch.name}</span>
             </div>
          ))}
        </div>

        <div className={`mt-auto p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
          <span className="text-xs font-bold uppercase">Membership</span>
          <span className="font-bold">€{data.price}/mo</span>
        </div>
      </div>
    </div>
  );
};

export const CommunityWizard = ({ onClose, onCreated, draftId }: { onClose: () => void, onCreated?: (id: string) => void, draftId?: string | null }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: 'Business',
    images: [] as string[],
    metadata: {
      community: {
        categories: [
          {
            id: 'cat-1',
            title: 'START HERE',
            channels: [
              { id: 'ch-1', name: 'Welcome', type: 'feed', icon: '👋', access: 'public' },
              { id: 'ch-2', name: 'Rules', type: 'resource', icon: '📜', access: 'public', config: { isReadOnly: true } }
            ]
          }
        ],
        design: {
          primaryColor: '#000000',
          layout: 'sidebar',
          theme: 'light'
        },
        settings: {
          isPublic: true,
          membershipApproval: false,
          welcomeMessage: 'Welcome to our community!'
        },
        apps: []
      },
      access: 'paid',
      membershipLevels: [
        { name: 'Free', price: 0, features: ['Public Channels'] },
        { name: 'Pro', price: 29, features: ['All Channels', 'Direct Messages'] }
      ]
    }
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
          price: (formData.price || 0).toString(),
          category: 'Community',
          type: 'community',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData.metadata
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

  const handleComplete = async () => {
    if (step === 1 && !formData.title) {
      toast.error("Community Name is required.");
      return;
    }
    setLoading(true);
    try {
      const data = await DatabaseService.insert('listings', {
        title: formData.title,
        description: formData.description,
        price: (formData.price || 0).toString(),
        category: 'Community',
        type: 'community',
        user_id: user?.id,
        seller_id: user?.id,
        status: 'published',
        metadata: formData.metadata
      });

      if (onCreated && data) {
        onCreated(data.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setLoading(false);
    }
  };

  const enhanceText = async (field: 'title' | 'description') => {
    if (!formData[field]) return;
    setAiLoading(true);
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const prompt = field === 'title' 
        ? `Improve this community name: "${formData.title}". Return only the improved title.`
        : `Improve this community description: "${formData.description}". Return only the improved description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      const text = response.text;
      if (text) {
        setFormData({ ...formData, [field]: text.trim() });
      }
    } catch (error) {
      console.error('AI Enhancement failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleNext = async () => {
    if (step === 1 && !formData.title) {
      toast.error("Community Name is required.");
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
          price: (formData.price || 0).toString(),
          category: 'Community',
          type: 'community',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData.metadata
        });
        if (data) {
          // Update URL with the new draft ID
          window.history.replaceState(null, '', `/create/community/${data.id}`);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a community listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy community title",
          "description": "A detailed, engaging community description",
          "price": 29,
          "category": "Business"
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

  if (showBuilder) {
    return (
      <div className={`fixed inset-0 z-[60] flex flex-col ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className={`h-16 border-b flex items-center justify-between px-8 ${isDark ? 'bg-black border-white/10' : 'bg-white border-black/5'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Users className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>Community Architect</h2>
              <p className="text-xs text-gray-400">Designing {formData.title || 'your community'}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBuilder(false)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Done Designing
          </button>
        </div>
        <div className={`flex-1 p-8 overflow-hidden ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
          <CommunityBuilder 
            initialData={formData.metadata.community}
            onSave={(communityData) => {
              setFormData({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  community: communityData
                }
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <WizardLayout
      title="Create Community"
      currentStep={step}
      totalSteps={3}
      onClose={onClose}
      onBack={() => step > 1 ? setStep(step - 1) : onClose()}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 3}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <CommunityPreview data={formData} isDark={isDarkPreview} type={type} />}
      onAiGenerate={handleAiGenerate}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className={labelClass}>Community Name</label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`${inputClass} pr-12`}
                placeholder="e.g. The Mastermind Hub"
              />
              <button 
                onClick={() => enhanceText('title')}
                disabled={aiLoading || !formData.title}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isDark ? 'text-purple-400 hover:bg-purple-500/10' : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Description</label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} pr-12 min-h-[120px]`}
                placeholder="What is this community about?"
              />
              <button 
                onClick={() => enhanceText('description')}
                disabled={aiLoading || !formData.description}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isDark ? 'text-purple-400 hover:bg-purple-500/10' : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Base Price (€)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={inputClass}
                placeholder="0 for free"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={inputClass}
              >
                <option>Business</option>
                <option>Tech</option>
                <option>Lifestyle</option>
                <option>Education</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className={`p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl ${
            isDark ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/20'
          }`}>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Community Channels</h3>
              <p className={`text-sm ${isDark ? 'text-black/60' : 'text-white/60'}`}>Design your chat, feed, and forum structure</p>
            </div>
            <button 
              onClick={() => setShowBuilder(true)}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                isDark ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <Layout className="w-5 h-5" /> Open Builder
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Globe, title: 'Public Access', desc: 'Anyone can see and join' },
              { icon: Shield, title: 'Private Gating', desc: 'Members only access' },
              { icon: Zap, title: 'Paid Channels', desc: 'Monetize specific areas' },
              { icon: MessageSquare, title: 'Rich Interaction', desc: 'Chat, Feed, and Forums' }
            ].map((feature, i) => (
              <div key={i} className={`p-6 rounded-3xl border flex gap-4 ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-black/5'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                  isDark ? 'bg-[#1A1A1A]' : 'bg-white'
                }`}>
                  <feature.icon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{feature.title}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Membership Levels</h3>
          <div className="space-y-4">
            {formData.metadata.membershipLevels.map((level, i) => (
              <div key={i} className={`p-6 border rounded-3xl flex items-center justify-between ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-[#1A1A1A]' : 'bg-gray-100'
                  }`}>
                    <Zap className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{level.name}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{level.features.length} features included</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>€{level.price}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Per Month</p>
                </div>
              </div>
            ))}
            <button className={`w-full p-4 border-2 border-dashed rounded-3xl font-bold transition-all ${
              isDark 
                ? 'border-white/10 text-gray-400 hover:border-white hover:text-white' 
                : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'
            }`}>
              + Add Membership Level
            </button>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};

