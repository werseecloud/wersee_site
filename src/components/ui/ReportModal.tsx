import React, { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  listingId?: string;
  title?: string;
}

const REPORT_REASONS = [
  { label: 'Illegal product or service', category: 'illegal_product', hint: 'Content or an offer that may break the law.' },
  { label: 'Scam or fraud', category: 'scam_or_fraud', hint: 'Deceptive payments, impersonation, or dishonest claims.' },
  { label: 'Unsafe product', category: 'unsafe_product', hint: 'A product or service that may cause harm.' },
  { label: 'Misleading information', category: 'misleading_information', hint: 'False descriptions, credentials, or outcomes.' },
  { label: 'Harassment or bullying', category: 'hate_or_harassment', hint: 'Threats, targeted abuse, or unwanted conduct.' },
  { label: 'Child safety concern', category: 'child_safety', hint: 'Anything that may put a minor at risk.' },
  { label: 'Privacy violation', category: 'privacy_violation', hint: 'Personal data shared without permission.' },
  { label: 'Prohibited goods', category: 'prohibited_goods', hint: 'Items or services not allowed on Wersee.' },
  { label: 'Intellectual property violation', category: 'ip_infringement', hint: 'Copyright, trademark, or other rights concerns.' },
  { label: 'Other legal concern', category: 'other_legal_concern', hint: 'Another issue that needs a trust review.' },
] as const;

