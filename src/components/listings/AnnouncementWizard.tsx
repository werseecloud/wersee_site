import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Link as LinkIcon, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { WizardLayout } from './WizardLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DatabaseService } from '../../services/databaseService';
import { FileUpload } from '../FileUpload';
import { toast } from 'sonner';

interface AnnouncementWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const AnnouncementPreview = ({ data, isDark, type = 'card' }: { data: any, isDark: boolean, type?: 'card' | 'page' | 'email' | 'checkout' }) => {
  if (type === 'email') {
    return (
      <div className="w-full bg-gray-100 p-8 font-sans">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-amber-500 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">New Announcement!</h2>
            <p className="text-amber-100 text-sm">Stay updated with our latest news and updates.</p>
          </div>
          <div className="p-8 space-y-6">
            {data.image && (
              <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden">
                <img src={data.image} alt="Announcement" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{data.title || 'Announcement Title'}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {data.message || 'No message provided.'}
            </p>
            {data.link && (
              <button className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-center">
                Read More
              </button>
            )}
          </div>
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent via Wersee News</p>
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
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Announcement</h2>
              <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">Update</div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <h3 className="font-bold text-xl mb-4">{data.title || 'Announcement Title'}</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{data.message}</p>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-center text-gray-500">This is a public announcement. No checkout required.</p>
              <button className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-[0.98]">
                Got it!
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
        <div className={`p-8 lg:p-12 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Megaphone className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Official Announcement</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Published just now</p>
            </div>
          </div>
          
          <h2 className={`text-3xl lg:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
            {data.title || 'Announcement Title'}
          </h2>
          <p className={`text-xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.description || 'Your announcement text will appear here...'}
          </p>
        </div>

        {data.imageUrl && (
          <div className="relative aspect-video bg-gray-100">
            <img src={data.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
          </div>
        )}

        {data.linkUrl && (
          <div className={`p-8 lg:p-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <a 
              href={data.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-6 p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#141414] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-black'}`}
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                <LinkIcon className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-lg font-bold truncate mb-1 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                  {data.linkUrl}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Click to visit external link
                </p>
              </div>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Announcement</h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Just now</p>
          </div>
        </div>
        
        <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
          {data.title || 'Announcement Title'}
        </h2>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.description || 'Your announcement text will appear here...'}
        </p>
      </div>

      {data.imageUrl && (
        <div className="relative aspect-video bg-gray-100">
          <img src={data.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
        </div>
      )}

      {data.linkUrl && (
        <div className={`p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <LinkIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                {data.linkUrl}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                External Link
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnouncementWizard = ({ onClose, onCreated, draftId }: AnnouncementWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);

  const inputClass = "w-full px-6 py-4 bg-[#141414] border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    category: 'Announcement'
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
          price: 0,
          category: 'Announcement',
          type: 'announcement',
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
      toast.error("Announcement Title is required.");
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
          price: 0,
          category: 'Announcement',
          type: 'announcement',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          window.history.replaceState(null, '', `/create/announcement/${data.id}`);
        }
      } catch (error) {
        console.error('Error creating initial draft:', error);
      }
    }

    if (step < 2) {
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
        price: 0,
        category: 'Announcement',
        type: 'announcement',
        user_id: user?.id,
        seller_id: user?.id,
        status: 'published',
        metadata: {
          ...formData
        }
      });

      if (onCreated && data) {
        onCreated(data.id);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate an announcement for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy announcement title",
          "description": "A detailed, engaging announcement message"
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
            description: data.description || prev.description
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
      title="Make an Announcement"
      currentStep={step}
      totalSteps={2}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 2}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <AnnouncementPreview data={formData} isDark={isDarkPreview} type={type} />}
      onAiGenerate={handleAiGenerate}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's new?"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Message</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Share the details..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Add an Image (Optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FileUpload
                bucket="listings"
                onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                label="Upload Image"
                accept=".jpg,.png,.webp"
                maxSizeMB={5}
                darkMode={isDark}
              />
              {formData.imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Add a Link (Optional)</label>
            <div className="relative">
              <LinkIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://..."
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
