import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, ArrowRight, Check, Sparkles, Monitor, Smartphone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { werseeAi } from '../../ai/client';
import { createListingDraftSchema } from '../../lib/listingSchemas';

interface WizardLayoutProps {
  title: string;
  stepTitle?: string;
  stepDescription?: string;
  stepLabels?: readonly string[];
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'modal' | 'fullscreen';
  preview?: React.ReactNode | ((type: 'card' | 'page' | 'email' | 'checkout', isDark: boolean) => React.ReactNode);
  onAiGenerate?: (prompt: string) => Promise<void>;
  aiKind?: 'product' | 'digital' | 'course' | 'physical' | 'service' | 'community' | 'job' | 'announcement' | 'bundle' | 'pos_item';
  aiCurrentDraft?: Record<string, unknown>;
  onAiApply?: (patch: Record<string, unknown>) => void;
}

export const WizardLayout = ({
  title,
  stepTitle,
  stepDescription,
  stepLabels,
  currentStep,
  totalSteps,
  onClose,
  onBack,
  onNext,
  isFirstStep,
  isLastStep,
  children,
  loading = false,
  variant = 'modal',
  preview,
  onAiGenerate,
  aiKind,
  aiCurrentDraft = {},
  onAiApply,
}: WizardLayoutProps) => {
  const { isDark } = useTheme();
  const [previewType, setPreviewType] = React.useState<'card' | 'page' | 'email' | 'checkout'>('card');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isPreviewDark, setIsPreviewDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<Record<string, unknown> | null>(null);
  const [selectedAiFields, setSelectedAiFields] = useState<string[]>([]);
  const [recentAiFields, setRecentAiFields] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  const [showAllAiActions, setShowAllAiActions] = useState(false);
  const hasAiAssistant = Boolean((aiKind && onAiApply) || onAiGenerate);
  const activeStepTitle = stepTitle || stepLabels?.[currentStep - 1];
  const aiQuickActions = [
    { label: 'Create complete draft', prompt: 'Create a complete, polished draft from my idea and preserve any useful fields I already wrote.' },
    { label: 'Generate title', prompt: 'Focus on generating a clear, specific, conversion-friendly title. Preserve my other completed fields.' },
    { label: 'Write description', prompt: 'Write a detailed product description and short description. Preserve my other completed fields.' },
    { label: 'Recommend price', prompt: 'Recommend a realistic price and optional original price. Explain the positioning in the generated copy, without inventing sales data.' },
    { label: 'Generate SEO', prompt: 'Generate a concise SEO title and meta description. Preserve my other completed fields.' },
    ...(aiKind === 'course' || aiKind === 'digital' ? [{ label: 'Build course structure', prompt: 'Build a practical curriculum with modules and lessons for this course or digital learning product.' }] : []),
    { label: 'Improve conversion', prompt: 'Improve the title, benefits, features, FAQs and offer clarity without inventing performance metrics.' },
    { label: 'Fill remaining fields', prompt: 'Fill only missing or incomplete fields and preserve useful user-written content.' },
    { label: 'Review entire listing', prompt: 'Review the entire draft for completeness, consistency, trust, SEO and conversion clarity, then propose only justified changes.' },
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isMobile && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    window.addEventListener('focusin', handleFocus);
    return () => window.removeEventListener('focusin', handleFocus);
  }, [isMobile]);

  const runAiGeneration = async (prompt: string) => {
    if (!prompt) return;
    setIsAiLoading(true);
    setAiError('');
    try {
      if (aiKind && onAiApply) {
        const response = await werseeAi.generateListingDraft({ kind: aiKind, idea: prompt, currentDraft: aiCurrentDraft });
        const proposal = createListingDraftSchema.parse(response.draft) as Record<string, unknown>;
        setAiProposal(proposal);
        setSelectedAiFields(Object.keys(proposal).filter((key) => JSON.stringify(proposal[key]) !== JSON.stringify(aiCurrentDraft[key])));
      } else if (onAiGenerate) {
        await onAiGenerate(aiPrompt);
        setShowAiPrompt(false);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      setAiError(error instanceof Error ? error.message : 'Wersee AI could not generate this draft.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiGenerate = () => runAiGeneration(aiPrompt);

  const closeAiPrompt = () => {
    setShowAiPrompt(false);
    setAiProposal(null);
    setSelectedAiFields([]);
    setAiError('');
  };

  const applyAiProposal = () => {
    if (!aiProposal || !onAiApply) return;
    onAiApply(Object.fromEntries(selectedAiFields.map((key) => [key, aiProposal[key]])));
    setRecentAiFields(selectedAiFields);
    closeAiPrompt();
  };

  const renderAiValue = (value: unknown) => {
    if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join(', ') : 'None';
    if (value && typeof value === 'object') return JSON.stringify(value);
    return value === undefined || value === null || value === '' ? 'Empty' : String(value);
  };

  const aiModal = (
    <AnimatePresence>
      {showAiPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Create with AI</h3>
                </div>
                <button onClick={closeAiPrompt} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">Describe what you want to create. Wersee AI proposes a draft first; you choose exactly which fields to apply.</p>

              {!aiProposal ? <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {aiQuickActions.slice(0, showAllAiActions ? undefined : 3).map((action) => <button key={action.label} type="button" disabled={isAiLoading} onClick={() => { const request = aiPrompt.trim() ? `${action.prompt}\n\nUser idea or instructions: ${aiPrompt.trim()}` : action.prompt; setAiPrompt(request); void runAiGeneration(request); }} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40">{action.label}</button>)}
                  <button type="button" onClick={() => setShowAllAiActions((current) => !current)} className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:text-white">
                    {showAllAiActions ? 'Show less' : `More options · ${aiQuickActions.length - 3}`}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="E.g., A comprehensive guide on starting a YouTube channel..."
                    rows={4}
                    className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div> : <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                {Object.entries(aiProposal).map(([field, after]) => {
                  const before = aiCurrentDraft[field];
                  const selected = selectedAiFields.includes(field);
                  return (
                    <label key={field} className={`block cursor-pointer rounded-2xl border p-3 transition ${selected ? 'border-indigo-400/40 bg-indigo-400/10' : 'border-white/10 bg-black/20'}`}>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={selected} onChange={() => setSelectedAiFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field])} className="h-4 w-4 accent-indigo-500" /><span className="text-xs font-bold uppercase tracking-wider text-white">{field.replace(/([A-Z])/g, ' $1')}</span></div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-black/30 p-2 text-gray-500"><span className="mb-1 block text-[9px] uppercase tracking-wider">Current</span><span className="line-clamp-3 break-words">{renderAiValue(before)}</span></div><div className="rounded-xl bg-black/30 p-2 text-gray-200"><span className="mb-1 block text-[9px] uppercase tracking-wider text-indigo-300">Proposed</span><span className="line-clamp-3 break-words">{renderAiValue(after)}</span></div></div>
                    </label>
                  );
                })}
              </div>}

              {aiError && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{aiError}</p>}

              <button
                onClick={aiProposal ? applyAiProposal : handleAiGenerate}
                disabled={aiProposal ? selectedAiFields.length === 0 : (!aiPrompt || isAiLoading)}
                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                {isAiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing draft...
                  </>
                ) : (
                  <>
                    {aiProposal ? `Apply ${selectedAiFields.length} selected field${selectedAiFields.length === 1 ? '' : 's'}` : 'Generate draft'} <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (variant === 'fullscreen') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#050505] lg:flex-row"
      >
        <div className="relative flex h-full w-full flex-col border-white/[0.08] bg-[#0a0a0a] lg:w-[44%] lg:min-w-[520px] lg:border-r">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0a0a0a]/90 px-5 py-4 backdrop-blur-2xl sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
              <button 
                onClick={onClose}
                aria-label="Close listing wizard"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-zinc-100">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
              {hasAiAssistant && (
                <button
                  onClick={() => setShowAiPrompt(true)}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.09]"
                  aria-label="Create with AI"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Create with AI</span>
                </button>
              )}
            </div>
            <div className="mt-4 flex gap-1" aria-label={`Step ${currentStep} of ${totalSteps}`}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div initial={false} animate={{ width: index + 1 <= currentStep ? '100%' : '0%' }} className="h-full rounded-full bg-white" />
                </div>
              ))}
            </div>
          </header>

          {/* Content Area */}
          <main className="custom-scrollbar relative flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mx-auto max-w-xl"
              >
                {(activeStepTitle || stepDescription) && (
                  <div className="mb-8">
                    {activeStepTitle && <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.1rem]">{activeStepTitle}</h1>}
                    {stepDescription && <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">{stepDescription}</p>}
                    {recentAiFields.length > 0 && <p className="mt-3 truncate text-xs font-medium text-zinc-400" title={recentAiFields.join(', ')}>AI updated {recentAiFields.join(', ')}</p>}
                  </div>
                )}
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="sticky bottom-0 z-20 flex items-center justify-between border-t border-white/[0.07] bg-[#0a0a0a]/90 px-5 py-4 backdrop-blur-2xl sm:px-8">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              disabled={isFirstStep}
              className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
                isFirstStep 
                  ? 'cursor-not-allowed text-zinc-800' 
                  : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              disabled={loading}
              className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-sm transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-black" />
              ) : isLastStep ? (
                <>Publish Listing <Check className="w-4 h-4" /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </footer>
        </div>

        <aside className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#050505] p-10 lg:flex">
          <div className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center rounded-full border border-white/[0.08] bg-white/[0.05] p-1 backdrop-blur-2xl">
            {(['card', 'page', 'email', 'checkout'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPreviewType(tab)}
                className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition-all ${previewType === tab ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="absolute right-6 top-6 z-20 flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] p-1">
            <button 
              onClick={() => setIsPreviewDark(!isPreviewDark)} 
              className={`grid h-8 w-8 place-items-center rounded-full transition-all ${isPreviewDark ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-200'}`}
              title="Toggle Dark Mode Preview"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => setPreviewDevice('mobile')} aria-label="Mobile preview" className={`grid h-8 w-8 place-items-center rounded-full transition-all ${previewDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}><Smartphone className="w-4 h-4" /></button>
            <button onClick={() => setPreviewDevice('desktop')} aria-label="Desktop preview" className={`grid h-8 w-8 place-items-center rounded-full transition-all ${previewDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}><Monitor className="w-4 h-4" /></button>
          </div>

          {/* Preview Frame */}
          <motion.div 
            layout
            className={`relative z-10 overflow-hidden rounded-[28px] shadow-2xl transition-all duration-500 ${
              isPreviewDark ? 'bg-[#0A0A0A] border border-white/10' : 'bg-white border border-gray-100'
            } ${
              previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : 'w-[800px] h-[600px]'
            }`}
          >
            <div className="h-full overflow-y-auto custom-scrollbar">
              {typeof preview === 'function' ? preview(previewType, isPreviewDark) : preview}
            </div>
          </motion.div>

          <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live Preview
          </div>
        </aside>
        {aiModal}
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-lg sm:max-w-2xl md:max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-[#141414]' : 'bg-white'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b z-10 ${isDark ? 'border-white/10 bg-[#141414]' : 'border-gray-100 bg-white'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <motion.h2 
                key={title}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}
              >
                {title}
              </motion.h2>
              <div className={`flex items-center gap-2 text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Step {currentStep}</span>
                <span>of {totalSteps}</span>
              </div>
              {recentAiFields.length > 0 && <p className="mt-1 max-w-[320px] truncate text-xs font-semibold text-indigo-500" title={recentAiFields.join(', ')}>AI updated: {recentAiFields.join(', ')}</p>}
            </div>
          </div>
          
            {/* Progress Bar */}
          <div className="hidden sm:flex items-center gap-4">
            {hasAiAssistant && (
              <button
                onClick={() => setShowAiPrompt(true)}
                className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors"
                title="Create with AI"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ 
                    backgroundColor: i + 1 <= currentStep 
                      ? (isDark ? '#FFFFFF' : '#1D1D1F') 
                      : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                    scale: i + 1 === currentStep ? 1.1 : 1
                  }}
                  className="h-1.5 w-8 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 sm:p-10 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F7]'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-between items-center z-10 ${isDark ? 'border-white/10 bg-[#141414]' : 'border-gray-100 bg-white'}`}>
          <button
            onClick={onBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              isFirstStep 
                ? 'text-gray-300 cursor-not-allowed' 
                : isDark 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-[#1D1D1F] hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <button
            onClick={onNext}
            disabled={loading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-white to-gray-200 text-black shadow-white/10' 
                : 'bg-gradient-to-r from-[#1D1D1F] to-[#333333] text-white shadow-black/10'
            }`}
          >
            {loading ? (
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-black' : 'border-white'}`} />
            ) : isLastStep ? (
              <>Publish <Check className="w-4 h-4" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
      {aiModal}
    </div>
  );
};
