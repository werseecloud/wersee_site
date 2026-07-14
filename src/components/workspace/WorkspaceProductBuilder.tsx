import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Image as ImageIcon, Tag, FileText, DollarSign, 
  Settings, Eye, CheckCircle2, Package, Briefcase, Wrench, Download, 
  Gamepad2, Users, CreditCard, Link as LinkIcon, Trash2, X, Sparkles,
  ChevronRight, Monitor, Smartphone, Tablet, Type as TypeIcon
} from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

interface WorkspaceProductBuilderProps {
  initialType?: string;
  initialProductId?: string;
  onClose: () => void;
}

const PRODUCT_TYPES = [
  { id: 'physical', label: 'Physical Product', icon: Package, description: 'Sell tangible goods that require shipping' },
  { id: 'digital', label: 'Digital Product', icon: Download, description: 'Sell downloadable files, courses, or software' },
  { id: 'service', label: 'Service', icon: Wrench, description: 'Offer your time, skills, or consulting' },
  { id: 'job', label: 'Job / Vacancy', icon: Briefcase, description: 'Post a job opening or freelance gig' },
  { id: 'virtual', label: 'Virtual Item', icon: Gamepad2, description: 'In-game items, digital art, or virtual goods' },
  { id: 'community', label: 'Paid Community', icon: Users, description: 'Create a subscription-based community' },
  { id: 'pos', label: 'POS Item', icon: CreditCard, description: 'Items for your point-of-sale system' },
  { id: 'affiliate', label: 'Affiliate Product', icon: LinkIcon, description: 'Promote products and earn commissions' },
];

