import React, { useState, useEffect } from 'react';
import { Repeat, Plus, Loader2, X, ExternalLink, Copy, CheckCircle2, AlertTriangle, Settings, Tag, ShieldCheck, Monitor, Smartphone, ArrowLeft, Image as ImageIcon, Palette, Layout, Type, MessageSquare, UploadCloud, ChevronRight, Box, Percent, Clock, FileText, Lock, ShoppingBag, Gift, Zap, Building2, Star, Check, Sparkles, Wand2, Brain, Target, BarChart3, Lightbulb, Combine, Flag, Users } from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { ThinkingAnimation, ReasoningStep } from '../ThinkingAnimation';

import { appToast, destructiveAction } from '@/lib/feedback';
const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  { id: 'understand', label: 'Understand', content: '', status: 'pending', icon: Target },
  { id: 'analyze', label: 'Analyze', content: '', status: 'pending', icon: BarChart3 },
  { id: 'reason', label: 'Reason', content: '', status: 'pending', icon: Lightbulb },
  { id: 'synthesize', label: 'Synthesize', content: '', status: 'pending', icon: Combine },
  { id: 'conclude', label: 'Conclude', content: '', status: 'pending', icon: Flag },
];

export const MoneySubscriptionsView = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [fetchingSubscriptions, setFetchingSubscriptions] = useState(false);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans');
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [fetchingSubscribers, setFetchingSubscribers] = useState(false);
  
  const fetchSubscriptions = async (uid: string) => {
    setFetchingSubscriptions(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setFetchingSubscriptions(false);
    }
  };

  const fetchSubscribers = async (uid: string) => {
    setFetchingSubscribers(true);
    try {
      const { data: plans } = await supabase.from('subscriptions').select('id').eq('seller_id', uid);
      const planIds = plans?.map(p => p.id) || [];
      if (planIds.length === 0) {
        setSubscribers([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .in('subscription_id', planIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setFetchingSubscribers(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this subscription? This will not cancel existing active subscriptions in Stripe, but will prevent new ones.' }))) return;
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      if (userId) fetchSubscriptions(userId);
    } catch (err) {
      console.error('Error deleting subscription:', err);
      appToast('Failed to delete subscription');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'eur',
    billing_period: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
    trial_period_days: '',
    image_url: '',
    success_url: '',
    slug: '',
    features: [] as string[],
    settings: {
      collect_address: false,
      collect_phone: false,
    }
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
        if (savedAccountId) {
          setHasStripeAccount(true);
          fetchSubscriptions(user.id);
          fetchSubscribers(user.id);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setReasoningSteps(INITIAL_REASONING_STEPS);

    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: aiPrompt }] }],
        config: { 
          systemInstruction: `You are an expert subscription billing consultant. 
        Your task is to take a user's description and generate a structured subscription plan.
        
        Return a JSON object with:
        - name: A catchy name for the plan
        - description: A compelling description of the value proposition
        - price: A numeric value (e.g. 29.99)
        - currency: 'eur', 'usd', or 'gbp'
        - billing_period: 'monthly' or 'yearly'
        - trial_period_days: number of days for free trial (0 if none)
        
        Be creative and professional.`,
          responseMimeType: "application/json" 
        }
      });

      const response = await model;
      const result = JSON.parse(response.text || '{}');

      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        price: result.price?.toString() || prev.price,
        currency: result.currency || prev.currency,
        billing_period: result.billing_period || prev.billing_period,
        trial_period_days: result.trial_period_days?.toString() || prev.trial_period_days,
      }));

      setShowAiInput(false);
      setAiPrompt('');
    } catch (err) {
      console.error('AI Generation failed:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!hasStripeAccount) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!session || !user) throw new Error('Not authenticated');

      const accountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      if (!accountId) throw new Error('Stripe account not connected');

      // Create Stripe Product & Price
      const resData = await invokeApiRunner('create-subscription-product', {
        ...formData,
        accountId
      });

      if (resData.error) {
        throw new Error(resData.error || 'Failed to create subscription product');
      }

      const { product, price } = resData;

      // Determine slug
      let finalSlug = formData.slug;
      if (!finalSlug) {
        // Auto-generate slug
        const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      // Check uniqueness
      if (formData.slug) {
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('seller_id', user.id)
          .eq('slug', formData.slug)
          .single();
        
        if (existing) {
          throw new Error('This link is already in use, try different.');
        }
      }

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          seller_id: user.id,
          username: user.user_metadata?.username,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billing_period: formData.billing_period,
          trial_period_days: parseInt(formData.trial_period_days) || 0,
          image_url: formData.image_url,
          features: formData.features,
          slug: finalSlug,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          success_url: formData.success_url,
          settings: formData.settings
        });

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
           throw new Error('This link is already in use, try different.');
        }
        throw dbError;
      }

      setShowWizard(false);
      if (userId) fetchSubscriptions(userId);
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        currency: 'eur',
        billing_period: 'monthly',
        trial_period_days: '',
        image_url: '',
        success_url: '',
        slug: '',
        features: [],
        settings: {
          collect_address: false,
          collect_phone: false,
        }
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      appToast(error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (!hasStripeAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <Repeat className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        <p className="text-gray-400 max-w-md">Connect your Stripe account to start accepting recurring payments.</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Create and manage recurring payment plans.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'plans' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            PLANS
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'subscribers' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SUBSCRIBERS
          </button>
        </div>
        <button 
          onClick={() => setShowWizard(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-5 h-5" />
          New Subscription
        </button>
      </div>

      {activeTab === 'plans' ? (
        <>
          {/* Empty State */}
          {subscriptions.length === 0 && !fetchingSubscriptions && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 md:p-12 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">No subscriptions yet</h3>
              <p className="text-xs md:text-sm text-gray-400 max-w-sm mx-auto mb-6">
                Create your first subscription plan to start accepting recurring payments from your customers.
              </p>
              <button 
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-5 h-5" />
                Create Subscription
              </button>
            </div>
          )}

          {/* Subscriptions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 group hover:border-white/10 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <Repeat className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{sub.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-medium">
                        {sub.billing_period} billing
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">
                      {sub.currency === 'eur' ? '€' : sub.currency === 'usd' ? '$' : '£'}
                      {sub.price}
                    </p>
                    <p className="text-[10px] text-gray-500">per {sub.billing_period.replace('ly', '')}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/s/${sub.slug}`, sub.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-300 transition-all"
                  >
                    {copiedId === sub.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === sub.id ? 'COPIED' : 'COPY LINK'}
                  </button>
                  <a 
                    href={`/s/${sub.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => handleDeleteSubscription(sub.id)}
                    className="p-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-red-400/50 hover:text-red-400 transition-all ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {subscribers.length === 0 && !fetchingSubscribers ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm max-w-xs">
                No active subscribers found.
              </p>
            </div>
          ) : (
            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-widest">Renews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                            {sub.user_id.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-gray-300 font-medium">{sub.user_id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-bold">{sub.subscription?.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Subscription Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A] overflow-hidden">
          {/* Top Bar */}
          <div className="h-14 md:h-16 bg-[#0A0A0A] px-4 md:px-6 flex items-center justify-between shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowWizard(false)} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors lg:hidden">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm md:text-lg font-bold text-white tracking-tight uppercase truncate max-w-[200px] sm:max-w-none">
                {formData.name || 'NEW SUBSCRIPTION'}
              </h2>
            </div>
            
            <button onClick={() => setShowWizard(false)} className="hidden lg:block p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
            {/* Preview Area (Top on mobile, Left on desktop) */}
            <div className={`flex-1 bg-[#0A0A0A] flex flex-col items-center transition-all duration-500 ease-in-out ${showPreview ? 'h-full lg:h-auto' : 'h-[35vh] sm:h-[40vh] lg:h-auto'} overflow-y-auto pt-4 pb-20 lg:pb-4 px-4`}>
              {/* Preview Mode Toggle (Desktop only) */}
              <div className="hidden lg:flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl p-1 mb-8">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg transition-colors ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg transition-colors ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Container */}
              <div className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${previewMode === 'mobile' ? 'w-full max-w-[375px]' : 'w-full max-w-4xl'}`}>
                <div className={`relative bg-[#0A0A0A] rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex min-h-[400px] sm:min-h-[500px] ${previewMode === 'mobile' ? 'flex-col' : 'flex-col md:flex-row'}`}>
                  
                  {/* Atmospheric Background */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 blur-[80px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[80px] rounded-full mix-blend-screen" />
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
                  </div>

                  {/* Left Side: Plan Info */}
                  <div className={`relative z-10 p-6 sm:p-10 border-b border-white/10 bg-white/[0.02] flex flex-col justify-between ${previewMode === 'mobile' ? 'w-full' : 'md:border-b-0 md:border-r w-full md:w-5/12'}`}>
                    <div>
                      <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Subscribe to</p>
                          <h2 className="text-xs sm:text-sm font-bold text-white leading-tight">Your Business</h2>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-3 sm:mb-4">
                          <Star className="w-2.5 h-2.5" />
                          {formData.name || 'Subscription Plan'}
                        </div>
                        
                        <div className="flex items-baseline gap-1 mb-2 sm:mb-3">
                          <span className="text-3xl sm:text-5xl font-black tracking-tighter text-white">
                            {formData.currency === 'eur' ? '€' : formData.currency === 'usd' ? '$' : '£'}
                            {formData.price || '0.00'}
                          </span>
                          <span className="text-gray-500 text-xs sm:text-sm font-medium">/{formData.billing_period}</span>
                        </div>
                        
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                          {formData.description || 'A brief description of your subscription plan and its benefits.'}
                        </p>
                      </div>

                      {formData.trial_period_days && parseInt(formData.trial_period_days) > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 flex items-start gap-3">
                          <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs sm:text-sm">{formData.trial_period_days} days free</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Cancel anytime.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 text-gray-300 text-[10px] sm:text-xs">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-emerald-400" />
                        </div>
                        <span className="font-medium">Cancel anytime</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-[10px] sm:text-xs">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-emerald-400" />
                        </div>
                        <span className="font-medium">Secure payment processing</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Payment Form Mockup */}
                  <div className={`relative z-10 p-6 sm:p-10 bg-[#0A0A0A] flex flex-col justify-center ${previewMode === 'mobile' ? 'w-full' : 'w-full md:w-7/12'}`}>
                    <div className="w-full max-w-sm mx-auto space-y-4 sm:space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold mb-1 tracking-tight text-white">Your Details</h2>
                        <p className="text-gray-400 text-xs sm:text-sm">Enter your information to continue.</p>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                          <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-gray-500 text-xs sm:text-sm">
                            John Doe
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                          <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-gray-500 text-xs sm:text-sm">
                            john@example.com
                          </div>
                        </div>

                        <div className="pt-2 sm:pt-4">
                          <div className="w-full py-3 sm:py-3.5 bg-white text-black rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            Continue to Payment
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Toggle Button (Mobile only) */}
            <div className="absolute top-[30vh] sm:top-[35vh] lg:hidden left-1/2 -translate-x-1/2 z-20">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] sm:text-xs font-bold shadow-2xl hover:bg-white/20 transition-all"
              >
                <Monitor className="w-3.5 h-3.5" />
                {showPreview ? 'Edit Details' : 'Preview'}
              </button>
            </div>

            {/* Bottom Sheet / Form Panel */}
            <div className={`
              absolute inset-x-0 bottom-0 lg:relative lg:inset-auto lg:w-[400px] xl:w-[450px] 
              bg-[#141414] rounded-t-[2rem] lg:rounded-none border-t lg:border-t-0 lg:border-l border-white/10 
              transition-all duration-500 ease-in-out z-30
              ${showPreview ? 'translate-y-full lg:translate-y-0' : 'translate-y-0'}
              flex flex-col max-h-[70vh] sm:max-h-[75vh] lg:max-h-none
            `}>
              {/* Handle for mobile */}
              <div className="h-1 w-10 bg-white/10 rounded-full mx-auto my-3 lg:hidden shrink-0" />

              <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-32 lg:pb-8 space-y-6 sm:space-y-8">
                {/* Plan Details Section */}
                <section className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Plan Details</h3>
                    <button 
                      onClick={() => setShowAiInput(!showAiInput)}
                      className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20"
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      AI BUILDER
                    </button>
                  </div>

                  {showAiInput && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-4">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe your subscription plan (e.g. 'A monthly pro plan for $29 with a 14 day trial')..."
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={handleAiGenerate} disabled={isAiGenerating} className="px-5 py-2 bg-indigo-500 text-white rounded-xl text-[10px] sm:text-xs font-bold disabled:opacity-50">
                          {isAiGenerating ? 'Generating...' : 'Generate'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Plan Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Pro Membership"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="What's included in this plan?"
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs sm:text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Features (one per line)</label>
                      <textarea 
                        value={formData.features.join('\n')}
                        onChange={(e) => setFormData({...formData, features: e.target.value.split('\n').filter(f => f.trim())})}
                        placeholder="e.g. 24/7 Support&#10;Unlimited Access"
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs sm:text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase">
                            {formData.currency}
                          </span>
                          <input 
                            type="number" 
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl pl-12 pr-4 py-2.5 sm:py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Period</label>
                        <select 
                          value={formData.billing_period}
                          onChange={(e) => setFormData({...formData, billing_period: e.target.value})}
                          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs sm:text-sm appearance-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Advanced Section */}
                <section className="space-y-4 sm:space-y-6">
                  <h3 className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Advanced</h3>
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-300">Free Trial</span>
                        <p className="text-[9px] sm:text-[10px] text-gray-500">Days of free access</p>
                      </div>
                      <input 
                        type="number" 
                        value={formData.trial_period_days}
                        onChange={(e) => setFormData({...formData, trial_period_days: e.target.value})}
                        placeholder="0"
                        className="w-16 sm:w-20 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white text-center focus:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-300">Redirect URL</span>
                      <input 
                        type="text" 
                        value={formData.success_url}
                        onChange={(e) => setFormData({...formData, success_url: e.target.value})}
                        placeholder="https://your-site.com/welcome"
                        className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-4 py-2.5 sm:py-3 text-white text-[10px] sm:text-xs focus:ring-0"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Actions Bar */}
              <div className="p-4 sm:p-6 bg-[#141414] border-t border-white/10 shrink-0">
                <button 
                  onClick={handleCreateSubscription}
                  disabled={creating || !formData.name || !formData.price}
                  className="w-full py-3.5 sm:py-4 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,91,255,0.2)]"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CREATE SUBSCRIPTION PLAN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
