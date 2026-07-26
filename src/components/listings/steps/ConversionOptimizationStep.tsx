import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Users, MessageSquare, HelpCircle, Loader2 } from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../../lib/geminiClient";
import { useTheme } from '../../../context/ThemeContext';

interface Persona {
  role: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ConversionOptimizationStepProps {
  personas: Persona[];
  faq: FAQ[];
  onUpdatePersonas: (personas: Persona[]) => void;
  onUpdateFAQ: (faq: FAQ[]) => void;
  productTitle: string;
  productDescription: string;
}

export const ConversionOptimizationStep = ({
  personas,
  faq,
  onUpdatePersonas,
  onUpdateFAQ,
  productTitle,
  productDescription
}: ConversionOptimizationStepProps) => {
  const { isDark } = useTheme();
  const [aiLoading, setAiLoading] = useState<'personas' | 'faq' | null>(null);

  const inputClass = `w-full p-3 rounded-xl border outline-none transition-all ${
    isDark 
      ? 'bg-[#141414] border-white/10 text-white focus:ring-2 focus:ring-white/10 focus:border-white/20 placeholder-gray-600' 
      : 'bg-white border-gray-200 text-black focus:ring-2 focus:ring-black/5 focus:border-black placeholder-gray-400'
  }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

  const generateAIContent = async (type: 'personas' | 'faq') => {
    if (!productTitle) return;
    setAiLoading(type);
    
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      
      let prompt = '';
      if (type === 'personas') {
        prompt = `Generate 3 buyer personas for a product titled "${productTitle}" with description "${productDescription}". 
        Return a JSON array of objects with "role" and "description" keys. 
        Example: [{"role": "Busy Mom", "description": "Needs quick solutions..."}]
        Return ONLY the JSON array.`;
      } else {
        prompt = `Generate 5 Frequently Asked Questions (FAQ) for a product titled "${productTitle}" with description "${productDescription}". 
        Return a JSON array of objects with "question" and "answer" keys.
        Example: [{"question": "Is it durable?", "answer": "Yes, made of..."}]
        Return ONLY the JSON array.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (type === 'personas') {
          onUpdatePersonas([...personas, ...data]);
        } else {
          onUpdateFAQ([...faq, ...data]);
        }
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Conversion Optimization</h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Add personas and FAQs to help potential buyers understand who this product is for and answer their questions.
        </p>
      </div>

      {/* Personas Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Target Personas</label>
          <button
            onClick={() => generateAIContent('personas')}
            disabled={!!aiLoading || !productTitle}
            className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {aiLoading === 'personas' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate with AI
          </button>
        </div>

        <div className="space-y-3">
          {personas.map((persona, index) => (
            <div key={index} className={`p-4 rounded-xl border relative group space-y-3 ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={persona.role}
                    onChange={(e) => {
                      const newPersonas = [...personas];
                      newPersonas[index].role = e.target.value;
                      onUpdatePersonas(newPersonas);
                    }}
                    placeholder="e.g. Marketing Manager"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={persona.description}
                    onChange={(e) => {
                      const newPersonas = [...personas];
                      newPersonas[index].description = e.target.value;
                      onUpdatePersonas(newPersonas);
                    }}
                    placeholder="Why is this product for them?"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                onClick={() => onUpdatePersonas(personas.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onUpdatePersonas([...personas, { role: '', description: '' }])}
            className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isDark 
                ? 'border-white/10 text-gray-400 hover:border-white hover:text-white' 
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Persona
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Frequently Asked Questions</label>
          <button
            onClick={() => generateAIContent('faq')}
            disabled={!!aiLoading || !productTitle}
            className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {aiLoading === 'faq' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate with AI
          </button>
        </div>

        <div className="space-y-3">
          {faq.map((item, index) => (
            <div key={index} className={`p-4 rounded-xl border relative group space-y-3 ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <input
                type="text"
                value={item.question}
                onChange={(e) => {
                  const newFaq = [...faq];
                  newFaq[index].question = e.target.value;
                  onUpdateFAQ(newFaq);
                }}
                placeholder="Question"
                className={`font-bold ${inputClass}`}
              />
              <textarea
                value={item.answer}
                onChange={(e) => {
                  const newFaq = [...faq];
                  newFaq[index].answer = e.target.value;
                  onUpdateFAQ(newFaq);
                }}
                placeholder="Answer"
                rows={2}
                className={`${inputClass} resize-none`}
              />
              <button
                onClick={() => onUpdateFAQ(faq.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onUpdateFAQ([...faq, { question: '', answer: '' }])}
            className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isDark 
                ? 'border-white/10 text-gray-400 hover:border-white hover:text-white' 
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
            }`}
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      </div>
    </div>
  );
};