const CustomInput = ({ label, icon: Icon, error, ...props }: any) => (
  <div className="relative group">
    <div className="flex justify-between items-center mb-2">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-white transition-colors">
        {label}
      </label>
      {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</span>}
    </div>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-white border border-white/10 rounded-xl ${Icon ? 'pl-11' : 'px-5'} py-4 text-black placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium shadow-sm`}
      />
    </div>
  </div>
);

const CustomTextarea = ({ label, ...props }: any) => (
  <div className="relative group">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-white transition-colors">
      {label}
    </label>
    <textarea
      {...props}
      className="w-full bg-white border border-white/10 rounded-xl px-5 py-4 text-black placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm font-medium min-h-[120px] shadow-sm"
    />
  </div>
);

const CustomSelect = ({ label, children, ...props }: any) => (
  <div className="relative group">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-white transition-colors">
      {label}
    </label>
    <div className="relative">
      <select
        {...props}
        className="w-full bg-white border border-white/10 rounded-xl px-5 py-4 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-sm font-medium cursor-pointer shadow-sm"
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </div>
    </div>
  </div>
);

export const WorkspaceProductBuilder: React.FC<WorkspaceProductBuilderProps> = ({ 
  initialType = 'physical', 
  initialProductId,
  onClose 
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!initialProductId);
  const [previewTab, setPreviewTab] = useState<'card' | 'page' | 'email' | 'checkout'>('card');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [formData, setFormData] = useState({
    type: initialType,
    title: '',
    description: '',
    price: '',
    currency: 'EUR',
    images: [] as string[],
    category: 'Digital Service',
    status: 'draft',
    location_type: 'remote', // remote, on-site
    payment_type: 'fixed', // fixed, hourly
    // Type specific fields
    stock: '',
    shipping_fee: '',
    download_url: '',
    location: '',
    job_type: 'full-time',
    commission_rate: '',
    subscription_interval: 'monthly',
    community_url: '',
    duration: '',
    delivery_time: '',
    game_name: '',
    item_type: '',
    barcode: '',
    sku: '',
  });

  React.useEffect(() => {
    if (initialProductId) {
      fetchProduct();
    }
  }, [initialProductId]);

  const fetchProduct = async (retries = 3) => {
    try {
      const data = await DatabaseService.get('listings', {
        eq: { id: initialProductId },
        single: true
      });
      if (data) {
        setFormData({
          type: data.type || 'physical',
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          currency: data.currency || 'EUR',
          images: data.images || [],
          category: data.category || 'Digital Service',
          status: data.status || 'draft',
          location_type: data.metadata?.location_type || 'remote',
          payment_type: data.metadata?.payment_type || 'fixed',
          stock: data.metadata?.stock || '',
          shipping_fee: data.metadata?.shipping_fee || '',
          download_url: data.metadata?.download_url || '',
          location: data.metadata?.location || '',
          job_type: data.metadata?.job_type || 'full-time',
          commission_rate: data.metadata?.commission_rate || '',
          subscription_interval: data.metadata?.subscription_interval || 'monthly',
          community_url: data.metadata?.community_url || '',
          duration: data.metadata?.duration || '',
          delivery_time: data.metadata?.delivery_time || '',
          game_name: data.metadata?.game_name || '',
          item_type: data.metadata?.item_type || '',
          barcode: data.metadata?.barcode || '',
          sku: data.metadata?.sku || '',
        });
      }
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying fetchProduct... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return fetchProduct(retries - 1);
      }
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleSave = async (statusOverride?: 'draft' | 'published') => {
    if (!user) return;
    try {
      setIsSaving(true);
      const finalStatus = statusOverride || formData.status;
      const listingData = {
        seller_id: user.id,
        title: formData.title || 'Untitled Product',
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        type: formData.type,
        status: finalStatus,
        category: formData.category || formData.type,
        images: formData.images,
        metadata: {
          stock: formData.stock,
          shipping_fee: formData.shipping_fee,
          download_url: formData.download_url,
          location: formData.location,
          job_type: formData.job_type,
          commission_rate: formData.commission_rate,
          subscription_interval: formData.subscription_interval,
          community_url: formData.community_url,
          duration: formData.duration,
          delivery_time: formData.delivery_time,
          game_name: formData.game_name,
          item_type: formData.item_type,
          barcode: formData.barcode,
          sku: formData.sku,
          location_type: formData.location_type,
          payment_type: formData.payment_type,
        }
      };
      
      if (initialProductId) {
        await DatabaseService.update('listings', initialProductId, listingData);
      } else {
        await DatabaseService.insert('listings', listingData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  const STEPS = [
    { id: 1, label: 'Identify', icon: Tag },
    { id: 2, label: 'Pricing', icon: DollarSign },
    { id: 3, label: 'Visuals', icon: ImageIcon },
    { id: 4, label: 'Details', icon: Settings },
    { id: 5, label: 'Review', icon: CheckCircle2 },
  ];

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-8">
            <CustomInput
              label={`${typeConfig.label} Title`}
              placeholder="e.g. Professional Logo Design"
              value={formData.title}
              onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
            />

            <CustomSelect
              label="Category"
              value={formData.category}
              onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Graphic Design">Graphic Design</option>
              <option value="Digital Service">Digital Service</option>
              <option value="Physical Product">Physical Product</option>
              <option value="Consulting">Consulting</option>
              <option value="Software">Software</option>
              <option value="Education">Education</option>
            </CustomSelect>

            {formData.type === 'service' && (
              <div className="space-y-4">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">Service Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, payment_type: 'fixed'})}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.payment_type === 'fixed' ? 'bg-white/5 border-white' : 'bg-transparent border-white/10 text-gray-500'}`}
                  >
                    <div className="font-bold text-white mb-1">Fixed Package</div>
                    <div className="text-xs opacity-60">One-time delivery</div>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, payment_type: 'hourly'})}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.payment_type === 'hourly' ? 'bg-white/5 border-white' : 'bg-transparent border-white/10 text-gray-500'}`}
                  >
                    <div className="font-bold text-white mb-1">Subscription</div>
                    <div className="text-xs opacity-60">Monthly retainer</div>
                  </button>
                </div>
              </div>
            )}

            {(formData.type === 'physical' || formData.type === 'pos') && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <CustomInput
                  label="SKU"
                  placeholder="Stock Keeping Unit"
                  value={formData.sku}
                  onChange={(e: any) => setFormData({ ...formData, sku: e.target.value })}
                />
                <CustomInput
                  label="Barcode"
                  placeholder="EAN/UPC"
                  value={formData.barcode}
                  onChange={(e: any) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <CustomTextarea
              label="Description"
              placeholder="Describe your offering in detail..."
              rows={6}
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <CustomInput
                label="Price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
              />
              <CustomSelect
                label="Currency"
                value={formData.currency}
                onChange={(e: any) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </CustomSelect>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Media & Assets</h3>
            <div className="grid grid-cols-2 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Upload Image</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData(p => ({ ...p, images: [...p.images, reader.result as string] }));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Specific Details</h3>
            {(formData.type === 'physical' || formData.type === 'pos') && (
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Stock Quantity"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e: any) => setFormData({ ...formData, stock: e.target.value })}
                />
                {formData.type === 'physical' ? (
                  <CustomInput
                    label="Shipping Fee"
                    type="number"
                    placeholder="0.00"
                    value={formData.shipping_fee}
                    onChange={(e: any) => setFormData({ ...formData, shipping_fee: e.target.value })}
                  />
                ) : (
                  <CustomInput
                    label="Tax Rate %"
                    type="number"
                    placeholder="21"
                    value={formData.commission_rate} // Reusing commission_rate for tax rate
                    onChange={(e: any) => setFormData({ ...formData, commission_rate: e.target.value })}
                  />
                )}
              </div>
            )}
            {formData.type === 'digital' && (
              <CustomInput
                label="Download URL"
                placeholder="https://your-file-link.com"
                value={formData.download_url}
                onChange={(e: any) => setFormData({ ...formData, download_url: e.target.value })}
              />
            )}
            {formData.type === 'service' && (
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Delivery Time"
                  placeholder="e.g. 3-5 days"
                  value={formData.delivery_time}
                  onChange={(e: any) => setFormData({ ...formData, delivery_time: e.target.value })}
                />
                <CustomInput
                  label="Duration"
                  placeholder="e.g. 1 hour"
                  value={formData.duration}
                  onChange={(e: any) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            )}
            {formData.type === 'community' && (
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Community URL"
                  placeholder="Discord/Slack link"
                  value={formData.community_url}
                  onChange={(e: any) => setFormData({ ...formData, community_url: e.target.value })}
                />
                <CustomSelect
                  label="Interval"
                  value={formData.subscription_interval}
                  onChange={(e: any) => setFormData({ ...formData, subscription_interval: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </CustomSelect>
              </div>
            )}
            {formData.type === 'affiliate' && (
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Affiliate Link"
                  placeholder="https://..."
                  value={formData.community_url} // Reusing community_url for affiliate link
                  onChange={(e: any) => setFormData({ ...formData, community_url: e.target.value })}
                />
                <CustomInput
                  label="Commission %"
                  type="number"
                  placeholder="0"
                  value={formData.commission_rate}
                  onChange={(e: any) => setFormData({ ...formData, commission_rate: e.target.value })}
                />
              </div>
            )}
            {formData.type === 'job' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    label="Location"
                    placeholder="e.g. London, UK"
                    value={formData.location}
                    onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <CustomSelect
                    label="Job Type"
                    value={formData.job_type}
                    onChange={(e: any) => setFormData({ ...formData, job_type: e.target.value })}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </CustomSelect>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label="Location Type"
                    value={formData.location_type}
                    onChange={(e: any) => setFormData({ ...formData, location_type: e.target.value })}
                  >
                    <option value="remote">Remote</option>
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </CustomSelect>
                  <CustomSelect
                    label="Payment Type"
                    value={formData.payment_type}
                    onChange={(e: any) => setFormData({ ...formData, payment_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                  </CustomSelect>
                </div>
              </div>
            )}
            {formData.type === 'virtual' && (
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Game Name"
                  placeholder="e.g. Roblox"
                  value={formData.game_name}
                  onChange={(e: any) => setFormData({ ...formData, game_name: e.target.value })}
                />
                <CustomInput
                  label="Item Type"
                  placeholder="e.g. Skin, Currency"
                  value={formData.item_type}
                  onChange={(e: any) => setFormData({ ...formData, item_type: e.target.value })}
                />
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 py-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Review Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Title</span>
                  <span className="font-bold">{formData.title || 'Untitled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="font-bold capitalize">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="font-bold">{formData.currency} {formData.price || '0.00'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-indigo-400">Ready to publish?</div>
                <div className="text-xs text-indigo-400/60">Your product will be live immediately.</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const typeConfig = PRODUCT_TYPES.find(t => t.id === formData.type) || PRODUCT_TYPES[0];
  const Icon = typeConfig.icon;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Form */}
      <div className={`w-full md:max-w-[480px] bg-black border-r border-white/10 flex flex-col h-full relative transition-all duration-500 ${showPreview && isMobile ? 'translate-x-[-100%]' : 'translate-x-0'}`}>
        <div className="p-4 md:p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={onClose} className="p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors active:scale-90">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic leading-none">
                {formData.type === 'job' ? 'Post a Job' : `Offer a ${typeConfig.label}`}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-black uppercase tracking-widest text-white">
                  Step {step}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-700">/ 5</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button 
                onClick={() => setShowPreview(true)}
                className="p-2.5 bg-white/5 text-gray-400 rounded-2xl active:scale-90"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl active:scale-90">
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 md:px-8 py-2">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="pb-24"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className={`p-4 md:p-8 border-t border-white/10 bg-black flex items-center gap-4 shrink-0 ${isMobile ? 'fixed bottom-6 left-4 right-4 z-[70] bg-[#0A0A0A]/70 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] px-6 py-4' : ''}`}>
          {isMobile && <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[2rem]" />}
          
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-0 transition-all active:scale-90 relative z-10 ${step === 1 ? 'w-0 overflow-hidden' : 'px-4'}`}
          >
            <ArrowLeft className="w-4 h-4" /> {isMobile ? '' : 'Back'}
          </button>
          
          <button
            onClick={step === 5 ? () => handleSave('published') : nextStep}
            disabled={step === 1 && !formData.title}
            className="flex-1 py-4 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 relative z-10 shadow-lg"
          >
            {step === 5 ? 'Publish' : 'Next Step'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className={`flex-1 bg-[#F8F9FA] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden transition-all duration-500 ${isMobile ? (showPreview ? 'fixed inset-0 z-[60]' : 'hidden') : 'flex'}`}>
        {isMobile && (
          <button 
            onClick={() => setShowPreview(false)}
            className="absolute top-6 left-6 z-[70] p-3 bg-black text-white rounded-2xl shadow-2xl active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Preview Header */}
        <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-2 p-1 md:p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 z-10">
          {(['card', 'page', 'email', 'checkout'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setPreviewTab(tab)}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${previewTab === tab ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Device Toggles */}
        <div className="hidden md:flex absolute top-8 right-8 items-center gap-1 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-xl transition-all ${previewDevice === 'mobile' ? 'bg-gray-100 text-black' : 'text-gray-400'}`}><Smartphone className="w-4 h-4" /></button>
          <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded-xl transition-all ${previewDevice === 'tablet' ? 'bg-gray-100 text-black' : 'text-gray-400'}`}><Tablet className="w-4 h-4" /></button>
          <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-xl transition-all ${previewDevice === 'desktop' ? 'bg-gray-100 text-black' : 'text-gray-400'}`}><Monitor className="w-4 h-4" /></button>
        </div>

        {/* Preview Canvas */}
        <motion.div 
          layout
          className={`bg-white rounded-[32px] md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden transition-all duration-500 mt-12 md:mt-0 ${
            previewDevice === 'mobile' || isMobile ? 'w-full max-w-[375px] h-[667px]' : 
            previewDevice === 'tablet' ? 'w-[768px] h-[1024px]' : 
            'w-[500px] h-[700px]'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Mock Content */}
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                {formData.category}
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-8">
                {formData.title || `${typeConfig.label} Title`}
              </h2>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Packages</h4>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-gray-900">Basic</span>
                      <span className="font-black text-gray-900">€</span>
                    </div>
                    <p className="text-gray-400 text-xs">Package description...</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Add-ons</h4>
                  <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-600">Fast Delivery</span>
                    <span className="text-sm font-bold text-gray-400">+€25</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Total Price
              </span>
              <span className="text-2xl font-black text-gray-900">
                {formData.currency} {formData.price || '0.00'}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400" /> Live Preview
        </div>
      </div>
    </div>
  );
};
