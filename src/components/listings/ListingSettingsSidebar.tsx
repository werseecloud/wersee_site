import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Image as ImageIcon, CheckCircle2, Circle, Eye, DollarSign, Link as LinkIcon, MoreHorizontal, Plus, AlertCircle, ShieldCheck, Timer, Users, HelpCircle, Mail } from 'lucide-react';
import { FileUpload } from '../FileUpload';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

interface ListingSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onUpdate: (updates: any) => void;
}

const CATEGORIES = [
  'Technology', 'Design', 'Business', 'Marketing', 'Development',
  'Photography', 'Music', 'Art', 'Writing', 'Lifestyle'
];

type Tab = 'general' | 'views' | 'price' | 'tracking' | 'more';

export const ListingSettingsSidebar: React.FC<ListingSettingsSidebarProps> = ({
  isOpen,
  onClose,
  listing,
  onUpdate
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(listing.categories || []);
  const [customCategory, setCustomCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>(listing.custom_categories || []);
  const [logoUrl, setLogoUrl] = useState(listing.logo_url || '');
  const [plans, setPlans] = useState<any[]>(listing.plans || []);
  const [trackingLinks, setTrackingLinks] = useState<any[]>(listing.tracking_links || []);
  const [widgets, setWidgets] = useState<any[]>(listing.widgets || []);
  const [isSaving, setIsSaving] = useState(false);

  const AVAILABLE_WIDGETS = [
    { id: 'trust_badges', label: 'Trust Badges', icon: ShieldCheck, description: 'Show security and trust icons' },
    { id: 'countdown', label: 'Countdown Timer', icon: Timer, description: 'Create urgency for your offer' },
    { id: 'social_proof', label: 'Social Proof', icon: Users, description: 'Show recent sales or views' },
    { id: 'faq', label: 'FAQ Section', icon: HelpCircle, description: 'Answer common questions' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Collect email subscribers' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        categories: selectedCategories,
        custom_categories: customCategories,
        logo_url: logoUrl,
        plans,
        tracking_links: trackingLinks,
        widgets
      });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addPlan = () => {
    const newPlans = [...plans, { name: 'New Plan', price: 0, features: [] }];
    setPlans(newPlans);
  };

  const updatePlan = (index: number, updates: any) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], ...updates };
    setPlans(newPlans);
  };

  const removePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const addTrackingLink = () => {
    const newLinks = [...trackingLinks, { label: 'New Link', url: '' }];
    setTrackingLinks(newLinks);
  };

  const updateTrackingLink = (index: number, updates: any) => {
    const newLinks = [...trackingLinks];
    newLinks[index] = { ...newLinks[index], ...updates };
    setTrackingLinks(newLinks);
  };

  const removeTrackingLink = (index: number) => {
    setTrackingLinks(trackingLinks.filter((_, i) => i !== index));
  };

  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.includes(widgetId)
      ? widgets.filter(id => id !== widgetId)
      : [...widgets, widgetId];
    setWidgets(newWidgets);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      setCustomCategories(prev => [...prev, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const removeCustomCategory = (category: string) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
  };

  const handleLogoUpload = (url: string) => {
    setLogoUrl(url);
  };

  const hasStripe = !!user; // Simplified check for now

  const steps = [
    { id: 'basic', label: 'Basic Information', completed: !!listing.title && !!listing.description && !!listing.price },
    { id: 'media', label: 'Media & Gallery', completed: listing.images?.length > 0 },
    { id: 'logo', label: 'Store/Listing Logo', completed: !!logoUrl },
    { id: 'categories', label: 'Categories Selected', completed: selectedCategories.length > 0 || customCategories.length > 0 },
  ];

  if (listing.price > 0) {
    steps.push({ id: 'stripe', label: 'Activate Stripe Account', completed: hasStripe });
  }

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'views', label: 'Views', icon: Eye },
    { id: 'price', label: 'Price', icon: DollarSign },
    { id: 'tracking', label: 'Tracking Links', icon: LinkIcon },
    { id: 'more', label: 'More', icon: MoreHorizontal }
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Settings className="w-5 h-5 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold text-white">Listing Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Topbar Pills */}
            <div className="px-6 py-4 border-b border-white/10 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Categories */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Categories</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {CATEGORIES.map(category => (
                          <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCategories.includes(category)
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      {/* Custom Categories */}
                      <div className="mt-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Custom Categories (Widgets)</h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                            placeholder="Add custom category..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={addCustomCategory}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence>
                            {customCategories.map(cat => (
                              <motion.div
                                key={cat}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm"
                              >
                                <span>{cat}</span>
                                <button onClick={() => removeCustomCategory(cat)} className="hover:text-white transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Listing Logo</h3>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-[#141414] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <FileUpload
                            bucket="product-images"
                            onUpload={handleLogoUpload}
                            label="Upload Logo"
                            darkMode={true}
                          />
                          <p className="text-xs text-gray-500 mt-2">Recommended size: 512x512px. Max 2MB.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'views' && (
                  <motion.div
                    key="views"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Listing Views</h3>
                    <div className="grid gap-4">
                      {['Default View', 'Minimal View', 'Gallery View'].map((view, i) => (
                        <button
                          key={view}
                          onClick={() => onUpdate({ view_type: view.toLowerCase().replace(' ', '_') })}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            (listing.view_type || 'default_view') === view.toLowerCase().replace(' ', '_')
                              ? 'bg-indigo-500/10 border-indigo-500 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="font-medium mb-1">{view}</div>
                          <div className="text-xs opacity-70">Select this layout for your public listing page.</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'price' && (
                  <motion.div
                    key="price"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Pricing Options</h3>
                      <div className="text-xl font-bold text-white">€{listing.price} {listing.pricing_type === 'subscription' && <span className="text-sm text-gray-500 font-normal">/ {listing.billing_interval || 'month'}</span>}</div>
                    </div>
                    
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">Subscription Model</div>
                          <div className="text-xs text-gray-400 mt-1">Charge customers on a recurring basis</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={listing.pricing_type === 'subscription'}
                            onChange={(e) => onUpdate({ pricing_type: e.target.checked ? 'subscription' : 'one_time' })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>

                      <AnimatePresence>
                        {listing.pricing_type === 'subscription' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-white/10 overflow-hidden space-y-4"
                          >
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Billing Interval</label>
                              <select
                                value={listing.billing_interval || 'month'}
                                onChange={(e) => onUpdate({ billing_interval: e.target.value })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="year">Yearly</option>
                              </select>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-400">Subscription Plans</label>
                                <button 
                                  onClick={addPlan}
                                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Plan
                                </button>
                              </div>

                              <div className="space-y-3">
                                {plans.map((plan, idx) => (
                                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                    <div className="flex gap-2">
                                      <input 
                                        type="text"
                                        value={plan.name}
                                        onChange={(e) => updatePlan(idx, { name: e.target.value })}
                                        placeholder="Plan Name"
                                        className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                      />
                                      <div className="flex items-center gap-1 bg-black border border-white/10 rounded-lg px-3 py-2">
                                        <span className="text-gray-500 text-sm">€</span>
                                        <input 
                                          type="number"
                                          value={plan.price}
                                          onChange={(e) => updatePlan(idx, { price: parseFloat(e.target.value) || 0 })}
                                          className="w-16 bg-transparent text-sm text-white outline-none"
                                        />
                                      </div>
                                      <button onClick={() => removePlan(idx)} className="p-2 text-gray-500 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tracking' && (
                  <motion.div
                    key="tracking"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tracking Links</h3>
                      <button 
                        onClick={addTrackingLink}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Link
                      </button>
                    </div>

                    <div className="space-y-4">
                      {trackingLinks.length === 0 ? (
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
                          <LinkIcon className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">Add tracking pixels or affiliate links to monitor performance.</p>
                        </div>
                      ) : (
                        trackingLinks.map((link, idx) => (
                          <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={link.label}
                                onChange={(e) => updateTrackingLink(idx, { label: e.target.value })}
                                placeholder="Label (e.g. Facebook Pixel)"
                                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                              />
                              <button onClick={() => removeTrackingLink(idx)} className="p-2 text-gray-500 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <input 
                              type="text"
                              value={link.url}
                              onChange={(e) => updateTrackingLink(idx, { url: e.target.value })}
                              placeholder="URL or Pixel ID"
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'more' && (
                  <motion.div
                    key="more"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Advanced Features</h3>
                    
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">Affiliate Program</div>
                          <div className="text-xs text-gray-400 mt-1">Allow others to promote your product</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={listing.affiliate_enabled || false}
                            onChange={(e) => onUpdate({ affiliate_enabled: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>

                      <AnimatePresence>
                        {listing.affiliate_enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-white/10 overflow-hidden"
                          >
                            <label className="block text-sm font-medium text-gray-400 mb-2">Commission Percentage (%)</label>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={listing.affiliate_commission || 10}
                              onChange={(e) => onUpdate({ affiliate_commission: parseInt(e.target.value) })}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Widgets</h3>
                      <div className="grid gap-3">
                        {AVAILABLE_WIDGETS.map(widget => (
                          <button
                            key={widget.id}
                            onClick={() => toggleWidget(widget.id)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                              widgets.includes(widget.id)
                                ? 'bg-indigo-500/10 border-indigo-500 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${widgets.includes(widget.id) ? 'bg-indigo-500 text-white' : 'bg-white/5'}`}>
                              <widget.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm">{widget.label}</div>
                              <div className="text-xs opacity-60">{widget.description}</div>
                            </div>
                            {widgets.includes(widget.id) && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Completion Steps (Always visible at bottom) */}
            <div className="p-6 border-t border-white/10 bg-[#141414] space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Setup Progress</h3>
                  <span className="text-sm font-medium text-indigo-400">{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="space-y-3">
                  {steps.map(step => (
                    <div key={step.id} className="flex items-center gap-3">
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : step.id === 'stripe' ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                      )}
                      <span className={`text-sm ${step.completed ? 'text-gray-300' : step.id === 'stripe' ? 'text-amber-500 font-medium' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
