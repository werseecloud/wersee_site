import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Calendar, MapPin, DollarSign, Briefcase, CheckCircle, AlertCircle, Building2, Globe, Clock, Zap } from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { WizardLayout } from './WizardLayout';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { replaceStandaloneListingDraftUrl } from '../../lib/listingWizardRoute';

interface JobWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

const JobPreview = ({ data, isDark }: { data: any, isDark: boolean }) => {
  return (
    <div className={`w-full h-full overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl border flex flex-col ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
      {/* Cover Image */}
      <div className="h-32 w-full bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        {data.coverUrl && <img src={data.coverUrl} className="w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Cover" />}
        <div className={`absolute -bottom-8 left-6 w-16 h-16 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? 'bg-black border-[#1A1A1A]' : 'bg-white border-white'}`}>
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Building2 className={`w-8 h-8 ${isDark ? 'text-white' : 'text-gray-400'}`} />
          )}
        </div>
      </div>

      <div className="pt-12 p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.title || 'Job Title'}</h1>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{data.company || 'Company Name'}</p>
          </div>
          <button className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Apply</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {data.locationType === 'remote' ? 'Remote' : data.locationAddress || 'Location'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {data.jobType || 'Full-time'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {data.salaryRange ? `${data.currency || '€'}${data.salaryRange}` : 'Competitive'}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>About the role</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {data.shortDescription || 'Brief hook about the job...'}
            </p>
          </div>

          {data.skills.length > 0 && (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill: string, i: number) => (
                  <span key={i} className={`px-2 py-1 rounded-md text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const JobWizard = ({ onClose, onCreated, draftId }: JobWizardProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!draftId);
  const [formData, setFormData] = useState({
    // Basic
    title: '',
    company: '',
    locationType: 'remote', // remote, hybrid, onsite
    locationAddress: '',
    jobType: 'full-time', // full-time, part-time, freelance, internship
    salaryRange: '',
    currency: '€',
    shortDescription: '',
    // Details
    description: '',
    responsibilities: [''],
    requirements: [''],
    niceToHave: [''],
    benefits: [''],
    // Filters
    skills: [] as string[],
    experienceLevel: 'medior', // junior, medior, senior
    industry: '',
    languages: '',
    timezone: '',
    // Compensation
    equity: '',
    bonus: '',
    commission: '',
    // Hiring Setup
    applicationType: 'quick', // quick, external, custom
    externalLink: '',
    deadline: '',
    numberOfHires: '1',
    urgency: 'normal', // normal, urgent, high
    // Screening
    customQuestions: [{ question: '', type: 'open', required: true }],
    // Media
    logoUrl: '',
    coverUrl: '',
    videoUrl: '',
    website: '',
    socials: '',
    // Advanced
    autoShortlist: false,
    autoDm: false,
    teamCollaboration: false,
    contractGeneration: false,
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
          category: formData.industry || 'Jobs',
          type: 'job',
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
    if (step === 1 && (!formData.title || !formData.company)) {
      toast.error("Job Title and Company are required.");
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
          category: formData.industry || 'Jobs',
          type: 'job',
          user_id: user.id,
          seller_id: user.id,
          status: 'draft',
          expires_at: expiresAt.toISOString(),
          metadata: formData
        });
        if (data) {
          // Update URL with the new draft ID
          replaceStandaloneListingDraftUrl('job', data.id);
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
        description: formData.description,
        price: 0, // Jobs might not have a fixed price in the same way
        category: formData.industry || 'Jobs',
        type: 'job',
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
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayUpdate = (field: keyof typeof formData, index: number, value: string) => {
    const newArray = [...(formData[field] as string[])];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addArrayItem = (field: keyof typeof formData) => {
    updateField(field, [...(formData[field] as string[]), '']);
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    const newArray = (formData[field] as string[]).filter((_, i) => i !== index);
    updateField(field, newArray);
  };

  const inputClass = "w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-gray-600 font-medium";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1";

  const handleAiGenerate = async (prompt: string) => {
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a job listing for: "${prompt}". 
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A catchy job title",
          "shortDescription": "A 1-2 sentence hook",
          "description": "A detailed job description",
          "responsibilities": ["Resp 1", "Resp 2"],
          "requirements": ["Req 1", "Req 2"],
          "skills": ["Skill 1", "Skill 2"]
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
            shortDescription: data.shortDescription || prev.shortDescription,
            description: data.description || prev.description,
            responsibilities: data.responsibilities || prev.responsibilities,
            requirements: data.requirements || prev.requirements,
            skills: data.skills || prev.skills
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
      title="Create Job Listing"
      currentStep={step}
      totalSteps={6}
      onClose={onClose}
      onBack={handleBack}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 6}
      loading={loading}
      variant="fullscreen"
      preview={(type, isDarkPreview) => <JobPreview data={formData} isDark={isDarkPreview} />}
      aiKind="job"
      aiCurrentDraft={{ title: formData.title, shortDescription: formData.shortDescription, description: formData.description, category: formData.industry || 'Jobs', price: 0, features: formData.skills }}
      onAiApply={(patch) => setFormData((current) => ({ ...current, ...(typeof patch.title === 'string' ? { title: patch.title } : {}), ...(typeof patch.shortDescription === 'string' ? { shortDescription: patch.shortDescription } : {}), ...(typeof patch.description === 'string' ? { description: patch.description } : {}), ...(typeof patch.category === 'string' ? { industry: patch.category } : {}), ...(Array.isArray(patch.features) ? { skills: patch.features as string[] } : {}) }))}
    >
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job Title</label>
              <input type="text" value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Senior React Developer" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company Name</label>
              <input type="text" value={formData.company} onChange={(e) => updateField('company', e.target.value)} placeholder="Your Company" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job Type</label>
              <select value={formData.jobType} onChange={(e) => updateField('jobType', e.target.value)} className={inputClass}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Location Type</label>
              <select value={formData.locationType} onChange={(e) => updateField('locationType', e.target.value)} className={inputClass}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          {formData.locationType !== 'remote' && (
            <div>
              <label className={labelClass}>City + Country</label>
              <input type="text" value={formData.locationAddress} onChange={(e) => updateField('locationAddress', e.target.value)} placeholder="e.g. Amsterdam, NL" className={inputClass} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Salary Range (Optional)</label>
              <input type="text" value={formData.salaryRange} onChange={(e) => updateField('salaryRange', e.target.value)} placeholder="e.g. 60k - 80k" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select value={formData.currency} onChange={(e) => updateField('currency', e.target.value)} className={inputClass}>
                <option value="€">EUR (€)</option>
                <option value="$">USD ($)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Short Description (Hook)</label>
            <textarea value={formData.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} placeholder="1-2 sentences to hook candidates..." rows={2} className={`${inputClass} resize-none`} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Job Details</h2>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="What will they do? About the company..." rows={6} className={`${inputClass} resize-none`} />
          </div>

          {['responsibilities', 'requirements', 'niceToHave', 'benefits'].map((field) => (
            <div key={field}>
              <label className={labelClass}>{field.replace(/([A-Z])/g, ' $1').trim()}</label>
              <div className="space-y-2">
                {(formData[field as keyof typeof formData] as string[]).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={item} onChange={(e) => handleArrayUpdate(field as any, index, e.target.value)} placeholder={`Add ${field}...`} className={inputClass} />
                    <button onClick={() => removeArrayItem(field as any, index)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => addArrayItem(field as any)} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Item</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Smart Filters & Compensation</h2>
          
          <div>
            <label className={labelClass}>Skills Tags (comma separated)</label>
            <input type="text" value={formData.skills.join(', ')} onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()))} placeholder="React, Node.js, Sales..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Experience Level</label>
              <select value={formData.experienceLevel} onChange={(e) => updateField('experienceLevel', e.target.value)} className={inputClass}>
                <option value="junior">Junior</option>
                <option value="medior">Medior</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Industry</label>
              <input type="text" value={formData.industry} onChange={(e) => updateField('industry', e.target.value)} placeholder="e.g. SaaS, Fintech" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Equity / Revenue Share</label>
              <input type="text" value={formData.equity} onChange={(e) => updateField('equity', e.target.value)} placeholder="e.g. 1-2% Equity" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Commission / Bonus</label>
              <input type="text" value={formData.bonus} onChange={(e) => updateField('bonus', e.target.value)} placeholder="e.g. 10% OTE" className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Hiring Setup & Screening</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Application Type</label>
              <select value={formData.applicationType} onChange={(e) => updateField('applicationType', e.target.value)} className={inputClass}>
                <option value="quick">Quick Apply (Wersee Profile)</option>
                <option value="external">External Link</option>
                <option value="custom">Custom Form</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Urgency Level</label>
              <select value={formData.urgency} onChange={(e) => updateField('urgency', e.target.value)} className={inputClass}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {formData.applicationType === 'external' && (
            <div>
              <label className={labelClass}>External Application Link</label>
              <input type="url" value={formData.externalLink} onChange={(e) => updateField('externalLink', e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
          )}

          {formData.applicationType === 'custom' && (
            <div>
              <label className={labelClass}>Custom Screening Questions</label>
              <div className="space-y-4">
                {formData.customQuestions.map((q, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                    <input type="text" value={q.question} onChange={(e) => {
                      const newQ = [...formData.customQuestions];
                      newQ[index].question = e.target.value;
                      updateField('customQuestions', newQ);
                    }} placeholder="e.g. Do you have 3 years experience?" className={inputClass} />
                    <div className="flex gap-4">
                      <select value={q.type} onChange={(e) => {
                        const newQ = [...formData.customQuestions];
                        newQ[index].type = e.target.value;
                        updateField('customQuestions', newQ);
                      }} className={inputClass}>
                        <option value="open">Open Question</option>
                        <option value="yesno">Yes/No (Knock-out)</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                      <button onClick={() => {
                        const newQ = formData.customQuestions.filter((_, i) => i !== index);
                        updateField('customQuestions', newQ);
                      }} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateField('customQuestions', [...formData.customQuestions, { question: '', type: 'open', required: true }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Question</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Media & Branding</h2>
          
          <div>
            <label className={labelClass}>Company Logo URL</label>
            <input type="url" value={formData.logoUrl} onChange={(e) => updateField('logoUrl', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cover/Banner Image URL</label>
            <input type="url" value={formData.coverUrl} onChange={(e) => updateField('coverUrl', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Video Intro URL (Optional)</label>
            <input type="url" value={formData.videoUrl} onChange={(e) => updateField('videoUrl', e.target.value)} placeholder="YouTube or Vimeo link" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Website</label>
              <input type="url" value={formData.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Socials</label>
              <input type="text" value={formData.socials} onChange={(e) => updateField('socials', e.target.value)} placeholder="LinkedIn, Twitter..." className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Advanced Settings (Wersee Pro)</h2>
          
          <div className="space-y-4">
            {[
              { id: 'autoShortlist', label: 'Auto Shortlist', desc: 'AI ranks candidates based on match score' },
              { id: 'autoDm', label: 'Auto DM', desc: 'Send automatic messages on accept/reject' },
              { id: 'teamCollaboration', label: 'Team Collaboration', desc: 'Add multiple reviewers to this job' },
              { id: 'contractGeneration', label: 'Contract Generation', desc: 'Wersee prepares a contract upon hire' }
            ].map((setting) => (
              <label key={setting.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData[setting.id as keyof typeof formData] as boolean}
                  onChange={(e) => updateField(setting.id, e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-black text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-white">{setting.label}</div>
                  <div className="text-xs text-gray-400">{setting.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
