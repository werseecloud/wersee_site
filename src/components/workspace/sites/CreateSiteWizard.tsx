import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, BarChart3, Bot, Check, CheckCircle2, CloudUpload, Code2, Copy, CreditCard,
  FileArchive, FileCode2, FolderOpen, Gauge, Globe2, Image as ImageIcon, Loader2, Monitor, Pause,
  LogIn, Play, RefreshCw, Rocket, SearchCheck, ShoppingBag, Smartphone, Sparkles, Tablet, X, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { appToast } from '@/lib/feedback';
import { normalizeSiteSlug } from '@/lib/siteSlug';
import { sitesRequest, uploadSiteSources, type SiteUploadDestination } from '@/services/sitesService';

type Business = { id: string; name: string; slug?: string | null; logo_url?: string | null };
type Site = {
  id: string; business_id: string; name: string; slug: string; description?: string | null; icon_url?: string | null;
  spa_fallback: boolean; analytics_enabled: boolean; indexing_enabled?: boolean; ai_text_enhancement_enabled?: boolean;
  indexing_status?: string; last_indexing_requested_at?: string | null; public_url?: string; site_type: string;
  marketplace_listing_id?: string | null; marketplace_published_at?: string | null;
  directory_listed?: boolean;
};
type ValidationReport = {
  detectedRoot: string | null; validRoots: string[]; totalFiles: number; totalSize: number; htmlPages: number;
  javascriptFiles: number; cssFiles: number; imageFiles: number; missingReferencedAssets: string[];
  blockedFiles: string[]; warnings: Array<{ code: string; message: string; path?: string }>;
  errors: Array<{ code: string; message: string; path?: string }>; detectedSpa: boolean; detectedFramework: string | null;
  faviconStatus: string; analyticsInjectionStatus: string; werseeManifestStatus: string;
  seo: { indexingEnabled: boolean; sitemapGenerated: boolean; robotsGenerated: boolean; indexNowPrepared: boolean; indexedPages: number };
  aiTextEnhancement: { status: 'disabled' | 'completed' | 'failed'; changedTextNodes: number; consideredTextNodes: number; filesChanged: number };
  integrations: {
    candidates: Array<{ id: string; kind: 'quick_pay' | 'wersee_oauth'; sourcePath: string; sourceKind: 'html' | 'javascript'; label: string; detectedAmount: number | null; detectedCurrency: string | null; confidence: number }>;
    codeFilesScanned: number;
    visualDomReviewRequired: boolean;
    applied?: string[];
  };
  publishable: boolean; guidance?: string;
};

type AiComputerRun = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  progress: number;
  message: string;
  result?: {
    summary?: string;
    findings?: Array<{ severity: 'info' | 'warning' | 'blocking'; title: string; detail: string }>;
  };
  errorCode?: string | null;
  supportReference?: string;
};

type AiComputerSnapshot = {
  id: string;
  viewport: 'desktop' | 'mobile' | 'element';
  sequence: number;
  width: number;
  height: number;
  url: string;
  createdAt: string;
};

const steps = [
  { number: 1, label: 'Identity' },
  { number: 2, label: 'Upload' },
  { number: 3, label: 'Validation' },
  { number: 4, label: 'Report' },
  { number: 5, label: 'Preview' },
  { number: 6, label: 'Publish' },
];

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
};

const StepShell: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }} className="space-y-7">
    <div className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#101012]/95 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.045)] md:px-10 md:py-10">
      <div className="pointer-events-none absolute inset-x-20 -top-24 h-40 rounded-full bg-blue-500/[.09] blur-[70px]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/38"><Sparkles className="h-3.5 w-3.5 text-blue-400" /> Wersee Sites</span>
        <h2 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-.045em] text-white md:text-[2.7rem]">{title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/48 md:text-[15px]">{description}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