const ALLOWED_EVIDENCE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
]);
const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  listingId,
  title = 'Report',
}) => {
  const titleId = useId();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [error, setError] = useState('');

  const selectedReason = useMemo(
    () => REPORT_REASONS.find((item) => item.label === reason),
    [reason],
  );
  const isDsaNotice = reason === 'Illegal product or service'
    || reason === 'Intellectual property violation';

  const reset = () => {
    setStep(1);
    setReason('');
    setDescription('');
    setLegalBasis('');
    setEvidence(null);
    setCaseId('');
    setError('');
  };

  const close = () => {
    if (isSubmitting) return;
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }

    setContentUrl(window.location.href);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  const validateStep = (targetStep: number) => {
    setError('');
    if (targetStep >= 2 && !reason) {
      setError('Choose the reason that best describes the issue.');
      return false;
    }
    if (targetStep >= 3 && isDsaNotice && description.trim().length < 20) {
      setError('Add at least 20 characters explaining why this content may be illegal.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step + 1)) return;
    setStep((current) => Math.min(3, current + 1));
  };

  const handleEvidence = (file?: File) => {
    setError('');
    if (!file) {
      setEvidence(null);
      return;
    }
    if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
      setError('Use a PNG, JPG, WebP, PDF, or text file.');
      return;
    }
    if (file.size > MAX_EVIDENCE_SIZE) {
      setError('Evidence files can be up to 10 MB.');
      return;
    }
    setEvidence(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    if (!validateStep(3) || !selectedReason) return;

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to report.');

      let dsaNoticeId: string | null = null;
      const evidenceReferences: string[] = [];
      if (evidence) {
        const safeName = evidence.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('trust-evidence')
          .upload(path, evidence, { upsert: false, contentType: evidence.type });
        if (uploadError) throw uploadError;
        evidenceReferences.push(`trust-evidence:${path}`);
      }

      if (isDsaNotice) {
        const { data: notice, error: noticeError } = await supabase
          .from('dsa_notices')
          .insert({
            reporter_id: user.id,
            reported_user_id: reportedUserId || null,
            listing_id: listingId || null,
            notice_type: reason === 'Intellectual property violation' ? 'ip_infringement' : 'illegal_product',
            reason,
            description: description.trim(),
            legal_basis: legalBasis.trim() || null,
            content_url: contentUrl.trim() || null,
            status: 'received',
          })
          .select('id')
          .single();
        if (noticeError) throw noticeError;
        dsaNoticeId = notice?.id || null;
      }

      const { data: report, error: trustReportError } = await supabase
        .from('content_reports')
        .insert({
          user_id: user.id,
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          content_type: listingId ? 'listing' : reportedUserId ? 'profile' : 'page',
          content_id: listingId || reportedUserId || contentUrl,
          category: selectedReason.category,
          explanation: description.trim() || reason,
          evidence_references: evidenceReferences,
          content_snapshot: {
            url: contentUrl.trim() || null,
            title,
            legal_basis: legalBasis.trim() || null,
          },
          jurisdiction: null,
          policy_version: 'trust-core-2026-07-22',
          created_by: user.id,
        })
        .select('case_id')
        .single();
      if (trustReportError) throw trustReportError;

      const { error: legacyError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          listing_id: listingId || null,
          reason,
          description: description.trim(),
          report_type: isDsaNotice ? 'dsa_notice' : 'general',
          dsa_notice_id: dsaNoticeId,
        });
      if (legacyError) console.warn('Legacy report mirror failed', legacyError);

      setCaseId(report.case_id);
    } catch (submissionError) {
      console.error('Error submitting report:', submissionError);
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal((
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close report dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#0b0b0c] shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-[2rem]"
          >
            <header className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-[#0b0b0c]/95 px-5 py-5 backdrop-blur-xl sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 ring-1 ring-red-500/20">
                    <ShieldCheck className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Trust & Safety</p>
                    <h2 id={titleId} className="truncate text-xl font-black tracking-tight text-white">{title}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={isSubmitting}
                  className="rounded-full bg-white/5 p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!caseId && (
                <div className="mt-5 grid grid-cols-3 gap-2" aria-label={`Step ${step} of 3`}>
                  {['Reason', 'Details', 'Review'].map((label, index) => {
                    const number = index + 1;
                    return (
                      <div key={label}>
                        <div className={`h-1.5 rounded-full transition-colors ${number <= step ? 'bg-red-500' : 'bg-white/10'}`} />
                        <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${number === step ? 'text-white' : 'text-gray-600'}`}>
                          {number}. {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </header>

            {caseId ? (
              <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-14 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-500/10 ring-1 ring-emerald-500/25">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="mt-7 text-2xl font-black text-white">Report submitted</h3>
                <p className="mt-3 max-w-md leading-relaxed text-gray-400">Your report is safely recorded and ready for review by Wersee Trust & Safety.</p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Case reference</p>
                  <p className="mt-1 font-mono text-sm font-bold text-white">{caseId}</p>
                </div>
                <button type="button" onClick={close} className="mt-8 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-black transition-transform active:scale-95">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
                  {error && (
                    <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {step === 1 && (
                    <section>
                      <h3 className="text-lg font-black text-white">What happened?</h3>
                      <p className="mt-1 text-sm text-gray-500">Choose the closest match. You can add context in the next step.</p>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {REPORT_REASONS.map((item) => {
                          const selected = reason === item.label;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setReason(item.label);
                                setError('');
                              }}
                              className={`group flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                                selected
                                  ? 'border-red-500/50 bg-red-500/10 ring-1 ring-red-500/20'
                                  : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-red-400 bg-red-500 text-white' : 'border-white/20'}`}>
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                              <span>
                                <span className="block text-sm font-bold text-white">{item.label}</span>
                                <span className="mt-1 block text-xs leading-relaxed text-gray-500">{item.hint}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {step === 2 && (
                    <section className="space-y-5">
                      <div>
                        <h3 className="text-lg font-black text-white">Help us understand</h3>
                        <p className="mt-1 text-sm text-gray-500">Share only information that is relevant to this report.</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Selected reason</p>
                        <p className="mt-1 font-bold text-white">{reason}</p>
                      </div>
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                          Details {isDsaNotice ? '(required)' : '(optional)'}
                        </span>
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value.slice(0, 2000))}
                          rows={6}
                          placeholder="Describe what you saw, when it happened, and why it concerns you."
                          className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white outline-none transition focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10"
                        />
                        <span className="mt-2 block text-right text-[10px] font-bold text-gray-600">{description.length} / 2000</span>
                      </label>

                      {isDsaNotice && (
                        <div className="space-y-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
                          <div className="flex gap-3">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                            <p className="text-xs leading-relaxed text-amber-100/70">This reason creates a formal notice-and-action record.</p>
                          </div>
                          <input
                            type="url"
                            value={contentUrl}
                            onChange={(event) => setContentUrl(event.target.value)}
                            placeholder="URL of the content"
                            className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-amber-400/40"
                          />
                          <input
                            value={legalBasis}
                            onChange={(event) => setLegalBasis(event.target.value.slice(0, 300))}
                            placeholder="Law, right, or rule involved (optional)"
                            className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-amber-400/40"
                          />
                        </div>
                      )}

                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="rounded-xl bg-white/5 p-2.5"><Paperclip className="h-4 w-4 text-gray-300" /></span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-white">{evidence?.name || 'Attach evidence'}</span>
                            <span className="mt-0.5 block text-xs text-gray-600">PNG, JPG, WebP, PDF, or text · max 10 MB</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-black uppercase tracking-widest text-red-400">{evidence ? 'Change' : 'Choose'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                          className="sr-only"
                          onChange={(event) => handleEvidence(event.target.files?.[0])}
                        />
                      </label>
                    </section>
                  )}

                  {step === 3 && (
                    <section>
                      <h3 className="text-lg font-black text-white">Review your report</h3>
                      <p className="mt-1 text-sm text-gray-500">Check the details before sending this to Trust & Safety.</p>
                      <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                        <div className="p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Reason</p>
                          <p className="mt-2 font-bold text-white">{reason}</p>
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Details</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{description.trim() || 'No additional details provided.'}</p>
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Evidence</p>
                          <p className="mt-2 text-sm text-gray-300">{evidence?.name || 'No attachment'}</p>
                        </div>
                        {isDsaNotice && (
                          <div className="p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Formal notice URL</p>
                            <p className="mt-2 break-all text-sm text-gray-300">{contentUrl}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <p className="text-xs leading-relaxed text-emerald-100/70">Your identity and evidence are only available to authorized reviewers under Wersee’s trust policies.</p>
                      </div>
                    </section>
                  )}
                </div>

                <footer className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#0b0b0c]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
                  <button
                    type="button"
                    onClick={step === 1 ? close : () => {
                      setError('');
                      setStep((current) => Math.max(1, current - 1));
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    {step > 1 && <ArrowLeft className="h-4 w-4" />}
                    {step === 1 ? 'Cancel' : 'Back'}
                  </button>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition-transform active:scale-95"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Submit report'}
                    </button>
                  )}
                </footer>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  ), document.body);
};
