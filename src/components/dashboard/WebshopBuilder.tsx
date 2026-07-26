import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutTemplate, Globe, Sparkles, Check, ChevronRight, 
  Smartphone, Monitor, Eye, Save, ExternalLink, Loader2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Mock templates
const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Clean, whitespace-heavy design perfect for high-end products.',
    preview: 'bg-gray-50 border-gray-200',
    color: 'bg-white'
  },
  {
    id: 'bold',
    name: 'Bold & Brutalist',
    description: 'High contrast, large typography, and sharp edges.',
    preview: 'bg-black border-white/20',
    color: 'bg-black text-white'
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    description: 'Warm, inviting colors for lifestyle and handmade items.',
    preview: 'bg-rose-50 border-rose-100',
    color: 'bg-[#FFF0F5]'
  },
  {
    id: 'cyber',
    name: 'Cyber Dark',
    description: 'Neon accents and dark mode for digital goods and gaming.',
    preview: 'bg-slate-900 border-blue-500/30',
    color: 'bg-[#0F172A] text-blue-400'
  },
  {
    id: 'corporate',
    name: 'Professional',
    description: 'Trustworthy and structured for services and B2B.',
    preview: 'bg-blue-50 border-blue-100',
    color: 'bg-[#F0F9FF]'
  }
];

export const WebshopBuilder = ({ user }: { user: any }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'template' | 'embed' | 'ai' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [userListings, setUserListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .limit(4);
      if (data) setUserListings(data);
    };
    fetchListings();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock saving to Supabase
      const { error } = await supabase
        .from('webshops')
        .upsert({
          user_id: user.id,
          mode,
          config: {
            template: selectedTemplate,
            embed_url: embedUrl,
            ai_prompt: aiPrompt,
            custom_url: customUrl
          },
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSaving(false);
    } catch (err) {
      console.error('Error saving webshop:', err);
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call an AI endpoint
      // For now, we'll just transition to the next step
      setIsGenerating(false);
      setStep(3);
    } catch (err) {
      console.error('Error generating AI shop:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F]">Webshop Builder</h2>
          <p className="text-gray-500">Create your personal storefront in minutes.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            View Live Site
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#1D1D1F] text-white rounded-full font-medium hover:bg-black/90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 border-r border-black/5 p-6 bg-gray-50/50">
          <div className="space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 1 ? 'bg-[#1D1D1F] text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
              <div className="h-1 flex-1 bg-gray-200 rounded-full">
                <div className={`h-full bg-[#1D1D1F] rounded-full transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 2 ? 'bg-[#1D1D1F] text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
              <div className="h-1 flex-1 bg-gray-200 rounded-full">
                <div className={`h-full bg-[#1D1D1F] rounded-full transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 3 ? 'bg-[#1D1D1F] text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
            </div>

            {/* Step 1: Mode Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-[#1D1D1F]">Choose your method</h3>
                
                <button 
                  onClick={() => { setMode('template'); setStep(2); }}
                  className="w-full p-4 text-left bg-white border border-black/5 rounded-2xl hover:border-black/20 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <LayoutTemplate className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-medium text-[#1D1D1F]">Use a Template</div>
                  <div className="text-sm text-gray-500">Choose from 5 pro designs</div>
                </button>

                <button 
                  onClick={() => { setMode('embed'); setStep(2); }}
                  className="w-full p-4 text-left bg-white border border-black/5 rounded-2xl hover:border-black/20 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="font-medium text-[#1D1D1F]">Embed Website</div>
                  <div className="text-sm text-gray-500">Use your existing site</div>
                </button>

                <button 
                  onClick={() => { setMode('ai'); setStep(2); }}
                  className="w-full p-4 text-left bg-white border border-black/5 rounded-2xl hover:border-black/20 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-medium text-[#1D1D1F]">Generate with AI</div>
                  <div className="text-sm text-gray-500">Build a unique site instantly</div>
                </button>
              </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && (
              <div className="space-y-6">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-[#1D1D1F] flex items-center gap-1">
                  ← Back
                </button>

                {mode === 'template' && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[#1D1D1F]">Select a Template</h3>
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`w-full p-3 text-left rounded-xl border transition-all ${
                          selectedTemplate === t.id 
                            ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white' 
                            : 'border-black/5 bg-white hover:border-black/20'
                        }`}
                      >
                        <div className="font-medium">{t.name}</div>
                        <div className={`text-xs ${selectedTemplate === t.id ? 'text-gray-300' : 'text-gray-500'}`}>{t.description}</div>
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'embed' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1D1D1F]">Enter URL</h3>
                    <input
                      type="url"
                      placeholder="https://your-site.com"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#1D1D1F] focus:ring-0 outline-none"
                    />
                    <p className="text-xs text-gray-500">
                      Make sure your site allows embedding (X-Frame-Options).
                    </p>
                  </div>
                )}

                {mode === 'ai' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1D1D1F]">Describe your vibe</h3>
                    <textarea
                      placeholder="e.g. A dark, futuristic store selling gaming gear with neon accents..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#1D1D1F] focus:ring-0 outline-none min-h-[120px]"
                    />
                    <button
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt || isGenerating}
                      className="w-full py-3 bg-[#1D1D1F] text-white rounded-xl font-medium hover:bg-black/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Site
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Domain */}
            {step === 3 && (
              <div className="space-y-6">
                 <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-[#1D1D1F] flex items-center gap-1">
                  ← Back
                </button>
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#1D1D1F]">Custom Domain</h3>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-black/10 bg-white">
                    <span className="text-gray-500">avenue.com/</span>
                    <input
                      type="text"
                      placeholder="your-brand"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 outline-none bg-transparent font-medium"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This will be your public storefront URL.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-500 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Live Preview
            </h3>
            <div className="flex gap-2">
              <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                <Monitor className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                <Smartphone className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5 relative">
            {/* Mock Browser Bar */}
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white h-5 rounded-md border border-gray-200 text-[10px] flex items-center px-2 text-gray-400">
                {customUrl ? `avenue.com/${customUrl}` : 'avenue.com/your-store'}
              </div>
            </div>

            {/* Content Preview */}
            <div className="h-full overflow-y-auto">
              {mode === 'embed' && embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full border-0" title="Preview" />
              ) : (
                <div className={`min-h-full p-8 ${
                  mode === 'template' && selectedTemplate 
                    ? TEMPLATES.find(t => t.id === selectedTemplate)?.color 
                    : 'bg-white'
                }`}>
                  {/* Mock Store Content */}
                  <nav className="flex justify-between items-center mb-12">
                    <div className="font-bold text-xl">YOUR BRAND</div>
                    <div className="flex gap-4 text-sm opacity-70">
                      <span>Shop</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </nav>

                  <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Premium Collection</h1>
                    <p className="opacity-70 max-w-md mx-auto">
                      Discover our curated selection of high-quality products designed for your lifestyle.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {userListings.map(product => (
                      <div key={product.id} className="group cursor-pointer">
                        <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-2 relative">
                          <img 
                            src={product.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80'} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="font-medium text-sm truncate">{product.title}</div>
                        <div className="text-sm opacity-70">${product.price}</div>
                      </div>
                    ))}
                    {userListings.length === 0 && (
                      <div className="col-span-2 text-center py-8 opacity-50">
                        No products found. Add some products to see them here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
