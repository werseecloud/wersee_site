import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Zap, Settings, Play, Code, Upload, FileArchive, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { appToast } from '@/lib/feedback';
interface ExtensionBuilderProps {
  businessId?: string;
  onClose: () => void;
  onSave: () => void;
  existingExtension?: any;
}

type ExtensionType = 'basic' | 'advanced' | null;

export const ExtensionBuilder: React.FC<ExtensionBuilderProps> = ({ businessId, onClose, onSave, existingExtension }) => {
  const [step, setStep] = useState(1);
  const [extensionType, setExtensionType] = useState<ExtensionType>(existingExtension?.type === 'advanced' ? 'advanced' : (existingExtension ? 'basic' : null));
  
  // Details
  const [name, setName] = useState(existingExtension?.name || '');
  const [description, setDescription] = useState(existingExtension?.description || '');
  const [isPublic, setIsPublic] = useState(existingExtension?.is_public || false);
  const [price, setPrice] = useState(existingExtension?.price || '0');
  
  // Basic Config
  const [trigger, setTrigger] = useState(existingExtension?.config?.trigger || '');
  const [actions, setActions] = useState<any[]>(existingExtension?.config?.actions || []);
  
  // Advanced Config
  const [distFile, setDistFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const triggers = [
    { id: 'user_joined', label: 'User Joined Community', icon: '👥' },
    { id: 'course_purchased', label: 'Course Purchased', icon: '🎓' },
    { id: 'product_created', label: 'Product Created', icon: '💼' },
    { id: 'payment_success', label: 'Payment Success', icon: '💰' },
  ];

  const availableActions = [
    { id: 'assign_role', label: 'Assign Role', icon: '🛡️' },
    { id: 'send_message', label: 'Send Message', icon: '💬' },
    { id: 'send_email', label: 'Send Email', icon: '📧' },
    { id: 'webhook_call', label: 'Call Webhook', icon: '🔗' },
  ];

  const handleAddAction = (actionId: string) => {
    setActions([...actions, { type: actionId, config: {} }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionConfigChange = (index: number, key: string, value: string) => {
    const newActions = [...actions];
    newActions[index].config[key] = value;
    setActions(newActions);
  };

  const handleNext = () => {
    if (step === 1 && !extensionType) {
      appToast('Please select an extension type.');
      return;
    }
    if (step === 2) {
      if (extensionType === 'basic' && (!trigger || actions.length === 0)) {
        appToast('Please select a trigger and at least one action.');
        return;
      }
      if (extensionType === 'advanced' && !distFile && !existingExtension) {
        appToast('Please upload a dist file (.zip).');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSave = async () => {
    if (!name) {
      appToast('Please provide a name for your extension.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let config = {};
      
      if (extensionType === 'basic') {
        config = {
          trigger,
          conditions: [],
          actions
        };
      } else {
        config = {
          isAdvanced: true,
          // In a real app, we would upload the distFile to Supabase Storage and store the URL here
          distUrl: distFile ? 'mock-url-for-uploaded-dist.zip' : existingExtension?.config?.distUrl
        };
      }

      if (existingExtension) {
        // Update logic would go here
      } else {
        // Create new extension
        const { data: extData, error: extError } = await supabase
          .from('extensions')
          .insert([{
            name,
            description,
            developer_id: user.id,
            type: 'business', // Defaulting to business for now
            is_public: isPublic,
            price: price
          }])
          .select()
          .single();

        if (extError) throw extError;

        const { data: verData, error: verError } = await supabase
          .from('extension_versions')
          .insert([{
            extension_id: extData.id,
            version: '1.0.0',
            config_schema: config,
            code: config
          }])
          .select()
          .single();

        if (verError) throw verError;

        // Install it
        const ownerId = businessId || user.id;
        const ownerType = 'business'; // Default to business for workspace extensions

        const { error: instError } = await supabase
          .from('installed_extensions')
          .insert([{
            extension_id: extData.id,
            version_id: verData.id,
            owner_id: ownerId,
            owner_type: ownerType,
            config: config,
            enabled: true
          }]);

        if (instError) throw instError;
      }

      onSave();
    } catch (error) {
      console.error('Error saving extension:', error);
      appToast('Failed to save extension');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Extension Builder</h2>
              <p className="text-sm text-gray-400">
                {step === 1 && 'Step 1: Choose Extension Type'}
                {step === 2 && extensionType === 'basic' && 'Step 2: Configure Logic'}
                {step === 2 && extensionType === 'advanced' && 'Step 2: Upload Package'}
                {step === 3 && 'Step 3: Extension Details'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setExtensionType('basic')}
                    className={`p-6 rounded-2xl border text-left transition-all ${
                      extensionType === 'basic'
                        ? 'bg-indigo-500/10 border-indigo-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Basic Extension</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      No-code builder. Create simple automations by connecting triggers to actions. Perfect for welcome messages, role assignments, and webhooks.
                    </p>
                  </button>

                  <button
                    onClick={() => setExtensionType('advanced')}
                    className={`p-6 rounded-2xl border text-left transition-all ${
                      extensionType === 'advanced'
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Code className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Advanced Extension</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Upload a compiled dist package (.zip). Optimized for PC. Runs securely in our sandbox environment. Full control over logic and embedded UI.
                    </p>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && extensionType === 'basic' && (
              <motion.div
                key="step2-basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Trigger Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-400" />
                    When this happens... (Trigger)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {triggers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTrigger(t.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          trigger === t.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="text-2xl mb-2">{t.icon}</div>
                        <div className="font-medium">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    Do this... (Actions)
                  </h3>
                  
                  <div className="space-y-4">
                    {actions.map((action, index) => {
                      const actionDef = availableActions.find(a => a.id === action.type);
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                          <div className="p-3 bg-white/5 rounded-lg text-xl">
                            {actionDef?.icon}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white">{actionDef?.label}</h4>
                              <button
                                onClick={() => handleRemoveAction(index)}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Action specific config fields */}
                            {action.type === 'send_message' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Message Content</label>
                                <textarea
                                  value={action.config.message || ''}
                                  onChange={(e) => handleActionConfigChange(index, 'message', e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                  rows={2}
                                  placeholder="Hello, welcome to the community!"
                                />
                              </div>
                            )}
                            {action.type === 'assign_role' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Role Name</label>
                                <input
                                  type="text"
                                  value={action.config.role || ''}
                                  onChange={(e) => handleActionConfigChange(index, 'role', e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                  placeholder="e.g. Member"
                                />
                              </div>
                            )}
                            {action.type === 'webhook_call' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Webhook URL</label>
                                <input
                                  type="url"
                                  value={action.config.url || ''}
                                  onChange={(e) => handleActionConfigChange(index, 'url', e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                  placeholder="https://api.example.com/webhook"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Action Button */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/10 border-dashed"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="bg-[#111] px-4">
                          <div className="flex gap-2">
                            {availableActions.map(a => (
                              <button
                                key={a.id}
                                onClick={() => handleAddAction(a.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                {a.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && extensionType === 'advanced' && (
              <motion.div
                key="step2-advanced"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                  <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Secure Execution Environment
                  </h3>
                  <p className="text-sm text-emerald-200/70 leading-relaxed">
                    Your code is never exposed to the client. We compile, secure, and run your dist package in an isolated server-side sandbox. The UI is rendered declaratively.
                  </p>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-colors relative">
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
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    {distFile ? <FileArchive className="w-8 h-8 text-emerald-400" /> : <Upload className="w-8 h-8 text-gray-400" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {distFile ? distFile.name : 'Upload Dist Package'}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-sm">
                    {distFile 
                      ? `${(distFile.size / 1024 / 1024).toFixed(2)} MB - Ready to compile` 
                      : 'Drag and drop your compiled .zip file here, or click to browse.'}
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Extension Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Advanced Analytics Sync"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this extension do?"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Price (EUR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Set to 0 for free extensions.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {isPublic ? <Zap className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Public Visibility</h4>
                      <p className="text-sm text-gray-400">
                        {isPublic ? 'Available in the Store for others to install.' : 'Private, only available to you.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-400 hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-2.5 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors font-bold"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save & Install
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

