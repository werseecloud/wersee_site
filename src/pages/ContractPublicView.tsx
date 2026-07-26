import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, CheckCircle, Clock, AlertCircle, MessageSquare, Download, Shield, ArrowRight, X, Loader2 } from 'lucide-react';
import { supabase, invokeFinanceWorkflow } from '../lib/supabase';
import SignaturePad from 'react-signature-canvas';
import { Helmet } from 'react-helmet-async';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { appToast } from '@/lib/feedback';
export const ContractPublicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'review' | 'feedback' | 'signing' | 'completed'>('review');
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [signature, setSignature] = useState<any>(null);
  
  // Signing state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quickPayUrl, setQuickPayUrl] = useState('');
  const sigCanvas = useRef<SignaturePad>(null);

  useEffect(() => {
    if (id) fetchContract();
  }, [id]);

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = document.getElementById('contract-content');
      if (!element) throw new Error('Contract content not found');

      element.classList.add('pdf-mode');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      element.classList.remove('pdf-mode');

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Contract_${contract.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      appToast('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data: publicPayload, error } = await supabase.rpc('get_public_contract', { p_contract_id: id });
      const data = publicPayload?.contract || null;

      if (error) throw error;
      if (!data) throw new Error('Contract not found');

      setContract(data);
      setQuickPayUrl(data.metadata?.quick_pay_url || '');
      
      if (data.status === 'signed') {
        setMode('completed');
        // Fetch signature
        const sigData = publicPayload?.signature || null;
        if (sigData) {
          setSignature(sigData);
          setSignerName(sigData.signer_name);
        }
      } else if (data.status === 'draft') {
        setError('This contract is not ready to be viewed yet.');
      } else {
        // Update status to viewed if it was sent
        if (data.status === 'sent') {
          await supabase.rpc('mark_public_contract_viewed', { p_contract_id: id });
        }
      }
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      setError(err.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      appToast('Please provide your signature.');
      return;
    }
    if (!signerName || !signerEmail) {
      appToast('Please provide your name and email.');
      return;
    }
    if (!agreed) {
      appToast('You must agree to the terms.');
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');

      const { data: signedResult, error: signError } = await supabase.rpc('sign_public_contract', {
        p_contract_id: id,
        p_signer_name: signerName,
        p_signer_email: signerEmail,
        p_signature_data: signatureData,
      });
      if (signError) throw signError;
      setSignature(signedResult?.signature || null);

      if (contract.metadata?.auto_quick_link) {
        try {
          const quickPay = await invokeFinanceWorkflow<{ paymentUrl?: string }>('contract-signed-quick-pay', {
            contractId: id,
            signerEmail,
          });
          setQuickPayUrl(quickPay.paymentUrl || '');
        } catch (quickPayError) {
          console.error('Contract signed, but quick payment delivery failed:', quickPayError);
          appToast('Contract signed. The payment email is still being prepared.');
        }
      }

      setMode('completed');
      setContract({ ...contract, status: 'signed', signed_at: new Date().toISOString() });
    } catch (err: any) {
      console.error('Error signing contract:', err);
      appToast('Failed to sign contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Unavailable</h1>
          <p className="text-gray-500 mb-8">{error || 'This contract could not be found.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-gray-900 font-sans flex flex-col md:flex-row">
      <Helmet>
        <title>{contract.title} | Contract</title>
        <meta name="description" content={`Review and sign the contract: ${contract.title}`} />
        <meta property="og:title" content={`${contract.title} | Contract`} />
        <meta property="og:description" content={`Review and sign the contract: ${contract.title}`} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Left Column: Document View */}
      <div className="flex-1 h-screen overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-hide bg-gray-100">
        <div id="contract-content" className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl p-8 md:p-16 mb-8 relative">
          
          {/* Trust Badge */}
          <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Secure Document
          </div>

          {/* Document Header */}
          <div className="mb-16">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{contract.title}</h1>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Prepared by:</span>
                {contract.metadata?.preparer_name || 'Wersee User'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Date:</span>
                {new Date(contract.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span className="uppercase tracking-wider text-xs font-bold">{contract.status}</span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-6">
            {contract.content.map((block: any, index: number) => (
              <div 
                key={block.id}
                className={`transition-colors duration-300 rounded-xl -mx-4 p-4 ${activeSection === index ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}`}
                onMouseEnter={() => setActiveSection(index)}
                onMouseLeave={() => setActiveSection(null)}
              >
                {block.type === 'h1' && <h2 className="text-2xl font-bold text-gray-900 mb-4">{block.value}</h2>}
                {block.type === 'h2' && <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">{block.value}</h3>}
                {block.type === 'p' && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{block.value}</p>}
              </div>
            ))}
          </div>

          {/* Signatures Area */}
          {mode === 'completed' && (
            <div className="mt-24 pt-12 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Signatures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Client Signature</div>
                  <div className="h-24 border-b border-gray-300 mb-4 flex items-end pb-2">
                    {signature?.signature_data ? (
                      <img src={signature.signature_data} alt="Signature" className="max-h-20" />
                    ) : (
                      <span className="font-script text-3xl text-gray-800">{signerName || 'Signed'}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{signerName}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(contract.signed_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Preparer Signature</div>
                  <div className="h-24 border-b border-gray-300 mb-4 flex items-end pb-2">
                    <span className="font-script text-3xl text-gray-800">{contract.metadata?.preparer_name || 'Signed'}</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{contract.metadata?.preparer_name || 'Wersee User'}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(contract.signed_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          {/* Made by Wersee Watermark */}
          <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full shadow-sm text-gray-500 pointer-events-none z-50">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold tracking-wide">MADE BY WERSEE</span>
          </div>
        </div>
      </div>

      {/* Right Column: Interaction Panel */}
      <div className="w-full md:w-96 lg:w-[400px] h-screen bg-white border-l border-gray-200 flex flex-col shadow-2xl z-10 shrink-0">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <FileSignature className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Contract Actions</h2>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-500" 
                 style={{ width: mode === 'review' ? '33%' : mode === 'signing' ? '66%' : '100%' }} />
            
            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${mode === 'review' || mode === 'signing' || mode === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${mode === 'signing' || mode === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${mode === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>Review</span>
            <span>Sign</span>
            <span>Done</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {mode === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Please review the document</h3>
                  <p className="text-sm text-gray-500">Read through the contract on the left. If everything looks good, you can proceed to sign.</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setMode('signing')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    Continue to Sign
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setMode('feedback')}
                    className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Changes
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => setMode('review')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-gray-900">Request Changes</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your comments</label>
                    <textarea 
                      className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      placeholder="Describe what needs to be changed..."
                    />
                  </div>
                  <button className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors">
                    Submit Feedback
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'signing' && (
              <motion.div
                key="signing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => setMode('review')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-gray-900">Sign Contract</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Signature</label>
                      <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">Clear</button>
                    </div>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                      <SignaturePad 
                        ref={sigCanvas}
                        canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 leading-relaxed">
                      I agree to be legally bound by this agreement and the terms contained within it.
                    </span>
                  </label>

                  <button 
                    onClick={handleSign}
                    disabled={submitting || !agreed || !signerName || !signerEmail}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign & Complete'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 pt-8"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Contract Signed</h3>
                  <p className="text-gray-500">Thank you. The agreement has been successfully signed and recorded.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Signed by</span>
                    <span className="font-medium text-gray-900">{signerName || 'You'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{new Date(contract.signed_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download PDF Copy
                </button>
                {quickPayUrl && (
                  <a
                    href={quickPayUrl}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to secure payment
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
