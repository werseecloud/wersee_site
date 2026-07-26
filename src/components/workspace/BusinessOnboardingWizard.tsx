import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Package, Users, Globe, CreditCard, Shield, Zap, Star, Layout, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { StripeV2OnboardingFlow } from './StripeV2OnboardingFlow';

import { appToast } from '@/lib/feedback';
interface BusinessOnboardingWizardProps {
  business: any;
  onComplete: (updatedBusiness: any) => void;
  onClose: () => void;
}

export const BusinessOnboardingWizard: React.FC<BusinessOnboardingWizardProps> = ({ business, onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Form state
  const [includesCommunity, setIncludesCommunity] = useState(false);
  const [includesEmbeddedSite, setIncludesEmbeddedSite] = useState(false);
  const [includesGeneratedSite, setIncludesGeneratedSite] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('tier1');
  const [isFreeAccess, setIsFreeAccess] = useState(true);
  const [accessPrice, setAccessPrice] = useState(0);
  
  // Final state
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalLinks, setFinalLinks] = useState<{siteUrl: string, workspaceUrl: string} | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const toggleProduct = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, isFree: false }]);
    }
  };

  const toggleProductFree = (productId: string, isFree: boolean) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, isFree } : p
    ));
  };

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create Stripe account via API runner (Hosted flow)
      const resData = await invokeApiRunner('create-account', {
        country: 'us', // Default to US
        onboardingType: 'hosted'
      });
      
      if (resData.error) {
        throw new Error(resData.error || 'Failed to create account');
      }
      
      setStripeAccountId(resData.id);
      
      // Create account link and redirect
      const linkRes = await invokeApiRunner('create-account-link', {
        accountId: resData.id,
        returnUrl: window.location.href,
        refreshUrl: window.location.href
      });
      
      if (linkRes.error) {
        throw new Error(linkRes.error || 'Failed to create account link');
      }
      
      if (linkRes.url) {
        window.location.href = linkRes.url;
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      appToast(error.message || 'Failed to connect Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const data = await invokeApiRunner('setup-business', {
        businessId: business.id,
        businessName: business.name,
        products: selectedProducts,
        includesCommunity,
        includesEmbeddedSite,
        includesGeneratedSite,
        subscriptionTier,
        isFreeAccess,
        accessPrice,
        stripeConnected,
        accessToken: session?.access_token
      });

      if (data.error) {
        throw new Error(data.error || 'Setup failed');
      }

      setFinalLinks({
        siteUrl: data.siteUrl,
        workspaceUrl: data.workspaceUrl
      });
      
      // Notify parent after a short delay to show the links
      setTimeout(() => {
        onComplete(data.business);
      }, 5000);

    } catch (error: any) {
      console.error('Setup error:', error);
      setIsGenerating(false);
      appToast(error.message);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <div className="text-center max-w-md w-full p-8">
          {!finalLinks ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">AI is making your landingpage on Wersee</h2>
              <p className="text-gray-400">Setting up your business environment, products, and community...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1D1D1F] rounded-3xl p-8 border border-white/10 text-left"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-8">Your Business is Ready!</h2>
              
              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Public Landing Page</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">{window.location.origin}{finalLinks.siteUrl}</span>
                    <a href={finalLinks.siteUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </div>
                
                <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Client Workspace</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">{window.location.origin}{finalLinks.workspaceUrl}</span>
                    <a href={finalLinks.workspaceUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => onComplete(business)}
                className="w-full mt-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1D1D1F] w-full max-w-4xl rounded-3xl overflow-hidden border border-white/10 flex flex-col"
        style={{ minHeight: '600px' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Setup {business.name}</h2>
            <p className="text-gray-400 text-sm mt-1">Let's configure your business environment</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : i < step ? 'w-4 bg-white/50' : 'w-4 bg-white/10'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Select Products</h3>
                    <p className="text-gray-400">Choose which products, services, or courses to offer in this business.</p>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
                    <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">No products found</p>
                    <p className="text-gray-400 text-sm">You haven't created any products yet. You can add them later.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {products.map(product => {
                      const isSelected = selectedProducts.find(p => p.id === product.id);
                      return (
                        <div 
                          key={product.id}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                          onClick={() => toggleProduct(product)}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-white border-white' : 'border-gray-500'}`}>
                            {isSelected && <Check className="w-4 h-4 text-black" />}
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{product.title}</h4>
                            <p className="text-gray-400 text-sm truncate">{product.category || 'Product'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white font-medium">€{product.price}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Includes These</h3>
                    <p className="text-gray-400">Select the features you want to include in your business.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <label className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${includesCommunity ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                    <div className="mt-1">
                      <input type="checkbox" className="sr-only" checked={includesCommunity} onChange={() => setIncludesCommunity(!includesCommunity)} />
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${includesCommunity ? 'bg-white border-white' : 'border-gray-500'}`}>
                        {includesCommunity && <Check className="w-4 h-4 text-black" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" /> Community
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">Build a community for your customers. Includes forums, chat, and member profiles.</p>
                    </div>
                  </label>

                  <label className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${includesEmbeddedSite ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                    <div className="mt-1">
                      <input type="checkbox" className="sr-only" checked={includesEmbeddedSite} onChange={() => setIncludesEmbeddedSite(!includesEmbeddedSite)} />
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${includesEmbeddedSite ? 'bg-white border-white' : 'border-gray-500'}`}>
                        {includesEmbeddedSite && <Check className="w-4 h-4 text-black" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-blue-400" /> Own Site Embedded
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">Embed your existing website directly into the workspace for a seamless experience.</p>
                    </div>
                  </label>

                  <label className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${includesGeneratedSite ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                    <div className="mt-1">
                      <input type="checkbox" className="sr-only" checked={includesGeneratedSite} onChange={() => setIncludesGeneratedSite(!includesGeneratedSite)} />
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${includesGeneratedSite ? 'bg-white border-white' : 'border-gray-500'}`}>
                        {includesGeneratedSite && <Check className="w-4 h-4 text-black" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-400" /> Generate a site for me
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">Let our AI generate a beautiful, high-converting landing page for your business.</p>
                    </div>
                  </label>
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
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Connect Stripe</h3>
                    <p className="text-gray-400">Connect your Stripe account to receive payments directly.</p>
                  </div>
                </div>

                <div className="bg-black/20 border border-white/10 rounded-3xl p-8 text-center">
                  {showStripeOnboarding && stripeAccountId ? (
                    <StripeV2OnboardingFlow 
                      accountId={stripeAccountId} 
                      onComplete={() => {
                        setShowStripeOnboarding(false);
                        setStripeConnected(true);
                      }} 
                    />
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-[#635BFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="w-10 h-10 text-[#635BFF]" />
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-4">Get Paid Faster</h4>
                      <p className="text-gray-400 max-w-md mx-auto mb-8">
                        Connect your Stripe account to process payments securely and get payouts directly to your bank account. You can also skip this and set it up later.
                      </p>
                      
                      {stripeConnected ? (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl font-medium">
                          <Check className="w-5 h-5" /> Stripe Connected
                        </div>
                      ) : (
                        <button 
                          onClick={handleConnectStripe}
                          disabled={loading}
                          className="px-8 py-4 bg-[#635BFF] hover:bg-[#5249E5] text-white rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                          Complete Login / Stripe Site Onboarding
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Subscriptions for Business</h3>
                    <p className="text-gray-400">Choose the right tier for your business needs.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Tier 1 */}
                  <div 
                    onClick={() => setSubscriptionTier('tier1')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col ${subscriptionTier === 'tier1' ? 'bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="mb-4">
                      <h4 className="text-white font-bold text-xl mb-1">Standard</h4>
                      <p className="text-gray-400 text-sm">Everything you need to start.</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">Free</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" /> Normal Wersee branding
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" /> Embedded sites
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-white shrink-0 mt-0.5" /> Standard features
                      </li>
                    </ul>
                    <div className={`w-full py-2 rounded-lg text-center font-medium text-sm transition-colors ${subscriptionTier === 'tier1' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                      {subscriptionTier === 'tier1' ? 'Selected' : 'Select'}
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div 
                    onClick={() => setSubscriptionTier('tier2')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col relative ${subscriptionTier === 'tier2' ? 'bg-white/10 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                      Popular
                    </div>
                    <div className="mb-4">
                      <h4 className="text-white font-bold text-xl mb-1">Pro</h4>
                      <p className="text-gray-400 text-sm">For growing businesses.</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">€29</span><span className="text-gray-400">/mo</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> No payment fees (up to €669)
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> Advanced analytics
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> Priority support
                      </li>
                    </ul>
                    <div className={`w-full py-2 rounded-lg text-center font-medium text-sm transition-colors ${subscriptionTier === 'tier2' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'}`}>
                      {subscriptionTier === 'tier2' ? 'Selected' : 'Select'}
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div 
                    onClick={() => setSubscriptionTier('tier3')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col ${subscriptionTier === 'tier3' ? 'bg-white/10 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="mb-4">
                      <h4 className="text-white font-bold text-xl mb-1">Ultimate</h4>
                      <p className="text-gray-400 text-sm">Complete white-label solution.</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">€99</span><span className="text-gray-400">/mo</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" /> No Wersee branding
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" /> Custom domain access
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" /> Custom course pages
                      </li>
                    </ul>
                    <div className={`w-full py-2 rounded-lg text-center font-medium text-sm transition-colors ${subscriptionTier === 'tier3' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white'}`}>
                      {subscriptionTier === 'tier3' ? 'Selected' : 'Select'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Access Settings</h3>
                    <p className="text-gray-400">Is your business free to access or paid?</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <label className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${isFreeAccess ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                    <input type="radio" name="access" className="sr-only" checked={isFreeAccess} onChange={() => setIsFreeAccess(true)} />
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-4">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">Free Access</h4>
                    <p className="text-gray-400 text-sm">Anyone can join your business workspace for free. You can still charge for specific products.</p>
                  </label>

                  <label className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${!isFreeAccess ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                    <input type="radio" name="access" className="sr-only" checked={!isFreeAccess} onChange={() => setIsFreeAccess(false)} />
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">Paid Access</h4>
                    <p className="text-gray-400 text-sm">Users must pay a one-time fee or subscription to access your business workspace.</p>
                  </label>
                </div>

                {!isFreeAccess && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-black/20 border border-white/10 rounded-2xl"
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">Access Price (€)</label>
                    <input 
                      type="number" 
                      value={accessPrice}
                      onChange={(e) => setAccessPrice(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="e.g. 49.99"
                      min="0"
                      step="0.01"
                    />
                  </motion.div>
                )}

                {selectedProducts.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-white font-medium mb-4">Product Access Overrides</h4>
                    <p className="text-sm text-gray-400 mb-4">You can make specific products free for members who have access to your business.</p>
                    
                    <div className="space-y-3">
                      {selectedProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                              {product.image ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{product.title}</p>
                              <p className="text-gray-400 text-xs">Regular price: €{product.price}</p>
                            </div>
                          </div>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-gray-400">Make Free</span>
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={product.isFree}
                                onChange={(e) => toggleProductFree(product.id, e.target.checked)}
                              />
                              <div className={`w-10 h-6 rounded-full transition-colors ${product.isFree ? 'bg-white' : 'bg-white/20'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${product.isFree ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between shrink-0 bg-[#1D1D1F]">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-3 text-gray-400 hover:text-white font-medium transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={() => step < 5 ? setStep(step + 1) : handleFinish()}
            className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {step === 5 ? 'Finish Setup' : 'Next Step'}
            {step < 5 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
