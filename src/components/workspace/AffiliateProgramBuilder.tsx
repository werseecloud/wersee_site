import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Loader2, DollarSign, 
  TrendingUp, Shield, Globe, Users, 
  AlertCircle, CheckCircle, Image as ImageIcon,
  Settings, Layout, FileText, Target,
  Wallet, PieChart, Info, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '../FileUpload';
import { toast } from 'sonner';

interface AffiliateProgramBuilderProps {
  productId: string;
  onClose: () => void;
}

export const AffiliateProgramBuilder: React.FC<AffiliateProgramBuilderProps> = ({ productId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'budget' | 'terms' | 'assets'>('general');

  // Form state
  const [formData, setFormData] = useState({
    commission_percentage: 10,
    fixed_commission: 0,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    is_active: true,
    budget: 0,
    remaining_budget: 0,
    terms: '',
    allow_public_join: true,
    banner_url: '',
    min_payout: 10,
    description: ''
  });

  const [newAssets, setNewAssets] = useState<any[]>([]);
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetType, setNewAssetType] = useState('banner');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async (retries = 3) => {
    try {
      setLoading(true);
      // Fetch product
      const { data: productData, error: pError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (pError) throw pError;
      setProduct(productData);

      // Fetch program
      const { data: programData, error: prError } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (prError) throw prError;

      if (programData) {
        setProgram(programData);
        setFormData({
          commission_percentage: programData.commission_percentage || 10,
          fixed_commission: programData.fixed_commission || 0,
          commission_type: programData.fixed_commission > 0 ? 'fixed' : 'percentage',
          is_active: programData.is_active ?? true,
          budget: programData.budget || 0,
          remaining_budget: programData.remaining_budget || 0,
          terms: programData.terms || '',
          allow_public_join: programData.allow_public_join ?? true,
          banner_url: programData.banner_url || '',
          min_payout: programData.min_payout || 10,
          description: programData.description || ''
        });
      } else if (productData?.price === 0) {
        // Default to fixed if product is free
        setFormData(prev => ({ ...prev, commission_type: 'fixed', fixed_commission: 1 }));
      }
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying fetchData... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return fetchData(retries - 1);
      }
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (retries = 3) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        commission_percentage: formData.commission_type === 'percentage' ? formData.commission_percentage : 0,
        fixed_commission: formData.commission_type === 'fixed' ? formData.fixed_commission : 0,
        is_active: formData.is_active,
        budget: formData.budget,
        remaining_budget: formData.remaining_budget,
        terms: formData.terms,
        allow_public_join: formData.allow_public_join,
        banner_url: formData.banner_url,
        min_payout: formData.min_payout,
        description: formData.description,
        product_id: productId,
        seller_id: user.id,
        updated_at: new Date().toISOString()
      };

      let finalProgramId = program?.id;

      if (program) {
        const { error } = await supabase
          .from('affiliate_programs')
          .update(payload)
          .eq('id', program.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('affiliate_programs')
          .insert({
            ...payload,
            remaining_budget: formData.budget // Initial budget
          })
          .select()
          .single();
        if (error) throw error;
        finalProgramId = data.id;
      }

      // Save buffered assets
      if (newAssets.length > 0 && finalProgramId) {
        const { error: assetError } = await supabase
          .from('affiliate_promo_materials')
          .insert(newAssets.map(asset => ({
            ...asset,
            program_id: finalProgramId
          })));
        if (assetError) throw assetError;
      }

      toast.success('Affiliate program saved successfully!');
      onClose();
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying handleSave... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return handleSave(retries - 1);
      }
      console.error('Error saving program:', error);
      toast.error('Failed to save program.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm sm:text-lg font-bold truncate">Affiliate Builder</h1>
          <div className="hidden sm:block h-4 w-px bg-white/10 mx-2" />
          <span className="hidden sm:block text-sm text-gray-500 truncate">{product?.title}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 sm:px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save Program</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar / Mobile Tabs */}
        <div className={`
          ${isMobile ? 'flex overflow-x-auto scrollbar-hide p-2 border-b' : 'w-64 border-r p-4 flex flex-col gap-2'} 
          border-white/10 bg-[#141414] shrink-0
        `}>
          {[
            { id: 'general', icon: <Settings className="w-4 h-4" />, label: 'General' },
            { id: 'budget', icon: <Wallet className="w-4 h-4" />, label: 'Budget' },
            { id: 'terms', icon: <FileText className="w-4 h-4" />, label: 'Terms' },
            { id: 'assets', icon: <ImageIcon className="w-4 h-4" />, label: 'Assets' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon} {isMobile ? tab.label : tab.label + ' Settings'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Program Status</h3>
                      <p className="text-sm text-gray-500">Enable or disable this affiliate program.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-400">Commission Model</label>
                      <div className="flex bg-[#0A0A0A] p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setFormData({...formData, commission_type: 'percentage'})}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.commission_type === 'percentage' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Percentage
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, commission_type: 'fixed'})}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.commission_type === 'fixed' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Fixed Amount
                        </button>
                      </div>
                    </div>

                    {formData.commission_type === 'percentage' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                          <input 
                            type="range" 
                            min="1" 
                            max="90" 
                            value={formData.commission_percentage}
                            onChange={(e) => setFormData({...formData, commission_percentage: parseInt(e.target.value)})}
                            className="flex-1 accent-indigo-500"
                          />
                          <div className="w-24 bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 text-center text-2xl font-black text-indigo-400">
                            {formData.commission_percentage}%
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-indigo-400" />
                          <p className="text-xs text-indigo-300/80">
                            On a €{product?.price || 0} sale, affiliates will earn <span className="font-bold text-white">€{((parseFloat(product?.price || '0') * formData.commission_percentage) / 100).toFixed(2)}</span>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input 
                            type="number" 
                            value={formData.fixed_commission || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormData({...formData, fixed_commission: isNaN(val) ? 0 : val});
                            }}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 pl-12 text-2xl font-black text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        {product?.price === 0 && (
                          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-xs text-red-300/80">
                              This is a <span className="font-bold text-white">Free Product</span>. You will pay affiliates <span className="font-bold text-white">€{formData.fixed_commission}</span> per lead out of your budget pot.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Program Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                      placeholder="Briefly describe your affiliate program..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Public Visibility</label>
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold">Allow Public Joining</p>
                          <p className="text-xs text-gray-500">Anyone can join via your invite link.</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.allow_public_join}
                        onChange={(e) => setFormData({...formData, allow_public_join: e.target.checked})}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'budget' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Affiliate Budget Pot</h3>
                    <p className="text-sm text-gray-500 mb-6">Set a maximum budget for commissions. The program will auto-disable when empty.</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Budget (€)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="number" 
                            value={formData.budget || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormData({...formData, budget: isNaN(val) ? 0 : val, remaining_budget: isNaN(val) ? 0 : val});
                            }}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 pl-10 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min. Payout (€)</label>
                        <div className="relative">
                          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="number" 
                            value={formData.min_payout || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormData({...formData, min_payout: isNaN(val) ? 0 : val});
                            }}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 pl-10 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="10.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold">Budget Utilization</span>
                      </div>
                      <span className="text-xs text-gray-500">Remaining: €{formData.remaining_budget}</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${formData.budget > 0 ? (formData.remaining_budget / formData.budget) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'terms' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-500 mb-4">Define the rules for your affiliates. These will be shown on the join page.</p>
                    <textarea 
                      value={formData.terms}
                      onChange={(e) => setFormData({...formData, terms: e.target.value})}
                      rows={10}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                      placeholder="e.g. No spamming, no coupon sites, etc."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Promotional Assets</h3>
                    <p className="text-sm text-gray-500 mb-6">Upload banners, text templates, and social media assets for your affiliates.</p>
                    
                    <div className="space-y-4">
                      {/* Upload New Asset */}
                      <div className="p-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <h4 className="font-bold text-white mb-4">Add New Asset</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input 
                            type="text" 
                            placeholder="Asset Title (e.g. Instagram Story)"
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                            value={newAssetTitle}
                            onChange={(e) => setNewAssetTitle(e.target.value)}
                          />
                          <select 
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                            value={newAssetType}
                            onChange={(e) => setNewAssetType(e.target.value)}
                          >
                            <option value="banner">Image Banner</option>
                            <option value="text">Text / Copy</option>
                            <option value="social">Social Media Post</option>
                          </select>
                        </div>
                        
                        <FileUpload 
                          bucket="affiliate-assets"
                          onUpload={async (url) => {
                            if (!newAssetTitle) {
                              toast.error('Please enter a title first');
                              return;
                            }

                            const newAsset = {
                              title: newAssetTitle,
                              type: newAssetType,
                              url: url,
                              description: 'Uploaded via builder'
                            };

                            if (program?.id) {
                              // If program exists, upload immediately
                              try {
                                const { error } = await supabase
                                  .from('affiliate_promo_materials')
                                  .insert({
                                    ...newAsset,
                                    program_id: program.id
                                  });
                                if (error) throw error;
                                toast.success('Asset added successfully!');
                              } catch (err) {
                                console.error('Error adding asset:', err);
                                toast.error('Failed to add asset');
                              }
                            } else {
                              // If new program, buffer it
                              setNewAssets(prev => [...prev, newAsset]);
                              toast.info('Asset buffered. It will be saved with the program.');
                            }

                            setNewAssetTitle('');
                          }}
                          label="Upload Asset File"
                          accept="image/*,video/*,.pdf"
                          darkMode={true}
                        />
                      </div>

                      {/* List Existing Assets */}
                      <div className="space-y-3">
                        {newAssets.map((asset, idx) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{asset.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{asset.type} (Pending save)</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setNewAssets(prev => prev.filter((_, i) => i !== idx))}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(newAssets.length === 0 && !program) && (
                          <p className="text-sm text-gray-500 italic">No assets added yet.</p>
                        )}
                        {program && (
                           <p className="text-sm text-gray-500 italic">Assets will appear in the partners view after saving.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
