import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { 
  Loader2, FileText, Download, AlertCircle, Calendar, DollarSign, 
  User, Plus, Palette, ArrowDownToLine, CheckCircle2, XCircle, 
  Clock, X, Tag, Settings, Trash2, AlertTriangle, MoreVertical, 
  Send, CheckCircle, Ban, Copy, Sparkles, Wand2, Brain, ShieldCheck, ArrowRight,
  Target, BarChart3, Lightbulb, Combine, Flag, CreditCard, Landmark, Image as ImageIcon, ChevronRight, Lock, Shield, QrCode
} from 'lucide-react';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";
import { ThinkingAnimation, ReasoningStep } from '../ThinkingAnimation';
import { InvoicePDFPreview } from '../public/InvoicePDFPreview';
import { CityAutocomplete } from './CityAutocomplete';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { appToast } from '@/lib/feedback';
const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  { id: 'understand', label: 'Understand', content: '', status: 'pending', icon: Target },
  { id: 'analyze', label: 'Analyze', content: '', status: 'pending', icon: BarChart3 },
  { id: 'reason', label: 'Reason', content: '', status: 'pending', icon: Lightbulb },
  { id: 'synthesize', label: 'Synthesize', content: '', status: 'pending', icon: Combine },
  { id: 'conclude', label: 'Conclude', content: '', status: 'pending', icon: Flag },
];

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit Card', icon: CreditCard, logo: null, currencies: ['eur', 'usd', 'gbp'] },
  { id: 'ideal', name: 'iDEAL', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/iDEAL_Wero_Lockup_Yellow_Square_RGB.svg', currencies: ['eur'] },
  { id: 'bancontact', name: 'Bancontact', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/Bancontact_logo.svg.png', currencies: ['eur'] },
  { id: 'klarna', name: 'Klarna', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/klarna-icon.webp', currencies: ['eur', 'usd', 'gbp'] },
  { id: 'affirm', name: 'Affirm', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/blue_solid_circle-transparent_bg.avif', currencies: ['usd'] },
  { id: 'eps', name: 'EPS', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/32041242-b0eb5b7c-ba33-11e7-8d58-7f134da0e4d8.png', currencies: ['eur'] },
  { id: 'alipay', name: 'Alipay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/62b1e77b56b6848f8bec9031.png', currencies: ['usd', 'eur'] },
  { id: 'sepa_debit', name: 'SEPA Direct Debit', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/67433ffcacc11a3a9c648faf_639b928a92f2c749f5ad800c_APMsLPMs20Website20Template.png', currencies: ['eur'] },
  { id: 'sofort', name: 'Sofort', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment-sofort.png', currencies: ['eur'] },
  { id: 'afterpay_clearpay', name: 'Afterpay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/unnamed.png', currencies: ['eur', 'usd', 'gbp'] },
  { id: 'giropay', name: 'Giropay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Giropay.svg.png', currencies: ['eur'] },
  { id: 'p24', name: 'Przelewy24', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/6.Przelewy24_logo.webp', currencies: ['pln', 'eur'] },
  { id: 'wechat_pay', name: 'WeChat Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/77adb574c905404f69555e6fc9e47e3693444c6c.svg', currencies: ['usd', 'eur'] },
  { id: 'link', name: 'Link', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/link.png', currencies: ['usd', 'eur', 'gbp'] },
  { id: 'customer_balance', name: 'Bank Transfer', icon: Landmark, logo: null, currencies: ['eur', 'usd', 'gbp'] },
  { id: 'us_bank_account', name: 'ACH Direct Debit', icon: Landmark, logo: null, currencies: ['usd'] },
  { id: 'boleto', name: 'Boleto', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/boleto.png', currencies: ['brl'] },
  { id: 'cashapp', name: 'Cash App Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/cashapp.png', currencies: ['usd'] },
  { id: 'wersee_points', name: 'Wersee Points', icon: Sparkles, logo: null, currencies: ['eur', 'usd', 'gbp'] },
];

interface InvoiceBuilderProps {
  invoiceId?: string | null;
  onClose: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ invoiceId, onClose }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewType, setPreviewType] = useState<'pdf' | 'email' | 'checkout'>('pdf');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [simulatedPayLater, setSimulatedPayLater] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);

  const [formData, setFormData] = useState({
    business_name: '',
    business_address: '',
    business_city: '',
    business_country: '',
    business_vat: '',
    business_kvk: '',
    business_logo_url: '',
    theme_preset: 'default',
    theme_color: '#635BFF',
    customer_name: '',
    customer_email: '',
    customer_address: '',
    customer_city: '',
    customer_country: '',
    customer_vat: '',
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    invoice_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    currency: 'eur',
    items: [{ description: '', quantity: 1, price: 0, vat_rate: 21 }],
    tax_type: 'domestic',
    payment_methods: ['card', 'ideal'],
    days_until_due: 30,
    memo: '',
    slug: '',
    show_qr_code: true
  });

  useEffect(() => {
    fetchBusinessInfo();
    checkStripeAccount();
    if (invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoiceData = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          ...formData,
          ...data.metadata,
          invoice_number: data.invoice_number,
          currency: data.currency,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
        });
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('business_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setFormData(prev => ({
          ...prev,
          business_name: data.company_name || '',
          business_address: data.address || '',
          business_city: data.city || '',
          business_country: data.country || '',
          business_vat: data.vat_number || '',
          business_kvk: data.kvk_number || '',
          business_logo_url: data.logo_url || '',
          theme_preset: data.metadata?.theme_preset || 'default',
          theme_color: data.metadata?.theme_color || '#635BFF',
        }));
      }
    } catch (err) {
      console.error('Error fetching business info:', err);
    }
  };

  const checkStripeAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('business_info')
        .select('stripe_account_id')
        .eq('user_id', user.id)
        .single();
      
      setHasStripeAccount(!!business?.stripe_account_id);
    } catch (err) {
      console.error('Error checking Stripe account:', err);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * (item.vat_rate / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreateInvoice = async (isDraft: boolean = false) => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const user = session.user;

      const accountId = localStorage.getItem(`stripe_account_id_${user.id}`);

      const supportedMethods = formData.payment_methods.filter(methodId => {
        const method = PAYMENT_METHODS.find(m => m.id === methodId);
        return !method || !method.currencies || method.currencies.includes(formData.currency);
      });

      const resData = await invokeApiRunner('create-invoice', {
        ...formData,
        payment_methods: supportedMethods,
        accountId: accountId || null,
        draftOnly: isDraft
      });

      const stripeInvoice = resData;
      const username = user.email ? user.email.split('@')[0] : 'user';
      const finalSlug = formData.slug || `invoice-${stripeInvoice.number || Date.now()}`.toLowerCase();

      const newInvoice = {
        user_id: user.id,
        username: username,
        stripe_invoice_id: stripeInvoice.id,
        invoice_number: formData.invoice_number || stripeInvoice.number,
        show_qr_code: formData.show_qr_code,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        amount: calculateTotal(),
        currency: formData.currency,
        status: isDraft ? 'draft' : 'sent',
        pdf_url: stripeInvoice.invoice_pdf,
        hosted_url: stripeInvoice.hosted_invoice_url,
        slug: finalSlug,
        metadata: {
          ...formData,
          subtotal: calculateSubtotal(),
          tax_amount: calculateTax()
        }
      };

      const { data: insertedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select()
        .single();

      if (dbError) throw dbError;

      setCreatedInvoice(insertedInvoice);
      setWizardStep(2); // Success step
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      appToast(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiGenerating(true);
    setReasoningSteps(INITIAL_REASONING_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));
    
    try {
      const updateStep = (id: string, status: 'active' | 'completed', content: string) => {
        setReasoningSteps(prev => prev.map(s => 
          s.id === id ? { ...s, status, content } : s
        ));
      };

      // Step 1: Understand
      updateStep('understand', 'active', 'Analyzing invoice request: ' + aiPrompt);
      await new Promise(r => setTimeout(r, 800));
      updateStep('understand', 'completed', 'Invoice context established.');

      // Step 2: Analyze
      updateStep('analyze', 'active', 'Identifying relevant line items and tax rates...');
      await new Promise(r => setTimeout(r, 1000));
      updateStep('analyze', 'completed', 'Standard items and rates identified.');

      // Step 3: Reason
      updateStep('reason', 'active', 'Generating invoice details and customer info...');
      
      const ai = (() => { const client = getGeminiClient(); if (!client) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return client; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate invoice details based on this request: "${aiPrompt}". 
        Return a JSON object with the following structure:
        {
          "customer_name": "string",
          "customer_email": "string",
          "customer_address": "string",
          "items": [
            { "description": "string", "quantity": number, "price": number, "vat_rate": number }
          ],
          "memo": "string"
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || '{}');
      
      updateStep('reason', 'completed', 'Invoice data generated successfully.');

      // Step 4: Synthesize
      updateStep('synthesize', 'active', 'Applying data to form...');
      await new Promise(r => setTimeout(r, 600));
      updateStep('synthesize', 'completed', 'Data application complete.');

      // Step 5: Conclude
      updateStep('conclude', 'active', 'Finalizing...');
      await new Promise(r => setTimeout(r, 400));
      
      setFormData(prev => ({
        ...prev,
        customer_name: result.customer_name || prev.customer_name,
        customer_email: result.customer_email || prev.customer_email,
        customer_address: result.customer_address || prev.customer_address,
        items: result.items || prev.items,
        memo: result.memo || prev.memo
      }));
      
      updateStep('conclude', 'completed', 'Invoice updated.');
      setAiPrompt('');
      setShowAiInput(false);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('business_logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('business_logos').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, business_logo_url: publicUrl }));
    } catch (err: any) {
      appToast(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSendEmail = async (invoice: any) => {
    setIsSendingEmail(true);
    try {
      await invokeApiRunner('send-invoice-email', {
        invoiceId: invoice.id,
        recipientEmail: invoice.customer_email
      });
      setEmailSent(true);
    } catch (err) {
      console.error('Email error:', err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const downloadCustomPDF = () => {
    if (createdInvoice?.pdf_url) {
      window.open(createdInvoice.pdf_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0A0A0A]">
      {wizardStep === 2 && createdInvoice ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Invoice Created!</h2>
          <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Payment Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm truncate">
                  {`${window.location.origin}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}`}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium">Done</button>
              <button onClick={downloadCustomPDF} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Preview Area */}
          <div className="flex-1 bg-[#0A0A0A] flex flex-col items-center overflow-y-auto p-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_80%)] pointer-events-none" />
            
            <div className="flex gap-3 mb-8 z-10">
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                {(['pdf', 'email', 'checkout'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setPreviewType(t)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${previewType === t ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                {(['mobile', 'desktop'] as const).map(d => (
                  <button 
                    key={d}
                    onClick={() => setPreviewDevice(d)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${previewDevice === d ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={`w-full transition-all duration-500 flex justify-center z-10 ${previewDevice === 'desktop' ? 'max-w-4xl' : 'max-w-md'}`}>
               <InvoicePDFPreview 
                formData={formData} 
                setFormData={setFormData}
                subtotal={calculateSubtotal()} 
                taxAmount={calculateTax()} 
                total={calculateTotal()} 
                isHidden={false} 
              />
            </div>
          </div>

          {/* Form Panel */}
          <div className="w-full lg:w-[450px] bg-[#141414] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      wizardStep === step ? 'bg-[#635BFF] text-white ring-4 ring-[#635BFF]/20' :
                      wizardStep > step ? 'bg-emerald-500 text-white' :
                      'bg-white/5 text-gray-500'
                    }`}>
                      {wizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </div>
                    {step < 4 && <div className={`h-0.5 mx-2 flex-1 rounded-full ${wizardStep > step ? 'bg-emerald-500' : 'bg-white/5'}`} />}
                  </div>
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Business Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                        {formData.business_logo_url ? <img src={formData.business_logo_url} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-gray-600" />}
                      </div>
                      <label className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold cursor-pointer border border-white/10 transition-all">
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                    <input placeholder="Business Name" value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                    <input placeholder="Address" value={formData.business_address} onChange={e => setFormData({...formData, business_address: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <CityAutocomplete value={formData.business_city} onChange={city => setFormData({...formData, business_city: city})} />
                      <input placeholder="Country" value={formData.business_country} onChange={e => setFormData({...formData, business_country: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Customer Details</h3>
                    <button onClick={() => setShowAiInput(!showAiInput)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black border border-indigo-500/20">
                      <Sparkles className="w-3 h-3" /> AI ASSIST
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAiInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-4 mb-6"
                      >
                        {!isAiGenerating ? (
                          <div className="space-y-3">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Describe the invoice (e.g., 'Invoice for John Doe for 5 hours of consulting at 100/hr')..."
                              className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[80px] resize-none"
                            />
                            <button
                              onClick={handleAiGenerate}
                              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Generate with AI
                            </button>
                          </div>
                        ) : (
                          <ThinkingAnimation steps={reasoningSteps} isDark={true} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <input placeholder="Customer Name" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                    <input placeholder="Customer Email" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                    <input placeholder="Customer Address" value={formData.customer_address} onChange={e => setFormData({...formData, customer_address: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none" />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Invoice Items</h3>
                  <div className="space-y-4">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 space-y-4 relative group">
                        <button onClick={() => {
                          const newItems = [...formData.items];
                          newItems.splice(idx, 1);
                          setFormData({...formData, items: newItems});
                        }} className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                        <input placeholder="Description" value={item.description} onChange={e => {
                          const newItems = [...formData.items];
                          newItems[idx].description = e.target.value;
                          setFormData({...formData, items: newItems});
                        }} className="w-full bg-transparent border-none p-0 text-white font-bold placeholder:text-gray-700 focus:ring-0" />
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">Qty</label>
                            <input type="number" value={item.quantity} onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].quantity = parseInt(e.target.value) || 1;
                              setFormData({...formData, items: newItems});
                            }} className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">Price</label>
                            <input type="number" value={item.price} onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].price = parseFloat(e.target.value) || 0;
                              setFormData({...formData, items: newItems});
                            }} className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">VAT %</label>
                            <input type="number" value={item.vat_rate} onChange={e => {
                              const newItems = [...formData.items];
                              newItems[idx].vat_rate = parseFloat(e.target.value) || 0;
                              setFormData({...formData, items: newItems});
                            }} className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setFormData({...formData, items: [...formData.items, { description: '', quantity: 1, price: 0, vat_rate: 21 }]})} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-gray-500 hover:text-white hover:border-white/10 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Final Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Methods</label>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => {
                              const methods = formData.payment_methods.includes(m.id)
                                ? formData.payment_methods.filter(id => id !== m.id)
                                : [...formData.payment_methods, m.id];
                              setFormData({...formData, payment_methods: methods});
                            }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${formData.payment_methods.includes(m.id) ? 'bg-[#635BFF]/20 border-[#635BFF] text-[#635BFF]' : 'bg-white/5 border-white/10 text-gray-500'}`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea placeholder="Memo / Notes" value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 outline-none min-h-[100px]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-[#141414] border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                {wizardStep > 1 ? (
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Back</button>
                ) : (
                  <button onClick={() => handleCreateInvoice(true)} disabled={creating} className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                    {creating ? '...' : 'Save Draft'}
                  </button>
                )}
                
                {wizardStep < 4 ? (
                  <button onClick={() => setWizardStep(wizardStep + 1)} className="py-4 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#635BFF]/20">Next</button>
                ) : (
                  <button onClick={() => handleCreateInvoice(false)} disabled={creating} className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                    {creating ? 'Creating...' : 'Finalize'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
