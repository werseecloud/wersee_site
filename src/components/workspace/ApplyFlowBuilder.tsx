import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Save, Sparkles, Trash2, GripVertical, MessageSquare, CheckSquare, FileUp, ToggleLeft } from 'lucide-react';
import { invokeApiRunner } from '../../lib/supabase';
import { Type, getGeminiClient } from '../../lib/geminiClient';

let aiClient = getGeminiClient();

const getAiClient = () => {
  return aiClient;
};

interface Question {
  id?: string;
  question: string;
  type: 'open' | 'multiple_choice' | 'yes_no' | 'file_upload';
  logic_rules?: any;
}

export const ApplyFlowBuilder = ({ jobId, user, onBack }: { jobId: string, user: any, onBack: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<any>({});
  const [jobDetails, setJobDetails] = useState<any>(null);

  useEffect(() => {
    fetchFlow();
  }, [jobId]);

  const fetchFlow = async () => {
    setLoading(true);
    try {
      const response = await invokeApiRunner('jobs/apply-flow/get', { jobId });
      if (response.success && response.data) {
        setQuestions(response.data.job_questions || []);
        setConfig(response.data.config || {});
      }
      
      // Fetch job details for AI generation context
      const { data: jobData } = await invokeApiRunner('business/get-listing', { id: jobId });
      if (jobData) {
        setJobDetails(jobData);
      }
    } catch (error) {
      console.error("Error fetching flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveFlow = async () => {
    setSaving(true);
    try {
      await invokeApiRunner('jobs/apply-flow/save', {
        jobId,
        config,
        questions
      });
      // Show success toast here
    } catch (error) {
      console.error("Error saving flow:", error);
    } finally {
      setSaving(false);
    }
  };

  const generateQuestions = async () => {
    if (!jobDetails) return;
    setGenerating(true);
    try {
      const ai = getAiClient();
      if (!ai) throw new Error('Gemini API key is missing');

      const prompt = `
        Generate 5 relevant interview questions for a "${jobDetails.title}" position.
        Category: ${jobDetails.category || 'General'}
        Job Description: ${jobDetails.description || 'Not provided'}
        
        Return ONLY a JSON array of strings, where each string is a question.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      let text = response.text || "[]";
      const generatedQuestions = JSON.parse(text);
      
      if (Array.isArray(generatedQuestions)) {
        const newQuestions: Question[] = generatedQuestions.map((q: string) => ({ 
          question: q, 
          type: 'open' as const 
        }));
        setQuestions([...questions, ...newQuestions]);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setGenerating(false);
    }
  };

  const addQuestion = (type: Question['type']) => {
    setQuestions([...questions, { question: '', type }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'open': return <MessageSquare className="w-4 h-4" />;
      case 'multiple_choice': return <CheckSquare className="w-4 h-4" />;
      case 'yes_no': return <ToggleLeft className="w-4 h-4" />;
      case 'file_upload': return <FileUp className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading flow builder...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Application Flow Builder</h1>
            <p className="text-gray-400 text-sm">Design the chat experience for applicants.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateQuestions}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold transition-colors border border-indigo-500/20"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Auto-Generate
          </button>
          <button 
            onClick={saveFlow}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-black transition-colors"
          >
            {saving ? 'Saving...' : 'Save Flow'}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-white/10 rounded-2xl p-6 flex gap-4 group"
          >
            <div className="mt-2 text-gray-600 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-lg">
                  {getIconForType(q.type)}
                  {q.type.replace('_', ' ')}
                </div>
                <button 
                  onClick={() => removeQuestion(index)}
                  className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                placeholder="Enter your question here..."
                className="w-full bg-transparent border-none text-lg text-white placeholder-gray-600 focus:ring-0 p-0"
              />
            </div>
          </motion.div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No questions yet</h3>
            <p className="text-gray-500 text-sm mb-6">Start building your application flow by adding questions or using AI.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
        <span className="text-sm font-bold text-gray-500">Add Question:</span>
        <button onClick={() => addQuestion('open')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Open Text
        </button>
        <button onClick={() => addQuestion('yes_no')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
          <ToggleLeft className="w-4 h-4" /> Yes/No
        </button>
        <button onClick={() => addQuestion('file_upload')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
          <FileUp className="w-4 h-4" /> File Upload
        </button>
      </div>
    </div>
  );
};
