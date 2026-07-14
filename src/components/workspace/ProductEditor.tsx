import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Eye, Layout, FileText, Settings, Image as ImageIcon, Loader2, ArrowLeft, Video, Link as LinkIcon, BookOpen, Key, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FileUpload } from '../FileUpload';
import { CourseCurriculum } from './CourseCurriculum';
import { StripeSetupModal } from './StripeSetupModal';

import { appToast } from '@/lib/feedback';
interface ProductEditorProps {
  productId: string;
  onClose: () => void;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ productId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'curriculum' | 'settings' | 'license' | 'affiliates'>('details');
  const [product, setProduct] = useState<any>(null);
  const [affiliateProgram, setAffiliateProgram] = useState<any>(null);
  const [isStripeSetup, setIsStripeSetup] = useState(true);
  const [showStripeModal, setShowStripeModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image: '',
    status: 'draft',
    content_url: '',
    preview_url: '',
    curriculum: [] as any[], // For courses
    generate_license_key: false,
    license_config: {
      max_activations: 1,
      format: 'XXXX-XXXX-XXXX-XXXX'
    },
    affiliate_enabled: false,
    commission_percentage: 10
  });

  useEffect(() => {
    fetchProduct();
    checkStripeSetup();
  }, [productId]);

  const checkStripeSetup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      setIsStripeSetup(!!savedAccountId);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, affiliate_program:affiliate_programs!affiliate_programs_listing_id_fkey(*)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
      
      const affProg = Array.isArray(data.affiliate_program) ? data.affiliate_program[0] : data.affiliate_program;
      setAffiliateProgram(affProg);

      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        category: data.category || '',
        image: data.images?.[0] || '',
        status: data.status || 'draft',
        content_url: data.metadata?.mainFileUrl || '',
        preview_url: data.metadata?.previewFileUrl || '',
        curriculum: data.metadata?.curriculum || [],
        generate_license_key: data.generate_license_key || false,
        license_config: data.license_config || {
          max_activations: 1,
          format: 'XXXX-XXXX-XXXX-XXXX'
        },
        affiliate_enabled: affProg?.is_active || false,
        commission_percentage: affProg?.commission_percentage || 10
      });
      
      // Set default tab based on category
      if (data.category === 'course') {
        setActiveTab('curriculum');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          images: [formData.image],
          status: formData.status,
          generate_license_key: formData.generate_license_key,
          license_config: formData.license_config,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(product?.metadata || {}),
            mainFileUrl: formData.content_url,
            previewFileUrl: formData.preview_url,
            curriculum: formData.curriculum,
          }
        })
        .eq('id', productId);

      if (error) throw error;

      // Handle Affiliate Program Save
      if (affiliateProgram) {
        await supabase
          .from('affiliate_programs')
          .update({
            is_active: formData.affiliate_enabled,
            commission_percentage: formData.commission_percentage
          })
          .eq('id', affiliateProgram.id);
      } else if (formData.affiliate_enabled) {
        await supabase
          .from('affiliate_programs')
          .insert({
            listing_id: productId,
            seller_id: user.id,
            commission_percentage: formData.commission_percentage,
            is_active: true
          });
      }

      await fetchProduct();
    } catch (error) {
      console.error('Error saving product:', error);
      appToast('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => (
    <div className="bg-[#141414] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="aspect-video bg-[#1A1A1A] relative">
        {formData.image ? (
          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase">
          {formData.category || 'Product'}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-white">{formData.title || 'Product Title'}</h2>
          <span className="text-xl font-bold text-white">€{formData.price || '0.00'}</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
          {formData.description || 'Product description will appear here...'}
        </p>
        
        {formData.category === 'course' && (
          <div className="space-y-2 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Curriculum Preview</h4>
            <div className="space-y-1">
              {formData.curriculum.slice(0, 3).map((module: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{module.title}</span>
                  <span className="text-xs text-gray-600 ml-auto">{module.lessons.length} lessons</span>
                </div>
              ))}
              {formData.curriculum.length > 3 && (
                <div className="text-xs text-gray-500 pl-3.5">+ {formData.curriculum.length - 3} more modules</div>
              )}
            </div>
          </div>
        )}

        <button className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors mt-4">
          {formData.category === 'course' ? 'Enroll Now' : 'Buy Now'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="h-14 sm:h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm sm:text-lg font-bold text-white whitespace-nowrap">Edit Product</h1>
          <div className="h-4 w-px bg-white/10 mx-1 sm:mx-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-gray-500 truncate">{formData.title}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={() => window.open(`/listing/${productId}`, '_blank')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors hidden sm:block"
            title="View Product"
          >
            <Eye className="w-5 h-5" />
          </button>
          <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
            {saving ? 'Saving...' : 'All changes saved'}
          </span>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation / Mobile Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#141414] p-2 sm:p-4 flex flex-row md:flex-col gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'details' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-4 h-4" /> Details
          </button>
          
          {formData.category === 'course' ? (
            <button 
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'curriculum' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Curriculum
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'content' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" /> Content
            </button>
          )}

          <button 
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'license' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" /> License
          </button>

          <button 
            onClick={() => setActiveTab('affiliates')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'affiliates' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" /> Affiliates
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 border-r border-white/10">
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
              {activeTab === 'details' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Product Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={6}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Price (€)</label>
                        <input 
                          type="number" 
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      
                      {!isStripeSetup && parseFloat(formData.price || '0') > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-400">Setup Wersee Pay</p>
                              <p className="text-xs text-amber-400/80 mt-1">
                                You need to connect your Stripe account to accept payments.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowStripeModal(true)}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors"
                          >
                            Connect Stripe
                          </button>
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors"
                      >
                        <option value="digital">Digital Product / Download</option>
                        <option value="course">Online Course (Digital Product)</option>
                        <option value="service">Service</option>
                        <option value="community">Community Access</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                    <FileUpload 
                      bucket="listings"
                      onUpload={(url) => setFormData({...formData, image: url})}
                      label="Upload Cover Image"
                      accept="image/*"
                      darkMode={true}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'content' && formData.category !== 'course' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-2xl border border-white/10">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-4">Digital Content</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-6">Upload the files that customers will receive after purchase.</p>
                    <FileUpload 
                      bucket="digital-downloads"
                      onUpload={(url) => setFormData({...formData, content_url: url})}
                      label="Upload Main File (PDF, ZIP, etc.)"
                      accept="*"
                      darkMode={true}
                    />
                    {formData.content_url && (
                      <p className="mt-2 text-xs sm:text-sm text-green-400">File uploaded: {formData.content_url.split('/').pop()}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'curriculum' && formData.category === 'course' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-2xl border border-white/10">
                    <div className="mb-6">
                      <h3 className="text-base sm:text-lg font-bold text-white">Course Curriculum</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">Organize your course into modules and lessons.</p>
                    </div>
                    <CourseCurriculum 
                      modules={formData.curriculum} 
                      onChange={(newCurriculum) => setFormData({...formData, curriculum: newCurriculum})} 
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'license' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">License Manager</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Automatically generate and manage license keys for this product.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.generate_license_key}
                          onChange={(e) => setFormData({...formData, generate_license_key: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {formData.generate_license_key && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6 overflow-hidden"
                        >
                          <div className="h-px bg-white/5" />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Max Activations</label>
                              <input 
                                type="number" 
                                value={formData.license_config.max_activations}
                                onChange={(e) => setFormData({
                                  ...formData, 
                                  license_config: { ...formData.license_config, max_activations: parseInt(e.target.value) }
                                })}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Format Selector</label>
                              <select 
                                value={formData.license_config.format}
                                onChange={(e) => setFormData({
                                  ...formData, 
                                  license_config: { ...formData.license_config, format: e.target.value }
                                })}
                                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white focus:outline-none focus:border-white/30 transition-colors"
                              >
                                <option value="XXXX-XXXX-XXXX-XXXX">XXXX-XXXX-XXXX-XXXX</option>
                                <option value="SERIAL_NUMBER">SERIAL_NUMBER (8 chars)</option>
                                <option value="UUID">UUID (Standard)</option>
                              </select>
                            </div>
                          </div>

                          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                            <p className="text-[10px] sm:text-xs text-indigo-300/80 leading-relaxed">
                              When enabled, Veny will automatically generate a unique license key for every purchase. 
                              The key will be sent to the buyer and can be verified via our Developer API.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === 'affiliates' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Affiliate Program</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Allow others to promote this product for a commission.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.affiliate_enabled}
                          onChange={(e) => setFormData({...formData, affiliate_enabled: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {formData.affiliate_enabled && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6 overflow-hidden"
                        >
                          <div className="h-px bg-white/5" />
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Commission Percentage (%)</label>
                            <div className="flex items-center gap-4">
                              <input 
                                type="range" 
                                min="1" 
                                max="90" 
                                value={formData.commission_percentage}
                                onChange={(e) => setFormData({...formData, commission_percentage: parseInt(e.target.value)})}
                                className="flex-1 accent-indigo-500"
                              />
                              <div className="w-16 sm:w-20 bg-[#141414] border border-white/10 rounded-xl p-2 sm:p-3 text-center text-white font-bold text-sm sm:text-base">
                                {formData.commission_percentage}%
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                              Affiliates will earn €{((parseFloat(formData.price || '0') * formData.commission_percentage) / 100).toFixed(2)} per sale.
                            </p>
                          </div>

                          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3">
                            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
                            <p className="text-[10px] sm:text-xs text-indigo-300/80 leading-relaxed">
                              Tip: Higher commissions (15-25%) attract more and better affiliates. 
                              You can manage your partners and see detailed reports in the Affiliates tab of your workspace.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-2xl border border-white/10">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-4">Visibility</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-white font-medium text-sm sm:text-base">Publish Status</p>
                        <p className="text-xs sm:text-sm text-gray-400">Control whether this product is visible in your store.</p>
                      </div>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Preview Area */}
          <div className="w-[400px] bg-[#0A0A0A] p-8 hidden xl:block overflow-y-auto border-l border-white/10">
            <div className="sticky top-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</h3>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>

      <StripeSetupModal 
        isOpen={showStripeModal} 
        onClose={() => setShowStripeModal(false)} 
        onComplete={() => setIsStripeSetup(true)}
      />
    </div>
  );
};
