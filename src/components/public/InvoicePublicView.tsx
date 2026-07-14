import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle, FileText, Download, CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck, Share2, Printer, QrCode as QrIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../SEO';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';

export const InvoicePublicView = () => {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (invoice) {
      // Generate QR code data URL for PDF
      const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      if (canvas) {
        setQrDataUrl(canvas.toDataURL());
      }
    }
  }, [invoice]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const cleanUsername = username?.replace('@', '');
        const { data, error: dbError } = await supabase
          .from('invoices')
          .select('*')
          .eq('username', cleanUsername)
          .eq('slug', slug)
          .single();

        if (dbError || !data) throw new Error('Invoice not found');
        setInvoice(data);

        // Fetch business info
        const { data: bizData } = await supabase
          .from('business_info')
          .select('*')
          .eq('user_id', data.user_id)
          .single();
        
        if (bizData) {
          setBusiness(bizData);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) fetchInvoice();
  }, [username, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
        <p className="text-gray-400 max-w-md">{error || 'This invoice does not exist or has been removed.'}</p>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const isVoid = invoice.status === 'void';
  const paymentUrl = `${window.location.origin}/quick-pay/invoice/${invoice.slug || invoice.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#635BFF]/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00D4FF]/5 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-container { 
            background: white !important; 
            border: none !important; 
            box-shadow: none !important; 
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          .print-text-black { color: black !important; }
          .print-bg-white { background: white !important; }
          .print-border-gray { border-color: #e5e7eb !important; }
        }
      `}} />
      
      <SEO 
        title={`Invoice #${invoice.slug?.toUpperCase() || invoice.id.slice(0, 8).toUpperCase()}`}
        description={`Invoice for ${invoice.customer_name} from ${username}`}
        url={`/@${username}/invoice/${slug}`}
        noIndex={true}
      />

      {/* Top Actions (Floating) */}
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center no-print relative z-20">
        <button 
          onClick={() => navigate(-1)}
          className="group px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all flex items-center gap-3 text-sm font-black border border-white/10 backdrop-blur-xl"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          BACK TO DASHBOARD
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/10 backdrop-blur-xl shadow-xl"
            title="Print Invoice"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/10 backdrop-blur-xl shadow-xl"
            title="Share Invoice"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-[#111111] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_64px_128px_-24px_rgba(0,0,0,0.9)] print-container relative z-10"
      >
        {/* Status Banner */}
        {isPaid && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-4 px-8 flex items-center justify-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-[0.4em] no-print">
            <CheckCircle2 className="w-5 h-5" />
            Payment Successfully Received
          </div>
        )}

        {/* Header Section */}
        <div className="p-10 md:p-20 flex flex-col md:flex-row justify-between gap-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#635BFF]/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-8 mb-12">
              <div className="w-24 h-24 bg-gradient-to-br from-[#635BFF] to-[#8E2DE2] rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(99,91,255,0.3)] border border-white/20">
                <FileText className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-white print-text-black leading-none mb-2">INVOICE</h1>
                <p className="text-[#635BFF] font-black text-lg tracking-[0.2em] opacity-80">
                  #{invoice.slug?.toUpperCase() || invoice.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Issued On</p>
                <p className="text-xl font-bold text-white print-text-black">{new Date(invoice.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Due Date</p>
                <p className="text-xl font-bold text-white print-text-black">{new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>

          <div className="text-right relative z-10 flex flex-col justify-between items-end">
            <div className="mb-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Billed To</p>
              <h3 className="text-3xl font-black text-white mb-2 print-text-black tracking-tight">{invoice.customer_name}</h3>
              <p className="text-gray-400 font-bold text-lg print-text-black opacity-60">{invoice.customer_email}</p>
            </div>
            
            <div className="inline-flex flex-col items-end">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Current Status</p>
              <span className={`inline-flex items-center gap-3 px-8 py-3 rounded-2xl text-sm font-black border shadow-2xl transition-all ${
                isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                isVoid ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
              }`}>
                {isPaid ? <CheckCircle2 className="w-5 h-5" /> : isVoid ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                {invoice.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-10 md:px-20 pb-20">
          <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] overflow-hidden print-border-gray shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 print-bg-white print-border-gray">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Description</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] w-24">Qty</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] w-32">Price</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] w-40">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print-border-gray">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index} className="group hover:bg-white/[0.02] transition-all duration-300">
                    <td className="px-10 py-10">
                      <p className="text-xl font-black text-white print-text-black tracking-tight group-hover:text-[#635BFF] transition-colors">{item.description}</p>
                    </td>
                    <td className="px-10 py-10 text-right text-gray-400 font-bold text-lg print-text-black">{item.quantity}</td>
                    <td className="px-10 py-10 text-right text-gray-400 font-bold text-lg print-text-black">
                      {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                      {item.price.toFixed(2)}
                    </td>
                    <td className="px-10 py-10 font-black text-white text-right text-2xl print-text-black tracking-tighter">
                      {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                      {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR Code Section */}
          <div className="mt-16 flex flex-col md:flex-row justify-between items-start gap-16">
            {/* Payment QR Code */}
            {!isPaid && !isVoid && (
              <div className="flex items-center gap-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] print-border-gray shadow-2xl group hover:bg-white/10 transition-all">
                <div className="bg-white p-4 rounded-3xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-500">
                  <QRCodeSVG 
                    value={paymentUrl}
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div>
                  <h4 className="text-white text-lg font-black mb-2 flex items-center gap-3 print-text-black">
                    <QrIcon className="w-6 h-6 text-[#635BFF]" />
                    Scan to Pay
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-[220px] print-text-black font-medium">
                    Use your phone camera to scan and pay instantly via our secure Stripe checkout.
                  </p>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="flex items-center gap-6 bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] print-border-gray shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-emerald-400 text-xl font-black mb-1">Paid in Full</h4>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Transaction Completed</p>
                </div>
              </div>
            )}

            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-3 px-4">
                <div className="flex justify-between items-center text-gray-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Subtotal</span>
                  <span className="text-lg font-bold print-text-black">
                    {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                    {invoice.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">VAT (0%)</span>
                  <span className="text-lg font-bold print-text-black">
                    {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}0.00
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-[#635BFF] to-[#8E2DE2] p-[2px] rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(99,91,255,0.4)]">
                <div className="bg-[#1A1A1A] rounded-[calc(2.5rem-2px)] p-10 flex justify-between items-center print-bg-white">
                  <span className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500">Total Due</span>
                  <span className="text-5xl font-black text-white print-text-black tracking-tighter">
                    {invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£'}
                    {invoice.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-20 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 no-print">
            <div className="flex items-center gap-4 text-gray-500 text-sm bg-white/5 px-8 py-4 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <span className="font-bold">Secure payment processing by <span className="text-white font-black">Stripe</span></span>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto">
              {/* Hidden canvas for QR code generation */}
              <div className="hidden">
                <QRCodeCanvas 
                  id="qr-canvas"
                  value={paymentUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <PDFDownloadLink 
                document={<InvoicePDF invoice={invoice} business={business} qrCodeDataUrl={invoice.show_qr_code ? qrDataUrl : undefined} />} 
                fileName={`invoice-${invoice.slug || invoice.id}.pdf`}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-black transition-all flex items-center justify-center gap-4 border border-white/10 backdrop-blur-xl shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {({ loading: pdfLoading }) => (
                  <>
                    {pdfLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                    DOWNLOAD PDF
                  </>
                )}
              </PDFDownloadLink>
              
              {!isPaid && !isVoid && (
                <button
                  onClick={() => navigate(`/${username}/quick-pay/invoice/${slug}`)}
                  className="flex-1 md:flex-none px-12 py-5 bg-[#635BFF] hover:bg-[#5851E5] text-white rounded-[2rem] font-black transition-all shadow-[0_30px_60px_-12px_rgba(99,91,255,0.5)] hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-4 group"
                >
                  PAY INVOICE NOW <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.6em]">Powered by Wersee Pay</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
