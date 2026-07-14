import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, ChevronRight, ChevronLeft, Layout, Palette, 
  Video, HelpCircle, Users, TrendingUp, DollarSign, Globe,
  ArrowRight, Upload, Plus, Trash2, GripVertical, Store,
  Eye, Monitor, Smartphone, Image as ImageIcon, Info, Sparkles, Copy, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { DatabaseService } from '../../services/databaseService';
import { FileUpload } from '../FileUpload';
import { PhysicalProductDetail } from './details/PhysicalProductDetail';
import { ServiceDetail } from './details/ServiceDetail';
import { DigitalDetail } from './details/DigitalDetail';
import { CourseDetail } from './details/CourseDetail';
import { VirtualItemDetail } from './details/VirtualItemDetail';

interface StorePageBuilderProps {
  listingId: string;
  initialData: any;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 'media', title: 'Media & Gallery', icon: ImageIcon, description: 'Upload images and videos.' },
  { id: 'content', title: 'Content & FAQ', icon: HelpCircle, description: 'Answer common questions.' },
  { id: 'layout', title: 'Layout & Design', icon: Palette, description: 'Customize the look and feel.' },
  { id: 'sales', title: 'Sales & Upsells', icon: TrendingUp, description: 'Boost your revenue.' },
  { id: 'settings', title: 'Page Settings', icon: Globe, description: 'Configure URLs and SEO.' },
];

