import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Link as LinkIcon, Pencil, ArrowRight, Loader2, Check, Users, Globe, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { appToast } from '@/lib/feedback';
interface WizardProps {
  onClose: () => void; // Used to navigate back or close
}

export const WorkspaceCreateCommunityWizard: React.FC<WizardProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'ai' | 'scratch' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [prompt, setPrompt] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [price, setPrice] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.id) throw new Error('You must be logged in to create a community');

      // Create community in Supabase
      const { data, error } = await supabase
        .from('communities')
        .insert({
          owner_id: user.id,
          name: communityName,
          description: description,
          price: price ? parseFloat(price) : null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as the first member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Simulate AI processing if method is AI
      if (method === 'ai') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake AI delay
      }

      onClose(); // Navigate back to dashboard
    } catch (error) {
      console.error('Error creating community:', error);
      appToast('Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4 text-center">Create a New Community</h1>
            <p className="text-gray-400 text-center mb-12">How would you like to build your community?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button 
                onClick={() => { setMethod('ai'); setStep(2); }}
                className="group relative p-8 rounded-3xl bg-[#141414] border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Use AI Assistant</h3>
                <p className="text-sm text-gray-400">Describe your community and let AI generate channels, roles, and guidelines.</p>
              </button>

              <button 
                onClick={() => { setMethod('scratch'); setStep(3); }}
                className="group relative p-8 rounded-3xl bg-[#141414] border border-white/10 hover:border-amber-500/50 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Pencil className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Start from Scratch</h3>
                <p className="text-sm text-gray-400">Build your community manually step-by-step. Best for full control.</p>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">Describe your community</h1>
            <p className="text-gray-400 mb-8">
              Tell us about the community you want to build. Who is it for? What topics will be discussed?
            </p>

            <div className="space-y-6">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-48 bg-[#141414] border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                placeholder="I want to create a community for digital artists to share their work and get feedback..."
              />

              <button 
                onClick={() => {
                   // For AI, we might pre-fill the name/desc based on prompt in a real app
                   // For now, just move to manual steps with prompt saved
                   setCommunityName("AI Generated Community"); 
                   setDescription(prompt);
                   setStep(3); 
                }}
                disabled={!prompt}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(method === 'scratch' ? 1 : 2)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">What's your community name?</h1>
            <p className="text-gray-400 mb-8">Choose a name that brings people together.</p>

            <div className="space-y-6">
              <input 
                type="text" 
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Design Masters"
                autoFocus
              />

              <button 
                onClick={() => setStep(4)}
                disabled={!communityName}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">Describe your community</h1>
            <p className="text-gray-400 mb-8">What is this community about?</p>

            <div className="space-y-6">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors resize-none"
                placeholder="A place for designers to connect..."
                autoFocus
              />

              <button 
                onClick={() => setStep(5)}
                disabled={!description}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(4)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">Privacy & Pricing</h1>
            <p className="text-gray-400 mb-8">Control who can join your community.</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPrivacy('public')}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    privacy === 'public' 
                      ? 'bg-white/10 border-white text-white' 
                      : 'bg-[#141414] border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-8 h-8 mb-4" />
                  <h3 className="font-bold mb-1">Public</h3>
                  <p className="text-sm opacity-70">Anyone can find and join.</p>
                </button>
                <button 
                  onClick={() => setPrivacy('private')}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    privacy === 'private' 
                      ? 'bg-white/10 border-white text-white' 
                      : 'bg-[#141414] border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Lock className="w-8 h-8 mb-4" />
                  <h3 className="font-bold mb-1">Private</h3>
                  <p className="text-sm opacity-70">Invite only.</p>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Membership Price (€)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Leave empty for free"
                  className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button 
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {loading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {renderStep()}
      </motion.div>
    </div>
  );
};
