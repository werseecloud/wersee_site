import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, AppWindow, Upload, FileArchive, CheckCircle2, Globe, Shield, Server, Code } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { appToast } from '@/lib/feedback';
interface AppBuilderProps {
  businessId?: string;
  onClose: () => void;
  onSave: () => void;
  existingApp?: any;
}

export const AppBuilder: React.FC<AppBuilderProps> = ({ businessId, onClose, onSave, existingApp }) => {
  const [step, setStep] = useState(1);
  
  // Details
  const [name, setName] = useState(existingApp?.name || '');
  const [description, setDescription] = useState(existingApp?.description || '');
  const [isPublic, setIsPublic] = useState(existingApp?.is_public || false);
  const [price, setPrice] = useState(existingApp?.price || '0');
  
  // Advanced Config
  const [buildMode, setBuildMode] = useState<'upload' | 'manual'>('upload');
  const [distFile, setDistFile] = useState<File | null>(null);
  const [manualCode, setManualCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }\n    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Hello from Wersee!</h1>\n    <p>This is your custom app code.</p>\n  </div>\n</body>\n</html>');
  
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    if (existingApp) {
      // Fetch latest version code
      supabase
        .from('app_versions')
        .select('compiled_code')
        .eq('app_id', existingApp.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data?.compiled_code) {
            setManualCode(data.compiled_code);
            setBuildMode('manual');
          }
        });
    }
  }, [existingApp]);

  const username = userEmail.split('@')[0] || 'user';
  const appSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const previewUrl = `wersee.com/@${username}/apps/${appSlug || '[app-name]'}`;

  const handleNext = () => {
    if (step === 2 && buildMode === 'upload' && !distFile && !existingApp) {
      appToast('Please upload a dist file (.zip).');
      return;
    }
    if (step === 2 && buildMode === 'manual' && !manualCode.trim()) {
      appToast('Please provide some code for your app.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSave = async (retries = 3) => {
    if (!name) {
      appToast('Please provide a name for your app.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const insertData: any = {
        business_id: businessId || null,
        name: name,
        slug: appSlug,
        description: description,
        developer_id: user.id,
        is_public: isPublic,
        price: price
      };

      if (existingApp) {
        const { error } = await supabase
          .from('apps')
          .update(insertData)
          .eq('id', existingApp.id);
        if (error) throw error;

        // Create new version
        const { error: verError } = await supabase
          .from('app_versions')
          .insert([{
            app_id: existingApp.id,
            version: '1.0.' + Date.now(),
            compiled_code: buildMode === 'upload' ? (distFile ? 'mock-compiled-code-from-zip' : '') : manualCode,
            ui_schema: { type: 'page', components: [] }
          }]);
        if (verError) throw verError;
      } else {
        const { data: appData, error: appError } = await supabase
          .from('apps')
          .insert([insertData])
          .select()
          .single();
          
        if (appError) throw appError;

        // Create initial version
        const { error: verError } = await supabase
          .from('app_versions')
          .insert([{
            app_id: appData.id,
            version: '1.0.0',
            compiled_code: buildMode === 'upload' ? (distFile ? 'mock-compiled-code-from-zip' : '') : manualCode,
            ui_schema: { type: 'page', components: [] }
          }]);

        if (verError) throw verError;
      }

      onSave();
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying handleSave... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return handleSave(retries - 1);
      }
      console.error('Error saving app:', error);
      appToast('Failed to save app');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border-x border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-3xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl shrink-0">
              <AppWindow className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-white truncate">App Builder</h2>
              <p className="text-[10px] sm:text-sm text-gray-400 truncate">
                {step === 1 && 'Step 1: How it works'}
                {step === 2 && 'Step 2: Upload Package'}
                {step === 3 && 'Step 3: App Details'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors shrink-0">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/5">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-4">Build powerful apps, securely.</h3>
                  <p className="text-gray-400 text-sm sm:text-lg">
                    Wersee Apps run entirely on our server-side infrastructure. You upload your compiled code, and we handle the execution, security, and UI rendering.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white mb-2">Anti-Piracy Built-in</h4>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Your code is never exposed to the client. No raw code downloads, no exposed API keys. We protect your intellectual property.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Server className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white mb-2">Server-Side Execution</h4>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Your app runs in an isolated sandbox environment. We compile, minify, and execute your logic securely on the edge.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white mb-2">Custom Domain</h4>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Your app gets a dedicated URL under your Wersee profile, ready to be shared and used by your audience instantly.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Mode Selection */}
                <div className="flex gap-1 sm:gap-2 p-1 bg-white/5 rounded-2xl w-fit mb-6 overflow-x-auto max-w-full">
                  <button
                    onClick={() => setBuildMode('upload')}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${buildMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <FileArchive className="w-4 h-4" />
                    Upload Zip
                  </button>
                  <button
                    onClick={() => setBuildMode('manual')}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${buildMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Code className="w-4 h-4" />
                    Manual Code
                  </button>
                </div>

                {buildMode === 'upload' ? (
                  <>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 sm:p-6 mb-6">
                      <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <FileArchive className="w-5 h-5" />
                        Upload Dist Package
                      </h3>
                      <p className="text-xs sm:text-sm text-indigo-200/70 leading-relaxed">
                        Upload your compiled application package (.zip). This should contain your backend logic and declarative UI schema.
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-colors relative">
                      <input 
                        type="file" 
                        accept=".zip" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDistFile(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                        {distFile ? <FileArchive className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" /> : <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                        {distFile ? distFile.name : 'Upload App Package'}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm max-w-sm">
                        {distFile 
                          ? `${(distFile.size / 1024 / 1024).toFixed(2)} MB - Ready to compile` 
                          : 'Drag and drop your compiled .zip file here, or click to browse.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-6">
                      <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <Code className="w-5 h-5" />
                        Traditional Code Editor
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
                        Paste your HTML/JS code directly. This is great for simple tools or quick prototypes.
                      </p>
                    </div>
                    
                    <div className="relative group">
                      <textarea
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        className="w-full h-48 sm:h-64 bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 font-mono text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                        placeholder="Paste your code here..."
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-1 rounded">HTML/JS Mode</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">App Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Course Analytics Pro"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">App URL</label>
                  <div className="flex items-center bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 overflow-hidden">
                    <Globe className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-400 text-xs sm:text-sm truncate">{previewUrl}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2">This is where users will access your app.</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this app do?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5">Price (EUR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2">Set to 0 for free apps.</p>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Public Visibility</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500">Allow anyone with the link to access this app</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors relative ${isPublic ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-5 sm:left-7' : 'left-1'}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-gray-400 hover:text-white transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-6 py-2 sm:py-2.5 text-gray-400 hover:text-white transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-2.5 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50 text-sm"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Publish
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
