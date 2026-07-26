import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, invokeFinanceWorkflow } from '@/lib/supabase';
import { Loader2, CreditCard, Lock, ChevronRight, AlertTriangle, CheckCircle2, Building2, User as UserIcon, Calendar, Info, ArrowRight, Wallet, X, Eye, Download, ShieldCheck, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { InvoicePDFPreview } from '@/components/public/InvoicePDFPreview';
import { ContractPaymentPreview } from '@/components/public/ContractPaymentPreview';
import { WerseePayBrand } from '@/components/payments/WerseePayBrand';
import { werseePaymentUrls } from '@/lib/paymentUrls';
import { parseUsernameRouteValue } from '@/routing/routes';

import { appToast } from '@/lib/feedback';
export default function InvoicePaymentPage() {
  const { username, invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMode, setPayMode] = useState<'now' | 'later'>('now');
  const [laterDays, setLaterDays] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    fetchInvoice();
  }, [username, invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanUsername = parseUsernameRouteValue(username);
      if (!cleanUsername || !invoiceId) throw new Error('Invalid URL');

      // 1. Try to get user by username from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      const userId = profile?.id;

      if (profileError || !profile) {
        console.warn('Profile not found for username:', cleanUsername, profileError);
        // Don't throw yet, we'll try to find the invoice by username directly in the invoices table
      }

      // 2. Try to find the invoice
      let query = supabase.from('invoices').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('username', cleanUsername);
      }

      // Check if invoiceId is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceId || '');

      if (isUuid) {
        query = query.eq('id', invoiceId);
      } else {
        // Try exact match first, then ilike
        let exactQuery = supabase
          .from('invoices')
          .select('*');
          
        if (userId) {
          exactQuery = exactQuery.eq('user_id', userId);
        } else {
          exactQuery = exactQuery.eq('username', cleanUsername);
        }
        
        // invoice_number and slug are strings, so this is safe
        exactQuery = exactQuery.or(`invoice_number.eq.${invoiceId},slug.eq.${invoiceId}`);
        
        const { data: exactData } = await exactQuery;

        if (exactData && exactData.length > 0) {
          setInvoice(exactData[0]);
          await fetchBusiness(exactData[0].user_id);
          return;
        }

        // Fallback to ilike
        query = query.ilike('invoice_number', `%${invoiceId}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        const { data: linkData, error: linkError } = await supabase
          .from('invoice_links')
          .select('invoice_id')
          .eq('username', cleanUsername)
          .ilike('link', `%${invoiceId}%`);

        if (linkData && linkData.length > 0) {
          const { data: linkedInvoice, error: linkedError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', linkData[0].invoice_id)
            .maybeSingle();
          
          if (linkedInvoice) {
            setInvoice(linkedInvoice);
            await fetchBusiness(linkedInvoice.user_id);
            return;
          }
        }
        
        throw new Error('Invoice not found');
      }

      const invoice = data[0];
      setInvoice(invoice);
      await fetchBusiness(invoice.user_id);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusiness = async (userId: string) => {
    try {
      const { data: bizData, error: bizError } = await supabase
        .from('business_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (bizError) {
        console.warn('Business info error:', bizError);
      }
      
      if (bizData) {
        setBusiness(bizData);
      }
    } catch (err) {
      console.error('Error fetching business:', err);
    }
  };

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    
    try {
      const resData = await invokeFinanceWorkflow<{ url: string }>('invoice-checkout', {
        invoiceId: invoice.id,
        payMode,
        laterDays: payMode === 'later' ? laterDays : 0,
      });

      const { url } = resData;
      if (!url) throw new Error('Stripe did not return a checkout URL.');
      window.location.href = url;
    } catch (err: any) {
      console.error('Payment error:', err);
      appToast(err.message);
      setPaying(false);
    }
  };

  const metadata = invoice?.metadata || {};
  const contractId = typeof metadata.contract_id === 'string' ? metadata.contract_id : '';
  const isContractPayment = contractId.length > 0;
  const themePreset = metadata.theme_preset || 'default';
  const themeColor = metadata.theme_color || '#635BFF';
  const primaryColor = themePreset === 'bw' ? '#000000' : themePreset === 'custom' ? themeColor : '#635BFF';
  const primaryColorLight = `${primaryColor}15`;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0c0c0d]">
        <WerseePayBrand dark />
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0d] p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#171719] p-8 text-center text-white shadow-2xl">
          <WerseePayBrand dark className="mb-7" />
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Invoice Not Found</h2>
          <p className="mb-6 text-white/50">{error || 'The invoice you are looking for does not exist.'}</p>
          <a href="https://www.wersee.com" className="block w-full rounded-2xl bg-white py-4 font-bold text-black">Go to Wersee</a>
        </div>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0d] p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#171719] p-8 text-center text-white shadow-2xl">
          <WerseePayBrand dark className="mb-7" />
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Invoice Paid</h2>
          <p className="mb-6 text-white/50">This invoice has already been settled. Thank you!</p>
          <a href="https://www.wersee.com" className="block w-full rounded-2xl bg-white py-4 font-bold text-black">Done</a>
        </div>
      </div>
    );
  }

  const currencySymbol = invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£';
  const fee = invoice.amount * 0.016; // 1.6% fee as seen in image
  const totalWithFee = Number(invoice.amount) + (payMode === 'later' ? fee : 0);
  
  const repaymentDate = new Date();
  repaymentDate.setDate(repaymentDate.getDate() + laterDays);

  const subtotal = metadata.subtotal || invoice.amount;
  const taxAmount = metadata.tax_amount || 0;
  
  const isSandbox = invoice.stripe_invoice_id === 'sandbox_invoice';

  return (
    <div className="min-h-screen bg-[#F2F2F7] lg:bg-white">
      <SEO 
        title={isContractPayment
          ? `Pay Contract ${metadata.contract_title || invoice.invoice_number} - Wersee`
          : `Pay Invoice ${invoice.invoice_number} - ${metadata.business_name || 'Wersee'}`}
        description={isContractPayment
          ? `Secure payment for the signed contract ${metadata.contract_title || invoice.invoice_number}.`
          : `Securely pay invoice ${invoice.invoice_number} for ${currencySymbol}${invoice.amount.toFixed(2)} from ${metadata.business_name || 'Wersee Seller'}.`}
        image={invoice.pdf_url || metadata.business_logo_url}
        url={werseePaymentUrls.invoice({
          username: invoice.username || username,
          invoiceId: invoice.invoice_number || invoiceId,
          sandbox: isSandbox,
        })}
        type="website"
      />

      {/* Desktop Layout (2 Columns) */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Column: Invoice Preview */}
        <div className="w-1/2 bg-[#F2F2F7] p-12 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-[800px] shadow-2xl rounded-[2.5rem] overflow-hidden transform scale-[0.85] origin-center bg-white">
            {isContractPayment ? (
              <ContractPaymentPreview
                contractId={contractId}
                title={metadata.contract_title}
                reference={invoice.invoice_number}
                customerName={invoice.customer_name}
                createdAt={invoice.created_at}
                amount={Number(invoice.amount)}
                currency={invoice.currency}
              />
            ) : invoice.pdf_url ? (
              <iframe 
                src={`${invoice.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-[800px] border-0"
                title="Invoice PDF"
              />
            ) : (
              <InvoicePDFPreview 
                formData={metadata}
                subtotal={subtotal}
                taxAmount={taxAmount}
                total={Number(invoice.amount)}
              />
            )}
          </div>
        </div>

        {/* Right Column: Payment Details */}
        <div className="w-1/2 bg-white p-16 flex flex-col justify-center max-w-2xl">
          <WerseePayBrand className="mb-8 self-start" />
          {isSandbox && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3 text-yellow-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
              <div>
                <h3 className="font-bold text-sm">Test Mode Active</h3>
                <p className="text-sm mt-1 opacity-90">This invoice is currently in sandbox mode. No real payments will be processed. The seller has not fully set up their Wersee Pay account yet.</p>
              </div>
            </div>
          )}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              {metadata.business_logo_url ? (
                <img src={metadata.business_logo_url} alt="" className="w-16 h-16 rounded-2xl object-contain border border-black/5 p-2" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: primaryColor }}>
                  {(metadata.business_name || 'W').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black tracking-tight text-black leading-none">
                  {isContractPayment ? metadata.contract_title || 'Contract payment' : metadata.business_name || 'Checkout'}
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  {isContractPayment ? `Signed agreement · ${invoice.invoice_number}` : `Invoice ${invoice.invoice_number}`}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2 mb-8">
              <ShieldCheck className="w-4 h-4" />
              {isContractPayment ? 'Signed Contract' : 'Verified Seller'}
            </div>
          </div>

          {/* Pay Toggle */}
          <div className="bg-[#F2F2F7] p-1.5 rounded-full flex mb-10 max-w-sm">
            <button 
              onClick={() => setPayMode('now')}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${payMode === 'now' ? 'shadow-sm text-white' : 'text-gray-500'}`}
              style={payMode === 'now' ? { backgroundColor: primaryColor } : {}}
            >
              Pay now
            </button>
            <button 
              onClick={() => setPayMode('later')}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${payMode === 'later' ? 'shadow-sm text-white' : 'text-gray-500'}`}
              style={payMode === 'later' ? { backgroundColor: primaryColor } : {}}
            >
              Pay later
            </button>
          </div>

          <AnimatePresence mode="wait">
            {payMode === 'later' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center mb-10 px-2 max-w-sm"
              >
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setLaterDays(days as any)}
                    className={`flex flex-col items-center gap-1 transition-all ${laterDays === days ? 'scale-110' : 'opacity-40'}`}
                  >
                    <div className={`w-14 h-10 rounded-xl flex items-center justify-center font-bold text-base ${laterDays === days ? 'text-white' : 'bg-gray-100 text-black'}`} style={laterDays === days ? { backgroundColor: primaryColor } : {}}>
                      {days}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">days</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6 mb-12 max-w-sm">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-500 font-medium">Amount</span>
              <span className="font-bold text-black">{currencySymbol}{Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {payMode === 'later' && (
              <>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-500 font-medium">Fee (1.6%)</span>
                  <span className="font-bold text-black">{currencySymbol}{fee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center text-xl">
                  <span className="text-gray-900 font-bold">Total due</span>
                  <span className="font-black text-black">{currencySymbol}{totalWithFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl">
                  <Calendar className="w-4 h-4" />
                  Repayment on <span className="font-bold text-black">{repaymentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={handlePay}
            disabled={paying}
            className="w-full max-w-sm py-5 text-white rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
          >
            {paying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isContractPayment ? 'Pay Contract' : 'Continue to Payment'}
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          <div className="mt-8 flex flex-col gap-2">
            {business?.stripe_account_id && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Wersee Pay Setup Complete
              </div>
            )}
            <button 
              onClick={() => navigate('/wersee-pay-security')}
              className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-2 transition-colors text-left"
            >
              <Lock className="w-4 h-4" />
              Secured by Wersee Pay with Stripe
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout (Optimized) */}
      <div className="lg:hidden min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 pt-12 pb-4 flex justify-between items-center bg-[#F5F5F7] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {metadata.business_logo_url ? (
              <img src={metadata.business_logo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-black/5 shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: primaryColor }}>
                {(metadata.business_name || 'W').charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-gray-900">{metadata.business_name || 'Business'}</h2>
              <p className="text-xs text-gray-500 font-medium">
                {isContractPayment ? 'Signed contract payment' : `Invoice ${invoice.invoice_number}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WerseePayBrand compact />
            <a
              href="https://www.wersee.com"
              aria-label="Close payment page"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-600 transition-colors hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </a>
          </div>
        </div>

        {isSandbox && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3 text-yellow-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
            <div>
              <h3 className="font-bold text-sm">Test Mode Active</h3>
              <p className="text-sm mt-1 opacity-90">This invoice is currently in sandbox mode. No real payments will be processed.</p>
            </div>
          </div>
        )}

        {/* Amount Display */}
        <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {isContractPayment ? 'Contract amount due' : 'Amount Due'}
          </span>
          <div className="flex items-start justify-center gap-1">
            <span className="text-3xl font-bold text-gray-400 mt-1">{currencySymbol}</span>
            <span className="text-6xl font-black text-black tracking-tighter">
              {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5" />
            Pending Payment
          </div>
        </div>

        {/* Invoice Actions */}
        <div className="px-6 mb-6 flex gap-3">
          {isContractPayment && (
            <a
              href={`/contract/${encodeURIComponent(contractId)}`}
              className="flex-1 bg-white border border-black/5 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm text-gray-700 active:scale-[0.98] transition-transform"
            >
              <Eye className="w-4 h-4" />
              View contract
            </a>
          )}
          {invoice.pdf_url && (
            <a 
              href={invoice.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border border-black/5 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm text-gray-700 active:scale-[0.98] transition-transform"
            >
              <Eye className="w-4 h-4" />
              View PDF
            </a>
          )}
          {!isContractPayment && (
            <button className="flex-1 bg-white border border-black/5 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm text-gray-700 active:scale-[0.98] transition-transform">
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>

        {/* Bottom Payment Sheet */}
        <div className="mt-auto bg-white rounded-t-[2.5rem] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] p-6 pb-safe flex flex-col">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-black/5">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Date</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-black/5">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</p>
                  <p className="text-sm font-bold text-gray-900">{metadata.due_date ? new Date(metadata.due_date).toLocaleDateString() : 'On Receipt'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-black/5">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pay Later</p>
                  <p className="text-sm font-medium text-gray-500">Split into installments</p>
                </div>
              </div>
              <button 
                onClick={() => setPayMode(payMode === 'now' ? 'later' : 'now')}
                className={`w-12 h-7 rounded-full transition-colors relative ${payMode === 'later' ? '' : 'bg-gray-300'}`}
                style={payMode === 'later' ? { backgroundColor: primaryColor } : {}}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${payMode === 'later' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <button 
            onClick={handlePay}
            disabled={paying}
            className="w-full py-4 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg mb-4"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
          >
            {paying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isContractPayment ? 'Pay contract' : 'Pay'} {currencySymbol}{payMode === 'later' ? totalWithFee.toLocaleString('en-US', { minimumFractionDigits: 2 }) : Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </>
            )}
          </button>
          
          <div className="flex flex-col items-center gap-2 pb-4">
            {business?.stripe_account_id && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Wersee Pay Setup Complete
              </div>
            )}
            <button 
              onClick={() => navigate('/wersee-pay-security')}
              className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              <Lock className="w-3 h-3" />
              Secured by Wersee Pay with Stripe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
