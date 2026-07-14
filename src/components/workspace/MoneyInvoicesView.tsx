import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { cn, fixOklchColors } from '../../lib/utils';
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
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

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

import { useNavigate } from 'react-router-dom';
import { CityAutocomplete } from './CityAutocomplete';

import { appToast } from '@/lib/feedback';
export const MoneyInvoicesView = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    outstanding: 0,
    taxCollected: 0,
    refunds: 0
  });

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isMobile && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    window.addEventListener('focusin', handleFocus);
    return () => window.removeEventListener('focusin', handleFocus);
  }, [isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [creating, setCreating] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    business_name: '',
    business_address: '',
    business_city: '',
    business_country: '',
    business_vat: '',
    business_kvk: '',
    business_logo_url: '',
    theme_preset: 'default',
    theme_color: '#635BFF',
    
    // Step 2: Customer Details
    customer_name: '',
    customer_email: '',
    customer_address: '',
    customer_city: '',
    customer_country: '',
    customer_vat: '',
    
    // Step 3: Invoice Details
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    invoice_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    currency: 'eur',
    items: [{ description: '', quantity: 1, price: 0, vat_rate: 21 }],
    
    // Step 4: Tax & Payment
    tax_type: 'domestic', // domestic, eu_b2b, eu_b2c, outside_eu
    payment_methods: ['card', 'ideal'],
    days_until_due: 30,
    memo: '',
    slug: '',
    show_qr_code: true
  });

  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [simulatedPayLater, setSimulatedPayLater] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewType, setPreviewType] = useState<'pdf' | 'email' | 'checkout'>('pdf');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Email Sending State
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (createdInvoice) {
      setRecipientEmail(createdInvoice.customer_email);
    }
  }, [createdInvoice]);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS);

  useEffect(() => {
    const handleOpenWizard = () => setShowWizard(true);
    window.addEventListener('open-invoice-wizard', handleOpenWizard);
    return () => window.removeEventListener('open-invoice-wizard', handleOpenWizard);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchInvoices();
    fetchBusinessInfo();
    checkStripeAccount();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdown && !(e.target as Element).closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const fetchBusinessInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business_logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business_logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, business_logo_url: publicUrl }));
      
      // Save to business_info table
      const { error: upsertError } = await supabase
        .from('business_info')
        .upsert({
          user_id: user.id,
          company_name: formData.business_name || 'My Company',
          logo_url: publicUrl
        }, { onConflict: 'user_id' });
        
      if (upsertError) throw upsertError;

    } catch (err: any) {
      console.error('Error uploading logo:', err);
      appToast(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveBusinessInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('business_info')
        .upsert({
          user_id: user.id,
          company_name: formData.business_name,
          address: formData.business_address,
          city: formData.business_city,
          country: formData.business_country,
          vat_number: formData.business_vat,
          kvk_number: formData.business_kvk,
          logo_url: formData.business_logo_url
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving business info:', err);
    }
  };

  const checkStripeAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let accountId = localStorage.getItem(`stripe_account_id_${user.id}`);
      
      if (!accountId) {
        // Check business_info
        const { data: business } = await supabase
          .from('business_info')
          .select('stripe_account_id')
          .eq('user_id', user.id)
          .single();
        
        if (business?.stripe_account_id) {
          accountId = business.stripe_account_id;
          localStorage.setItem(`stripe_account_id_${user.id}`, accountId);
        }
      }

      setHasStripeAccount(!!accountId);
    } catch (err) {
      console.error('Error checking Stripe account:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invoiceData = data || [];
      setInvoices(invoiceData);

      // Calculate Stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalInvoiced = invoiceData
        .filter(inv => {
          const date = new Date(inv.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear && inv.status !== 'draft';
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const outstanding = invoiceData
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const taxCollected = invoiceData
        .reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

      const refunds = invoiceData
        .reduce((sum, inv) => sum + (inv.refunded_amount || 0), 0);

      setStats({
        totalInvoiced,
        outstanding,
        taxCollected,
        refunds
      });

    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, price: 0, vat_rate: 21 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateInvoice = async (isDraft: boolean = false) => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!session || !user) throw new Error('Not authenticated');

      const accountId = localStorage.getItem(`stripe_account_id_${user.id}`);

      // Filter payment methods based on currency to avoid Stripe errors
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

      // Determine slug
      let finalSlug = formData.slug;
      if (!finalSlug) {
        // Auto-generate slug
        const baseSlug = `invoice-${stripeInvoice.number || Date.now()}`.toLowerCase();
        // We rely on the DB function or just try to insert. 
        // Since we can't easily call the DB function from client without RPC, 
        // we'll just use a timestamp based slug which is likely unique.
        finalSlug = baseSlug;
      }

      // Check if slug exists (if user provided one)
      if (formData.slug) {
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('user_id', user.id)
          .eq('slug', formData.slug)
          .single();
        
        if (existing) {
          throw new Error('This link is already in use, try different.');
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
      const username = user.email ? user.email.split('@')[0] : 'user';

      // Save to Supabase
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
          items: formData.items,
          memo: formData.memo,
          due_date: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000).toISOString() : null,
          business_name: formData.business_name,
          business_address: formData.business_address,
          business_city: formData.business_city,
          business_country: formData.business_country,
          business_vat: formData.business_vat,
          business_kvk: formData.business_kvk,
          business_logo_url: formData.business_logo_url,
          theme_preset: formData.theme_preset,
          theme_color: formData.theme_color,
          customer_address: formData.customer_address,
          customer_city: formData.customer_city,
          customer_country: formData.customer_country,
          customer_vat: formData.customer_vat,
          invoice_date: formData.invoice_date,
          delivery_date: formData.delivery_date,
          tax_type: formData.tax_type,
          payment_methods: formData.payment_methods,
          subtotal: calculateSubtotal(),
          tax_amount: calculateTax()
        }
      };

      const { data: insertedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select()
        .single();

      if (!dbError && insertedInvoice) {
        const paymentLink = `${window.location.origin}${insertedInvoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${username}/${insertedInvoice.invoice_number || formData.invoice_number}`;
        await supabase
          .from('invoice_links')
          .upsert({ username: username, invoice_id: insertedInvoice.id, link: paymentLink });
      }

      // Fetch the link from the database
      let paymentLink = `${window.location.origin}${insertedInvoice?.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${username}/${insertedInvoice?.invoice_number || formData.invoice_number}`;
      if (insertedInvoice) {
        const { data: linkData } = await supabase
          .from('invoice_links')
          .select('link')
          .eq('invoice_id', insertedInvoice.id)
          .single();
        if (linkData) {
          paymentLink = linkData.link;
        }
      }

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
           throw new Error('This link is already in use, try different.');
        }
        console.error('Error saving invoice to database:', dbError);
        // We don't throw here because the invoice was already sent via Stripe
      }

      setCreatedInvoice(insertedInvoice || newInvoice);
      setWizardStep(2); // Success step
      fetchInvoices();
      
      // Automatically send the email if it's not a draft
      if (!isDraft) {
        handleSendEmail(insertedInvoice || newInvoice);
      }
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      appToast(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setCreatedInvoice(null);
    setFormData(prev => ({
      ...prev,
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
    }));
  };

  const handleSaveDraft = () => {
    handleCreateInvoice(true);
  };

  const downloadCustomPDF = async () => {
    const element = document.getElementById('invoice-pdf-preview-hidden');
    if (!element) {
      console.error('Invoice preview element not found');
      return;
    }
    
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Temporarily show the element to render it properly
    element.style.display = 'block';
    
    const opt = {
      margin:       0,
      filename:     `${formData.invoice_number || 'invoice'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        onclone: (clonedDoc: Document) => {
          fixOklchColors(clonedDoc);
        }
      },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    
    try {
      // Generate PDF as Blob
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      // Upload to Supabase
      const fileName = `${formData.invoice_number || 'invoice'}.pdf`;
      const { data, error } = await supabase.storage
        .from('invoice_pdfs')
        .upload(`${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('invoice_pdfs')
        .getPublicUrl(fileName);

      // Update invoice record with new PDF URL
      if (formData.invoice_number) {
        await supabase
          .from('invoices')
          .update({ pdf_url: publicUrlData.publicUrl })
          .eq('invoice_number', formData.invoice_number);
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = publicUrlData.publicUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error handling PDF:', error);
    }
    
    // Hide it again
    element.style.display = 'none';
  };

  const handleSendEmail = async (invoiceToUse?: any) => {
    const invoice = invoiceToUse || createdInvoice;
    if (!invoice) return;
    setIsSendingEmail(true);
    try {
      const paymentLink = `${window.location.origin}${invoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${invoice.username}/${invoice.invoice_number || formData.invoice_number}`;
      const currencySymbol = invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£';
      
      const itemsHtml = (invoice.metadata?.items || invoice.items || []).map((item: any) => `
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="color: white; font-weight: bold; font-size: 14px; margin: 0;">${item.description || 'Item'}</p>
            <p style="color: #6b7280; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin: 4px 0 0 0;">Qty: ${item.quantity}</p>
          </div>
          <p style="color: white; font-weight: 900; margin: 0;">
            ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      `).join('');

      const themePreset = invoice.metadata?.theme_preset || 'default';
      const themeColor = invoice.metadata?.theme_color || '#635BFF';
      const primaryColor = themePreset === 'bw' ? '#ffffff' : themePreset === 'custom' ? themeColor : '#635BFF';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', sans-serif; background-color: #0A0A0A; color: #ffffff; padding: 40px; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
              .logo-container { margin-bottom: 40px; text-align: center; }
              .logo { height: 56px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 8px; background-color: rgba(255,255,255,0.05); }
              .header { text-align: center; margin-bottom: 40px; }
              .header h2 { font-size: 30px; font-weight: 900; color: white; margin: 0 0 12px 0; letter-spacing: -0.05em; }
              .header p { color: #9ca3af; font-size: 14px; margin: 0; }
              .header span { color: white; font-weight: bold; }
              .amount-card { background-color: rgba(255,255,255,0.05); border-radius: 40px; padding: 48px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.1); text-align: center; }
              .amount-label { font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3em; margin: 0 0 24px 0; }
              .amount-value { font-size: 72px; font-weight: 900; color: ${primaryColor}; letter-spacing: -0.05em; margin: 0 0 40px 0; }
              .pay-button { display: inline-block; width: 100%; padding: 24px 0; background-color: ${primaryColor}; color: ${themePreset === 'bw' ? '#000000' : '#ffffff'}; border-radius: 16px; font-weight: 900; font-size: 24px; text-decoration: none; }
              .due-date { margin-top: 20px; font-size: 10px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
              .memo-card { margin-bottom: 40px; padding: 40px; background-color: rgba(255,255,255,0.05); border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${primaryColor}; }
              .memo-label { font-size: 10px; font-weight: 900; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 24px 0; }
              .memo-text { font-size: 16px; color: #d1d5db; font-style: italic; margin: 0; line-height: 1.6; }
              .summary-label { font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 8px; }
              .summary-card { background-color: rgba(255,255,255,0.05); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; margin-bottom: 40px; }
              .footer { text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 48px; padding-bottom: 24px; }
              .footer p { font-size: 10px; font-weight: 900; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5em; margin: 0; }
              .footer span { color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              ${invoice.metadata.business_logo_url ? `
                <div class="logo-container">
                  <img src="${invoice.metadata.business_logo_url}" alt="Logo" class="logo" />
                </div>
              ` : ''}
              
              <div class="header">
                <h2>Invoice ${invoice.invoice_number}</h2>
                <p>from <span>${invoice.metadata.business_name || 'Your Business Name'}</span></p>
              </div>

              <div class="amount-card">
                <p class="amount-label">Amount Due</p>
                <p class="amount-value">${currencySymbol}${invoice.amount.toFixed(2)}</p>
                
                <a href="${paymentLink}" class="pay-button">Pay Invoice</a>
                <a href="${paymentLink}?download=true" class="download-button" style="display: block; width: 100%; padding: 14px 0; background-color: transparent; color: white; text-align: center; text-decoration: none; border-radius: 16px; font-weight: bold; border: 1px solid rgba(255,255,255,0.2); font-size: 16px; margin-top: 16px;">Download PDF Invoice</a>
                <p class="due-date">Due ${invoice.metadata?.due_date ? `on ${new Date(invoice.metadata.due_date).toLocaleDateString()}` : 'on receipt'}</p>
              </div>
              
              ${(invoice.metadata?.memo || invoice.memo) ? `
                <div class="memo-card">
                  <p class="memo-label">Message from Merchant</p>
                  <p class="memo-text">"${invoice.metadata?.memo || invoice.memo}"</p>
                </div>
              ` : ''}

              <div>
                <p class="summary-label">Order Summary</p>
                <div class="summary-card">
                  ${itemsHtml}
                </div>
              </div>
              
              ${invoice.metadata.payment_methods && invoice.metadata.payment_methods.length > 0 ? `
                <div style="margin-top: 40px; text-align: center;">
                  <p style="font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">Accepted Payment Methods</p>
                  <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                    ${invoice.metadata.payment_methods.map((methodId: string) => {
                      const method = PAYMENT_METHODS.find(m => m.id === methodId);
                      if (!method) return '';
                      return method.logo 
                        ? `<img src="${method.logo}" alt="${method.name}" style="height: 24px; object-fit: contain; background: white; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />`
                        : `<span style="font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">${method.name}</span>`;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              
              <div class="footer">
                <p>Securely processed by <span>Wersee Pay</span></p>
              </div>
            </div>
          </body>
        </html>
      `;

      console.warn('Direct invoice HTML email sending is disabled. Queue invoice email through platform_email_events from a trusted server event.', {
        invoiceId: invoice.id,
        recipient: recipientEmail || invoice.customer_email,
      });
      appToast('Direct invoice email sending is disabled. Finalized invoice emails must be sent through the secure platform email outbox.');

      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error: any) {
      console.error('Error sending email:', error);
      appToast(error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleInvoiceAction = async (invoiceId: string, stripeInvoiceId: string, action: 'finalize' | 'send' | 'void' | 'mark_uncollectible' | 'delete') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!session || !user) throw new Error('Not authenticated');

      const accountId = localStorage.getItem(`stripe_account_id_${user.id}`);

      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!accountId || stripeInvoiceId === 'sandbox_invoice') {
        // Sandbox mode: just update the local database status
        let newStatus = invoice?.status;
        if (action === 'finalize' || action === 'send') newStatus = 'open';
        else if (action === 'void') newStatus = 'void';
        else if (action === 'mark_uncollectible') newStatus = 'uncollectible';
        
        if (action === 'delete') {
          await supabase.from('invoices').delete().eq('id', invoiceId);
        } else if (newStatus) {
          await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
        }
        await fetchInvoices();
        return;
      }

      let finalAction = action;
      if (action === 'send' && invoice && invoice.status === 'draft') {
        // Finalize first
        await invokeApiRunner('invoice-action', {
          invoiceAction: 'finalize',
          stripeInvoiceId,
          accountId
        });
        finalAction = 'send';
      }

      if (finalAction !== 'send') {
        await invokeApiRunner('invoice-action', {
          invoiceAction: finalAction,
          stripeInvoiceId,
          accountId
        });
      }

      // Update local state and Supabase
      if (action === 'delete') {
        await supabase.from('invoices').delete().eq('id', invoiceId);
      } else {
        let newStatus = 'open';
        if (action === 'void') newStatus = 'void';
        if (action === 'mark_uncollectible') newStatus = 'uncollectible';
        if (action === 'send') {
          newStatus = 'sent';
          
          // Send email using Resend API
          const invoice = invoices.find(inv => inv.id === invoiceId);
          console.warn('Direct invoice Resend email is disabled. Invoice delivery must be queued from a trusted platform email event.', { invoiceId });
          if (false && invoice && invoice.customer_email) {
            try {
              const emailData = await invokeApiRunner('disabled-platform-email', {
                from: 'Wersee Pay <onboarding@resend.dev>', // Replace with your verified domain
                to: [invoice.customer_email],
                subject: `Invoice ${invoice.invoice_number} from ${invoice.metadata?.business_name || 'Your Business Name'}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      ${invoice.metadata?.business_logo_url ? `<img src="${invoice.metadata.business_logo_url}" alt="Logo" style="height: 48px; margin-bottom: 16px;">` : ''}
                      <h1 style="color: #111827; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Invoice from ${invoice.metadata?.business_name || 'Your Business Name'}</h1>
                    </div>

                    <div style="margin-bottom: 32px;">
                      <h2 style="color: #111827; margin-bottom: 8px; font-size: 20px; font-weight: 700;">Invoice ${invoice.invoice_number}</h2>
                      <p style="color: #4B5563; margin: 0; line-height: 1.6; font-size: 16px;">
                        Hi ${invoice.customer_name},<br><br>
                        You have a new invoice for <strong>${invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}${invoice.amount?.toFixed(2)}</strong>.<br>
                        Due date: ${invoice.metadata?.due_date ? new Date(invoice.metadata.due_date).toLocaleDateString() : 'on receipt'}.
                      </p>
                    </div>

                    <div style="background-color: #F9FAFB; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <span style="color: #6B7280; font-weight: 500;">Total Amount</span>
                        <span style="font-size: 24px; font-weight: bold; color: #111827;">
                          ${invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}${invoice.amount?.toFixed(2)}
                        </span>
                      </div>
                      
                      <div style="margin-bottom: 24px;">
                        <p style="color: #6B7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Accepted Payment Methods</p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                          ${(invoice.metadata?.payment_methods || []).map((mId: string) => {
                            const m = PAYMENT_METHODS.find(pm => pm.id === mId);
                            return `<span style="background-color: #E5E7EB; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">${m?.name || mId}</span>`;
                          }).join(' ')}
                        </div>
                      </div>

                      <a href="${window.location.origin}${invoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${invoice.username}/${invoice.invoice_number}" style="display: block; width: 100%; padding: 14px 0; background-color: #635BFF; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: bold; margin-bottom: 12px; font-size: 16px;">
                        Pay Invoice Now
                      </a>
                      <a href="${window.location.origin}${invoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${invoice.username}/${invoice.invoice_number}?download=true" style="display: block; width: 100%; padding: 14px 0; background-color: white; color: #111827; text-align: center; text-decoration: none; border-radius: 10px; font-weight: bold; border: 1px solid #E5E7EB; font-size: 16px;">
                        Download PDF Invoice
                      </a>
                    </div>

                    ${(invoice.metadata?.memo || invoice.memo) ? `
                      <div style="margin-bottom: 32px; padding: 16px; border-left: 4px solid #635BFF; background-color: #F3F4F6;">
                        <p style="color: #4B5563; font-size: 14px; margin: 0;"><strong>Note:</strong> ${invoice.metadata?.memo || invoice.memo}</p>
                      </div>
                    ` : ''}

                    <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 24px;">
                      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Powered by Wersee Pay</p>
                    </div>
                  </div>
                `
              });
            } catch (error) {
              console.error('Error sending invoice email:', error);
            }
          }
        }

        await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
      }

      fetchInvoices();
    } catch (err: any) {
      console.error(`Error performing ${action} on invoice:`, err);
      appToast(err.message);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    if (formData.tax_type === 'eu_b2b' || formData.tax_type === 'outside_eu') return 0;
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vat_rate / 100)), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiGenerating(true);
    setReasoningSteps(INITIAL_REASONING_STEPS.map(s => ({ ...s, status: 'pending', content: '' })));
    
    try {
      const ai = (() => { const client = getGeminiClient(); if (!client) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return client; })();
      
      const systemInstruction = `You are an expert invoice generator. 
      Based on the user's prompt, generate a professional invoice structure in JSON format.
      
      The JSON must follow this schema:
      {
        "customer_name": "string",
        "customer_email": "string",
        "memo": "string",
        "items": [
          { "description": "string", "quantity": number, "price": number }
        ]
      }
      
      CRITICAL INSTRUCTION: You MUST ALWAYS wrap your internal reasoning process in <think>...</think> tags before providing your final response.
      STRUCTURED REASONING: Before answering, work through this step-by-step inside the <think> tags:
      1. UNDERSTAND: What is the core request?
      2. ANALYZE: What items and pricing are appropriate?
      3. REASON: How should the invoice be structured for professionalism?
      4. SYNTHESIZE: Combine everything into the JSON schema.
      5. CONCLUDE: Finalize the JSON output.
      
      Important: Use the exact headers "1. UNDERSTAND:", "2. ANALYZE:", etc. for each step.
      After completing all 5 steps, provide the final JSON starting with "ANSWER:".`;

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\nUser Prompt: ' + aiPrompt }] }]
      });

      let fullResponse = '';
      for await (const chunk of responseStream) {
        const c = chunk as any;
        if (c.text) {
          fullResponse += c.text;
          
          // Parse reasoning steps for live animation
          const thinkMatch = fullResponse.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
          if (thinkMatch) {
            const reasoningText = thinkMatch[1];
            const steps = [...INITIAL_REASONING_STEPS];
            const stepMarkers = [
              { id: 'understand', marker: /1\.\s*UNDERSTAND:/i },
              { id: 'analyze', marker: /2\.\s*ANALYZE:/i },
              { id: 'reason', marker: /3\.\s*REASON:/i },
              { id: 'synthesize', marker: /4\.\s*SYNTHESIZE:/i },
              { id: 'conclude', marker: /5\.\s*CONCLUDE:/i },
              { id: 'answer', marker: /ANSWER:/i }
            ];

            for (let i = 0; i < stepMarkers.length; i++) {
              const current = stepMarkers[i];
              const next = stepMarkers[i + 1];
              const currentMatch = reasoningText.match(current.marker);
              if (currentMatch) {
                const startIndex = currentMatch.index! + currentMatch[0].length;
                let endIndex = -1;
                if (next) {
                  const nextMatch = reasoningText.match(next.marker);
                  if (nextMatch) endIndex = nextMatch.index!;
                }
                const content = reasoningText.substring(startIndex, endIndex !== -1 ? endIndex : reasoningText.length).trim();
                if (current.id !== 'answer') {
                  const stepIdx = steps.findIndex(s => s.id === current.id);
                  if (stepIdx !== -1) {
                    steps[stepIdx].content = content;
                    steps[stepIdx].status = endIndex === -1 ? 'active' : 'completed';
                  }
                }
              }
            }
            setReasoningSteps(steps);
          }
        }
      }

      // Extract JSON from ANSWER:
      const answerPart = fullResponse.split(/ANSWER:/i)[1];
      if (answerPart) {
        const jsonMatch = answerPart.match(/```json\s*([\s\S]*?)\s*```/) || [null, answerPart];
        const jsonData = JSON.parse(jsonMatch[1]?.trim() || '');
        
        setFormData({
          ...formData,
          customer_name: jsonData.customer_name || formData.customer_name,
          customer_email: jsonData.customer_email || formData.customer_email,
          memo: jsonData.memo || formData.memo,
          items: jsonData.items || formData.items
        });
        setShowAiInput(false);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 max-w-7xl mx-auto relative space-y-6 md:space-y-8">
      {/* Purple Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[800px] h-[300px] md:h-[400px] bg-purple-600/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 space-y-6 md:space-y-8">
        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#141414]/80 backdrop-blur-xl border border-white/5 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 tracking-tight">Invoices</h1>
            <p className="text-xs md:text-sm text-gray-400">Manage your invoices and payments with ease.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button onClick={() => setShowCustomizeModal(true)} className="flex-1 md:flex-none px-3 py-2.5 md:px-5 md:py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/10">
              <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
              Customize
            </button>
            <button onClick={() => setShowExportModal(true)} className="flex-1 md:flex-none px-3 py-2.5 md:px-5 md:py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/10">
              <ArrowDownToLine className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
              Export
            </button>
            <button 
              onClick={() => setShowWizard(true)}
              className="w-full md:w-auto px-6 py-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-2xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/20 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-500/10 rounded-full blur-2xl md:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-indigo-500/10 rounded-lg md:rounded-xl">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-400">Total Invoiced</span>
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
              €{stats.totalInvoiced.toFixed(2)}
            </div>
            <div className="text-[8px] md:text-xs text-indigo-400/80 font-medium uppercase tracking-wider">This month</div>
          </div>

          <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-amber-500/10 rounded-full blur-2xl md:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors"></div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-amber-500/10 rounded-lg md:rounded-xl">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-400">Outstanding</span>
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
              €{stats.outstanding.toFixed(2)}
            </div>
            <div className="text-[8px] md:text-xs text-amber-400/80 font-medium uppercase tracking-wider">Unpaid</div>
          </div>

          <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-emerald-500/10 rounded-full blur-2xl md:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-emerald-500/10 rounded-lg md:rounded-xl">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-400">Tax Collected</span>
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
              €{stats.taxCollected.toFixed(2)}
            </div>
            <div className="text-[8px] md:text-xs text-emerald-400/80 font-medium uppercase tracking-wider">Stripe Tax</div>
          </div>

          <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-red-500/10 rounded-full blur-2xl md:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-colors"></div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <div className="p-2 md:p-3 bg-red-500/10 rounded-lg md:rounded-xl">
                <ArrowDownToLine className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
              </div>
              <span className="text-[10px] md:text-sm font-medium text-gray-400">Refunds</span>
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-0.5 md:mb-1">
              €{stats.refunds.toFixed(2)}
            </div>
            <div className="text-[8px] md:text-xs text-red-400/80 font-medium uppercase tracking-wider">Credited</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Recent Invoices Feed */}
        <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white">Recent Invoices</h2>
          </div>

        {invoices.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-white mb-1">No invoices yet</h3>
            <p className="text-xs md:text-sm text-gray-400 mb-6">Invoices will appear here once you start selling.</p>
            <button 
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#635BFF]/20 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-4 pl-2">Customer</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right pr-2">Action</div>
            </div>
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 md:items-center hover:bg-white/[0.02] transition-colors group">
                <div className="md:col-span-4 flex items-center gap-3 md:pl-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    {invoice.customer_name ? invoice.customer_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{invoice.customer_name || 'Unknown Customer'}</p>
                      {invoice.invoice_number && (
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                          {invoice.invoice_number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{invoice.customer_email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:contents">
                  <div className="md:col-span-2">
                    <p className="text-white font-medium font-mono text-sm md:text-base">
                      {invoice.currency?.toUpperCase()} {invoice.amount?.toFixed(2)}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-medium border w-fit ${
                        invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        invoice.status === 'sent' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        invoice.status === 'void' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {invoice.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {invoice.status === 'sent' && <Clock className="w-3 h-3" />}
                        {invoice.status === 'void' && <XCircle className="w-3 h-3" />}
                        {invoice.status?.toUpperCase()}
                      </span>
                      {invoice.metadata?.pay_mode === 'later' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                          <Clock className="w-2.5 h-2.5" />
                          PAY LATER
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 text-xs md:text-sm text-gray-400">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </div>
                  <div className="md:col-span-2 text-right md:pr-2 relative action-dropdown">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      {invoice.pdf_url && (
                        <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {activeDropdown === invoice.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                        {invoice.status === 'draft' && (
                          <>
                            <button 
                              onClick={() => { handleInvoiceAction(invoice.id, invoice.stripe_invoice_id, 'finalize'); setActiveDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Finalize
                            </button>
                            <button 
                              onClick={() => { handleInvoiceAction(invoice.id, invoice.stripe_invoice_id, 'delete'); setActiveDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Draft
                            </button>
                          </>
                        )}
                        {(invoice.status === 'open' || invoice.status === 'sent') && (
                          <>
                            <button 
                              onClick={() => { handleInvoiceAction(invoice.id, invoice.stripe_invoice_id, 'send'); setActiveDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" /> Send Invoice
                            </button>
                            <button 
                              onClick={() => { handleInvoiceAction(invoice.id, invoice.stripe_invoice_id, 'void'); setActiveDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" /> Void Invoice
                            </button>
                            <button 
                              onClick={() => { handleInvoiceAction(invoice.id, invoice.stripe_invoice_id, 'mark_uncollectible'); setActiveDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" /> Mark Uncollectible
                            </button>
                          </>
                        )}
                        {invoice.hosted_url && (
                          <a 
                            href={invoice.hosted_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> View Payment Page
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>

      {/* Create Invoice Wizard */}
      {showWizard && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-[#0A0A0A] overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-[#0A0A0A] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {formData.invoice_number ? `# ${formData.invoice_number}` : 'NEW INVOICE'}
              </h2>
              {!hasStripeAccount && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Sandbox Mode: Payments only with Wersee Points</span>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowWizard(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
            {wizardStep === 2 && createdInvoice ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0A0A0A]">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Invoice Created Successfully!</h2>
                <p className="text-gray-400 mb-8 max-w-md text-center">
                  Your invoice has been generated. You can now share the payment link with your customer.
                </p>
                
                <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Payment Link</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm truncate">
                          {`${window.location.origin}${createdInvoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}`}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}${createdInvoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl transition-colors shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-[#635BFF]" />
                          <h3 className="text-sm font-bold text-white">Email Sent</h3>
                        </div>
                        <span className="text-xs text-gray-400">{createdInvoice.customer_email}</span>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleSendEmail(createdInvoice)}
                          disabled={isSendingEmail}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${emailSent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                        >
                          {isSendingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : emailSent ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Email Resent!
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Resend Email
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleCloseWizard}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      Done
                    </button>
                    <button 
                      onClick={downloadCustomPDF}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Preview Area (Top on mobile, Right on desktop) */}
                <div className={`flex-1 bg-[#0A0A0A] flex flex-col items-center transition-all duration-300 ease-in-out overflow-y-auto pt-4 pb-4 lg:pb-8 px-4 relative`}>
                  {/* Radial Gradient Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_80%)] pointer-events-none" />
                  
                  {/* Preview Toggle (Always visible) */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 z-10 w-full max-w-[800px] justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live Preview</span>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex bg-white/5 p-1 rounded-full backdrop-blur-md border border-white/10">
                        <button 
                          onClick={() => setPreviewType('pdf')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${previewType === 'pdf' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          PDF
                        </button>
                        <button 
                          onClick={() => setPreviewType('email')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${previewType === 'email' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Email
                        </button>
                        <button 
                          onClick={() => setPreviewType('checkout')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${previewType === 'checkout' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Link
                        </button>
                      </div>

                      <div className="flex bg-white/5 p-1 rounded-full backdrop-blur-md border border-white/10">
                        <button 
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${previewDevice === 'mobile' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Mob
                        </button>
                        <button 
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all uppercase tracking-wider ${previewDevice === 'desktop' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                          Desk
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`w-full transition-all duration-500 flex justify-center z-10 ${previewDevice === 'desktop' ? 'max-w-[1000px]' : 'max-w-[800px]'}`}>
                    
                    {previewType === 'pdf' && (
                      <div className="w-full flex justify-center">
                        <div className={`origin-top shadow-2xl rounded-[1rem] overflow-hidden bg-white transition-all duration-500 ${
                          previewDevice === 'desktop' 
                            ? 'scale-[0.5] sm:scale-[0.7] md:scale-[0.85] lg:scale-[0.9] xl:scale-100' 
                            : 'scale-[0.6] sm:scale-[0.85] md:scale-100 lg:scale-[0.9] xl:scale-100'
                        }`}>
                          <InvoicePDFPreview 
                            formData={formData} 
                            setFormData={setFormData}
                            subtotal={calculateSubtotal()} 
                            taxAmount={calculateTax()} 
                            total={calculateTotal()} 
                            isHidden={false} 
                            paymentLink={createdInvoice ? `${window.location.origin}${createdInvoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}` : undefined}
                          />
                        </div>
                      </div>
                    )}

                    {previewType === 'email' && (
                      <div className="bg-[#0A0A0A] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[650px] relative group">
                        {/* Browser/Email Frame */}
                        <div className="bg-[#1A1A1A] border-b border-white/5 p-4 flex items-center justify-between gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner" />
                          </div>
                          <div className="flex-1 max-w-md bg-black/40 rounded-full py-1.5 px-6 text-[10px] text-gray-500 font-black text-center border border-white/5 tracking-widest uppercase">
                            inbox / invoice-{formData.invoice_number}
                          </div>
                          <div className="w-20" /> {/* Spacer */}
                        </div>

                        <div className="bg-white/5 border-b border-white/5 p-6 flex items-center gap-5 text-sm">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#00D4FF] flex items-center justify-center text-white font-black border border-white/20 shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                            {formData.business_name ? formData.business_name.charAt(0).toUpperCase() : 'B'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white tracking-tight text-lg">{formData.business_name || 'Your Business Name'}</p>
                              <span className="text-[10px] bg-[#635BFF]/20 text-[#635BFF] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[#635BFF]/30">Verified</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5 font-medium">to {formData.customer_email || 'customer@example.com'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Just Now</p>
                          </div>
                        </div>

                        <div className="p-12 flex-1 overflow-y-auto bg-[#0A0A0A] scrollbar-hide">
                          <div className="max-w-md mx-auto">
                            {formData.business_logo_url && (
                              <div className="mb-12 flex justify-center">
                                <img src={formData.business_logo_url} alt="Logo" className="h-16 rounded-2xl object-contain border border-white/10 shadow-2xl bg-white/5 p-3 transform hover:scale-110 transition-transform duration-500" />
                              </div>
                            )}
                            
                            <div className="text-center mb-12">
                              <h2 className="text-4xl font-black text-white mb-4 tracking-tighter leading-none">
                                Invoice {formData.invoice_number}
                              </h2>
                              <p className="text-gray-400 text-sm font-medium">
                                from <span className="text-white font-bold">{formData.business_name || 'Your Business Name'}</span>
                              </p>
                            </div>

                            <div className="bg-white/5 rounded-[3rem] p-12 mb-12 border border-white/10 text-center relative overflow-hidden group/card shadow-2xl">
                              <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF]/20 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#635BFF]/10 blur-[60px] rounded-full" />
                              
                              <div className="relative z-10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8">Amount Due</p>
                                <p className="text-8xl font-black text-white tracking-tighter mb-12 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                  {formData.currency === 'eur' ? '€' : formData.currency === 'usd' ? '$' : '£'}{calculateTotal().toFixed(2)}
                                </p>
                                
                                <div className="space-y-6">
                                  <button className="w-full py-7 bg-white text-black rounded-[2rem] font-black text-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_25px_60px_rgba(255,255,255,0.15)]">
                                    Pay Invoice
                                  </button>
                                  <div className="flex items-center justify-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                                      Due {formData.days_until_due > 0 ? `on ${new Date(Date.now() + formData.days_until_due * 24 * 60 * 60 * 1000).toLocaleDateString()}` : 'on receipt'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {formData.memo && (
                              <div className="mb-12 p-12 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#635BFF]" />
                                <div className="absolute top-5 left-12">
                                  <p className="text-[10px] font-black text-[#635BFF] uppercase tracking-[0.3em]">Message from Merchant</p>
                                </div>
                                <p className="text-lg text-gray-300 whitespace-pre-wrap leading-relaxed font-medium italic mt-8">"{formData.memo}"</p>
                              </div>
                            )}

                            {/* Item Summary in Email */}
                            <div className="mb-12 space-y-5">
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-4">Order Summary</p>
                              <div className="bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-xl">
                                {formData.items.map((item, idx) => (
                                  <div key={idx} className={`p-6 flex justify-between items-center ${idx !== formData.items.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div>
                                      <p className="text-white font-black text-sm tracking-tight">{item.description || 'Item Name'}</p>
                                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-white font-black text-sm">
                                      {formData.currency === 'eur' ? '€' : formData.currency === 'usd' ? '$' : '£'}{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-12 border-t border-white/5 text-center">
                              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mb-4">Powered by Wersee</p>
                              <div className="flex justify-center gap-6">
                                <div className="w-2 h-2 rounded-full bg-white/10" />
                                <div className="w-2 h-2 rounded-full bg-white/10" />
                                <div className="w-2 h-2 rounded-full bg-white/10" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {previewType === 'checkout' && (
                      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden relative bg-[#F2F2F7]">
                        <div className={`w-full max-w-6xl h-full max-h-[90vh] lg:max-h-[800px] bg-white rounded-[2rem] lg:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden flex ${previewDevice === 'mobile' ? 'flex-col' : 'flex-col lg:flex-row'} relative z-10`}>
                          
                          {/* Left Column: Invoice Preview */}
                          <div className={`${previewDevice === 'mobile' ? 'hidden lg:flex' : 'flex'} lg:w-1/2 bg-[#F2F2F7] p-8 flex items-center justify-center overflow-hidden`}>
                            <div className="w-full max-w-[800px] shadow-2xl rounded-[2.5rem] overflow-hidden transform scale-[0.6] origin-center">
                              <InvoicePDFPreview 
                                formData={formData}
                                setFormData={setFormData}
                                subtotal={calculateSubtotal()}
                                taxAmount={calculateTax()}
                                total={calculateTotal()}
                              />
                            </div>
                          </div>

                          {/* Right Column: Payment Details */}
                          <div className="flex-1 bg-white p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
                            <div className="max-w-md mx-auto w-full">
                              <div className="mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                  {formData.business_logo_url ? (
                                    <img src={formData.business_logo_url} alt="" className="w-12 h-12 rounded-xl object-contain border border-black/5 p-2" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white font-bold text-xl">
                                      {(formData.business_name || 'W').charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="text-xl font-black tracking-tight text-black leading-none">
                                      {formData.business_name || 'Checkout'}
                                    </h3>
                                    <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Invoice {formData.invoice_number}</p>
                                  </div>
                                </div>

                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 mb-8">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Verified Seller
                                </div>
                              </div>

                              {/* Pay Toggle (Simulated) */}
                              <div className="bg-[#F2F2F7] p-1 rounded-full flex mb-8">
                                <button 
                                  onClick={() => setSimulatedPayLater(false)}
                                  className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!simulatedPayLater ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                  Pay now
                                </button>
                                <button 
                                  onClick={() => setSimulatedPayLater(true)}
                                  className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${simulatedPayLater ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                  Pay later
                                </button>
                              </div>

                              <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                                    {simulatedPayLater ? 'Total with fee' : 'Amount'}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-black text-black text-xl">
                                      {formData.currency === 'eur' ? '€' : formData.currency === 'usd' ? '$' : '£'}
                                      {(simulatedPayLater ? calculateTotal() + (calculateTotal() * 0.029 + 0.30) : calculateTotal()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    {simulatedPayLater && (
                                      <p className="text-[10px] text-gray-400 font-bold mt-1">
                                        Includes {(calculateTotal() * 0.029 + 0.30).toFixed(2)} service fee
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="h-px bg-gray-100" />
                              </div>

                              <div className="space-y-3 mb-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                  {simulatedPayLater ? 'Pay in 30 days with' : 'Select Payment Method'}
                                </p>
                                {simulatedPayLater ? (
                                  <div className="p-4 rounded-2xl border-2 border-black bg-black/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-8 rounded-lg bg-white flex items-center justify-center">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Klarna_Logo.svg/1200px-Klarna_Logo.svg.png" alt="Klarna" className="h-3 object-contain" />
                                      </div>
                                      <div>
                                        <span className="font-bold text-sm text-black block">Klarna Pay Later</span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">30 days interest-free</span>
                                      </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                                    </div>
                                  </div>
                                ) : (
                                  formData.payment_methods.slice(0, 3).map((methodId, idx) => {
                                    const method = PAYMENT_METHODS.find(m => m.id === methodId);
                                    if (!method) return null;
                                    const isSelected = idx === 0;
                                    return (
                                      <div 
                                        key={methodId}
                                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                          isSelected ? 'border-black bg-black/5' : 'border-gray-100 bg-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className={`w-12 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white' : 'bg-gray-50'}`}>
                                            {method.logo ? (
                                              <img src={method.logo} alt="" className="h-4 object-contain" />
                                            ) : (
                                              <method.icon className="w-5 h-5 text-gray-400" />
                                            )}
                                          </div>
                                          <span className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-gray-500'}`}>{method.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-black' : 'border-gray-200'}`}>
                                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <button className="w-full py-4 bg-black text-white rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                {simulatedPayLater ? 'Confirm Pay Later' : 'Pay Now'}
                                <ArrowRight className="w-6 h-6" />
                              </button>

                              <p className="mt-6 text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <Lock className="w-3.5 h-3.5" />
                                Secured by Stripe & Wersee Pay
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                    )}
                  </div>
                </div>

                {/* Bottom Sheet / Form Panel */}
                <div className={`
                  absolute inset-x-0 bottom-0 lg:relative lg:inset-auto lg:w-[450px] 
                  bg-[#141414] rounded-t-[2rem] lg:rounded-none border-t lg:border-t-0 lg:border-l border-white/5 
                  z-30 flex flex-col overflow-hidden transition-all duration-500
                  ${isMobile ? 'h-full' : 'h-full'}
                `}>
                  <motion.div
                    initial={false}
                    animate={{ y: 0, opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    {/* Handle for mobile */}
                    <div className="h-1 w-10 bg-white/10 rounded-full mx-auto my-3 lg:hidden shrink-0" />

                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    <div className="flex items-center justify-between mb-4 mt-2">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            wizardStep === step ? 'bg-[#635BFF] text-white' :
                            wizardStep > step ? 'bg-emerald-500 text-white' :
                            'bg-white/5 text-gray-500'
                          }`}>
                            {wizardStep > step ? <CheckCircle2 className="w-3 h-3" /> : step}
                          </div>
                          {step < 4 && (
                            <div className={`h-0.5 mx-1 rounded-full flex-1 ${wizardStep > step ? 'bg-emerald-500' : 'bg-white/5'}`} />
                          )}
                        </div>
                      ))}
                    </div>

                    {wizardStep === 1 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Business Info</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Logo</label>
                            <div className="flex items-center gap-3">
                              {formData.business_logo_url ? (
                                <img src={formData.business_logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white/5" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                                  <ImageIcon className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                              <label className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-bold cursor-pointer transition-colors border border-white/10">
                                {uploadingLogo ? '...' : 'Upload'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                              </label>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                            <input type="text" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address</label>
                            <input type="text" value={formData.business_address} onChange={(e) => setFormData({...formData, business_address: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                              <CityAutocomplete 
                                value={formData.business_city} 
                                onChange={(city, country) => setFormData(prev => ({
                                  ...prev, 
                                  business_city: city,
                                  ...(country ? { business_country: country } : {})
                                }))} 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Country</label>
                              <input type="text" value={formData.business_country} onChange={(e) => setFormData({...formData, business_country: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">VAT Number</label>
                              <input type="text" value={formData.business_vat} onChange={(e) => setFormData({...formData, business_vat: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">KvK Number</label>
                              <input type="text" value={formData.business_kvk} onChange={(e) => setFormData({...formData, business_kvk: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {wizardStep === 2 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Customer</h3>
                          <button onClick={() => setShowAiInput(!showAiInput)} className="flex items-center gap-1.5 text-[8px] font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </button>
                        </div>
                        {showAiInput && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 space-y-3">
                            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your invoice..." className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-xs min-h-[60px]" />
                            <div className="flex justify-end">
                              <button onClick={handleAiGenerate} disabled={isAiGenerating} className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-50">
                                {isAiGenerating ? '...' : 'Generate'}
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Name / Company</label>
                            <input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                            <input type="email" value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address</label>
                            <input type="text" value={formData.customer_address} onChange={(e) => setFormData({...formData, customer_address: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                              <CityAutocomplete 
                                value={formData.customer_city} 
                                onChange={(city, country) => setFormData(prev => ({
                                  ...prev, 
                                  customer_city: city,
                                  ...(country ? { customer_country: country } : {})
                                }))} 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Country</label>
                              <input type="text" value={formData.customer_country} onChange={(e) => setFormData({...formData, customer_country: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">VAT Number</label>
                              <input type="text" value={formData.customer_vat} onChange={(e) => setFormData({...formData, customer_vat: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                          </div>
                      </section>
                    )}

                    {wizardStep === 3 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Invoice Details</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Invoice #</label>
                              <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Currency</label>
                              <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs">
                                <option value="eur">EUR (€)</option>
                                <option value="usd">USD ($)</option>
                                <option value="gbp">GBP (£)</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                              <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Delivery</label>
                              <input type="date" value={formData.delivery_date} onChange={(e) => setFormData({...formData, delivery_date: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs" />
                            </div>
                          </div>
                        </div>

                        <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-4">Line Items</h3>
                        <div className="space-y-2">
                          {formData.items.map((item, index) => (
                            <div key={index} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 relative group">
                              <button onClick={() => handleRemoveItem(index)} className="absolute top-1 right-1 p-1 text-gray-500 hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                              <div className="space-y-2">
                                <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Description" className="w-full bg-transparent border-none p-0 text-white focus:ring-0 text-xs font-bold placeholder:text-gray-700" />
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="text-[7px] font-bold text-gray-600 uppercase tracking-widest mb-0.5 block">Qty</label>
                                    <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px]" />
                                  </div>
                                  <div className="flex-[2]">
                                    <label className="text-[7px] font-bold text-gray-600 uppercase tracking-widest mb-0.5 block">Price</label>
                                    <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px]" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[7px] font-bold text-gray-600 uppercase tracking-widest mb-0.5 block">VAT %</label>
                                    <input type="number" value={item.vat_rate} onChange={(e) => handleItemChange(index, 'vat_rate', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-white text-[10px]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={handleAddItem} className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold">
                            <Plus className="w-3 h-3" />
                            ADD ITEM
                          </button>
                        </div>
                      </section>
                    )}

                    {wizardStep === 4 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Tax & Payment</h3>
                        </div>
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tax Type</label>
                            <select value={formData.tax_type} onChange={(e) => setFormData({...formData, tax_type: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs">
                              <option value="domestic">Domestic (Standard VAT)</option>
                              <option value="eu_b2b">EU B2B (Reverse Charge)</option>
                              <option value="eu_b2c">EU B2C (OSS)</option>
                              <option value="outside_eu">Outside EU (0% VAT)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Terms</label>
                            <select value={formData.days_until_due} onChange={(e) => setFormData({...formData, days_until_due: parseInt(e.target.value)})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs">
                              <option value={0}>Due on receipt</option>
                              <option value={7}>Net 7</option>
                              <option value={14}>Net 14</option>
                              <option value={30}>Net 30</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Methods</label>
                            <div className="flex flex-wrap gap-1.5">
                              {PAYMENT_METHODS.map(method => {
                                const isSupported = !method.currencies || method.currencies.includes(formData.currency);
                                return (
                                  <button
                                    key={method.id}
                                    disabled={!isSupported}
                                    onClick={() => {
                                      const methods = formData.payment_methods.includes(method.id)
                                        ? formData.payment_methods.filter(m => m !== method.id)
                                        : [...formData.payment_methods, method.id];
                                      setFormData({...formData, payment_methods: methods});
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1.5 transition-all ${!isSupported ? 'opacity-30 grayscale cursor-not-allowed' : ''} ${formData.payment_methods.includes(method.id) ? 'bg-[#635BFF]/20 border-[#635BFF] text-[#635BFF]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                  >
                                    {method.logo ? (
                                      <img src={method.logo} alt={method.name} className="h-3 object-contain opacity-80" />
                                    ) : (
                                      method.icon && <method.icon className="w-3 h-3 opacity-80" />
                                    )}
                                    {method.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Memo / Notes</label>
                            <textarea value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs min-h-[50px]" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                            <div>
                              <p className="text-xs font-bold text-white">QR Code</p>
                              <p className="text-[8px] text-gray-500">Adds QR to PDF</p>
                            </div>
                            <button 
                              onClick={() => setFormData({...formData, show_qr_code: !formData.show_qr_code})}
                              className={`w-10 h-5 rounded-full transition-all relative ${formData.show_qr_code ? 'bg-emerald-500' : 'bg-white/10'}`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.show_qr_code ? 'left-5.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                </motion.div>

                    {/* Actions Bar */}
                  <div className="p-4 bg-[#141414] border-t border-white/5 shrink-0 z-40">
                    <div className="grid grid-cols-2 gap-3">
                      {wizardStep > 1 ? (
                        <button onClick={() => setWizardStep(wizardStep - 1)} className="py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs transition-all uppercase tracking-wider">
                          Back
                        </button>
                      ) : (
                        <button onClick={handleSaveDraft} className="py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs transition-all uppercase tracking-wider">
                          Draft
                        </button>
                      )}

                      {wizardStep < 4 ? (
                        <button onClick={() => {
                          if (wizardStep === 1) saveBusinessInfo();
                          setWizardStep(wizardStep + 1);
                        }} className="py-3.5 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-[#635BFF]/20">
                          Next
                        </button>
                      ) : (
                        <button onClick={() => handleCreateInvoice()} disabled={creating || !formData.customer_email || !formData.customer_name} className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-white/5 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Export Invoices</h2>
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Download a ZIP file containing all your invoices in PDF format and an Excel spreadsheet with payment statuses.
              </p>
              
              <button 
                onClick={async () => {
                  setExporting(true);
                  try {
                    const zip = new JSZip();
                    const pdfFolder = zip.folder("invoices");
                    
                    // Create Excel data
                    const excelData = invoices.map(inv => ({
                      'Invoice Number': inv.invoice_number,
                      'Customer Name': inv.customer_name,
                      'Customer Email': inv.customer_email,
                      'Amount': inv.amount,
                      'Currency': inv.currency.toUpperCase(),
                      'Status': inv.status,
                      'Created At': new Date(inv.created_at).toLocaleDateString(),
                      'Due Date': inv.metadata?.due_date ? new Date(inv.metadata.due_date).toLocaleDateString() : 'On receipt',
                      'Payment Link': `${window.location.origin}${inv.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${inv.username}/${inv.invoice_number}`
                    }));

                    const ws = XLSX.utils.json_to_sheet(excelData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    zip.file("invoices_summary.xlsx", excelBuffer);

                    // Fetch PDFs
                    const pdfPromises = invoices.map(async (inv) => {
                      if (inv.pdf_url) {
                        try {
                          const response = await fetch(inv.pdf_url);
                          if (response.ok) {
                            const blob = await response.blob();
                            pdfFolder?.file(`${inv.invoice_number || inv.id}.pdf`, blob);
                          }
                        } catch (e) {
                          console.error(`Failed to fetch PDF for ${inv.invoice_number}`, e);
                        }
                      }
                    });

                    await Promise.all(pdfPromises);

                    const content = await zip.generateAsync({ type: "blob" });
                    saveAs(content, "invoices_export.zip");
                    
                    setShowExportModal(false);
                  } catch (err) {
                    console.error('Export failed:', err);
                    appToast('Failed to export invoices. Please try again.');
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting || invoices.length === 0}
                className="w-full py-3 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export All Invoices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-white/5 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Customize Invoices</h2>
              <button onClick={() => setShowCustomizeModal(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Theme Preset</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setFormData({...formData, theme_preset: 'default'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.theme_preset === 'default' ? 'border-[#635BFF] bg-[#635BFF]/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#635BFF]" />
                    <span className="text-xs font-medium text-white">Default</span>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, theme_preset: 'bw'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.theme_preset === 'bw' ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-300" />
                    <span className="text-xs font-medium text-white">B&W</span>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, theme_preset: 'custom'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.theme_preset === 'custom' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: formData.theme_color }} />
                    <span className="text-xs font-medium text-white">Custom</span>
                  </button>
                </div>
              </div>

              {formData.theme_preset === 'custom' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">House Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.theme_color}
                      onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                      className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent p-0"
                    />
                    <input 
                      type="text" 
                      value={formData.theme_color}
                      onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                      className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={async () => {
                    // Save to business_info
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await supabase.from('business_info').upsert({
                          user_id: user.id,
                          metadata: {
                            theme_preset: formData.theme_preset,
                            theme_color: formData.theme_color
                          }
                        }, { onConflict: 'user_id' });
                      }
                    } catch (err) {
                      console.error('Error saving theme:', err);
                    }
                    setShowCustomizeModal(false);
                  }}
                  className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm transition-all hover:bg-gray-200"
                >
                  Save Customization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Preview for html2pdf */}
      <InvoicePDFPreview 
        formData={formData} 
        subtotal={calculateSubtotal()} 
        taxAmount={calculateTax()} 
        total={calculateTotal()} 
        isHidden={true} 
        paymentLink={createdInvoice ? `${window.location.origin}${createdInvoice.stripe_invoice_id === 'sandbox_invoice' ? '/sandbox' : ''}/pay/invoice/${createdInvoice.username}/${createdInvoice.invoice_number}` : undefined}
      />
    </div>
  );
};

