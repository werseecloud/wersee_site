import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, ExternalLink, Copy, CheckCircle2, AlertTriangle, Loader2, X, Globe, CreditCard, Landmark, Tag, Settings, DollarSign, ShieldCheck, Monitor, Smartphone, ArrowLeft, Image as ImageIcon, Palette, Layout, Type, MessageSquare, UploadCloud, ChevronRight, Box, Percent, Clock, FileText, Lock, ShoppingBag, Gift, Zap, Building2, Edit, Video } from 'lucide-react';
import { clearStoredStripeAccount, isStripeAccountInaccessibleError, supabase, invokeApiRunner } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { StripeSetupModal } from './StripeSetupModal';
import { FileUpload } from '../FileUpload';
import { PaymentLinkVideoUpload } from './PaymentLinkVideoUpload';
import { QuickPayVideoPlayer } from '../public/QuickPayVideoPlayer';
import { werseePaymentUrls } from '../../lib/paymentUrls';

// Helper to translate Stripe's requirement state into a user-friendly status
const getAccountState = (account: any) => {
  const reqs = account?.requirements;
  if (!reqs) return "unknown";

  if (reqs.disabled_reason && reqs.disabled_reason.includes("rejected")) {
    return "rejected";
  } else if (account.payouts_enabled && account.charges_enabled) {
    if (reqs.pending_verification && reqs.pending_verification.length > 0) {
      return "pending enablement";
    } else if (!reqs.disabled_reason && (!reqs.currently_due || reqs.currently_due.length === 0)) {
      if (!reqs.eventually_due || reqs.eventually_due.length === 0) {
        return "complete";
      } else {
        return "enabled";
      }
    } else {
      return "restricted";
    }
  } else if (!account.payouts_enabled && account.charges_enabled) {
    return "restricted (payouts disabled)";
  } else if (!account.charges_enabled && account.payouts_enabled) {
    return "restricted (charges disabled)";
  } else if (reqs.past_due && reqs.past_due.length > 0) {
    return "restricted (past due)";
  } else if (reqs.pending_verification && reqs.pending_verification.length > 0) {
    return "pending (disabled)";
  } else {
    return "restricted";
  }
};