export const StorePageBuilder: React.FC<StorePageBuilderProps> = ({ listingId, initialData, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(isMobile ? 'mobile' : 'desktop');
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [formData, setFormData] = useState({
    thumbnail: initialData.thumbnail || '',
    gallery: initialData.images || [],
    videoUrl: initialData.video_url || '',
    faq: initialData.faq || [{ question: '', answer: '' }],
    personas: initialData.personas || [{ name: '', description: '' }],
    layout: initialData.layout_settings || { theme: 'modern', primaryColor: '#000000', sections: ['hero', 'description', 'gallery', 'reviews'] },
    upsells: initialData.upsell_products || [],
    subscriptionPlans: initialData.subscription_options || [],
    allowTrading: initialData.allow_trading || false,
    slug: initialData.slug || '',
    brandColor: initialData.layout_settings?.primaryColor || '#000000',
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setShowPreview(false);
        setShowSidebar(false);
      } else {
        setShowPreview(true);
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const listingType = initialData.type || 'product';

  const previewListing = {
    ...initialData,
    ...formData,
    images: formData.gallery,
    video_url: formData.videoUrl,
    layout_settings: { ...formData.layout, primaryColor: formData.brandColor },
    subscription_options: formData.subscriptionPlans,
    allow_trading: formData.allowTrading,
    seller: initialData.profiles?.name || 'Your Store',
    rating: 5.0,
  };

  const renderPreview = () => {
    const props = { 
      listing: previewListing, 
      relatedListings: [], 
      reviews: [],
      onContactSeller: () => {},
      onShare: () => {},
      onEnroll: () => {},
      stats: { students: 0, lessons: 0, certificates: 0 },
      canBuy: true // Preview mode always allows buying
    };
    
    switch (listingType) {
      case 'product':
      case 'affiliate':
        return <PhysicalProductDetail {...props} />;
      case 'service':
        return <ServiceDetail {...props} />;
      case 'digital':
        return <DigitalDetail {...props} />;
      case 'course':
        return <CourseDetail {...props} />;
      case 'virtual':
        return <VirtualItemDetail {...props} />;
      default:
        return <PhysicalProductDetail {...props} />;
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await DatabaseService.update('listings', listingId, {
        thumbnail: formData.thumbnail,
        images: formData.gallery,
        video_url: formData.videoUrl,
        faq: formData.faq,
        personas: formData.personas,
        layout_settings: { ...formData.layout, primaryColor: formData.brandColor },
        upsell_products: formData.upsells,
        subscription_options: formData.subscriptionPlans,
        allow_trading: formData.allowTrading,
        slug: formData.slug,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error saving store page:', error);
      if (error.code === '23505' && error.message?.includes('unique_seller_slug')) {
        toast.error('This URL slug is already taken. Please choose a different one.');
      } else {
        toast.error('Failed to save store page. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPersonaLabel = () => {
    switch (listingType) {
      case 'course': return 'Student Success Stories';
      case 'service': return 'Ideal Client Profile';
      case 'community': return 'Member Spotlights';
      default: return 'Buyer Personas';
    }
  };

  const showTrading = ['virtual', 'digital'].includes(listingType);
  const showSubscriptions = ['course', 'community', 'service'].includes(listingType);

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'media':
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Main Thumbnail</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileUpload
                  bucket="product-images"
                  onUpload={(url) => updateField('thumbnail', url)}
                  label="Upload Thumbnail"
                  darkMode={true}
                />
                {formData.thumbnail && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      onClick={() => updateField('thumbnail', '')}
                      className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {listingType === 'course' ? 'Course Preview Video' : 'Product Video'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Video className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => updateField('videoUrl', e.target.value)}
                  placeholder="YouTube or Vimeo URL"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#141414] border border-white/10 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Gallery Images</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {formData.gallery.map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10 shadow-lg">
                    <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={() => updateField('gallery', formData.gallery.filter((_: any, i: number) => i !== idx))}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square">
                  <FileUpload
                    bucket="product-images"
                    onUpload={(url) => updateField('gallery', [...formData.gallery, url])}
                    label="Add Image"
                    darkMode={true}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-gray-300">Frequently Asked Questions</label>
                <button
                  onClick={() => updateField('faq', [...formData.faq, { question: '', answer: '' }])}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
              <div className="space-y-4">
                {formData.faq.map((item: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#141414] border border-white/10 relative group transition-all hover:border-white/20">
                    <button 
                      onClick={() => {
                        const newFaq = [...formData.faq];
                        newFaq.splice(idx, 1);
                        updateField('faq', newFaq);
                      }}
                      className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const newFaq = [...formData.faq];
                        newFaq[idx].question = e.target.value;
                        updateField('faq', newFaq);
                      }}
                      placeholder="Question"
                      className="w-full mb-3 bg-transparent outline-none font-medium text-white placeholder-gray-600 text-lg"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newFaq = [...formData.faq];
                        newFaq[idx].answer = e.target.value;
                        updateField('faq', newFaq);
                      }}
                      placeholder="Answer"
                      className="w-full bg-transparent outline-none text-sm text-gray-400 placeholder-gray-600 resize-y min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-gray-300">{getPersonaLabel()}</label>
                <button
                  onClick={() => updateField('personas', [...formData.personas, { name: '', description: '' }])}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                >
                  <Plus className="w-4 h-4" /> Add {getPersonaLabel().slice(0, -1)}
                </button>
              </div>
              <div className="space-y-4">
                {formData.personas.map((item: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#141414] border border-white/10 relative group transition-all hover:border-white/20">
                    <button 
                      onClick={() => {
                        const newPersonas = [...formData.personas];
                        newPersonas.splice(idx, 1);
                        updateField('personas', newPersonas);
                      }}
                      className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newPersonas = [...formData.personas];
                        newPersonas[idx].name = e.target.value;
                        updateField('personas', newPersonas);
                      }}
                      placeholder="Name / Title"
                      className="w-full mb-3 bg-transparent outline-none font-medium text-white placeholder-gray-600 text-lg"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => {
                        const newPersonas = [...formData.personas];
                        newPersonas[idx].description = e.target.value;
                        updateField('personas', newPersonas);
                      }}
                      placeholder="Description or Testimonial"
                      className="w-full bg-transparent outline-none text-sm text-gray-400 placeholder-gray-600 resize-y min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'layout':
        return (
          <div className="space-y-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Brand Color</label>
              <div className="flex flex-wrap gap-4">
                {['#000000', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateField('brandColor', color)}
                    className={`w-12 h-12 rounded-2xl transition-all shadow-lg ${formData.brandColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A] scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/20 shadow-lg group">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => updateField('brandColor', e.target.value)}
                    className="absolute -inset-2 w-16 h-16 cursor-pointer"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                    <Palette className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Page Layout</label>
              <div className="p-6 rounded-2xl bg-[#141414] border border-white/10">
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Drag to reorder sections (Coming soon)
                </p>
                <div className="space-y-3">
                  {formData.layout.sections.map((section: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5 text-gray-500" />
                      <span className="capitalize font-medium text-gray-200">{section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-8">
            {showTrading && (
              <div>
                <label className="flex items-center justify-between p-6 rounded-2xl border cursor-pointer transition-all hover:bg-white/5 border-white/10 bg-[#141414]">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${formData.allowTrading ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">Enable Trading</div>
                      <div className="text-sm text-gray-400 mt-1">Allow users to trade this item on the marketplace</div>
                    </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full transition-colors relative ${formData.allowTrading ? 'bg-green-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md ${formData.allowTrading ? 'left-7' : 'left-1'}`} />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.allowTrading}
                    onChange={(e) => updateField('allowTrading', e.target.checked)}
                  />
                </label>
              </div>
            )}

            {showSubscriptions && (
               <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-gray-300">Subscription Plans</label>
                  <button
                    onClick={() => updateField('subscriptionPlans', [...formData.subscriptionPlans, { name: 'Monthly', price: '', interval: 'month' }])}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                  >
                    <Plus className="w-4 h-4" /> Add Plan
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.subscriptionPlans.map((plan: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex gap-4 items-center relative group transition-all hover:border-white/20">
                      <button 
                        onClick={() => {
                          const newPlans = [...formData.subscriptionPlans];
                          newPlans.splice(idx, 1);
                          updateField('subscriptionPlans', newPlans);
                        }}
                        className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const newPlans = [...formData.subscriptionPlans];
                          newPlans[idx].name = e.target.value;
                          updateField('subscriptionPlans', newPlans);
                        }}
                        placeholder="Plan Name"
                        className="flex-1 bg-transparent outline-none font-medium text-white placeholder-gray-600"
                      />
                      <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-gray-400">€</span>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => {
                            const newPlans = [...formData.subscriptionPlans];
                            newPlans[idx].price = e.target.value;
                            updateField('subscriptionPlans', newPlans);
                          }}
                          placeholder="0.00"
                          className="w-20 bg-transparent outline-none font-bold text-white text-right placeholder-gray-700"
                        />
                      </div>
                      <select
                        value={plan.interval}
                        onChange={(e) => {
                          const newPlans = [...formData.subscriptionPlans];
                          newPlans[idx].interval = e.target.value;
                          updateField('subscriptionPlans', newPlans);
                        }}
                        className="bg-black/50 border border-white/5 outline-none text-sm text-gray-300 px-4 py-2.5 rounded-xl appearance-none cursor-pointer"
                      >
                        <option value="month">/ month</option>
                        <option value="year">/ year</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Upsell Products</label>
              <p className="text-sm text-gray-500 mb-4">Select products to recommend alongside this one.</p>
              <button className="w-full py-6 border-2 border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2">
                <Plus className="w-6 h-6" />
                <span className="font-medium">Select Products</span>
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Custom URL</h3>
                  <p className="text-sm text-gray-500">Choose a unique link for your product page</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">URL Slug</label>
                  <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <span className="text-gray-500 pl-4 pr-2 select-none font-medium">{window.location.origin}/p/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="my-product-name"
                      className="flex-1 bg-transparent py-4 pr-4 outline-none text-white font-bold placeholder-gray-700"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 ml-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Only lowercase letters, numbers, and hyphens allowed.
                  </p>
                </div>

                {formData.slug && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Your Live Link</label>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-indigo-400 font-mono text-sm truncate">
                        {window.location.origin}/p/{formData.slug}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${formData.slug}`);
                          toast.success("Link copied to clipboard!");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[#141414] border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">SEO Optimization</h3>
                  <p className="text-sm text-gray-500">Improve how your page appears in search results</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Wersee automatically optimizes your page for search engines and social media sharing. 
                  Your custom slug helps search engines understand what your product is about.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" /> SEO Ready
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#050505] text-white">
      {/* Header */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#0A0A0A] shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400"
          >
            <Layout className="w-5 h-5" />
          </button>
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Store className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-xl tracking-tight truncate">Store Builder</h2>
            <p className="text-[10px] sm:text-sm text-gray-400 truncate">Editing: <span className="text-gray-200">{initialData.title}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden sm:flex items-center p-1.5 rounded-xl bg-[#141414] border border-white/5">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2.5 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              title="Desktop Preview"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2.5 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              title="Mobile Preview"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${showPreview ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            <Eye className="w-4 h-4" /> <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <X className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              initial={isMobile ? { x: -320 } : { width: 320 }}
              animate={isMobile ? { x: 0 } : { width: 320 }}
              exit={isMobile ? { x: -320 } : { width: 0 }}
              className={`
                ${isMobile ? 'fixed inset-y-20 left-0 z-50 shadow-2xl' : 'relative'}
                w-80 border-r border-white/10 p-6 flex flex-col bg-[#0A0A0A]
              `}
            >
              <nav className="space-y-2">
                {STEPS.map((step, idx) => {
                  const isActive = currentStep === idx;
                  const isPast = currentStep > idx;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStep(idx);
                        if (isMobile) setShowSidebar(false);
                      }}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left ${
                        isActive 
                          ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-500'}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold mb-0.5 flex items-center justify-between">
                          {step.title}
                          {isPast && !isActive && <Check className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                          {step.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
              
              <div className="mt-auto p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Pro Tip
                </p>
                <p className="text-sm text-gray-300 leading-relaxed relative z-10">
                  Adding a high-quality video preview can increase conversions by up to <span className="text-white font-bold">80%</span>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050505] relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-10">
            <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={STEPS[currentStep].id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10">
                    <h2 className="text-4xl font-bold mb-3 text-white tracking-tight">{STEPS[currentStep].title}</h2>
                    <p className="text-gray-400 text-lg">{STEPS[currentStep].description}</p>
                  </div>
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-white/10 flex justify-between items-center bg-[#0A0A0A] shrink-0">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all text-xs sm:text-base"
              >
                Save Draft
              </button>
              {currentStep === STEPS.length - 1 ? (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:scale-105 active:scale-95 text-xs sm:text-base"
                >
                  {loading ? (
                    <><span className="w-4 h-4 sm:w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
                  ) : (
                    <>Publish <span className="hidden sm:inline">Page</span> <Check className="w-4 h-4 sm:w-5 h-5" /></>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 text-xs sm:text-base"
                >
                  Next <span className="hidden sm:inline">Step</span> <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: previewMode === 'mobile' ? '450px' : '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative border-l border-white/10 overflow-hidden flex flex-col bg-[#0A0A0A]"
            >
              <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-90">
                <div 
                  className={`transition-all duration-500 shadow-2xl overflow-hidden bg-black origin-top ${
                    previewMode === 'mobile' 
                      ? 'w-[375px] min-h-[812px] rounded-[3rem] border-[12px] border-[#1A1A1A] mt-4 shadow-black/50' 
                      : 'w-full max-w-5xl min-h-[800px] rounded-2xl border border-white/10 scale-[0.85] sm:scale-90 md:scale-100 shadow-black/50'
                  }`}
                >
                  <div className="w-full h-full overflow-y-auto scrollbar-hide pointer-events-none">
                    {renderPreview()}
                  </div>
                </div>
              </div>
              
              {/* Preview Overlay Info */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-[#1A1A1A]/90 border border-white/10 backdrop-blur-md text-white text-sm font-bold flex items-center gap-3 shadow-2xl z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                Live Preview ({previewMode === 'mobile' ? 'Mobile' : 'Desktop'})
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
