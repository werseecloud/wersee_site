import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Clock, 
  Euro, 
  Calendar, 
  Layout, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Zap,
  Globe,
  Users,
  Shield,
  Palette,
  LucideIcon,
  Copy,
  ExternalLink,
  Code
} from 'lucide-react';
import { invokeApiRunner } from '../lib/supabase';
import { CallScheduler } from './CallScheduler';
import { useAuth } from '../context/AuthContext';
import { parseUsername, routes } from '../routing/routes';

interface WizardStep {
  id: string;
  title: string;
  icon: LucideIcon;
}

const STEPS: WizardStep[] = [
  { id: 'basics', title: 'Basics', icon: Settings },
  { id: 'availability', title: 'Availability', icon: Calendar },
  { id: 'style', title: 'Style & Layout', icon: Layout },
  { id: 'advanced', title: 'Advanced', icon: Zap },
  { id: 'review', title: 'Review', icon: CheckCircle2 },
];

export const CallConfigWizard: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [config, setConfig] = useState({
    title: 'Discovery Call',
    slug: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    availability: {
      monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
    embed_settings: {
      theme: 'dark' as const,
      color: '#6366f1',
      radius: '1rem',
      layout: 'vertical' as 'vertical' | 'horizontal'
    },
    scheduling_type: 'individual',
    rolling_days: 30,
    buffer_minutes: 0,
    min_notice_hours: 24,
    businesses: {
      name: 'Your Business',
      logo_url: ''
    }
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invokeApiRunner('calls/save-config', config);
      if (res.success) {
        setSuccessData(res.data);
      } else {
        setError(res.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const username = parseUsername(session?.user?.email?.split('@')[0]);
  const bookingUrl = username
    ? `${window.location.origin}${routes.userBooking({
        username,
        configSlug: config.slug || 'call',
      })}`
    : '';
  const embedCode = `<iframe src="${bookingUrl}?embed=true" width="100%" height="700px" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic uppercase tracking-tight text-white">Booking Live!</h2>
          <p className="text-gray-400">Your booking type has been created and is ready to share.</p>
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Share Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm truncate">
                {bookingUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(bookingUrl, 'link')}
                className="px-6 rounded-2xl bg-white text-black font-bold hover:scale-105 transition-all flex items-center gap-2"
              >
                {copied === 'link' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied === 'link' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Embed Code</label>
            <div className="relative">
              <textarea 
                readOnly
                value={embedCode}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-xs h-24 focus:outline-none"
              />
              <button 
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                {copied === 'embed' ? <CheckCircle2 className="w-4 h-4" /> : <Code className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <a 
            href={bookingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            View Page
          </a>
          <button 
            onClick={() => onSuccess?.()}
            className="flex-1 px-8 py-4 rounded-2xl bg-indigo-500 text-white font-black italic uppercase tracking-tight hover:scale-105 transition-all shadow-xl shadow-indigo-500/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Header / Progress */}
          <div className="p-8 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tight text-white">Create Booking Type</h1>
                <p className="text-gray-400 text-sm">Configure your availability and booking page</p>
              </div>
              <div className="flex gap-2">
                {STEPS.map((step, i) => (
                  <div 
                    key={step.id}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      i <= currentStep ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wizard Content */}
          <div className="p-8 min-h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[currentStep].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Title</label>
                      <input 
                        type="text"
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="e.g. 15 Minute Discovery Call"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">URL Slug</label>
                      <input 
                        type="text"
                        value={config.slug}
                        onChange={e => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="discovery-call"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Description</label>
                      <textarea 
                        value={config.description}
                        onChange={e => setConfig({ ...config, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all min-h-[100px]"
                        placeholder="What is this call about?"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Duration (min)</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                          type="number"
                          value={config.duration_minutes}
                          onChange={e => setConfig({ ...config, duration_minutes: parseInt(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Price (€)</label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                          type="number"
                          value={config.price}
                          onChange={e => setConfig({ ...config, price: parseFloat(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    {Object.entries(config.availability).map(([day, data]: [string, any]) => (
                      <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox" 
                            checked={data.enabled}
                            onChange={e => setConfig({
                              ...config,
                              availability: {
                                ...config.availability,
                                [day]: { ...data, enabled: e.target.checked }
                              }
                            })}
                            className="w-5 h-5 rounded-lg accent-indigo-500"
                          />
                          <span className="text-white font-bold capitalize">{day}</span>
                        </div>
                        {data.enabled && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={data.slots[0]?.start || '09:00'}
                              className="bg-black border border-white/10 rounded-lg p-2 text-white text-sm"
                            />
                            <span className="text-gray-500">-</span>
                            <input 
                              type="time" 
                              value={data.slots[0]?.end || '17:00'}
                              className="bg-black border border-white/10 rounded-lg p-2 text-white text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Layout Direction</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setConfig({ ...config, embed_settings: { ...config.embed_settings, layout: 'vertical' } })}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                            config.embed_settings.layout === 'vertical' ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-500'
                          }`}
                        >
                          <div className="w-8 h-12 border-2 border-current rounded-md opacity-50" />
                          <span className="text-sm font-bold">Vertical</span>
                        </button>
                        <button 
                          onClick={() => setConfig({ ...config, embed_settings: { ...config.embed_settings, layout: 'horizontal' } })}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                            config.embed_settings.layout === 'horizontal' ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-500'
                          }`}
                        >
                          <div className="w-12 h-8 border-2 border-current rounded-md opacity-50" />
                          <span className="text-sm font-bold">Horizontal</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Accent Color</label>
                      <div className="flex gap-4">
                        <input 
                          type="color"
                          value={config.embed_settings.color}
                          onChange={e => setConfig({ ...config, embed_settings: { ...config.embed_settings, color: e.target.value } })}
                          className="w-16 h-16 rounded-2xl bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={config.embed_settings.color}
                          onChange={e => setConfig({ ...config, embed_settings: { ...config.embed_settings, color: e.target.value } })}
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Border Radius</label>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="range" min="0" max="3" step="0.1"
                          value={parseFloat(config.embed_settings.radius)}
                          onChange={e => setConfig({ ...config, embed_settings: { ...config.embed_settings, radius: `${e.target.value}rem` } })}
                          className="flex-1 accent-indigo-500"
                        />
                        <span className="text-white font-mono text-sm w-12">{config.embed_settings.radius}</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold">
                        <Globe className="w-5 h-5 text-indigo-400" />
                        <span>Scheduling Logic</span>
                      </div>
                      <select 
                        value={config.scheduling_type}
                        onChange={e => setConfig({ ...config, scheduling_type: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white"
                      >
                        <option value="individual">Individual (Just You)</option>
                        <option value="round_robin">Round Robin (Team Distribution)</option>
                        <option value="collective">Collective (All must be free)</option>
                      </select>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span>Booking Limits</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Rolling Days</span>
                          <span>{config.rolling_days} days</span>
                        </div>
                        <input 
                          type="range" min="1" max="365"
                          value={config.rolling_days}
                          onChange={e => setConfig({ ...config, rolling_days: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-3 text-white font-bold">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span>Buffers & Notice</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 uppercase">Buffer (min)</label>
                          <input 
                            type="number"
                            value={config.buffer_minutes}
                            onChange={e => setConfig({ ...config, buffer_minutes: parseInt(e.target.value) })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 uppercase">Min Notice (h)</label>
                          <input 
                            type="number"
                            value={config.min_notice_hours}
                            onChange={e => setConfig({ ...config, min_notice_hours: parseInt(e.target.value) })}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="text-center space-y-6 py-12">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2">Ready to Launch?</h2>
                      <p className="text-gray-400">Review your settings and create your booking type.</p>
                    </div>
                    <div className="max-w-sm mx-auto p-6 rounded-3xl bg-white/5 border border-white/10 text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Service</span>
                        <span className="text-white font-bold">{config.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-white font-bold">{config.duration_minutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price</span>
                        <span className="text-white font-bold">€{config.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Layout</span>
                        <span className="text-white font-bold capitalize">{config.embed_settings.layout}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer / Actions */}
          <div className="p-8 border-t border-white/10 bg-white/5 flex items-center justify-between">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold">Previous</span>
            </button>

            <div className="flex gap-4">
              {currentStep < STEPS.length - 1 ? (
                <button 
                  onClick={nextStep}
                  className="px-8 py-4 rounded-2xl bg-white text-black font-black italic uppercase tracking-tight hover:scale-105 transition-all flex items-center gap-2"
                >
                  Next Step
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-black italic uppercase tracking-tight hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20"
                >
                  {loading ? 'Creating...' : 'Create Booking Type'}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:col-span-5 sticky top-8 h-fit">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Live Preview</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative">
              <CallScheduler previewConfig={config} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

