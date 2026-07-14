import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseService } from '../services/databaseService';
import { appToast } from '@/lib/feedback';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Send
} from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface Form {
  id: string;
  title: string;
  description?: string;
  steps: FormStep[];
  status: 'draft' | 'active';
  theme_color?: string;
}

export const FormPublicView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data, error } = await DatabaseService.get('forms', {
          eq: { slug: slug, status: 'active' },
          single: true
        });

        if (error) throw error;
        setForm(data as any);
      } catch (err: any) {
        console.error('Error fetching form:', err);
        setError('Form not found or is currently inactive.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchForm();
  }, [slug]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleNext = () => {
    if (!form) return;
    
    // Basic validation for current step
    const currentStep = form.steps[currentStepIdx];
    const missingRequired = currentStep.fields.some(f => f.required && !formData[f.id]);
    
    if (missingRequired) {
      appToast('Please fill in all required fields.');
      return;
    }

    if (currentStepIdx < form.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    try {
      const { error } = await DatabaseService.insert('form_submissions', {
        form_id: form.id,
        data: formData
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      appToast('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-white/60 mb-6">{error || 'Form not found'}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-white text-black rounded-xl font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-white/60 mb-8">Your submission has been received successfully.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-white text-black rounded-xl font-medium"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const currentStep = form.steps[currentStepIdx];
  const progress = ((currentStepIdx + 1) / form.steps.length) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-white transition-all duration-500"
        />
      </div>

      <div className="max-w-2xl w-full">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12"
        >
          <div className="mb-8">
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2 block">
              Step {currentStepIdx + 1} of {form.steps.length}
            </span>
            <h1 className="text-3xl font-bold text-white mb-2">{currentStep.title}</h1>
            {currentStep.description && (
              <p className="text-white/60">{currentStep.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {currentStep.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-white/80 block">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors min-h-[120px] resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  >
                    <option value="" disabled className="bg-zinc-900 text-white/40">Select an option</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={formData[field.id] === opt}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                            formData[field.id] === opt ? 'border-white bg-white' : 'border-white/20 bg-transparent'
                          }`} />
                          {formData[field.id] === opt && (
                            <div className="absolute w-2 h-2 rounded-full bg-black" />
                          )}
                        </div>
                        <span className="text-white/60 group-hover:text-white transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={!!formData[field.id]}
                        onChange={(e) => handleInputChange(field.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                        formData[field.id] ? 'border-white bg-white' : 'border-white/20 bg-transparent'
                      }`}>
                        {formData[field.id] && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                    </div>
                    <span className="text-white/60 group-hover:text-white transition-colors">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIdx === 0}
              className={`flex items-center space-x-2 text-white/40 hover:text-white transition-colors ${
                currentStepIdx === 0 ? 'opacity-0 pointer-events-none' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{currentStepIdx === form.steps.length - 1 ? 'Submit' : 'Next'}</span>
                  {currentStepIdx === form.steps.length - 1 ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-white/20 text-xs">
            Powered by Wersee Forms
          </p>
        </div>
      </div>
    </div>
  );
};
