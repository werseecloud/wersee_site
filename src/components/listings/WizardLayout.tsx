import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, ArrowRight, Check, Sparkles, Image as ImageIcon, Plus, Monitor, Smartphone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface WizardLayoutProps {
  title: string;
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
}

export const WizardLayout = ({
  title,
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
  onAiGenerate
}: WizardLayoutProps) => {
  const { isDark } = useTheme();
  const [previewType, setPreviewType] = React.useState<'card' | 'page' | 'email' | 'checkout'>('card');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isPreviewDark, setIsPreviewDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleAiGenerate = async () => {
    if (!onAiGenerate || !aiPrompt) return;
    setIsAiLoading(true);
    try {
      await onAiGenerate(aiPrompt);
      setShowAiPrompt(false);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsAiLoading(false);
    }
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
                <button onClick={() => setShowAiPrompt(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">
                Describe what you want to create. AI will generate the title, description, and suggest pricing for your category.
              </p>

              <div className="relative">
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="E.g., A comprehensive guide on starting a YouTube channel..."
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={!aiPrompt || isAiLoading}
                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                {isAiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    Generate Product <Sparkles className="w-5 h-5" />
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
        className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-black overflow-hidden"
      >
        {/* Left Side - Controls (Wizard) */}
        <div className="w-full lg:w-[40%] h-full bg-[#0A0A0A] flex flex-col relative border-r border-white/5">
          {/* Header */}
          <div className="flex items-center justify-between p-6 lg:p-8 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <motion.h2 
                  key={title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-bold tracking-tight text-white"
                >
                  {title}
                </motion.h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {onAiGenerate && (
                <button
                  onClick={() => setShowAiPrompt(true)}
                  className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20 group"
                  title="Create with AI"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-white/5 w-full relative overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-xl mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer - The "Mooier" Bottom Bar */}
          <div className="p-6 lg:p-8 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl flex justify-between items-center sticky bottom-0 z-20">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                isFirstStep 
                  ? 'text-gray-800 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-white to-gray-200 text-black shadow-white/5' 
                  : 'bg-gradient-to-r from-[#1D1D1F] to-[#333333] text-white shadow-black/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-black" />
              ) : isLastStep ? (
                <>Publish Listing <Check className="w-4 h-4" /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="hidden lg:flex flex-1 bg-black items-center justify-center p-12 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Preview Controls */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 z-20">
            {(['card', 'page', 'email', 'checkout'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPreviewType(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${previewType === tab ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="absolute top-8 right-8 flex items-center gap-1 p-1.5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 z-20">
            <button 
              onClick={() => setIsPreviewDark(!isPreviewDark)} 
              className={`p-2 rounded-xl transition-all ${isPreviewDark ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Toggle Dark Mode Preview"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-xl transition-all ${previewDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Smartphone className="w-4 h-4" /></button>
            <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-xl transition-all ${previewDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Monitor className="w-4 h-4" /></button>
          </div>

          {/* Preview Frame */}
          <motion.div 
            layout
            className={`rounded-[32px] shadow-2xl overflow-hidden transition-all duration-700 relative z-10 ${
              isPreviewDark ? 'bg-[#0A0A0A] border border-white/10' : 'bg-white border border-gray-100'
            } ${
              previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : 'w-[800px] h-[600px]'
            }`}
          >
            <div className="h-full overflow-y-auto custom-scrollbar">
              {typeof preview === 'function' ? preview(previewType, isPreviewDark) : preview}
            </div>
          </motion.div>

          <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview
          </div>
        </div>
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
            </div>
          </div>
          
            {/* Progress Bar */}
          <div className="hidden sm:flex items-center gap-4">
            {onAiGenerate && (
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
