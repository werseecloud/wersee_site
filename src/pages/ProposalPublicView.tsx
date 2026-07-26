import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileSignature, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Download,
  Clock,
  Building2,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import { appToast } from '@/lib/feedback';
export const ProposalPublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [proposal, setProposal] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<'accepted' | 'rejected' | null>(null);

  // Feedback form state
  const [newFeedback, setNewFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProposalData();
    }
  }, [id]);

  const fetchProposalData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch Proposal & Business Info
      const { data: publicPayload, error: proposalError } = await supabase.rpc('get_public_proposal', { p_proposal_id: id });
      const proposalData = publicPayload?.proposal
        ? { ...publicPayload.proposal, business: publicPayload.business, client: publicPayload.client }
        : null;

      if (proposalError) throw proposalError;
      if (!proposalData) throw new Error('Proposal not found');

      setProposal(proposalData);

      // Update status to viewed if it was just sent
      if (proposalData.status === 'sent') {
        void (async () => {
          const { error: viewErr } = await supabase.rpc('track_proposal_view_public', { p_proposal_id: id });
          if (viewErr) {
            console.warn('Could not track proposal view:', viewErr);
          }
        })();
        setProposal({ ...proposalData, status: 'viewed' });
      }

      // 2. Fetch Deliverables
      setDeliverables(publicPayload.deliverables || []);

      // 3. Fetch Milestones
      setMilestones(publicPayload.milestones || []);

      // 4. Fetch Feedback
      setFeedback(publicPayload.feedback || []);

    } catch (err: any) {
      console.error('Error fetching proposal:', err);
      setError(err.message || 'Failed to load proposal');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const element = document.getElementById('proposal-content');
      if (!element) throw new Error('Proposal content not found');

      // Add a temporary class to ensure light theme for PDF
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
      pdf.save(`Proposal_${proposal.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      appToast('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'accepted' | 'rejected') => {
    try {
      setIsUpdatingStatus(newStatus);
      const { data, error } = await supabase.rpc('respond_to_proposal_public', {
        p_proposal_id: id,
        p_status: newStatus
      });

      if (error) throw error;
      
      setProposal({ ...proposal, ...(data || {}), status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      appToast('Failed to update proposal status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (!proposal || searchParams.get('download') !== '1') return;
    const timer = window.setTimeout(() => void generatePdf(), 250);
    return () => window.clearTimeout(timer);
  }, [proposal?.id, searchParams]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    try {
      setIsSubmittingFeedback(true);
      const { data, error } = await supabase.rpc('submit_public_proposal_feedback', { p_proposal_id: id, p_message: newFeedback });

      if (error) throw error;

      setFeedback([data, ...feedback]);
      setNewFeedback('');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      appToast('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Proposal Not Found</h1>
        <p className="text-gray-400 max-w-md">
          {error || "The proposal you're looking for doesn't exist or has been removed."}
        </p>
      </div>
    );
  }

  const isEditable = proposal.status === 'sent' || proposal.status === 'viewed';
  const termsText = proposal.terms || proposal.terms_conditions;

  return (
    <>
      <Helmet>
        <title>{proposal.title} - Proposal</title>
        <meta name="description" content={`Proposal for ${proposal.client?.name || 'Client'} from ${proposal.business?.name || 'Business'}`} />
        <meta property="og:title" content={`${proposal.title} - Proposal`} />
        <meta property="og:description" content={`Proposal for ${proposal.client?.name || 'Client'} from ${proposal.business?.name || 'Business'}`} />
        <meta property="og:type" content="article" />
        {/* If there's a way to generate a thumbnail URL, it would go here. For now, we use a placeholder or business logo if available. */}
        {proposal.business?.logo_url && (
          <meta property="og:image" content={proposal.business.logo_url} />
        )}
      </Helmet>
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-emerald-500/30" id="proposal-content">
      {/* Top Bar - Hidden in PDF */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {proposal.business?.logo_url ? (
              <img src={proposal.business.logo_url} alt={proposal.business.name} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            <span className="font-semibold">{proposal.business?.name || 'Business'}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={generatePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
            
            {isEditable && (
              <>
                <button 
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={!!isUpdatingStatus}
                  className="px-4 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus === 'rejected' ? 'Declining...' : 'Decline'}
                </button>
                <button 
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={!!isUpdatingStatus}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isUpdatingStatus === 'accepted' ? 'Accepting...' : 'Accept Proposal'}
                </button>
              </>
            )}
            {proposal.status === 'accepted' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Accepted
              </div>
            )}
            {proposal.status === 'rejected' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium border border-red-500/20">
                <XCircle className="w-4 h-4" />
                Declined
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Proposal Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover Page Header */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
          >
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-sky-400 to-white" />
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                <div className="space-y-4">
                  {proposal.business?.logo_url && (
                    <img src={proposal.business.logo_url} alt={proposal.business.name} className="h-12 object-contain" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">{proposal.title}</h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
                      Proposal #{proposal.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                
                <div className="text-left sm:text-right space-y-1">
                  <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Total Investment</div>
                  <div className="text-4xl font-bold text-emerald-400">
                    {proposal.currency} {proposal.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Issued on {new Date(proposal.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prepared For</h3>
                  <div className="space-y-1">
                    <div className="font-bold text-lg">{proposal.client?.name}</div>
                    {proposal.client?.company?.name && (
                      <div className="text-gray-400">{proposal.client.company.name}</div>
                    )}
                    {proposal.client?.email && (
                      <div className="text-sm text-gray-500">{proposal.client.email}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prepared By</h3>
                  <div className="space-y-1">
                    <div className="font-bold text-lg">{proposal.business?.name}</div>
                    {proposal.business?.email && (
                      <div className="text-sm text-gray-500">{proposal.business.email}</div>
                    )}
                    {proposal.business?.phone && (
                      <div className="text-sm text-gray-500">{proposal.business.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {isEditable && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Ready to approve?</h2>
                  <p className="text-sm text-emerald-100/70 mt-1">
                    Accepting notifies {proposal.business?.name || 'the business'} immediately so they can send the invoice from their dashboard.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={!!isUpdatingStatus}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {isUpdatingStatus === 'accepted' ? 'Accepting...' : 'Accept and notify'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.section>
          )}

          {/* Executive Summary Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111111] border border-white/10 rounded-2xl p-8 sm:p-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">01</span>
              Executive Summary
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                {proposal.description}
              </p>
            </div>
          </motion.section>

          {/* Deliverables Section */}
          {deliverables.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111111] border border-white/10 rounded-2xl p-8 sm:p-12"
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">02</span>
                Scope of Work & Pricing
              </h2>
              
              <div className="space-y-6">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="space-y-3">
                  {deliverables.map((item, index) => (
                    <div key={index} className="deliverable-row grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-white/5 rounded-xl border border-white/5 items-center">
                      <div className="col-span-1 sm:col-span-6">
                        <h4 className="font-bold text-white">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 text-left sm:text-center text-sm text-gray-300">
                        <span className="sm:hidden text-gray-500 mr-2">Qty:</span>
                        {item.quantity || 1}
                      </div>
                      <div className="col-span-1 sm:col-span-2 text-left sm:text-right text-sm text-gray-300">
                        <span className="sm:hidden text-gray-500 mr-2">Unit Price:</span>
                        {proposal.currency} {Number(item.unit_price ?? item.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-1 sm:col-span-2 text-left sm:text-right font-bold text-white">
                        <span className="sm:hidden text-gray-500 mr-2">Total:</span>
                        {proposal.currency} {Number(item.total_price ?? item.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-section flex justify-end pt-6">
                  <div className="text-right space-y-1">
                    <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Grand Total</div>
                    <div className="text-3xl font-bold text-white">
                      {proposal.currency} {proposal.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Milestones Section */}
          {milestones.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111111] border border-white/10 rounded-2xl p-8 sm:p-12"
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">03</span>
                Payment Schedule
              </h2>
              
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:via-white/10 before:to-transparent">
                {milestones.map((item, index) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#111111] text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Clock className="w-4 h-4" />
                    </div>
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-bold text-white">{item.title}</div>
                        <time className="font-mono text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {proposal.currency} {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </time>
                      </div>
                      {item.due_date && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(item.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      )}
                      {item.description && (
                        <div className="text-sm text-gray-400 mt-2">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Terms Section */}
          {termsText && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#111111] border border-white/10 rounded-2xl p-8 sm:p-12"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">04</span>
                Terms & Conditions
              </h2>
              <div className="prose prose-sm prose-invert max-w-none text-gray-400 whitespace-pre-wrap leading-relaxed">
                {termsText}
              </div>
            </motion.section>
          )}

          {/* Footer - Only visible in PDF */}
          <div className="hidden pdf-mode:block pt-12 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>© {new Date().getFullYear()} {proposal.business?.name}. All rights reserved.</p>
            <p className="mt-1">This proposal is valid for 30 days from the date of issue.</p>
          </div>
        </div>

        {/* Sidebar - Hidden in PDF */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit" id="feedback-section">
          {/* Status Card */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Current Status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                proposal.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-500' :
                proposal.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {proposal.status === 'accepted' ? <CheckCircle2 className="w-5 h-5" /> :
                 proposal.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                 <Clock className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold capitalize">{proposal.status}</div>
                <div className="text-xs text-gray-500">Last updated {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Feedback/Comments */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111111] border border-white/10 rounded-2xl flex flex-col h-[500px]"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="font-medium text-white">Questions & Feedback</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {feedback.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Have a question or need changes?<br/>Leave a comment below.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col ${item.is_from_client ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-gray-400">
                        {item.is_from_client ? 'You' : proposal.business?.name}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                        item.is_from_client 
                          ? 'bg-emerald-500 text-white rounded-tr-sm' 
                          : 'bg-white/10 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                        {item.message || item.comment}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSubmitFeedback} className="flex gap-2">
                <input
                  data-mobile-keyboard-target="chat"
                  type="text"
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  type="submit"
                  disabled={!newFeedback.trim() || isSubmittingFeedback}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
    </>
  );
};