export const CreateSiteWizard: React.FC<{
  businesses: Business[];
  defaultSlug?: string | null;
  existingSite?: Site | null;
  onClose: () => void;
  onComplete: (site: Site) => void;
}> = ({ businesses, defaultSlug, existingSite, onClose, onComplete }) => {
  const [step, setStep] = useState(existingSite ? 2 : 1);
  const [site, setSite] = useState<Site | null>(existingSite || null);
  const [name, setName] = useState(existingSite?.name || '');
  const [slug, setSlug] = useState(existingSite?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(existingSite));
  const [description, setDescription] = useState(existingSite?.description || '');
  const [businessId, setBusinessId] = useState(existingSite?.business_id || businesses[0]?.id || '');
  const [icon, setIcon] = useState<File | null>(null);
  const [slugState, setSlugState] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugReason, setSlugReason] = useState('');
  const [sourceType, setSourceType] = useState<'html' | 'zip' | 'folder' | 'wersee_storage'>('html');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; relativePath: string }>>([]);
  const [storageZips, setStorageZips] = useState<Array<{ path: string; name: string; size: number }>>([]);
  const [storagePath, setStoragePath] = useState('');
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [destination, setDestination] = useState<SiteUploadDestination | null>(null);
  const [release, setRelease] = useState<any>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [acceptedWarnings, setAcceptedWarnings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ uploadedBytes: 0, totalBytes: 0, remainingFiles: 0, speedBytesPerSecond: 0 });
  const [uploadPaused, setUploadPaused] = useState(false);
  const [preview, setPreview] = useState<{ url: string; expiresAt: number } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [publishJob, setPublishJob] = useState<any>(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [publishToMarketplace, setPublishToMarketplace] = useState(Boolean(existingSite?.marketplace_published_at));
  const [indexingEnabled, setIndexingEnabled] = useState(existingSite?.indexing_enabled !== false);
  const [advancedAnalyticsEnabled, setAdvancedAnalyticsEnabled] = useState(existingSite?.analytics_enabled !== false);
  const [aiTextEnhancementEnabled, setAiTextEnhancementEnabled] = useState(Boolean(existingSite?.ai_text_enhancement_enabled));
  const [aiLocale, setAiLocale] = useState('nl');
  const [aiTone, setAiTone] = useState<'clear' | 'professional' | 'friendly' | 'confident' | 'concise'>('clear');
  const [directoryListed, setDirectoryListed] = useState(Boolean(existingSite?.directory_listed));
  const [quickPayEnabled, setQuickPayEnabled] = useState(false);
  const [quickPayCandidateId, setQuickPayCandidateId] = useState('');
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayCurrency, setQuickPayCurrency] = useState<'eur' | 'usd'>('eur');
  const [quickPayPath, setQuickPayPath] = useState('pay');
  const [oauthEnabled, setOauthEnabled] = useState(false);
  const [oauthCandidateId, setOauthCandidateId] = useState('');
  const [oauthPlacement, setOauthPlacement] = useState<'existing' | 'header' | 'footer' | 'selector'>('existing');
  const [oauthSelector, setOauthSelector] = useState('');
  const [oauthPath, setOauthPath] = useState('auth');
  const [integrationsApplied, setIntegrationsApplied] = useState(false);
  const [computerRun, setComputerRun] = useState<AiComputerRun | null>(null);
  const [computerEvents, setComputerEvents] = useState<Array<{ id: number; stage: string; progress: number; public_message: string; event_type: string }>>([]);
  const [computerSnapshots, setComputerSnapshots] = useState<AiComputerSnapshot[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slugTouched && name) setSlug(normalizeSiteSlug(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!existingSite && !name && defaultSlug) {
      setName(defaultSlug);
      setSlug(normalizeSiteSlug(defaultSlug));
    }
  }, [defaultSlug, existingSite, name]);

  useEffect(() => {
    if (existingSite || slug.length < 3) { setSlugState('idle'); return; }
    setSlugState('checking');
    const timer = window.setTimeout(async () => {
      try {
        const result = await sitesRequest<{ available: boolean; reason?: string }>(`/slug-availability?slug=${encodeURIComponent(slug)}`);
        setSlugState(result.available ? 'available' : 'unavailable');
        setSlugReason(result.reason || '');
      } catch (error) {
        setSlugState('unavailable');
        setSlugReason(error instanceof Error ? error.message : 'Availability could not be checked.');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [slug, existingSite]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const totalBytes = useMemo(() => selectedFiles.reduce((sum, item) => sum + item.file.size, 0), [selectedFiles]);
  const iconPreviewUrl = useMemo(() => icon ? URL.createObjectURL(icon) : null, [icon]);
  const canContinueIdentity = Boolean(name.trim() && businessId && slugState === 'available');

  useEffect(() => () => {
    if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
  }, [iconPreviewUrl]);

  const createSite = async () => {
    if (site) return site;
    setBusy(true);
    try {
      const created = await sitesRequest<{ site: Site }>('', { method: 'POST', body: JSON.stringify({ businessId, name, slug, description, siteType: 'uploaded_static' }) });
      let nextSite = created.site;
      if (icon) {
        const { data: userData } = await supabase.auth.getUser();
        const extension = icon.name.split('.').pop()?.toLowerCase() || 'png';
        const iconPath = `${userData.user?.id}/${nextSite.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('site-icons').upload(iconPath, icon, { contentType: icon.type, upsert: false });
        if (error) appToast('The site was created, but its icon could not be uploaded.', 'warning');
        else {
          const iconUrl = supabase.storage.from('site-icons').getPublicUrl(iconPath).data.publicUrl;
          nextSite = (await sitesRequest<{ site: Site }>(`/${nextSite.id}`, { method: 'PATCH', body: JSON.stringify({ iconUrl }) })).site;
        }
      }
      setSite(nextSite);
      setStep(2);
      return nextSite;
    } finally { setBusy(false); }
  };

  const chooseFiles = (files: FileList | null, folder: boolean) => {
    if (!files?.length) return;
    const items = [...files].map((file) => ({ file, relativePath: folder ? ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name) : file.name }));
    setSelectedFiles(items);
    setUploadId(null); setDestination(null); setRelease(null); setReport(null); setUploadPaused(false);
  };

  const chooseHtmlFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSourceType('html');
    setSelectedFiles([{ file, relativePath: 'index.html' }]);
    setUploadId(null); setDestination(null); setRelease(null); setReport(null); setUploadPaused(false);
  };

  const loadStorageZips = async () => {
    setSourceType('wersee_storage'); setLoadingStorage(true);
    try { setStorageZips((await sitesRequest<{ files: Array<{ path: string; name: string; size: number }> }>('/storage-zips')).files); }
    finally { setLoadingStorage(false); }
  };

  const runPrivateComputer = async (targetSite: Site, targetRelease: any) => {
    const started = await sitesRequest<{ run: any }>(`/${targetSite.id}/ai-computer/runs`, {
      method: 'POST',
      body: JSON.stringify({ releaseId: targetRelease.id }),
    });
    setComputerRun({
      id: started.run.id,
      status: started.run.status,
      stage: started.run.stage,
      progress: started.run.progress,
      message: started.run.public_message,
    });
    const deadline = Date.now() + 8 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      const detail = await sitesRequest<{
        run: AiComputerRun;
        events: Array<{ id: number; stage: string; progress: number; public_message: string; event_type: string }>;
        snapshots: AiComputerSnapshot[];
      }>(`/${targetSite.id}/ai-computer/runs/${started.run.id}`);
      setComputerRun(detail.run);
      setComputerEvents(detail.events);
      setComputerSnapshots(detail.snapshots);
      if (detail.run.status === 'completed') return detail.run;
      if (detail.run.status === 'failed' || detail.run.status === 'cancelled') {
        throw new Error(`The private computer stopped safely. Reference: ${detail.run.supportReference || 'unavailable'}`);
      }
    }
    throw new Error('The private computer is still working. You can reopen this release to view its durable progress.');
  };

  const runValidation = async (targetSite: Site, targetRelease: any, root: string | null = null) => {
    setBusy(true); setStep(3);
    try {
      const result = await sitesRequest<{ report: ValidationReport; release: any }>(`/${targetSite.id}/validate`, {
        method: 'POST',
        body: JSON.stringify({
          releaseId: targetRelease.id,
          selectedRoot: root,
          aiTextEnhancement: {
            enabled: aiTextEnhancementEnabled,
            locale: aiLocale,
            tone: aiTone,
          },
        }),
      });
      setReport(result.report); setRelease({ ...targetRelease, ...result.release });
      const detectedPay = result.report.integrations?.candidates.find((candidate) => candidate.kind === 'quick_pay');
      const detectedLogin = result.report.integrations?.candidates.find((candidate) => candidate.kind === 'wersee_oauth');
      if (detectedPay) {
        setQuickPayCandidateId(detectedPay.id);
        if (detectedPay.detectedAmount != null) setQuickPayAmount(String(detectedPay.detectedAmount));
        if (detectedPay.detectedCurrency === 'usd') setQuickPayCurrency('usd');
      }
      if (detectedLogin) setOauthCandidateId(detectedLogin.id);
      setIntegrationsApplied(false);
      setSelectedRoot(result.report.detectedRoot);
      setAcceptedWarnings(false);
      if (result.report.publishable) {
        try {
          await runPrivateComputer(targetSite, { ...targetRelease, ...result.release });
        } catch (error) {
          appToast(error instanceof Error ? error.message : 'The private computer could not finish.', 'warning');
        }
      }
      setStep(4);
    } catch (error) {
      setStep(2);
      appToast(error instanceof Error ? error.message : 'Validation failed.', 'error');
    } finally { setBusy(false); }
  };

  const uploadAndValidate = async (resume = false) => {
    let targetSite = site || await createSite();
    if (!targetSite) return;
    if (sourceType !== 'wersee_storage' && !selectedFiles.length) { appToast('Choose a ZIP archive or website folder first.', 'error'); return; }
    if (sourceType === 'wersee_storage' && !storagePath) { appToast('Choose a ZIP from Wersee Storage first.', 'error'); return; }
    setBusy(true); setUploadPaused(false);
    try {
      targetSite = (await sitesRequest<{ site: Site }>(`/${targetSite.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          indexingEnabled,
          analyticsEnabled: advancedAnalyticsEnabled,
          aiTextEnhancementEnabled,
          directoryListed,
        }),
      })).site;
      setSite(targetSite);
      let currentUploadId = resume ? uploadId : null;
      let currentDestination = resume ? destination : null;
      if (!currentUploadId || !currentDestination) {
        const uploadResponse = await sitesRequest<{ upload: any; destination: SiteUploadDestination }>(`/${targetSite.id}/uploads`, {
          method: 'POST',
          body: JSON.stringify({
            sourceType: sourceType === 'html' ? 'folder' : sourceType,
            originalName: sourceType === 'wersee_storage' ? storageZips.find((item) => item.path === storagePath)?.name : selectedFiles[0]?.file.name,
            totalBytes: sourceType === 'wersee_storage' ? storageZips.find((item) => item.path === storagePath)?.size || 0 : totalBytes,
            fileCount: sourceType === 'folder' ? selectedFiles.length : 1,
            storagePath: sourceType === 'wersee_storage' ? storagePath : undefined,
          }),
        });
        currentUploadId = uploadResponse.upload.id;
        currentDestination = uploadResponse.destination;
        setUploadId(currentUploadId); setDestination(currentDestination);
      }
      if (sourceType !== 'wersee_storage') {
        const controller = new AbortController(); abortRef.current = controller;
        await uploadSiteSources(selectedFiles, currentDestination, setUploadProgress, controller.signal);
      }
      const releaseResponse = await sitesRequest<{ release: any }>(`/${targetSite.id}/releases`, {
        method: 'POST', body: JSON.stringify({ uploadId: currentUploadId }),
      });
      setRelease(releaseResponse.release);
      await runValidation(targetSite, releaseResponse.release);
    } catch (error: any) {
      if (error?.code === 'SITE_UPLOAD_CANCELLED') {
        setUploadPaused(true);
        appToast('Upload paused. You can resume from the last completed chunk.', 'info');
      } else appToast(error instanceof Error ? error.message : 'The upload failed.', 'error');
    } finally { setBusy(false); abortRef.current = null; }
  };

  const openPreview = async () => {
    if (!site || !release) return;
    setBusy(true);
    try {
      const result = await sitesRequest<{ url: string; expiresAt: number }>(`/${site.id}/preview-token?releaseId=${release.id}`);
      setPreview(result); setStep(5);
    } finally { setBusy(false); }
  };

  const applyIntegrations = async () => {
    if (!site || !release || (!quickPayEnabled && !oauthEnabled)) return;
    const amount = Number(quickPayAmount);
    if (quickPayEnabled && (!quickPayCandidateId || !Number.isFinite(amount) || amount <= 0)) {
      appToast('Choose a detected Pay button and confirm its price first.', 'warning');
      return;
    }
    if (oauthEnabled && oauthPlacement === 'existing' && !oauthCandidateId) {
      appToast('Choose a detected login button or another placement.', 'warning');
      return;
    }
    setBusy(true);
    try {
      const result = await sitesRequest<{ applied: string[]; report: ValidationReport }>(`/${site.id}/integrations/apply`, {
        method: 'POST',
        body: JSON.stringify({
          releaseId: release.id,
          quickPay: quickPayEnabled ? {
            candidateId: quickPayCandidateId,
            customPath: normalizeSiteSlug(quickPayPath),
            confirmedAmount: amount,
            currency: quickPayCurrency,
          } : undefined,
          oauth: oauthEnabled ? {
            candidateId: oauthPlacement === 'existing' ? oauthCandidateId : undefined,
            placement: oauthPlacement,
            targetSelector: oauthPlacement === 'selector' ? oauthSelector : undefined,
            customPath: normalizeSiteSlug(oauthPath),
          } : undefined,
        }),
      });
      setReport(result.report);
      setIntegrationsApplied(true);
      appToast('Wersee connected the selected site integrations.', 'success');
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'The integrations could not be applied.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!site || !release || !report?.publishable) return;
    if (report.warnings.length && !acceptedWarnings) { appToast('Review and accept the validation warnings before publishing.', 'warning'); return; }
    setBusy(true); setStep(6);
    try {
      const result = await sitesRequest<{ job: any }>(`/${site.id}/releases/${release.id}/publish`, {
        method: 'POST', body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          acceptWarnings: acceptedWarnings || report.warnings.length === 0,
          publishToMarketplace,
        }),
      });
      setPublishJob(result.job);
      const deadline = Date.now() + 10 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const detail = await sitesRequest<{ site: Site; jobs: any[] }>(`/${site.id}`);
        const job = detail.jobs.find((item) => item.id === result.job.id) || result.job;
        setPublishJob(job);
        if (job.status === 'completed') {
          setPublishedUrl(detail.site.public_url || `https://${detail.site.slug}.wersee.com`);
          setSite(detail.site); setBusy(false); appToast('Your website is live.', 'success'); return;
        }
        if (job.status === 'failed') throw new Error(`${job.error_message || 'The deployment failed.'} Reference: ${job.support_reference}`);
      }
      throw new Error('Deployment status timed out. Wersee will keep synchronizing it in the background.');
    } catch (error) {
      setBusy(false);
      appToast(error instanceof Error ? error.message : 'Publishing failed. Your previous release remains live.', 'error');
    }
  };

  const previewWidth = previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '390px';
  const publishStages = ['preparing', 'uploading', 'creating', 'building', 'checking', 'aliasing', 'publishing', 'live'];

  return (
    <motion.main
      aria-label="Wersee Sites publishing workspace"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed inset-0 z-[500] flex h-dvh w-screen flex-col overflow-hidden bg-[#050506] font-sans text-white antialiased"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,.10),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.022] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:80px_80px]" />
        <header className="relative flex h-[72px] shrink-0 items-center justify-between border-b border-white/[.07] bg-[#09090a]/80 px-5 backdrop-blur-2xl md:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/10 bg-gradient-to-b from-white/[.11] to-white/[.045] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"><Globe2 className="h-[18px] w-[18px] text-white/90" /></div><div><p className="text-[13px] font-semibold tracking-[-.01em] text-white/90">Wersee Sites</p><p className="mt-0.5 text-[11px] text-white/35">{existingSite ? `New release for ${existingSite.name}` : 'Create a new website'}</p></div></div>
          <button onClick={onClose} className="flex h-9 items-center gap-2 rounded-full border border-white/[.09] bg-white/[.035] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Exit Sites wizard"><span className="hidden sm:inline">Close</span><X className="h-4 w-4" /></button>
        </header>
        <nav aria-label="Publishing progress" className="relative shrink-0 overflow-x-auto border-b border-white/[.065] bg-[#070708]/72 px-5 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex min-w-max max-w-5xl items-center gap-1.5">
            {steps.map((item, index) => <React.Fragment key={item.number}><div aria-current={step === item.number ? 'step' : undefined} className={`flex h-8 items-center gap-2 rounded-full px-3 text-[11px] font-medium transition-all ${step === item.number ? 'bg-white text-black shadow-[0_1px_0_rgba(255,255,255,.25),0_8px_24px_rgba(0,0,0,.35)]' : step > item.number ? 'text-white/68' : 'text-white/25'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${step > item.number ? 'bg-blue-500 text-white' : step === item.number ? 'bg-black/10' : 'border border-white/10'}`}>{step > item.number ? <Check className="h-2.5 w-2.5" /> : item.number}</span>{item.label}</div>{index < steps.length - 1 && <div className={`h-px w-5 ${step > item.number ? 'bg-blue-500/55' : 'bg-white/[.08]'}`} />}</React.Fragment>)}
          </div>
        </nav>
        <section className="relative flex-1 overflow-y-auto px-4 py-7 [scrollbar-color:rgba(255,255,255,.15)_transparent] md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-6xl">
          <AnimatePresence mode="wait">
            {step === 1 && <StepShell key="identity" title="Give your site an address" description="Choose the business that owns this site. Subdomains are reserved transactionally, so two users can never claim the same address.">
              <div className="grid gap-5 rounded-[28px] border border-white/[.075] bg-[#0d0d0f]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] md:grid-cols-2 md:p-7">
                <label className="space-y-2 text-[13px] font-medium text-white/52">Business<select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="w-full rounded-[14px] border border-white/[.09] bg-[#171719] px-4 py-3.5 text-[14px] text-white outline-none transition focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10">{businesses.map((business) => <option className="bg-[#171719]" value={business.id} key={business.id}>{business.name}</option>)}</select></label>
                <label className="space-y-2 text-[13px] font-medium text-white/52">Site name<input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[14px] border border-white/[.09] bg-[#171719] px-4 py-3.5 text-[14px] text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10" placeholder="My portfolio" /></label>
                <label className="space-y-2 text-[13px] font-medium text-white/52 md:col-span-2">Public subdomain<div className="relative"><input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(normalizeSiteSlug(event.target.value)); }} className={`w-full rounded-[14px] border bg-[#171719] px-4 py-3.5 pr-12 text-[14px] text-white outline-none transition focus:ring-4 ${slugState === 'available' ? 'border-emerald-500/45 focus:ring-emerald-500/10' : slugState === 'unavailable' ? 'border-red-500/45 focus:ring-red-500/10' : 'border-white/[.09] focus:border-blue-500/70 focus:ring-blue-500/10'}`} /> <span className="absolute right-4 top-1/2 -translate-y-1/2">{slugState === 'checking' ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : slugState === 'available' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : slugState === 'unavailable' ? <XCircle className="h-4 w-4 text-red-400" /> : null}</span></div><p className={slugState === 'unavailable' ? 'text-xs font-normal text-red-400' : 'text-xs font-normal text-white/30'}>{slugReason || `https://${slug || 'your-site'}.wersee.com`}</p></label>
                <label className="space-y-2 text-[13px] font-medium text-white/52 md:col-span-2">Description <span className="font-normal text-white/25">(optional)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full resize-none rounded-[14px] border border-white/[.09] bg-[#171719] px-4 py-3.5 text-[14px] text-white outline-none transition focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10" /></label>
                <label className="flex cursor-pointer items-center gap-4 rounded-[18px] border border-dashed border-white/[.12] bg-white/[.025] p-4 transition hover:border-white/20 hover:bg-white/[.04] md:col-span-2"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] border border-white/[.07] bg-white/[.04]">{iconPreviewUrl ? <img src={iconPreviewUrl} className="h-full w-full object-cover" alt="Selected icon" /> : <ImageIcon className="h-5 w-5 text-white/30" />}</div><div className="flex-1"><p className="text-sm font-medium text-white/85">Site icon or favicon</p><p className="mt-1 text-xs text-white/32">PNG, JPG, WebP or ICO up to 10 MB</p></div><span className="rounded-full bg-white/[.07] px-3 py-1.5 text-[11px] font-medium text-white/55">Choose</span><input type="file" accept="image/png,image/jpeg,image/webp,image/x-icon" className="hidden" onChange={(event) => setIcon(event.target.files?.[0] || null)} /></label>
              </div>
              <div className="flex justify-end"><button disabled={!canContinueIdentity || busy} onClick={() => void createSite()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,.08)] transition hover:bg-white/90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}</button></div>
            </StepShell>}

            {step === 2 && <StepShell key="upload" title="Bring any static codebase" description="Publish plain HTML/CSS/JavaScript or the static output from Vite, React, Vue, Svelte, Angular, Astro and Next.js. Files go directly to private staging with resumable 6 MB chunks.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={() => htmlInputRef.current?.click()} className={`group relative flex min-h-36 flex-col items-start overflow-hidden rounded-[22px] border p-5 text-left transition-all hover:-translate-y-0.5 ${sourceType === 'html' ? 'border-blue-400/55 bg-blue-500/[.10] shadow-[0_14px_38px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.08)]' : 'border-white/[.075] bg-[#101012] hover:border-white/15 hover:bg-[#141416]'}`}><span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-[11px] ${sourceType === 'html' ? 'bg-blue-500 text-white' : 'bg-white/[.055] text-white/45'}`}><FileCode2 className="h-[18px] w-[18px]" /></span><p className="text-[15px] font-semibold tracking-[-.015em] text-white/90">One HTML5 file</p><p className="mt-1.5 text-xs leading-relaxed text-white/34">Any .html file becomes index.html</p>{sourceType === 'html' && <Check className="absolute right-4 top-4 h-4 w-4 text-blue-300" />}</button>
                <button onClick={() => { setSourceType('zip'); zipInputRef.current?.click(); }} className={`relative flex min-h-36 flex-col items-start rounded-[22px] border p-5 text-left transition-all hover:-translate-y-0.5 ${sourceType === 'zip' ? 'border-blue-400/55 bg-blue-500/[.10]' : 'border-white/[.075] bg-[#101012] hover:border-white/15 hover:bg-[#141416]'}`}><span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-[11px] ${sourceType === 'zip' ? 'bg-blue-500 text-white' : 'bg-white/[.055] text-white/45'}`}><FileArchive className="h-[18px] w-[18px]" /></span><p className="text-[15px] font-semibold text-white/90">ZIP archive</p><p className="mt-1.5 text-xs text-white/34">Upload a prepared archive</p>{sourceType === 'zip' && <Check className="absolute right-4 top-4 h-4 w-4 text-blue-300" />}</button>
                <button onClick={() => { setSourceType('folder'); folderInputRef.current?.click(); }} className={`relative flex min-h-36 flex-col items-start rounded-[22px] border p-5 text-left transition-all hover:-translate-y-0.5 ${sourceType === 'folder' ? 'border-blue-400/55 bg-blue-500/[.10]' : 'border-white/[.075] bg-[#101012] hover:border-white/15 hover:bg-[#141416]'}`}><span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-[11px] ${sourceType === 'folder' ? 'bg-blue-500 text-white' : 'bg-white/[.055] text-white/45'}`}><FolderOpen className="h-[18px] w-[18px]" /></span><p className="text-[15px] font-semibold text-white/90">Website folder</p><p className="mt-1.5 text-xs text-white/34">dist, build, out or public</p>{sourceType === 'folder' && <Check className="absolute right-4 top-4 h-4 w-4 text-blue-300" />}</button>
                <button onClick={() => void loadStorageZips()} className={`relative flex min-h-36 flex-col items-start rounded-[22px] border p-5 text-left transition-all hover:-translate-y-0.5 ${sourceType === 'wersee_storage' ? 'border-blue-400/55 bg-blue-500/[.10]' : 'border-white/[.075] bg-[#101012] hover:border-white/15 hover:bg-[#141416]'}`}><span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-[11px] ${sourceType === 'wersee_storage' ? 'bg-blue-500 text-white' : 'bg-white/[.055] text-white/45'}`}><CloudUpload className="h-[18px] w-[18px]" /></span><p className="text-[15px] font-semibold text-white/90">Wersee Storage</p><p className="mt-1.5 text-xs text-white/34">Reuse an existing ZIP</p>{sourceType === 'wersee_storage' && <Check className="absolute right-4 top-4 h-4 w-4 text-blue-300" />}</button>
                <input ref={htmlInputRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(event) => chooseHtmlFile(event.target.files)} />
                <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => chooseFiles(event.target.files, false)} />
                <input ref={folderInputRef} type="file" className="hidden" {...({ webkitdirectory: '', directory: '' } as any)} onChange={(event) => chooseFiles(event.target.files, true)} />
              </div>
              <div className="flex flex-wrap gap-2 rounded-[18px] border border-white/[.065] bg-white/[.022] p-4 text-[11px] font-medium text-white/35"><span className="mr-1 flex items-center gap-1.5 text-white/60"><Code2 className="h-3.5 w-3.5" /> Works with</span>{['HTML5', 'CSS', 'JavaScript', 'Vite', 'React', 'Vue', 'Svelte', 'Angular', 'Astro', 'Next static'].map((label) => <span key={label} className="rounded-full border border-white/[.045] bg-white/[.035] px-2.5 py-1">{label}</span>)}</div>
              <section className="rounded-[28px] border border-white/[.075] bg-[#0d0d0f]/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] md:p-7">
                <div className="mb-6"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-400">Wersee Intelligence</p><h3 className="mt-2 text-xl font-semibold tracking-[-.025em] text-white/95">Search, safer AI copy and richer tracking</h3><p className="mt-1.5 text-xs leading-relaxed text-white/37">These settings are written into a validated wersee.json. Private keys, form values and page HTML are never sent by analytics.</p></div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className={`cursor-pointer rounded-[20px] border p-4 transition ${indexingEnabled ? 'border-blue-400/35 bg-blue-500/[.08]' : 'border-white/[.07] bg-[#141416]'}`}>
                    <span className="flex items-center justify-between"><SearchCheck className={`h-5 w-5 ${indexingEnabled ? 'text-blue-400' : 'text-white/30'}`} /><input type="checkbox" checked={indexingEnabled} onChange={(event) => setIndexingEnabled(event.target.checked)} className="accent-blue-500" /></span>
                    <span className="mt-4 block text-sm font-semibold text-white/90">Automatic discovery</span><span className="mt-1 block text-xs leading-relaxed text-white/36">Adds canonical metadata, robots.txt, sitemap.xml and an IndexNow ownership file, then submits changed URLs after publishing.</span>
                  </label>
                  <label className={`cursor-pointer rounded-[20px] border p-4 transition ${aiTextEnhancementEnabled ? 'border-blue-400/35 bg-blue-500/[.08]' : 'border-white/[.07] bg-[#141416]'}`}>
                    <span className="flex items-center justify-between"><Bot className={`h-5 w-5 ${aiTextEnhancementEnabled ? 'text-blue-400' : 'text-white/30'}`} /><input type="checkbox" checked={aiTextEnhancementEnabled} onChange={(event) => setAiTextEnhancementEnabled(event.target.checked)} className="accent-blue-500" /></span>
                    <span className="mt-4 block text-sm font-semibold text-white/90">Improve visible text with AI</span><span className="mt-1 block text-xs leading-relaxed text-white/36">Only isolated text fragments are shared. Wersee preserves tags, links, scripts, CSS, prices and file structure.</span>
                  </label>
                  <label className={`cursor-pointer rounded-[20px] border p-4 transition ${advancedAnalyticsEnabled ? 'border-blue-400/35 bg-blue-500/[.08]' : 'border-white/[.07] bg-[#141416]'}`}>
                    <span className="flex items-center justify-between"><BarChart3 className={`h-5 w-5 ${advancedAnalyticsEnabled ? 'text-blue-400' : 'text-white/30'}`} /><input type="checkbox" checked={advancedAnalyticsEnabled} onChange={(event) => setAdvancedAnalyticsEnabled(event.target.checked)} className="accent-blue-500" /></span>
                    <span className="mt-4 block text-sm font-semibold text-white/90">Advanced private analytics</span><span className="mt-1 block text-xs leading-relaxed text-white/36">Tracks pages, campaigns, downloads, goals, forms, scroll depth and Web Vitals without collecting entered form data.</span>
                  </label>
                  <label className={`cursor-pointer rounded-[20px] border p-4 transition ${directoryListed ? 'border-blue-400/35 bg-blue-500/[.08]' : 'border-white/[.07] bg-[#141416]'}`}>
                    <span className="flex items-center justify-between"><Globe2 className={`h-5 w-5 ${directoryListed ? 'text-blue-400' : 'text-white/30'}`} /><input type="checkbox" checked={directoryListed} onChange={(event) => setDirectoryListed(event.target.checked)} className="accent-blue-500" /></span>
                    <span className="mt-4 block text-sm font-semibold text-white/90">Published-sites slider</span><span className="mt-1 block text-xs leading-relaxed text-white/36">Opt in to the public, auto-scrolling Wersee Sites directory. Only your name, icon and public domain are returned.</span>
                  </label>
                </div>
                {aiTextEnhancementEnabled && <div className="mt-4 grid gap-3 rounded-[18px] border border-white/[.07] bg-[#151517] p-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-medium text-white/42">Text language<select value={aiLocale} onChange={(event) => setAiLocale(event.target.value)} className="w-full rounded-[12px] border border-white/[.08] bg-[#1b1b1e] px-3 py-2.5 text-white outline-none focus:border-blue-500/60"><option value="nl">Dutch</option><option value="en">English</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option></select></label><label className="space-y-2 text-xs font-medium text-white/42">Tone<select value={aiTone} onChange={(event) => setAiTone(event.target.value as typeof aiTone)} className="w-full rounded-[12px] border border-white/[.08] bg-[#1b1b1e] px-3 py-2.5 text-white outline-none focus:border-blue-500/60"><option value="clear">Clear</option><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="confident">Confident</option><option value="concise">Concise</option></select></label></div>}
              </section>
              {sourceType === 'wersee_storage' ? <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">{loadingStorage ? <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading your ZIP archives…</div> : storageZips.length ? <div className="space-y-2">{storageZips.map((file) => <label key={file.path} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${storagePath === file.path ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-transparent bg-white/[.03]'}`}><input type="radio" name="storageZip" checked={storagePath === file.path} onChange={() => setStoragePath(file.path)} /><FileArchive className="h-4 w-4 text-amber-300" /><span className="flex-1 truncate text-sm text-white">{file.name}</span><span className="text-xs text-white/35">{formatBytes(file.size)}</span></label>)}</div> : <p className="text-sm text-white/45">No ZIP archives were found in your Wersee Storage.</p>}</div> : selectedFiles.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{sourceType === 'zip' ? selectedFiles[0].file.name : `${selectedFiles[0].relativePath.split('/')[0]} folder`}</p><p className="text-xs text-white/40">{selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}</p></div></div></div>}
              {(busy || uploadPaused) && uploadProgress.totalBytes > 0 && <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 flex justify-between text-xs text-white/50"><span>{formatBytes(uploadProgress.uploadedBytes)} / {formatBytes(uploadProgress.totalBytes)}</span><span>{formatBytes(uploadProgress.speedBytesPerSecond)}/s · {uploadProgress.remainingFiles} remaining</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-indigo-500" animate={{ width: `${Math.min(100, (uploadProgress.uploadedBytes / uploadProgress.totalBytes) * 100)}%` }} /></div></div>}
              <div className="flex flex-wrap justify-between gap-3"><button onClick={() => existingSite ? onClose() : setStep(1)} className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/48 transition hover:bg-white/[.055] hover:text-white/75"><ArrowLeft className="h-4 w-4" /> Back</button><div className="flex gap-2">{busy && sourceType !== 'wersee_storage' && <button onClick={() => abortRef.current?.abort()} className="flex h-11 items-center gap-2 rounded-full border border-white/[.09] px-4 text-sm font-medium text-white"><Pause className="h-4 w-4" /> Pause</button>}{uploadPaused && <button onClick={() => void uploadAndValidate(true)} className="flex h-11 items-center gap-2 rounded-full border border-blue-500/35 bg-blue-500/10 px-4 text-sm font-medium text-blue-200"><Play className="h-4 w-4" /> Resume</button>}<button disabled={busy || (sourceType === 'wersee_storage' ? !storagePath : !selectedFiles.length)} onClick={() => void uploadAndValidate(false)} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gauge className="h-4 w-4" /> Upload & validate</>}</button></div></div>
            </StepShell>}

            {step === 3 && <StepShell key="validation" title={computerRun ? 'Wersee AI is using its private computer' : 'Validating on the server'} description={computerRun ? 'The browser runs inside an isolated microVM. It receives only this prepared release, has no Wersee credentials, and loses network access before your site is opened.' : 'Wersee is inspecting paths, secrets, MIME types, file limits, asset references and the publishing root.'}>
              {computerRun ? <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
                <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/[.08] bg-[#08080a] shadow-[0_28px_80px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.04)]">
                  <div className="flex items-center gap-2 border-b border-white/[.07] bg-white/[.025] px-4 py-3"><span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /><span className="ml-3 text-[10px] font-semibold uppercase tracking-[.15em] text-white/28">Private computer · offline browser</span></div>
                  <div className="relative flex min-h-[315px] items-center justify-center p-4">
                    <AnimatePresence mode="wait">
                      {computerSnapshots.length ? <motion.img
                        key={computerSnapshots.at(-1)?.id}
                        src={computerSnapshots.at(-1)?.url}
                        initial={{ opacity: 0, scale: 1.015, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: .6 }}
                        className="max-h-[292px] w-full rounded-[16px] border border-white/[.08] object-contain shadow-2xl"
                        alt={`Sanitized ${computerSnapshots.at(-1)?.viewport || 'browser'} progress capture`}
                      /> : <div className="text-center"><div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-blue-400/20 bg-blue-500/[.08]"><motion.div className="absolute inset-2 rounded-[18px] border border-blue-300/20" animate={{ scale: [1, 1.12, 1], opacity: [.4, .85, .4] }} transition={{ repeat: Infinity, duration: 2.2 }} /><Monitor className="relative h-8 w-8 text-blue-300" /></div><p className="mt-5 text-sm font-semibold text-white/75">The computer view stays private until a sanitized capture is ready.</p></div>}
                    </AnimatePresence>
                    <div className="pointer-events-none absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/[.06]"><motion.div className="h-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" animate={{ width: `${computerRun.progress}%` }} /></div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/[.075] bg-[#0d0d0f] p-5 md:p-6">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-300">Safe thinking pattern</p><p className="mt-2 text-lg font-semibold tracking-[-.02em] text-white">{computerRun.message}</p></div><span className="rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-white/55">{computerRun.progress}%</span></div>
                  <p className="mt-3 text-xs leading-relaxed text-white/32">These are curated task updates—not hidden chain-of-thought. Raw browser state and full-resolution artifacts are never exposed here.</p>
                  <div className="mt-6 space-y-2.5">
                    {computerEvents.filter((event) => event.event_type !== 'snapshot').slice(-6).map((event, index, items) => <motion.div key={event.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-3 rounded-[15px] border p-3 ${index === items.length - 1 ? 'border-blue-400/25 bg-blue-500/[.08]' : 'border-white/[.055] bg-white/[.02]'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index === items.length - 1 ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/10 text-emerald-400'}`}>{index === items.length - 1 && computerRun.status === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}</span><div><p className="text-xs font-medium text-white/72">{event.public_message}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/24">{event.stage} · {event.progress}%</p></div></motion.div>)}
                  </div>
                </div>
              </div> : <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-white/[.075] bg-[#0d0d0f] text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035)]"><div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[.07] bg-white/[.035]"><div className="absolute inset-0 animate-pulse rounded-[20px] bg-blue-500/[.08]" /><Loader2 className="relative h-7 w-7 animate-spin text-blue-400" /></div><p className="mt-6 text-[15px] font-semibold text-white/90">Secure validation in progress</p><p className="mt-2 max-w-sm text-sm text-white/36">The result comes directly from the prepared release, not from a simulated timer.</p></div>}
            </StepShell>}

            {step === 4 && report && <StepShell key="report" title={report.publishable ? 'Validation complete' : 'This release needs attention'} description={report.guidance || 'Review the detected root, real file totals, warnings and errors before previewing or publishing.'}>
              {report.validRoots.length > 1 && <label className="block rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100"><span className="mb-2 block font-bold">Choose a publishing directory</span><select value={selectedRoot ?? ''} onChange={(event) => setSelectedRoot(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#16130b] px-3 py-2 text-white">{report.validRoots.map((root) => <option value={root} key={root}>{root || '/ (root)'}</option>)}</select><button onClick={() => site && release && void runValidation(site, release, selectedRoot)} className="mt-3 rounded-xl bg-amber-300 px-4 py-2 text-xs font-black text-black">Validate selected root</button></label>}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Files', report.totalFiles], ['Published size', formatBytes(report.totalSize)], ['HTML pages', report.htmlPages], ['JavaScript', report.javascriptFiles], ['CSS', report.cssFiles], ['Images', report.imageFiles], ['Framework', report.detectedFramework || 'Static'], ['Site root', report.detectedRoot || '/']].map(([label, value]) => <div key={String(label)} className="rounded-[18px] border border-white/[.07] bg-[#101012] p-4"><p className="text-xs text-white/30">{label}</p><p className="mt-2 truncate text-sm font-semibold text-white/88">{value}</p></div>)}</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border border-white/[.07] bg-[#101012] p-4"><SearchCheck className="h-5 w-5 text-blue-400" /><p className="mt-3 text-sm font-semibold text-white/90">Search discovery</p><p className="mt-1 text-xs leading-relaxed text-white/36">{report.seo.indexingEnabled ? `${report.seo.indexedPages} page${report.seo.indexedPages === 1 ? '' : 's'} prepared with sitemap, robots and IndexNow.` : 'Indexing is disabled for this release.'}</p></div>
                <div className="rounded-[20px] border border-white/[.07] bg-[#101012] p-4"><Bot className="h-5 w-5 text-blue-400" /><p className="mt-3 text-sm font-semibold text-white/90">AI text guard</p><p className="mt-1 text-xs leading-relaxed text-white/36">{report.aiTextEnhancement.status === 'completed' ? `${report.aiTextEnhancement.changedTextNodes} visible text fragment${report.aiTextEnhancement.changedTextNodes === 1 ? '' : 's'} improved; code and structure preserved.` : report.aiTextEnhancement.status === 'failed' ? 'AI was unavailable; original text was preserved.' : 'AI text improvement was not enabled.'}</p></div>
                <div className="rounded-[20px] border border-white/[.07] bg-[#101012] p-4"><BarChart3 className="h-5 w-5 text-blue-400" /><p className="mt-3 text-sm font-semibold text-white/90">wersee.json</p><p className="mt-1 text-xs leading-relaxed text-white/36">{report.werseeManifestStatus === 'validated' ? 'Your configuration was validated and secured.' : 'Wersee generated a safe configuration for this release.'}</p></div>
              </div>
              {computerRun && <section className={`rounded-[24px] border p-5 ${computerRun.status === 'completed' ? 'border-emerald-400/20 bg-emerald-500/[.045]' : 'border-amber-400/20 bg-amber-500/[.045]'}`}>
                <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${computerRun.status === 'completed' ? 'bg-emerald-500/12 text-emerald-300' : 'bg-amber-500/12 text-amber-300'}`}><Monitor className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/35">AI computer review</p><h3 className="mt-1 text-sm font-semibold text-white/90">{computerRun.result?.summary || computerRun.message}</h3><p className="mt-1 text-xs text-white/34">{computerSnapshots.length} sanitized progress capture{computerSnapshots.length === 1 ? '' : 's'} · isolated browser · external network blocked</p></div></div>
                {computerRun.result?.findings?.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{computerRun.result.findings.map((finding, index) => <div key={`${finding.title}-${index}`} className="rounded-[15px] border border-white/[.06] bg-black/20 p-3"><p className={`text-[10px] font-semibold uppercase tracking-wider ${finding.severity === 'blocking' ? 'text-red-300' : finding.severity === 'warning' ? 'text-amber-300' : 'text-blue-300'}`}>{finding.severity}</p><p className="mt-1 text-xs font-semibold text-white/78">{finding.title}</p><p className="mt-1 text-[11px] leading-relaxed text-white/35">{finding.detail}</p></div>)}</div> : null}
              </section>}
              <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h3 className="flex items-center gap-2 font-bold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Detection</h3><div className="mt-4 space-y-2 text-sm text-white/55"><p>SPA: <span className="text-white">{report.detectedSpa ? 'Detected' : 'No'}</span></p><p>Favicon: <span className="text-white capitalize">{report.faviconStatus}</span></p><p>Analytics: <span className="text-white capitalize">{report.analyticsInjectionStatus}</span></p><p>Missing assets: <span className="text-white">{report.missingReferencedAssets.length}</span></p></div></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h3 className="flex items-center gap-2 font-bold text-white"><AlertTriangle className="h-4 w-4 text-amber-400" /> Findings</h3><div className="mt-4 max-h-48 space-y-2 overflow-y-auto">{[...report.errors.map((item) => ({ ...item, type: 'error' })), ...report.warnings.map((item) => ({ ...item, type: 'warning' }))].map((item, index) => <div key={`${item.code}-${index}`} className={`rounded-xl p-3 text-xs ${item.type === 'error' ? 'bg-red-500/10 text-red-200' : 'bg-amber-500/10 text-amber-100'}`}><p className="font-bold">{item.message}</p>{item.path && <p className="mt-1 truncate opacity-60">{item.path}</p>}</div>)}{!report.errors.length && !report.warnings.length && <p className="text-sm text-emerald-300">No issues found.</p>}</div></div></div>
              {report.publishable && <section className="rounded-[26px] border border-blue-400/20 bg-blue-500/[.045] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-300">Wersee AI connections</p><h3 className="mt-2 text-lg font-semibold text-white">Connect detected Pay and login controls</h3><p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/42">{report.integrations.codeFilesScanned} code file{report.integrations.codeFilesScanned === 1 ? '' : 's'} scanned. Nothing is changed until you review the candidate and press Apply. Prices are never guessed.</p></div>{integrationsApplied && <span className="rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-semibold text-emerald-300"><Check className="mr-1 inline h-3 w-3" /> Applied</span>}</div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className={`rounded-[20px] border p-4 ${quickPayEnabled ? 'border-blue-400/30 bg-blue-500/[.07]' : 'border-white/[.07] bg-black/20'}`}>
                    <label className="flex cursor-pointer items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[.055]"><CreditCard className="h-4 w-4 text-blue-300" /></span><span className="flex-1"><span className="block text-sm font-semibold text-white">Wersee Quick Pay</span><span className="block text-xs text-white/35">Create a real managed payment route</span></span><input type="checkbox" checked={quickPayEnabled} onChange={(event) => { setQuickPayEnabled(event.target.checked); setIntegrationsApplied(false); }} className="accent-blue-500" /></label>
                    {quickPayEnabled && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs text-white/42 sm:col-span-2">Detected control<select value={quickPayCandidateId} onChange={(event) => { const next = report.integrations.candidates.find((candidate) => candidate.id === event.target.value); setQuickPayCandidateId(event.target.value); if (next?.detectedAmount != null) setQuickPayAmount(String(next.detectedAmount)); if (next?.detectedCurrency === 'usd') setQuickPayCurrency('usd'); setIntegrationsApplied(false); }} className="w-full rounded-xl border border-white/[.08] bg-[#151519] px-3 py-2.5 text-white"><option value="">Choose a Pay button</option>{report.integrations.candidates.filter((candidate) => candidate.kind === 'quick_pay').map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.label} · {candidate.sourcePath}{candidate.detectedAmount != null ? ` · ${candidate.detectedCurrency?.toUpperCase()} ${candidate.detectedAmount}` : ' · price needs confirmation'}</option>)}</select></label>
                      <label className="space-y-1.5 text-xs text-white/42">Confirmed price<div className="flex"><select value={quickPayCurrency} onChange={(event) => { setQuickPayCurrency(event.target.value as 'eur' | 'usd'); setIntegrationsApplied(false); }} className="rounded-l-xl border border-r-0 border-white/[.08] bg-[#151519] px-2 text-white"><option value="eur">EUR</option><option value="usd">USD</option></select><input inputMode="decimal" value={quickPayAmount} onChange={(event) => { setQuickPayAmount(event.target.value); setIntegrationsApplied(false); }} className="min-w-0 flex-1 rounded-r-xl border border-white/[.08] bg-[#151519] px-3 py-2.5 text-white" placeholder="0.00" /></div></label>
                      <label className="space-y-1.5 text-xs text-white/42">Site route<div className="flex items-center rounded-xl border border-white/[.08] bg-[#151519] px-3"><span className="text-white/25">/</span><input value={quickPayPath} onChange={(event) => { setQuickPayPath(normalizeSiteSlug(event.target.value)); setIntegrationsApplied(false); }} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-white outline-none" /></div></label>
                    </div>}
                  </div>
                  <div className={`rounded-[20px] border p-4 ${oauthEnabled ? 'border-blue-400/30 bg-blue-500/[.07]' : 'border-white/[.07] bg-black/20'}`}>
                    <label className="flex cursor-pointer items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[.055]"><LogIn className="h-4 w-4 text-blue-300" /></span><span className="flex-1"><span className="block text-sm font-semibold text-white">Login with Wersee</span><span className="block text-xs text-white/35">OAuth 2.1 Authorization Code + PKCE</span></span><input type="checkbox" checked={oauthEnabled} onChange={(event) => { setOauthEnabled(event.target.checked); setIntegrationsApplied(false); }} className="accent-blue-500" /></label>
                    {oauthEnabled && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs text-white/42">Placement<select value={oauthPlacement} onChange={(event) => { setOauthPlacement(event.target.value as typeof oauthPlacement); setIntegrationsApplied(false); }} className="w-full rounded-xl border border-white/[.08] bg-[#151519] px-3 py-2.5 text-white"><option value="existing">Existing button</option><option value="header">Header</option><option value="footer">Footer</option><option value="selector">CSS selector</option></select></label>
                      <label className="space-y-1.5 text-xs text-white/42">Callback route<div className="flex items-center rounded-xl border border-white/[.08] bg-[#151519] px-3"><span className="text-white/25">/</span><input value={oauthPath} onChange={(event) => { setOauthPath(normalizeSiteSlug(event.target.value)); setIntegrationsApplied(false); }} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-white outline-none" /></div></label>
                      {oauthPlacement === 'existing' && <label className="space-y-1.5 text-xs text-white/42 sm:col-span-2">Detected control<select value={oauthCandidateId} onChange={(event) => { setOauthCandidateId(event.target.value); setIntegrationsApplied(false); }} className="w-full rounded-xl border border-white/[.08] bg-[#151519] px-3 py-2.5 text-white"><option value="">Choose a login button</option>{report.integrations.candidates.filter((candidate) => candidate.kind === 'wersee_oauth').map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.label} · {candidate.sourcePath}</option>)}</select></label>}
                      {oauthPlacement === 'selector' && <label className="space-y-1.5 text-xs text-white/42 sm:col-span-2">CSS selector<input value={oauthSelector} onChange={(event) => { setOauthSelector(event.target.value); setIntegrationsApplied(false); }} className="w-full rounded-xl border border-white/[.08] bg-[#151519] px-3 py-2.5 text-white" placeholder="#account-actions" /></label>}
                    </div>}
                  </div>
                </div>
                {(quickPayEnabled || oauthEnabled) && <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-white/30">Quick Pay requires an active Wersee Pay/Stripe Connect account. OAuth uses an exact callback URL; no wildcard redirect is accepted.</p><button disabled={busy || integrationsApplied} onClick={() => void applyIntegrations()} className="flex h-10 items-center gap-2 rounded-full bg-blue-500 px-4 text-xs font-semibold text-white disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Apply reviewed connections</button></div>}
              </section>}
              {report.detectedSpa && site && !site.spa_fallback && <button onClick={async () => { const next = (await sitesRequest<{ site: Site }>(`/${site.id}`, { method: 'PATCH', body: JSON.stringify({ spaFallback: true }) })).site; setSite(next); appToast('SPA fallback enabled.', 'success'); }} className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-left text-sm text-indigo-100"><span className="font-bold">Enable recommended SPA fallback</span><span className="ml-2 text-indigo-200/60">Unknown non-file routes will use index.html.</span></button>}
              {report.warnings.length > 0 && report.publishable && <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><input type="checkbox" checked={acceptedWarnings} onChange={(event) => setAcceptedWarnings(event.target.checked)} className="mt-1" /><span className="text-sm text-white/60"><strong className="text-white">I reviewed these warnings.</strong><br />Critical errors still block publishing.</span></label>}
              <div className="flex justify-between"><button onClick={() => setStep(2)} className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/48 hover:bg-white/[.05]"><ArrowLeft className="h-4 w-4" /> Upload another version</button><button disabled={!report.publishable || busy || ((quickPayEnabled || oauthEnabled) && !integrationsApplied)} onClick={() => void openPreview()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-35">Preview release <ArrowRight className="h-4 w-4" /></button></div>
            </StepShell>}

            {step === 5 && preview && <StepShell key="preview" title="Preview the prepared release" description="This signed preview is short-lived and serves the sanitized release files—not the currently published website.">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/[.07] bg-[#101012] p-3"><div className="flex gap-1 rounded-[12px] bg-black/30 p-1"><button onClick={() => setPreviewDevice('desktop')} className={`rounded-[9px] p-2 ${previewDevice === 'desktop' ? 'bg-white text-black shadow-sm' : 'text-white/40'}`} aria-label="Desktop preview"><Monitor className="h-4 w-4" /></button><button onClick={() => setPreviewDevice('tablet')} className={`rounded-[9px] p-2 ${previewDevice === 'tablet' ? 'bg-white text-black shadow-sm' : 'text-white/40'}`} aria-label="Tablet preview"><Tablet className="h-4 w-4" /></button><button onClick={() => setPreviewDevice('mobile')} className={`rounded-[9px] p-2 ${previewDevice === 'mobile' ? 'bg-white text-black shadow-sm' : 'text-white/40'}`} aria-label="Mobile preview"><Smartphone className="h-4 w-4" /></button></div><div className="min-w-0 flex-1 truncate px-3 text-xs text-white/30">{preview.url}</div><button onClick={() => setPreviewKey((value) => value + 1)} className="rounded-full p-2 text-white/45 hover:bg-white/[.07]" aria-label="Refresh preview"><RefreshCw className="h-4 w-4" /></button><button onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')} className="rounded-full border border-white/[.08] px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/[.06]">Open in new tab</button></div>
              <div className="flex min-h-[480px] justify-center overflow-auto rounded-[28px] border border-white/[.075] bg-[#101012] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]"><iframe key={previewKey} src={preview.url} title="Prepared website preview" className="min-h-[450px] rounded-[18px] bg-white transition-[width] duration-300" style={{ width: previewWidth }} sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads" /></div>
              {report?.warnings.length ? <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-4"><input type="checkbox" checked={acceptedWarnings} onChange={(event) => setAcceptedWarnings(event.target.checked)} className="mt-1" /><span className="text-sm text-amber-100/70"><strong className="text-amber-100">I reviewed the validation warnings.</strong><br />This confirmation is required before the immutable release can go live.</span></label> : null}
              <label className={`flex cursor-pointer items-start gap-4 rounded-[22px] border p-5 transition ${publishToMarketplace ? 'border-blue-400/35 bg-blue-500/[.08]' : 'border-white/[.075] bg-[#101012]'}`}>
                <input type="checkbox" checked={publishToMarketplace} onChange={(event) => setPublishToMarketplace(event.target.checked)} className="sr-only" />
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${publishToMarketplace ? 'bg-blue-500 text-white' : 'bg-white/[.055] text-white/30'}`}>{publishToMarketplace ? <BadgeCheck className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-white/90">Show this site in the Wersee Marketplace {publishToMarketplace && <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[9px] uppercase tracking-wider text-blue-200">Selected</span>}</span><span className="mt-1 block text-xs leading-relaxed text-white/36">Create or update a free website showcase after the live deployment succeeds. Visitors open the real site—there is no checkout.</span></span>
                <span aria-hidden="true" className={`mt-1 h-6 w-11 rounded-full p-1 transition ${publishToMarketplace ? 'bg-blue-500' : 'bg-white/10'}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition ${publishToMarketplace ? 'translate-x-5' : ''}`} /></span>
              </label>
              <div className="flex justify-between"><button onClick={() => setStep(4)} className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/48 hover:bg-white/[.05]"><ArrowLeft className="h-4 w-4" /> Report</button><button disabled={Boolean(report?.warnings.length && !acceptedWarnings)} onClick={() => void publish()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-35"><Rocket className="h-4 w-4" /> Publish release</button></div>
            </StepShell>}

            {step === 6 && <StepShell key="publish" title={publishedUrl ? 'Your website is live' : 'Publishing immutable release'} description={publishedUrl ? 'The requested Wersee subdomain now points to this exact release.' : 'Progress is restored from Supabase if you reload. The previous live deployment stays active until the alias switch succeeds.'}>
              {publishedUrl ? <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/[.06] px-6 text-center"><div className="rounded-full bg-emerald-500/15 p-5"><CheckCircle2 className="h-12 w-12 text-emerald-400" /></div><a href={publishedUrl} target="_blank" rel="noreferrer" className="mt-6 break-all text-xl font-bold text-white hover:underline">{publishedUrl}</a>{publishToMarketplace && site?.marketplace_listing_id && <a href={`/listing/${site.marketplace_listing_id}`} className="mt-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-bold text-fuchsia-200"><ShoppingBag className="h-3.5 w-3.5" /> View marketplace showcase</a>}<div className="mt-5 flex flex-wrap justify-center gap-2"><button onClick={() => navigator.clipboard.writeText(publishedUrl).then(() => appToast('Link copied.', 'success'))} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white"><Copy className="h-4 w-4" /> Copy link</button><button onClick={() => site && onComplete(site)} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Done</button></div></div> : <div className="space-y-3">{publishStages.map((stageName, index) => { const activeIndex = Math.max(0, publishStages.indexOf(publishJob?.stage || 'preparing')); const completed = index < activeIndex; const active = index === activeIndex; return <div key={stageName} className={`flex items-center gap-4 rounded-2xl border p-4 ${active ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/5 bg-white/[.02]'}`}><div className={`flex h-8 w-8 items-center justify-center rounded-full ${completed ? 'bg-emerald-500/15 text-emerald-400' : active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/25'}`}>{completed ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}</div><span className={`text-sm font-bold capitalize ${active || completed ? 'text-white' : 'text-white/30'}`}>{stageName === 'creating' ? 'Creating deployment' : stageName === 'aliasing' ? 'Connecting subdomain' : stageName}</span>{active && <span className="ml-auto text-xs text-white/40">{publishJob?.progress || 0}%</span>}</div>; })}{publishJob?.status === 'failed' && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100"><p className="font-bold">{publishJob.error_message || 'Publishing failed.'}</p><p className="mt-1 text-xs text-red-200/60">Support reference: {publishJob.support_reference}</p></div>}</div>}
            </StepShell>}
          </AnimatePresence>
          </div>
        </section>
    </motion.main>
  );
};