import { SellerGuidelinesModal } from './SellerGuidelinesModal';
import { CurrencySelectionModal } from './CurrencySelectionModal';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit Card', icon: CreditCard, logo: null },
  { id: 'ideal', name: 'iDEAL', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/iDEAL_Wero_Lockup_Yellow_Square_RGB.svg' },
  { id: 'bancontact', name: 'Bancontact', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/Bancontact_logo.svg.png' },
  { id: 'klarna', name: 'Klarna', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/klarna-icon.webp' },
  { id: 'affirm', name: 'Affirm', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/blue_solid_circle-transparent_bg.avif' },
  { id: 'eps', name: 'EPS', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/32041242-b0eb5b7c-ba33-11e7-8d58-7f134da0e4d8.png' },
  { id: 'alipay', name: 'Alipay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/62b1e77b56b6848f8bec9031.png' },
  { id: 'sepa_debit', name: 'SEPA Direct Debit', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/67433ffcacc11a3a9c648faf_639b928a92f2c749f5ad800c_APMsLPMs20Website20Template.png' },
  { id: 'sofort', name: 'Sofort', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment-sofort.png' },
  { id: 'afterpay_clearpay', name: 'Afterpay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/unnamed.png' },
  { id: 'giropay', name: 'Giropay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Giropay.svg.png' },
  { id: 'p24', name: 'Przelewy24', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/6.Przelewy24_logo.webp' },
  { id: 'wechat_pay', name: 'WeChat Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/77adb574c905404f69555e6fc9e47e3693444c6c.svg' },
  { id: 'link', name: 'Link', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/link.png' },
  { id: 'customer_balance', name: 'Bank Transfer', icon: Landmark, logo: null },
  { id: 'us_bank_account', name: 'ACH Direct Debit', icon: Landmark, logo: null },
  { id: 'boleto', name: 'Boleto', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/boleto.png' },
  { id: 'cashapp', name: 'Cash App Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/cashapp.png' },
];

import { BusinessOnboardingModal } from './BusinessOnboardingModal';
import { BusinessSettings } from '../../types/business';

import { appToast } from '@/lib/feedback';
export const MoneyPaymentLinksView = () => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [fetchingLinks, setFetchingLinks] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  
  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewStep, setPreviewStep] = useState<'checkout' | 'success'>('checkout');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Business Settings State
  const [activeTab, setActiveTab] = useState<'live' | 'sandbox'>('live');
  const [showBusinessOnboarding, setShowBusinessOnboarding] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState<string | null>('card');
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [werseeProducts, setWerseeProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Analytics State
  const [expandedAnalyticsId, setExpandedAnalyticsId] = useState<string | null>(null);
  const [linkAnalytics, setLinkAnalytics] = useState<any>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    product_name: '',
    description: '',
    price: '',
    currency: 'eur',
    pricing_type: 'fixed', // 'fixed', 'variable'
    min_amount: '', // for variable pricing
    image_url: '',
    logo_url: '',
    video_url: '',
    selected_product_ids: [] as string[],
    success_url: '',
    success_message: '',
    confirmation_type: 'default', // 'default', 'redirect'
    quantity_limit: '',
    stock_limit: '', // limited edition
    trial_period_days: '',
    generate_license_key: false,
    terms_required: false,
    tax_behavior: 'inclusive', // 'inclusive', 'exclusive'
    settings: {
      theme: 'custom',
      layout: 'accordion',
      collect_address: false,
      collect_phone: false,
      collect_promotion_code: false,
      border_radius: '24px', // '0px', '8px', '16px', '24px', '9999px'
      font: 'inter', // 'inter', 'manrope', 'system'
      payment_methods: ['card'],
      save_payment_method: false,
      colors: {
        background: '#0A0A0A',
        card: '#141414',
        text: '#FFFFFF',
        secondary_text: '#A1A1AA',
        border: '#27272A',
        primary: '#635BFF'
      }
    }
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Always fetch links, even if Stripe is not connected (for sandbox links)
        await Promise.all([fetchLinks(user.id), fetchWerseeProducts(user.id)]);
        
        const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
        if (savedAccountId) {
          await fetchAccount(savedAccountId);
        } else {
          setLoading(false);
        }
        
        // Fetch Business Settings
        const { data: settings } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (settings) {
          setBusinessSettings(settings as BusinessSettings);
        } else {
          // If no settings found, show onboarding
          setShowBusinessOnboarding(true);
        }
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchAccount = async (id: string) => {
    try {
      const data = await invokeApiRunner('stripe-v2-get-account', { id });
      setAccount(data);
    } catch (err: any) {
      console.error(err);
      if (userId && isStripeAccountInaccessibleError(err)) {
        await clearStoredStripeAccount(userId);
        setAccount(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async (userId: string) => {
    setFetchingLinks(true);
    try {
      const { data, error } = await supabase
        .from('quick_pay_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingLinks(false);
    }
  };

  const fetchWerseeProducts = async (ownerId: string) => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id,title,description,price,image_url,thumbnail,type,status,base_currency')
        .or(`seller_id.eq.${ownerId},user_id.eq.${ownerId}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setWerseeProducts(data || []);
    } catch (error) {
      console.error('Could not load Wersee products', error);
      setWerseeProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const includedProductSnapshots = () => werseeProducts
    .filter(product => formData.selected_product_ids.includes(product.id))
    .map(product => ({
      id: product.id,
      title: product.title,
      description: product.description || '',
      price: Number.parseFloat(String(product.price || '0')) || 0,
      image_url: product.image_url || product.thumbnail || '',
      type: product.type || 'product',
    }));

  const toggleIncludedProduct = (productId: string) => {
    setFormData(current => {
      const isSelected = current.selected_product_ids.includes(productId);
      const selected = isSelected
        ? current.selected_product_ids.filter(id => id !== productId)
        : [...current.selected_product_ids, productId];
      const products = werseeProducts.filter(product => selected.includes(product.id));
      const currencies = new Set(
        products.map(product => String(product.base_currency || current.currency).toLowerCase()),
      );
      if (!isSelected && currencies.size > 1) {
        appToast('Choose products with the same currency for one payment link.');
        return current;
      }
      const total = products.reduce(
        (sum, product) => sum + (Number.parseFloat(String(product.price || '0')) || 0),
        0,
      );
      return {
        ...current,
        selected_product_ids: selected,
        currency: products.length
          ? String(products[0].base_currency || current.currency).toLowerCase()
          : current.currency,
        product_name: products.length ? products.map(product => product.title).join(' + ') : current.product_name,
        price: products.length ? total.toFixed(2) : current.price,
        image_url: current.image_url || products[0]?.image_url || products[0]?.thumbnail || '',
        description: current.description || products.map(product => product.description).filter(Boolean).join('\n\n'),
      };
    });
  };

  const isSandboxLink = (link: any) => link.environment === 'test';

  const activeLinks = links.filter(l => l.status !== 'draft' && (activeTab === 'sandbox' ? isSandboxLink(l) : !isSandboxLink(l)));
  const draftLinks = links.filter(l => l.status === 'draft' && (activeTab === 'sandbox' ? isSandboxLink(l) : !isSandboxLink(l)));

  const fetchAnalytics = async (linkId: string) => {
    if (linkAnalytics[linkId]) {
      setExpandedAnalyticsId(expandedAnalyticsId === linkId ? null : linkId);
      return;
    }
    
    setLoadingAnalytics(linkId);
    try {
      const { data: visits, error } = await supabase
        .from('quick_pay_link_visits')
        .select('*')
        .eq('link_id', linkId);
        
      if (error) throw error;
      
      const mobileCount = visits.filter(v => v.device_type === 'mobile').length;
      const desktopCount = visits.filter(v => v.device_type === 'desktop').length;
      
      setLinkAnalytics(prev => ({
        ...prev,
        [linkId]: {
          visits,
          mobileCount,
          desktopCount
        }
      }));
      setExpandedAnalyticsId(linkId);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoadingAnalytics(null);
    }
  };

  const handleEditDraft = (link: any) => {
    setEditingId(link.id);
    setFormData({
      name: link.name,
      slug: link.slug,
      product_name: link.product_name,
      description: link.description,
      price: link.price.toString(),
      currency: link.currency,
      pricing_type: link.settings.pricing_type || 'fixed',
      min_amount: link.settings.min_amount?.toString() || '',
      image_url: link.settings.image_url || '',
      logo_url: link.settings.logo_url || '',
      video_url: link.settings.video_url || '',
      selected_product_ids: Array.isArray(link.settings.included_product_ids) ? link.settings.included_product_ids : [],
      success_url: link.settings.success_url || '',
      success_message: link.settings.success_message || '',
      confirmation_type: link.settings.confirmation_type || 'default',
      quantity_limit: link.settings.quantity_limit?.toString() || '',
      stock_limit: link.settings.stock_limit?.toString() || '',
      trial_period_days: link.settings.trial_period_days?.toString() || '',
      generate_license_key: link.settings.generate_license_key || false,
      terms_required: link.settings.terms_required || false,
      tax_behavior: link.settings.tax_behavior || 'inclusive',
      settings: {
        ...formData.settings,
        ...link.settings
      }
    });
    setShowWizard(true);
    setWizardStep(1);
  };

  const handleSaveDraft = async () => {
    if (!userId) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      const username = profile?.username || 'user';
      const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `draft-${Date.now()}`;

      const payload: any = {
        user_id: userId,
        username,
        name: formData.name || 'Untitled Draft',
        slug,
        product_name: formData.product_name,
        description: formData.description,
        price: formData.pricing_type === 'fixed' ? parseFloat(formData.price || '0') : parseFloat(formData.min_amount || '0'),
        currency: formData.currency,
        environment: activeTab === 'sandbox' ? 'test' : 'live',
        stripe_account_id: activeTab === 'sandbox' ? 'sandbox' : (account?.id || 'sandbox'),
        status: 'draft',
        settings: {
          ...formData.settings,
          pricing_type: formData.pricing_type,
          min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
          image_url: formData.image_url,
          logo_url: formData.logo_url,
          video_url: formData.video_url,
          included_product_ids: formData.selected_product_ids,
          included_products: includedProductSnapshots(),
          success_url: formData.success_url,
          success_message: formData.success_message,
          confirmation_type: formData.confirmation_type,
          quantity_limit: formData.quantity_limit ? parseInt(formData.quantity_limit) : null,
          stock_limit: formData.stock_limit ? parseInt(formData.stock_limit) : null,
          trial_period_days: formData.trial_period_days ? parseInt(formData.trial_period_days) : null,
          generate_license_key: formData.generate_license_key,
          terms_required: formData.terms_required,
          tax_behavior: formData.tax_behavior,
          is_sandbox: activeTab === 'sandbox' || !account?.id
        }
      };

      if (editingId) {
        payload.id = editingId;
      }

      const { error } = await supabase
        .from('quick_pay_links')
        .upsert(payload);

      if (error) throw error;
      
      setShowWizard(false);
      setWizardStep(1);
      setEditingId(null);
      fetchLinks(userId);
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  };

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create Stripe Product & Price
      const stripeResData = await invokeApiRunner('quick-pay-create', {
        accountId: activeTab === 'sandbox' ? 'sandbox' : (account?.id || null),
        name: formData.product_name || formData.name,
        price: formData.pricing_type === 'fixed' ? parseFloat(formData.price) : parseFloat(formData.min_amount || '1'),
        currency: formData.currency,
        description: formData.description
      });
      
      if (stripeResData.error) {
        throw new Error(stripeResData.error);
      }
      
      const { stripe_product_id, stripe_price_id } = stripeResData;

      // 2. Save to Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const username = profile?.username || user.email?.split('@')[0] || 'user';
      let slug = formData.slug;
      
      if (!slug) {
        // Auto-generate
        slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Append random string to ensure uniqueness for auto-generated
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      } else {
        // Check if user provided slug exists
        const { data: existing } = await supabase
          .from('quick_pay_links')
          .select('id')
          .eq('user_id', user.id)
          .eq('slug', slug)
          .single();
        
        if (existing && existing.id !== editingId) {
          throw new Error('This link is already in use, try different.');
        }
      }

      const payload = {
        user_id: user.id,
        username,
        name: formData.name,
        slug,
        product_name: formData.product_name || formData.name,
        description: formData.description,
        price: formData.pricing_type === 'fixed' ? parseFloat(formData.price) : parseFloat(formData.min_amount || '0'),
        currency: formData.currency,
        environment: activeTab === 'sandbox' ? 'test' : 'live',
        stripe_account_id: activeTab === 'sandbox' ? 'sandbox' : (account?.id || 'sandbox'),
        stripe_product_id,
        stripe_price_id,
        settings: {
          ...formData.settings,
          pricing_type: formData.pricing_type,
          min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
          image_url: formData.image_url,
          logo_url: formData.logo_url,
          video_url: formData.video_url,
          included_product_ids: formData.selected_product_ids,
          included_products: includedProductSnapshots(),
          success_url: formData.success_url,
          success_message: formData.success_message,
          confirmation_type: formData.confirmation_type,
          quantity_limit: formData.quantity_limit ? parseInt(formData.quantity_limit) : null,
          stock_limit: formData.stock_limit ? parseInt(formData.stock_limit) : null,
          trial_period_days: formData.trial_period_days ? parseInt(formData.trial_period_days) : null,
          generate_license_key: formData.generate_license_key,
          terms_required: formData.terms_required,
          tax_behavior: formData.tax_behavior,
          is_sandbox: activeTab === 'sandbox' || !account?.id
        },
        active: true,
        status: 'active'
      };

      let newLink;
      if (editingId) {
        const { data, error: dbError } = await supabase
          .from('quick_pay_links')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (dbError) throw dbError;
        newLink = data;
        setLinks(links.map(l => l.id === editingId ? newLink : l));
      } else {
        const { data, error: dbError } = await supabase
          .from('quick_pay_links')
          .insert([payload])
          .select()
          .single();
        if (dbError) throw dbError;
        newLink = data;
        setLinks([newLink, ...links]);
      }

      setShowWizard(false);
      setWizardStep(1);
      setEditingId(null);
      // Reset form...
    } catch (err: any) {
      console.error(err);
      appToast(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (link: any) => {
    const isSandbox = isSandboxLink(link);
    const url = werseePaymentUrls.quickPay({
      username: link.username,
      slug: link.slug,
      sandbox: isSandbox,
    });
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewLinkClick = async () => {
    setFormData({
      name: '',
      slug: '',
      product_name: '',
      description: '',
      price: '',
      currency: 'eur',
      pricing_type: 'fixed',
      min_amount: '',
      image_url: '',
      logo_url: '',
      video_url: '',
      selected_product_ids: [],
      success_url: '',
      success_message: '',
      confirmation_type: 'default',
      quantity_limit: '',
      stock_limit: '',
      trial_period_days: '',
      generate_license_key: false,
      terms_required: false,
      tax_behavior: 'inclusive',
      settings: {
        theme: 'custom',
        layout: 'accordion',
        collect_address: false,
        collect_phone: false,
        collect_promotion_code: false,
        border_radius: '24px',
        font: 'inter',
        payment_methods: ['card'],
        save_payment_method: false,
        colors: {
          background: '#0A0A0A',
          card: '#141414',
          text: '#FFFFFF',
          secondary_text: '#A1A1AA',
          border: '#27272A',
          primary: '#635BFF'
        }
      }
    });
    setEditingId(null);
    setWizardStep(1);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_terms_accepted_at')
        .eq('id', user.id)
        .single();
      
      if (!profile?.seller_terms_accepted_at) {
        setShowGuidelines(true);
      } else {
        setShowWizard(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  const accountState = account ? getAccountState(account) : null;
  const isSetupComplete = accountState === 'complete' || accountState === 'enabled';
  const showSandboxBanner = !isSetupComplete && showBanner;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <SellerGuidelinesModal 
        isOpen={showGuidelines} 
        onClose={() => setShowGuidelines(false)} 
        onComplete={() => {
          setShowGuidelines(false);
          setShowWizard(true);
        }} 
      />
      {/* Sandbox Banner */}
      {showSandboxBanner && (
        <div className="mb-6 md:mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 md:gap-4 animate-in fade-in slide-in-from-top-4 mx-4 sm:mx-0">
          <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-amber-400 font-bold mb-1 text-sm md:text-base">Sandbox Mode</h3>
            <p className="text-amber-400/80 text-xs md:text-sm mb-3">
              You can test all Stripe features here and create payment links, but payments can only be made with Wersee Points until you have completed your setup.
            </p>
            <button
              onClick={() => setShowStripeModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs transition-colors"
            >
              Setup Wersee Pay
            </button>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Payment Links</h1>
          <p className="text-xs md:text-sm text-gray-400">Create a custom payment page without code and share it anywhere.</p>
        </div>
        <button 
          onClick={handleNewLinkClick}
          className="w-full md:w-auto px-6 py-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#635BFF]/20 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          New Link
        </button>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden mx-4 sm:mx-0">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base md:text-lg font-bold text-white">Active Links</h2>
            {fetchingLinks && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              Live
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sandbox' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              Sandbox
            </button>
          </div>
        </div>
        
        {activeLinks.length === 0 && !fetchingLinks ? (
          <div className="p-8 md:p-12 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-white mb-1">No active links</h3>
            <p className="text-xs md:text-sm text-gray-400">Create your first link to start accepting payments.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeLinks.map((link) => (
                  <div className="flex flex-col border-b border-white/5 last:border-0" key={link.id}>
                    <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors gap-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                          <LinkIcon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-medium mb-0.5 md:mb-1 truncate text-sm md:text-base">{link.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-sm text-gray-400">
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${link.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                              {link.active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400 font-medium">{link.currency.toUpperCase()} {link.price}</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <a href={werseePaymentUrls.quickPay({ username: link.username, slug: link.slug, sandbox: isSandboxLink(link) })} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1 truncate max-w-[150px] md:max-w-none">
                              {link.username}/.../{link.slug}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6">
                        {/* Stats */}
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-left sm:text-right">
                            <div className="text-[9px] md:text-xs text-gray-500 uppercase tracking-wider font-bold">Revenue</div>
                            <div className="text-white font-mono text-xs md:text-sm">{link.currency.toUpperCase()} {link.total_revenue || '0.00'}</div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-[9px] md:text-xs text-gray-500 uppercase tracking-wider font-bold">Sales</div>
                            <div className="text-white font-mono text-xs md:text-sm">{link.total_sales || 0}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2">
                          <button 
                            onClick={() => fetchAnalytics(link.id)}
                            className={`p-2 rounded-lg transition-colors relative group ${expandedAnalyticsId === link.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                            title="Analytics"
                          >
                            {loadingAnalytics === link.id ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Monitor className="w-4 h-4 md:w-5 md:h-5" />}
                          </button>
                          <button 
                            onClick={() => handleEditDraft(link)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors relative group"
                          >
                            <Edit className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button 
                            onClick={() => handleCopy(link)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors relative group"
                          >
                            {copiedId === link.id ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Analytics Expanded View */}
                    <AnimatePresence>
                      {expandedAnalyticsId === link.id && linkAnalytics[link.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-black/20 border-t border-white/5"
                        >
                          <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                              <div className="text-xs text-gray-400 mb-1">Total Clicks</div>
                              <div className="text-xl font-bold text-white">{link.total_clicks || 0}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                              <div className="text-xs text-gray-400 mb-1">Unique Visitors</div>
                              <div className="text-xl font-bold text-white">{link.unique_visitors || 0}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                              <div className="text-xs text-gray-400 mb-1">Conversion %</div>
                              <div className="text-xl font-bold text-emerald-400">
                                {link.unique_visitors > 0 ? Math.round(((link.total_sales || 0) / link.unique_visitors) * 100) : 0}%
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                              <div className="text-xs text-gray-400 mb-1">Last Click</div>
                              <div className="text-sm font-medium text-white mt-1">
                                {link.last_click_at ? new Date(link.last_click_at).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 flex flex-col justify-center">
                              <div className="text-xs text-gray-400 mb-2">Device Type</div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <Smartphone className="w-4 h-4 text-indigo-400" />
                                  <span className="text-sm text-white font-medium">{linkAnalytics[link.id].mobileCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Monitor className="w-4 h-4 text-emerald-400" />
                                  <span className="text-sm text-white font-medium">{linkAnalytics[link.id].desktopCount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              ))}
            </div>
          )}

          {/* Drafts Section */}
          {draftLinks.length > 0 && (
            <>
              <div className="p-4 md:p-6 border-t border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-base md:text-lg font-bold text-white">Drafts</h2>
              </div>
              <div className="divide-y divide-white/5">
                {draftLinks.map((link) => (
                  <div key={link.id} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-500/10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-0.5 md:mb-1 text-sm md:text-base">{link.name || 'Untitled Draft'}</h3>
                        <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm text-gray-400">
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400">
                            Draft
                          </span>
                          <span>•</span>
                          <span className="text-gray-500">Last edited {new Date(link.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEditDraft(link)}
                      className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors text-xs md:text-sm"
                    >
                      Continue Editing
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      {/* Quick Pay Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A]">
          {/* Top Bar */}
          <div className="h-14 md:h-16 border-b border-white/10 bg-[#141414] px-4 md:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setShowWizard(false)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg md:rounded-xl text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="h-5 md:h-6 w-px bg-white/10"></div>
              <h2 className="text-sm md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-none">Create Link</h2>
              {(!account || account === 'sandbox') && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Sandbox Mode: Payments only with Wersee Points</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2">
              <button 
                onClick={handleSaveDraft}
                className="hidden sm:block px-3 md:px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium text-xs md:text-sm"
              >
                Save Draft
              </button>
              <div className="hidden sm:block h-5 md:h-6 w-px bg-white/10 mx-1 md:mx-2"></div>
              <div className="flex items-center gap-1 mr-2 md:mr-4">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div key={s} className={`h-1 md:h-1.5 w-4 md:w-8 rounded-full transition-all ${s <= wizardStep ? 'bg-[#635BFF]' : 'bg-white/10'}`} />
                ))}
              </div>
              {wizardStep > 1 && (
                <button onClick={() => setWizardStep(prev => prev - 1)} className="px-2 md:px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium text-xs md:text-sm">
                  Back
                </button>
              )}
              {wizardStep < 6 ? (
                <button 
                  onClick={() => setWizardStep(prev => prev + 1)}
                  disabled={!formData.name || (!formData.price && formData.pricing_type === 'fixed')}
                  className="px-4 md:px-6 py-1.5 md:py-2 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-lg md:rounded-xl font-bold transition-all disabled:opacity-50 text-xs md:text-sm"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={handleCreateLink}
                  disabled={creating}
                  className="px-4 md:px-6 py-1.5 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg md:rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-xs md:text-sm"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#141414] overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
              
              {/* Step 1: Product & Price */}
              {wizardStep === 1 && (
                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <Tag className="w-4 h-4 md:w-5 md:h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white">Product & Price</h3>
                  </div>
                  
                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 md:text-xs">Include Wersee products</label>
                        {formData.selected_product_ids.length > 0 && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                            {formData.selected_product_ids.length} selected
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] leading-4 text-gray-500">
                        Build one checkout bundle from products you already created on Wersee.
                      </p>
                      {loadingProducts ? (
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-gray-400">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading your products…
                        </div>
                      ) : werseeProducts.length ? (
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {werseeProducts.map(product => {
                            const selected = formData.selected_product_ids.includes(product.id);
                            const image = product.image_url || product.thumbnail;
                            return (
                              <button
                                type="button"
                                key={product.id}
                                onClick={() => toggleIncludedProduct(product.id)}
                                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                                  selected ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                }`}
                              >
                                {image ? (
                                  <img src={image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                                ) : (
                                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-gray-500">
                                    <Box className="h-5 w-5" />
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold text-white">{product.title}</span>
                                  <span className="mt-0.5 block font-mono text-[10px] text-gray-500">
                                    {(product.base_currency || formData.currency).toUpperCase()} {Number.parseFloat(String(product.price || '0')).toFixed(2)}
                                  </span>
                                </span>
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/20'}`}>
                                  {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-gray-500">
                          You have no Wersee products yet. You can still create this link manually.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Internal Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g. Consulting Session" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                      />
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Link URL</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] md:text-sm truncate max-w-[150px]">
                            wersee.com/.../
                          </span>
                          <input 
                            type="text" 
                            value={formData.slug} 
                            onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} 
                            placeholder="my-product" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-[100px] md:pl-[240px] pr-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                          />
                        </div>
                        <p className="text-[9px] md:text-[10px] text-gray-500">Leave empty to auto-generate based on name.</p>
                      </div>
                    
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name (Public)</label>
                      <input 
                        type="text" 
                        value={formData.product_name} 
                        onChange={(e) => setFormData({...formData, product_name: e.target.value})} 
                        placeholder="e.g. 1-on-1 Strategy Call" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                      />
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing Model</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setFormData({...formData, pricing_type: 'fixed'})} 
                          className={`px-3 md:px-4 py-2.5 md:py-3 rounded-xl border transition-all text-xs md:text-sm font-medium ${formData.pricing_type === 'fixed' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          Fixed Price
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, pricing_type: 'variable'})} 
                          className={`px-3 md:px-4 py-2.5 md:py-3 rounded-xl border transition-all text-xs md:text-sm font-medium ${formData.pricing_type === 'variable' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          Pay what you want
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {formData.pricing_type === 'fixed' ? 'Price' : 'Minimum Amount'}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium uppercase text-xs md:text-sm">
                            {formData.currency}
                          </span>
                          <input 
                            type="number" 
                            value={formData.pricing_type === 'fixed' ? formData.price : formData.min_amount} 
                            onChange={(e) => formData.pricing_type === 'fixed' ? setFormData({...formData, price: e.target.value}) : setFormData({...formData, min_amount: e.target.value})} 
                            placeholder="0.00" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                          />
                        </div>
                        <button
                          onClick={() => setShowCurrencyModal(true)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white focus:outline-none focus:border-[#635BFF] hover:bg-white/10 transition-all font-medium uppercase min-w-[60px] md:min-w-[80px] text-xs md:text-sm"
                        >
                          {formData.currency}
                        </button>
                      </div>
                    </div>

                    <CurrencySelectionModal
                      isOpen={showCurrencyModal}
                      onClose={() => setShowCurrencyModal(false)}
                      onSelect={(currency) => setFormData({...formData, currency})}
                      currentCurrency={formData.currency}
                    />

                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        placeholder="Describe what the customer is purchasing..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600 h-24 md:h-32 resize-none" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Image</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          {formData.image_url ? (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 group">
                              <img src={formData.image_url} alt="Product" className="w-full h-full object-cover" />
                              <button
                                onClick={() => setFormData({...formData, image_url: ''})}
                                className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <FileUpload 
                              bucket="listings"
                              onUpload={(url) => setFormData({...formData, image_url: url})}
                              label="Upload Product Image"
                              accept="image/*"
                              darkMode={true}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-yellow-300" />
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Mobile hero video</label>
                      </div>
                      <p className="text-[10px] leading-4 text-gray-500">
                        Uploaded in resumable chunks through Wersee’s STRATO Storage API.
                      </p>
                      {userId && (
                        <PaymentLinkVideoUpload
                          userId={userId}
                          value={formData.video_url}
                          poster={formData.image_url}
                          onChange={(videoUrl) => setFormData(current => ({ ...current, video_url: videoUrl }))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Branding */}
              {wizardStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <Palette className="w-5 h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Branding & UI</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Theme</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setFormData({
                            ...formData, 
                            settings: {
                              ...formData.settings, 
                              theme: 'dark',
                              colors: {
                                background: '#0A0A0A',
                                card: '#141414',
                                text: '#FFFFFF',
                                secondary_text: '#A1A1AA',
                                border: '#27272A',
                                primary: '#635BFF'
                              }
                            }
                          })} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.settings.theme === 'dark' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <div className="w-full h-12 bg-[#0A0A0A] border border-white/10 rounded-lg mb-1 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/10"></div>
                          </div>
                          <span className="text-sm font-medium">Dark Mode</span>
                        </button>
                        <button 
                          onClick={() => setFormData({
                            ...formData, 
                            settings: {
                              ...formData.settings, 
                              theme: 'light',
                              colors: {
                                background: '#F9FAFB',
                                card: '#FFFFFF',
                                text: '#111827',
                                secondary_text: '#6B7280',
                                border: '#E5E7EB',
                                primary: '#635BFF'
                              }
                            }
                          })} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.settings.theme === 'light' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <div className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-lg mb-1 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                          </div>
                          <span className="text-sm font-medium">Light Mode</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layout Style</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setFormData({...formData, settings: {...formData.settings, layout: 'accordion'}})} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.settings.layout === 'accordion' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <div className="w-full h-12 bg-current opacity-10 rounded-lg mb-1"></div>
                          <span className="text-sm font-medium">Accordion</span>
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, settings: {...formData.settings, layout: 'tabs'}})} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.settings.layout === 'tabs' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <div className="w-full h-12 bg-current opacity-10 rounded-lg mb-1"></div>
                          <span className="text-sm font-medium">Tabs</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Border Radius</label>
                      <div className="flex gap-2">
                        {['0px', '8px', '16px', '24px', '99px'].map((radius) => (
                          <button
                            key={radius}
                            onClick={() => setFormData({...formData, settings: {...formData.settings, border_radius: radius}})}
                            className={`flex-1 h-10 border transition-all ${formData.settings.border_radius === radius ? 'bg-[#635BFF] border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                            style={{ borderRadius: radius === '99px' ? '9999px' : radius }}
                          >
                            {radius === '99px' ? 'Full' : radius}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-bold text-white">Colors</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Background Color</label>
                          <div className="flex gap-3">
                            <input 
                              type="color" 
                              value={formData.settings.colors.background} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, background: e.target.value}}})} 
                              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden" 
                            />
                            <input 
                              type="text" 
                              value={formData.settings.colors.background} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, background: e.target.value}}})} 
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#635BFF]" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Card Background</label>
                          <div className="flex gap-3">
                            <input 
                              type="color" 
                              value={formData.settings.colors.card} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, card: e.target.value}}})} 
                              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden" 
                            />
                            <input 
                              type="text" 
                              value={formData.settings.colors.card} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, card: e.target.value}}})} 
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#635BFF]" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Primary Color (Buttons & Accents)</label>
                          <div className="flex gap-3">
                            <input 
                              type="color" 
                              value={formData.settings.colors.primary} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, primary: e.target.value}}})} 
                              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden" 
                            />
                            <input 
                              type="text" 
                              value={formData.settings.colors.primary} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, primary: e.target.value}}})} 
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#635BFF]" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">Text Color</label>
                          <div className="flex gap-3">
                            <input 
                              type="color" 
                              value={formData.settings.colors.text} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, text: e.target.value}}})} 
                              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0 overflow-hidden" 
                            />
                            <input 
                              type="text" 
                              value={formData.settings.colors.text} 
                              onChange={(e) => setFormData({...formData, settings: {...formData.settings, colors: {...formData.settings.colors, text: e.target.value}}})} 
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#635BFF]" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Post-Purchase */}
              {wizardStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Post-Purchase Flow</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirmation Page</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setFormData({...formData, confirmation_type: 'default'})} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.confirmation_type === 'default' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <FileText className="w-6 h-6 mb-1 opacity-80" />
                          <span className="text-sm font-medium">Default Page</span>
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, confirmation_type: 'redirect'})} 
                          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.confirmation_type === 'redirect' ? 'bg-[#635BFF]/10 border-[#635BFF] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                          <ExternalLink className="w-6 h-6 mb-1 opacity-80" />
                          <span className="text-sm font-medium">Custom Redirect</span>
                        </button>
                      </div>
                    </div>

                    {formData.confirmation_type === 'redirect' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Redirect URL</label>
                        <input 
                          type="text" 
                          value={formData.success_url} 
                          onChange={(e) => setFormData({...formData, success_url: e.target.value})} 
                          placeholder="https://your-site.com/thank-you" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Success Message</label>
                        <textarea 
                          value={formData.success_message} 
                          onChange={(e) => setFormData({...formData, success_message: e.target.value})} 
                          placeholder="Thanks for your purchase! Here is your access link..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600 h-24 resize-none" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Marketing */}
              {wizardStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Marketing & Scarcity</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.settings.collect_promotion_code ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.settings.collect_promotion_code && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <input type="checkbox" checked={formData.settings.collect_promotion_code} onChange={(e) => setFormData({...formData, settings: {...formData.settings, collect_promotion_code: e.target.checked}})} className="hidden" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Allow Discount Codes</span>
                        <span className="text-xs text-gray-500">Customers can enter coupons</span>
                      </div>
                    </label>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity Limit (Max per order)</label>
                      <input 
                        type="number" 
                        value={formData.quantity_limit} 
                        onChange={(e) => setFormData({...formData, quantity_limit: e.target.value})} 
                        placeholder="e.g. 5" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Limit (Limited Edition)</label>
                      <input 
                        type="number" 
                        value={formData.stock_limit} 
                        onChange={(e) => setFormData({...formData, stock_limit: e.target.value})} 
                        placeholder="e.g. 100" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                      />
                      <p className="text-[10px] text-gray-500">Leave empty for unlimited stock.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Free Trial (Days)</label>
                      <input 
                        type="number" 
                        value={formData.trial_period_days} 
                        onChange={(e) => setFormData({...formData, trial_period_days: e.target.value})} 
                        placeholder="e.g. 7" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#635BFF] focus:bg-white/10 transition-all placeholder:text-gray-600" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Payment Methods */}
              {wizardStep === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <CreditCard className="w-5 h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Payment Methods</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Payment Methods List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <label key={method.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${formData.settings.payment_methods?.includes(method.id) ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                            {formData.settings.payment_methods?.includes(method.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={formData.settings.payment_methods?.includes(method.id)} 
                            onChange={(e) => {
                              const current = formData.settings.payment_methods || [];
                              const newMethods = e.target.checked 
                                ? [...current, method.id]
                                : current.filter(m => m !== method.id);
                              setFormData({...formData, settings: {...formData.settings, payment_methods: newMethods}});
                            }} 
                            className="hidden" 
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-white/5 rounded-md flex-shrink-0 flex items-center justify-center w-8 h-8">
                              {method.logo ? (
                                <img src={method.logo} alt={method.name} className="w-full h-full object-contain" />
                              ) : (
                                method.icon && <method.icon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-white truncate">{method.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Save for future use */}
                    <div className="pt-4 border-t border-white/10">
                      <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.settings.save_payment_method ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                          {formData.settings.save_payment_method && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={formData.settings.save_payment_method} 
                          onChange={(e) => setFormData({...formData, settings: {...formData.settings, save_payment_method: e.target.checked}})} 
                          className="hidden" 
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">Save Payment Method</span>
                          <span className="text-xs text-gray-500">Allow customers to save details for future purchases</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Advanced */}
              {wizardStep === 6 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                      <Settings className="w-5 h-5 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Advanced Settings</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.settings.collect_address ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.settings.collect_address && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <input type="checkbox" checked={formData.settings.collect_address} onChange={(e) => setFormData({...formData, settings: {...formData.settings, collect_address: e.target.checked}})} className="hidden" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Collect Shipping Address</span>
                        <span className="text-xs text-gray-500">Required for physical products</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.settings.collect_phone ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.settings.collect_phone && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <input type="checkbox" checked={formData.settings.collect_phone} onChange={(e) => setFormData({...formData, settings: {...formData.settings, collect_phone: e.target.checked}})} className="hidden" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Collect Phone Number</span>
                        <span className="text-xs text-gray-500">Useful for order updates</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.generate_license_key ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.generate_license_key && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <input type="checkbox" checked={formData.generate_license_key} onChange={(e) => setFormData({...formData, generate_license_key: e.target.checked})} className="hidden" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Generate License Key</span>
                        <span className="text-xs text-gray-500">Automatically create a key after purchase</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.terms_required ? 'bg-[#635BFF] border-[#635BFF]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {formData.terms_required && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <input type="checkbox" checked={formData.terms_required} onChange={(e) => setFormData({...formData, terms_required: e.target.checked})} className="hidden" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Require Terms Acceptance</span>
                        <span className="text-xs text-gray-500">Customer must agree to T&C</span>
                      </div>
                    </label>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Slug (Optional)</label>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#635BFF] transition-all">
                          <span className="text-gray-500 text-sm font-mono">/quick-pay/</span>
                          <input 
                            type="text" 
                            value={formData.slug} 
                            onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} 
                            placeholder="my-link" 
                            className="flex-1 bg-transparent text-white focus:outline-none text-sm font-mono placeholder:text-gray-600" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div className="flex-1 bg-[#0A0A0A] flex flex-col overflow-hidden relative">
              {/* Preview Toolbar */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0A] z-20">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</span>
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/5 p-1">
                    <button 
                      onClick={() => setPreviewStep('checkout')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewStep === 'checkout' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >
                      Checkout
                    </button>
                    <button 
                      onClick={() => setPreviewStep('success')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewStep === 'success' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >
                      Success
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Viewport */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-8 bg-[#0A0A0A] relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                />

                <motion.div 
                  layout
                  initial={false}
                  animate={{ 
                    width: previewMode === 'mobile' ? 375 : '100%',
                    height: previewMode === 'mobile' ? 700 : 'auto',
                    minHeight: previewMode === 'mobile' ? 700 : 600,
                    borderRadius: previewMode === 'mobile' ? 40 : 24,
                    borderWidth: previewMode === 'mobile' ? 8 : 1,
                    borderColor: previewMode === 'mobile' ? '#333' : 'rgba(255,255,255,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className={`relative overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col ${previewMode === 'desktop' ? 'md:flex-row max-w-4xl mx-auto my-auto' : ''}`}
                  style={{ 
                    backgroundColor: formData.settings.colors.background,
                  }}
                >
                  {/* Mock Browser Bar for Desktop */}
                  {previewMode === 'desktop' && (
                    <div className="absolute top-0 left-0 right-0 h-0 lg:hidden"></div> 
                  )}

                  {/* Product Info Section */}
                  <div className={`p-8 ${previewMode === 'desktop' ? 'md:w-1/2 md:p-12' : ''} flex flex-col justify-center relative overflow-hidden`} style={{ color: formData.settings.colors.text }}>
                    {formData.video_url && (
                      <>
                        <QuickPayVideoPlayer
                          src={formData.video_url}
                          poster={formData.image_url}
                          title={`${formData.product_name || 'Payment link'} background video`}
                          className="absolute inset-0 h-full w-full"
                          cover
                        />
                        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-black/30 to-black/75" />
                      </>
                    )}
                    {/* Background Decoration */}
                    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${formData.video_url ? 'opacity-30' : ''}`}>
                      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-20 blur-[60px]" style={{ backgroundColor: formData.settings.colors.primary }} />
                      <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[60px]" />
                    </div>

                    <div className="relative z-10">
                      <div className="mb-8">
                        <div className={`flex items-center gap-3 mb-8 ${formData.video_url && previewMode === 'mobile' ? 'justify-between' : ''}`}>
                          {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo" className="h-8 object-contain" />
                          ) : formData.image_url ? (
                            <img src={formData.image_url} alt="Product" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: formData.settings.colors.primary }}>
                              <DollarSign className="w-6 h-6 text-white" />
                            </div>
                          )}
                          {!formData.logo_url && !formData.video_url && (
                            <>
                              <div className="h-6 w-px opacity-20" style={{ backgroundColor: formData.settings.colors.text }}></div>
                              <span className={`text-sm font-bold tracking-tight opacity-60`}>
                                {formData.name || 'Your Brand'}
                              </span>
                            </>
                          )}
                          {formData.video_url && previewMode === 'mobile' && (
                            <span className="max-w-[190px] truncate rounded-full bg-black/35 px-4 py-2 text-right text-sm font-bold text-white backdrop-blur-md">
                              {formData.product_name || 'Product Name'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-6">
                          <h1 className={`font-bold tracking-tight leading-tight ${previewMode === 'mobile' ? 'text-3xl' : 'text-4xl'} ${formData.video_url && previewMode === 'mobile' ? 'sr-only' : ''}`}>
                            {formData.product_name || 'Product Name'}
                          </h1>
                          
                          <div className={`flex items-baseline gap-2 ${previewMode === 'mobile' ? 'hidden' : 'block'}`}>
                            <span className="text-4xl font-bold tracking-tighter">
                              {formData.currency.toUpperCase()} {formData.pricing_type === 'fixed' ? (formData.price || '0.00') : (formData.min_amount || '0.00')}
                            </span>
                            {formData.pricing_type === 'variable' && <span className="text-lg opacity-60">+</span>}
                            <span className="text-sm font-medium opacity-60 uppercase tracking-wider ml-2">Total</span>
                          </div>
                        </div>
                        
                        <p className={`text-sm leading-relaxed opacity-70`}>
                          {formData.description || 'Product description will appear here. Add details about what the customer is purchasing.'}
                        </p>
                        {formData.selected_product_ids.length > 0 && (
                          <div className="mt-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {includedProductSnapshots().map(product => (
                              <div key={product.id} className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-2.5 backdrop-blur-md">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                    <ShoppingBag className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold">{product.title}</div>
                                  <div className="text-[11px] opacity-60">{formData.currency.toUpperCase()} {product.price.toFixed(2)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checkout Section */}
                  <div className={`flex-1 flex flex-col p-6 ${previewMode === 'desktop' ? 'md:p-12 md:border-l' : 'border-t'} relative z-20 overflow-y-auto`}
                    style={{ 
                      backgroundColor: formData.settings.colors.card,
                      borderColor: formData.settings.colors.border,
                      borderLeftWidth: previewMode === 'desktop' ? 1 : 0,
                      borderTopWidth: previewMode === 'desktop' ? 0 : 1,
                      borderTopLeftRadius: previewMode === 'desktop' ? '24px' : '24px',
                      borderBottomLeftRadius: previewMode === 'desktop' ? '24px' : '0px',
                      borderTopRightRadius: previewMode === 'mobile' ? '24px' : '0px',
                      marginTop: previewMode === 'mobile' ? '-20px' : '0',
                      boxShadow: previewMode === 'mobile' ? '0 -10px 40px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    
                    {previewStep === 'checkout' ? (
                      <>
                        {/* Mobile Price Display */}
                        <div className={`${previewMode === 'mobile' ? 'block' : 'hidden'} mb-6 pb-6 border-b opacity-10`} style={{ borderColor: formData.settings.colors.text }}>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: formData.settings.colors.text }}>Total to pay</div>
                          <div className="text-3xl font-bold" style={{ color: formData.settings.colors.text }}>
                            {formData.currency.toUpperCase()} {formData.pricing_type === 'fixed' ? (formData.price || '0.00') : (formData.min_amount || '0.00') + '+'}
                          </div>
                        </div>

                        {/* Payment Methods Preview */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3 opacity-60">
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: formData.settings.colors.text }}>Pay with</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.settings.payment_methods?.map(methodId => {
                              const method = PAYMENT_METHODS.find(m => m.id === methodId);
                              if (!method) return null;
                              return (
                                <button 
                                  key={methodId} 
                                  onClick={() => setPreviewPaymentMethod(methodId)}
                                  className={`h-10 px-4 rounded border flex items-center justify-center transition-all ${previewPaymentMethod === methodId ? 'ring-2 ring-offset-2 ring-offset-black ring-[#635BFF] bg-white/10' : 'bg-white/5 hover:bg-white/10'}`} 
                                  style={{ borderColor: formData.settings.colors.border }}
                                >
                                  {method.logo ? (
                                    <img src={method.logo} alt={method.name} className="h-5 object-contain" />
                                  ) : (
                                    method.icon && <method.icon className="w-5 h-5" style={{ color: formData.settings.colors.secondary_text }} />
                                  )}
                                </button>
                              );
                            })}
                            {(!formData.settings.payment_methods || formData.settings.payment_methods.length === 0) && (
                              <span className="text-xs italic opacity-50" style={{ color: formData.settings.colors.text }}>All supported methods</span>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Payment Method Form */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={previewPaymentMethod}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4 mb-6 p-4 rounded-xl bg-black/5 border border-black/5"
                            style={{ borderColor: formData.settings.colors.border }}
                          >
                            {previewPaymentMethod === 'card' && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold opacity-60 uppercase" style={{ color: formData.settings.colors.text }}>Card Information</label>
                                  <div className="h-10 rounded-lg border flex items-center px-3 gap-2" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                    <CreditCard className="w-4 h-4 opacity-40" style={{ color: formData.settings.colors.text }} />
                                    <div className="h-2 w-32 rounded bg-current opacity-10" style={{ color: formData.settings.colors.text }}></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="h-10 flex-1 rounded-lg border flex items-center px-3" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                      <div className="h-2 w-12 rounded bg-current opacity-10" style={{ color: formData.settings.colors.text }}></div>
                                    </div>
                                    <div className="h-10 w-24 rounded-lg border flex items-center px-3" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                      <div className="h-2 w-8 rounded bg-current opacity-10" style={{ color: formData.settings.colors.text }}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {previewPaymentMethod === 'ideal' && (
                              <div className="space-y-3">
                                <label className="text-xs font-bold opacity-60 uppercase" style={{ color: formData.settings.colors.text }}>Select Your Bank</label>
                                <div className="h-10 rounded-lg border flex items-center justify-between px-3" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                  <span className="text-sm opacity-60" style={{ color: formData.settings.colors.text }}>Choose bank...</span>
                                  <ChevronRight className="w-4 h-4 opacity-40" style={{ color: formData.settings.colors.text }} />
                                </div>
                              </div>
                            )}
                            {/* Fallback for others */}
                            {!['card', 'ideal'].includes(previewPaymentMethod || '') && (
                              <div className="text-center py-4">
                                <p className="text-sm opacity-60 mb-3" style={{ color: formData.settings.colors.text }}>You will be redirected to complete your payment securely.</p>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        <div className="space-y-6">
                          {/* Express Checkout Mock */}
                          <div className="space-y-3">
                            <div className="h-10 bg-black flex items-center justify-center gap-2 text-white text-sm font-bold shadow-sm relative overflow-hidden" style={{ borderRadius: formData.settings.border_radius }}>
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black"></div>
                              <div className="relative flex items-center gap-2">
                                 <div className="w-4 h-4 bg-white rounded-full"></div>
                                 Pay
                              </div>
                            </div>
                            
                            <div className="relative flex items-center py-2">
                              <div className="flex-grow border-t opacity-10" style={{ borderColor: formData.settings.colors.text }}></div>
                              <span className="flex-shrink-0 mx-3 text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: formData.settings.colors.text }}>Or pay with card</span>
                              <div className="flex-grow border-t opacity-10" style={{ borderColor: formData.settings.colors.text }}></div>
                            </div>
                          </div>

                          {/* Form Fields Mock */}
                          <div className="space-y-4">
                            {formData.pricing_type === 'variable' && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: formData.settings.colors.text }}>Pay what you want</h3>
                                <div className="h-10 border opacity-50 flex items-center px-4" style={{ borderRadius: formData.settings.border_radius, borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                  <span style={{ color: formData.settings.colors.text }}>{formData.currency.toUpperCase()} {formData.min_amount || '0.00'}</span>
                                </div>
                              </div>
                            )}

                            {formData.settings.collect_address && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: formData.settings.colors.text }}>Shipping Details</h3>
                                <div className="h-10 border opacity-50" style={{ borderRadius: formData.settings.border_radius, borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}></div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: formData.settings.colors.text }}>Payment Method</h3>
                              <div className="border p-3 space-y-3" style={{ borderRadius: formData.settings.border_radius, borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                 <div className="flex gap-3">
                                   <div className="flex-1 h-8 rounded border opacity-50" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.card }}></div>
                                   <div className="flex-1 h-8 rounded border opacity-50" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.card }}></div>
                                 </div>
                                 <div className="h-8 rounded border opacity-50" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.card }}></div>
                              </div>
                            </div>

                            {formData.terms_required && (
                              <div className="flex items-center gap-2 opacity-70">
                                <div className="w-4 h-4 border rounded" style={{ borderColor: formData.settings.colors.text }}></div>
                                <span className="text-xs" style={{ color: formData.settings.colors.text }}>I agree to the Terms & Conditions</span>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={() => setPreviewStep('success')}
                            className="w-full h-12 font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 text-sm hover:shadow-xl hover:scale-[1.02]"
                            style={{ backgroundColor: formData.settings.colors.primary, borderRadius: formData.settings.border_radius }}
                          >
                            Pay {formData.currency.toUpperCase()} {formData.pricing_type === 'fixed' ? (formData.price || '0.00') : (formData.min_amount || '0.00') + '+'}
                          </button>

                          <div className="flex items-center justify-center gap-2 opacity-40" style={{ color: formData.settings.colors.text }}>
                            <ShieldCheck className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Secure Payment by Stripe</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        {formData.confirmation_type === 'redirect' ? (
                          <>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: formData.settings.colors.primary + '20' }}>
                              <ExternalLink className="w-8 h-8" style={{ color: formData.settings.colors.primary }} />
                            </div>
                            <h2 className="text-2xl font-bold" style={{ color: formData.settings.colors.text }}>Redirecting...</h2>
                            <p className="opacity-70" style={{ color: formData.settings.colors.text }}>
                              Customer will be redirected to:<br/>
                              <span className="font-mono text-xs opacity-50 mt-2 block">{formData.success_url || 'https://example.com'}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: formData.settings.colors.primary }}>
                              <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold" style={{ color: formData.settings.colors.text }}>Payment Successful</h2>
                            <p className="opacity-70" style={{ color: formData.settings.colors.text }}>
                              {formData.success_message || 'Thank you for your purchase!'}
                            </p>
                            {formData.generate_license_key && (
                              <div className="w-full p-4 mt-4 border border-dashed rounded-xl" style={{ borderColor: formData.settings.colors.border, backgroundColor: formData.settings.colors.background }}>
                                <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2" style={{ color: formData.settings.colors.text }}>Your License Key</div>
                                <div className="font-mono text-lg tracking-widest" style={{ color: formData.settings.colors.primary }}>XXXX-XXXX-XXXX-XXXX</div>
                              </div>
                            )}
                          </>
                        )}
                        <button 
                          onClick={() => setPreviewStep('checkout')}
                          className="mt-8 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: formData.settings.colors.text }}
                        >
                          Back to Checkout
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Onboarding Modal */}
      <BusinessOnboardingModal
        isOpen={showBusinessOnboarding}
        onClose={() => setShowBusinessOnboarding(false)}
        userId={userId || ''}
      />

      <StripeSetupModal 
        isOpen={showStripeModal} 
        onClose={() => setShowStripeModal(false)} 
        onComplete={() => {
          if (userId) {
            const savedAccountId = localStorage.getItem(`stripe_account_id_${userId}`);
            if (savedAccountId) {
              fetchAccount(savedAccountId);
            }
          }
        }}
      />
    </div>
  );
};
