import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { WizardLayout } from './WizardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import {
  ASSET_3D_ACCEPT,
  ASSET_3D_FILE_ROLES,
  ASSET_3D_LICENSES,
  ASSET_3D_SUBCATEGORIES,
  ASSET_3D_TYPES,
  formatBytes,
  formatMinorCurrency,
} from '../../lib/asset3d';
import { Wersee3DViewer } from '../asset3d/Wersee3DViewer';

interface Asset3DWizardProps {
  onClose: () => void;
  onCreated?: (id: string) => void;
  draftId?: string | null;
}

type UploadRow = {
  id?: string;
  name: string;
  size: number;
  role: string;
  bucketId?: string;
  path?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;
  error?: string;
};

const inputClass = 'w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-medium text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10 placeholder:text-gray-600';
const labelClass = 'mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-500';

const splitList = (value: string) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const sha256File = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const Asset3DPreview = ({ data }: { data: any }) => (
  <div className="flex h-full flex-col bg-[#0A0A0A] p-6">
    <Wersee3DViewer
      title={data.title || '3D Asset'}
      posterUrl={data.coverUrl || data.galleryImages?.[0]}
      previewUrl={data.previewUrl}
      settings={data.previewSettings}
      technicalSummary={{
        format: data.primaryFormat,
        sizeBytes: data.totalSize,
      }}
      compact
    />
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-gray-500">{data.subcategory}</p>
          <h3 className="line-clamp-2 text-2xl font-semibold tracking-normal text-white">{data.title || '3D Asset'}</h3>
        </div>
        <div className="text-right text-xl font-semibold text-white">
          {data.priceMinor === 0 ? 'Free' : formatMinorCurrency(data.priceMinor, data.currency)}
        </div>
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-gray-400">{data.shortDescription || data.description || 'Describe the asset, included formats and use cases.'}</p>
      <div className="flex flex-wrap gap-2">
        {(data.includedFormats || []).slice(0, 5).map((format: string) => (
          <span key={format} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-gray-300">
            {format.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export const Asset3DWizard: React.FC<Asset3DWizardProps> = ({ onClose, onCreated, draftId }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftListingId, setDraftListingId] = useState<string | null>(draftId || null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    assetType: 'single_model',
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    subcategory: '3D Models',
    tagsText: '',
    applicationsText: '',
    softwareText: '',
    enginesText: '',
    version: '1.0.0',
    language: 'en',
    contentRating: 'general',
    aiDisclosure: 'not_declared',
    aiTrainingPermission: false,
    supportContact: '',
    changelog: '',
    coverUrl: '',
    previewUrl: '',
    primaryFormat: '',
    includedFormats: [] as string[],
    totalSize: 0,
    gameReady: false,
    rigged: false,
    animated: false,
    pbr: false,
    hasLods: false,
    licenseType: 'commercial',
    licenseName: 'Commercial License',
    priceMinor: 4900,
    currency: 'eur',
    licenseTerms: {
      personal: true,
      commercial: true,
      games: true,
      films: true,
      ads: false,
      physicalProducts: false,
      resale: false,
      redistribution: false,
      sourceSharing: false,
      nft: false,
      aiTraining: false,
      attribution: false,
    },
    customTerms: '',
    previewSettings: {
      auto_rotate: false,
      background_color: '#0A0A0A',
      grid: false,
      ground_shadow: true,
      lighting_intensity: 1,
      exposure: 1,
      model_scale: 1,
    },
  });

  const listingId = draftListingId || draftId || null;
  const hasDownloadFile = uploads.some((file) => ['uploaded', 'pending'].includes(file.status) && file.role !== 'preview_only');
  const totalSize = useMemo(() => uploads.reduce((sum, file) => sum + file.size, 0), [uploads]);
  const includedFormats = useMemo(() => {
    const formats = uploads.map((file) => file.name.split('.').pop()?.toLowerCase()).filter(Boolean) as string[];
    return Array.from(new Set(formats));
  }, [uploads]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalSize,
      includedFormats,
      primaryFormat: includedFormats[0] || prev.primaryFormat,
    }));
  }, [includedFormats, totalSize]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) return;
      setLoading(true);
      try {
        const { data: listing, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', draftId)
          .maybeSingle();
        if (error) throw error;
        if (listing?.metadata?.asset3d) {
          setFormData((prev) => ({ ...prev, ...listing.metadata.asset3d }));
        }
        const { data: files } = await supabase
          .from('product_3d_files')
          .select('*')
          .eq('listing_id', draftId)
          .order('created_at', { ascending: true });
        setUploads((files || []).map((file: any) => ({
          id: file.id,
          name: file.original_filename,
          size: Number(file.size_bytes || 0),
          role: file.file_role,
          bucketId: file.bucket_id,
          path: file.storage_path,
          status: 'uploaded',
          progress: 100,
        })));
      } catch (error) {
        console.error('Failed to load 3D draft', error);
      } finally {
        setLoading(false);
      }
    };
    loadDraft();
  }, [draftId]);

  useEffect(() => {
    if (!listingId) return;
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('asset_processing_jobs')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      setJobs(data || []);
    };
    fetchJobs();

    const channel = supabase
      .channel(`asset_processing_jobs:${listingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asset_processing_jobs', filter: `listing_id=eq.${listingId}` },
        () => fetchJobs(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  const updateField = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));

  const ensureDraft = async () => {
    if (draftListingId) return draftListingId;
    if (!user) throw new Error('Sign in before creating a 3D asset.');
    if (!formData.title.trim()) throw new Error('Product name is required.');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 10);
    const slug = formData.slug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('listings')
      .insert({
        title: formData.title,
        slug,
        description: formData.description || formData.shortDescription,
        price: formData.priceMinor / 100,
        category: '3D Assets',
        asset_category: formData.subcategory,
        type: 'asset_3d',
        user_id: user.id,
        seller_id: user.id,
        status: 'draft',
        expires_at: expiresAt.toISOString(),
        metadata: { asset3d: formData },
      })
      .select()
      .single();

    if (error) throw error;
    setDraftListingId(data.id);
    window.history.replaceState(null, '', `/create/asset_3d/${data.id}`);
    return data.id as string;
  };

  const saveDraft = async () => {
    if (!user || !listingId || !formData.title.trim()) return;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 10);
    const slug = formData.slug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await supabase
      .from('listings')
      .update({
        title: formData.title,
        slug,
        description: formData.description || formData.shortDescription,
        price: formData.priceMinor / 100,
        category: '3D Assets',
        asset_category: formData.subcategory,
        status: 'draft',
        expires_at: expiresAt.toISOString(),
        metadata: { asset3d: formData },
        technical_metadata: {
          included_formats: includedFormats,
          download_size_bytes: totalSize,
          game_ready: formData.gameReady,
          rigged: formData.rigged,
          animated: formData.animated,
          pbr: formData.pbr,
          has_lods: formData.hasLods,
        },
      })
      .eq('id', listingId);
  };

  useEffect(() => {
    if (step > 1) saveDraft().catch((error) => console.warn('3D draft autosave failed', error));
  }, [step]);

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    let idForUpload = listingId;
    try {
      idForUpload = await ensureDraft();
    } catch (error: any) {
      toast.error(error.message || 'Create a draft before uploading.');
      return;
    }

    for (const file of files) {
      const uploadRow: UploadRow = {
        name: file.name,
        size: file.size,
        role: uploads.length === 0 ? 'primary_model' : 'buyer_download',
        status: 'uploading',
        progress: 0,
      };
      setUploads((prev) => [...prev, uploadRow]);

      try {
        const sha256 = await sha256File(file);
        const upload = await invokeApiRunner('3d/create-upload', {
          listingId: idForUpload,
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileRole: uploadRow.role,
          sha256,
        });

        if (upload.error) throw new Error(upload.error);

        const { error: uploadError } = await supabase.storage
          .from(upload.bucketId)
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });
        if (uploadError) throw uploadError;

        await invokeApiRunner('3d/confirm-upload', { fileId: upload.file.id });

        setUploads((prev) => prev.map((item) => (
          item.name === file.name && item.status === 'uploading'
            ? {
                ...item,
                id: upload.file.id,
                bucketId: upload.bucketId,
                path: upload.path,
                role: upload.file.file_role,
                status: 'uploaded',
                progress: 100,
              }
            : item
        )));

        if (upload.file.is_public_preview) {
          const { data } = supabase.storage.from(upload.bucketId).getPublicUrl(upload.path);
          updateField('previewUrl', data.publicUrl);
        }
      } catch (error: any) {
        console.error('3D upload failed', error);
        setUploads((prev) => prev.map((item) => (
          item.name === file.name && item.status === 'uploading'
            ? { ...item, status: 'failed', error: error.message || 'Upload failed', progress: 0 }
            : item
        )));
        toast.error(error.message || `Upload failed for ${file.name}`);
      }
    }
  };

  const updateUploadRole = async (index: number, role: string) => {
    const row = uploads[index];
    setUploads((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, role } : item));
    if (row?.id) {
      const { error } = await supabase
        .from('product_3d_files')
        .update({
          file_role: role,
          buyer_downloadable: role !== 'preview_only' && role !== 'license',
          is_public_preview: role === 'preview_only',
        })
        .eq('id', row.id);
      if (error) toast.error(error.message);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !formData.assetType) return toast.error('Select an asset type.');
    if (step === 2 && !formData.title.trim()) return toast.error('Product name is required.');
    if (step === 3 && !hasDownloadFile) return toast.error('Upload at least one buyer download file.');
    if (step === 5 && !formData.licenseName.trim()) return toast.error('License name is required.');

    if (step < 7) {
      try {
        if (step === 2) await ensureDraft();
        setStep((value) => value + 1);
      } catch (error: any) {
        toast.error(error.message || 'Could not continue.');
      }
      return;
    }

    await handlePublish();
  };

  const handlePublish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const id = await ensureDraft();
      if (!hasDownloadFile) throw new Error('Upload at least one buyer download file.');

      const { error: detailError } = await supabase.from('product_3d_details').upsert({
        listing_id: id,
        seller_id: user.id,
        asset_type: formData.assetType,
        subcategory: formData.subcategory,
        suitable_applications: splitList(formData.applicationsText),
        supported_software: splitList(formData.softwareText),
        supported_engines: splitList(formData.enginesText),
        version_label: formData.version,
        publication_language: formData.language,
        content_rating: formData.contentRating,
        ai_generated_disclosure: formData.aiDisclosure,
        ai_training_permission: formData.aiTrainingPermission,
        support_contact: formData.supportContact,
        changelog: formData.changelog,
        tags: splitList(formData.tagsText),
        game_ready: formData.gameReady,
        rigged: formData.rigged,
        animated: formData.animated,
        pbr: formData.pbr,
        has_lods: formData.hasLods,
        download_size_bytes: totalSize,
        primary_format: includedFormats[0] || null,
        included_formats: includedFormats,
        publish_checklist: {
          product_information_complete: Boolean(formData.title && formData.description),
          valid_sale_files: hasDownloadFile,
          license_selected: Boolean(formData.licenseName),
          price_set: formData.priceMinor >= 0,
          seller_acknowledged_processing: true,
        },
        storefront_settings: {
          cover_url: formData.coverUrl,
          hero_mode: formData.previewUrl ? 'interactive_3d' : 'poster',
        },
      }, { onConflict: 'listing_id' });
      if (detailError) throw detailError;

      await supabase.from('product_3d_preview_settings').upsert({
        listing_id: id,
        auto_rotate: formData.previewSettings.auto_rotate,
        background_color: formData.previewSettings.background_color,
        grid: formData.previewSettings.grid,
        ground_shadow: formData.previewSettings.ground_shadow,
        lighting_intensity: formData.previewSettings.lighting_intensity,
        exposure: formData.previewSettings.exposure,
        model_scale: formData.previewSettings.model_scale,
      }, { onConflict: 'listing_id' });

      await supabase.from('product_3d_licenses').delete().eq('listing_id', id).eq('seller_id', user.id);
      const { data: license, error: licenseError } = await supabase.from('product_3d_licenses').insert({
        listing_id: id,
        seller_id: user.id,
        license_type: formData.licenseType,
        name: formData.licenseName,
        terms: formData.licenseTerms,
        custom_terms: formData.customTerms,
        attribution_required: formData.licenseTerms.attribution,
        resale_allowed: formData.licenseTerms.resale,
        redistribution_allowed: formData.licenseTerms.redistribution,
        source_file_sharing_allowed: formData.licenseTerms.sourceSharing,
        nft_use_allowed: formData.licenseTerms.nft,
        ai_training_allowed: formData.licenseTerms.aiTraining,
      }).select().single();
      if (licenseError) throw licenseError;

      const { error: priceError } = await supabase.from('product_3d_license_prices').insert({
        license_id: license.id,
        listing_id: id,
        currency: formData.currency,
        price_minor: formData.priceMinor,
      });
      if (priceError) throw priceError;

      const { error: listingError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          slug: formData.slug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: formData.description || formData.shortDescription,
          price: formData.priceMinor / 100,
          category: '3D Assets',
          asset_category: formData.subcategory,
          type: 'asset_3d',
          status: 'published',
          images: [formData.coverUrl].filter(Boolean),
          metadata: { asset3d: formData },
          technical_metadata: {
          included_formats: includedFormats,
          download_size_bytes: totalSize,
          game_ready: formData.gameReady,
          rigged: formData.rigged,
          animated: formData.animated,
          pbr: formData.pbr,
          has_lods: formData.hasLods,
          processing_jobs: jobs.length,
        },
        })
        .eq('id', id);
      if (listingError) throw listingError;

      toast.success('3D asset published.');
      if (onCreated) onCreated(id);
      else onClose();
    } catch (error: any) {
      console.error('Publishing 3D asset failed', error);
      toast.error(error.message || 'Failed to publish 3D asset.');
    } finally {
      setLoading(false);
    }
  };

  const processingSummary = useMemo(() => {
    const counts = jobs.reduce((acc: any, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    return counts;
  }, [jobs]);

  return (
    <WizardLayout
      title="Sell 3D Asset"
      currentStep={step}
      totalSteps={7}
      onClose={onClose}
      onBack={() => setStep((value) => Math.max(1, value - 1))}
      onNext={handleNext}
      isFirstStep={step === 1}
      isLastStep={step === 7}
      loading={loading}
      variant="fullscreen"
      preview={() => <Asset3DPreview data={{ ...formData, totalSize, includedFormats }} />}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Asset type</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ASSET_3D_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateField('assetType', type.id)}
                  className={`rounded-2xl border p-4 text-left transition ${formData.assetType === type.id ? 'border-white bg-white text-black' : 'border-white/10 bg-[#141414] text-white hover:border-white/30'}`}
                >
                  <Box className="mb-3 h-5 w-5" />
                  <span className="text-sm font-semibold">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Product name</label>
            <input value={formData.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} placeholder="e.g. Modular Sci-Fi Corridor Pack" />
          </div>
          <div>
            <label className={labelClass}>Custom URL slug</label>
            <input value={formData.slug} onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className={inputClass} placeholder="modular-sci-fi-corridor-pack" />
          </div>
          <div>
            <label className={labelClass}>Short description</label>
            <input value={formData.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} className={inputClass} placeholder="A production-ready environment kit for games and cinematic scenes." />
          </div>
          <div>
            <label className={labelClass}>Full description</label>
            <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={6} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Subcategory</label>
              <select value={formData.subcategory} onChange={(e) => updateField('subcategory', e.target.value)} className={inputClass}>
                {ASSET_3D_SUBCATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Version</label>
              <input value={formData.version} onChange={(e) => updateField('version', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input value={formData.tagsText} onChange={(e) => updateField('tagsText', e.target.value)} className={inputClass} placeholder="sci-fi, modular, pbr, game-ready" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Supported software</label>
              <input value={formData.softwareText} onChange={(e) => updateField('softwareText', e.target.value)} className={inputClass} placeholder="Blender, Maya, Cinema 4D" />
            </div>
            <div>
              <label className={labelClass}>Supported engines</label>
              <input value={formData.enginesText} onChange={(e) => updateField('enginesText', e.target.value)} className={inputClass} placeholder="Unity, Unreal Engine, Godot" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Suitable applications</label>
            <input value={formData.applicationsText} onChange={(e) => updateField('applicationsText', e.target.value)} className={inputClass} placeholder="Games, film, visualization, VR" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['gameReady', 'Game-ready'],
              ['rigged', 'Rigged'],
              ['animated', 'Animated'],
              ['pbr', 'PBR materials'],
              ['hasLods', 'Includes LODs'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean((formData as any)[key])}
                  onChange={(e) => updateField(key, e.target.checked)}
                  className="h-5 w-5 accent-white"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>AI-generated disclosure</label>
              <select value={formData.aiDisclosure} onChange={(e) => updateField('aiDisclosure', e.target.value)} className={inputClass}>
                <option value="not_declared">Not declared</option>
                <option value="no_ai">No generative AI used</option>
                <option value="ai_assisted">AI assisted</option>
                <option value="ai_generated">AI generated</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-gray-300">
              <input type="checkbox" checked={formData.aiTrainingPermission} onChange={(e) => updateField('aiTrainingPermission', e.target.checked)} className="h-5 w-5 accent-white" />
              Allow generative-AI training
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${dragActive ? 'border-white bg-white/10' : 'border-white/15 bg-[#141414]'}`}
          >
            <Upload className="mx-auto mb-4 h-10 w-10 text-gray-400" />
            <h3 className="text-xl font-semibold text-white">Upload 3D asset files</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
              Upload originals, textures, archives, documentation and preview-only files. Buyer files stay in private Storage.
            </p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-6 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-200">
              Select files
            </button>
            <input ref={fileInputRef} type="file" multiple accept={ASSET_3D_ACCEPT} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </div>

          <div className="space-y-3">
            {uploads.map((file, index) => (
              <div key={`${file.name}-${index}`} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    {file.name.match(/\.(zip|7z)$/i) ? <FileArchive className="h-5 w-5 text-amber-300" /> : <FileText className="h-5 w-5 text-gray-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                      <span className="text-xs font-medium text-gray-500">{formatBytes(file.size)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <select value={file.role} onChange={(e) => updateUploadRole(index, e.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none">
                        {ASSET_3D_FILE_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                      </select>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {file.status === 'uploading' && <><Loader2 className="h-4 w-4 animate-spin" /> Uploading</>}
                        {file.status === 'uploaded' && <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Uploaded</>}
                        {file.status === 'failed' && <><AlertTriangle className="h-4 w-4 text-red-400" /> Failed</>}
                      </div>
                    </div>
                    {file.error && <p className="mt-2 text-xs text-red-300">{file.error}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Processing pipeline</h3>
                <p className="text-sm text-gray-400">Realtime status from `asset_processing_jobs`.</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['queued', 'processing', 'completed', 'failed'].map((status) => (
                <div key={status} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-2xl font-semibold text-white">{processingSummary[status] || 0}</p>
                  <p className="text-xs font-semibold uppercase tracking-normal text-gray-500">{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-sm text-gray-400">
                Upload files to create sniffing, virus scan and analysis jobs.
              </div>
            ) : jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141414] p-4">
                <div>
                  <p className="font-semibold text-white">{String(job.job_type).replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{job.status}{job.error_message ? ` · ${job.error_message}` : ''}</p>
                </div>
                {['failed', 'needs_seller_action'].includes(job.status) && (
                  <button type="button" onClick={() => invokeApiRunner('3d/retry-processing', { jobId: job.id }).then(() => toast.success('Processing job queued again')).catch((error) => toast.error(error.message))} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>License type</label>
              <select value={formData.licenseType} onChange={(e) => updateField('licenseType', e.target.value)} className={inputClass}>
                {ASSET_3D_LICENSES.map((license) => <option key={license.id} value={license.id}>{license.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>License name</label>
              <input value={formData.licenseName} onChange={(e) => updateField('licenseName', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input type="number" min="0" step="0.01" value={(formData.priceMinor / 100).toString()} onChange={(e) => updateField('priceMinor', Math.round(Number(e.target.value || 0) * 100))} className={inputClass} />
              <select value={formData.currency} onChange={(e) => updateField('currency', e.target.value)} className={inputClass}>
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
                <option value="gbp">GBP</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['commercial', 'Commercial projects'],
              ['games', 'Games'],
              ['films', 'Films and video'],
              ['physicalProducts', 'Physical products'],
              ['resale', 'Resale allowed'],
              ['redistribution', 'Redistribution allowed'],
              ['sourceSharing', 'Source file sharing'],
              ['nft', 'NFT use'],
              ['aiTraining', 'AI training'],
              ['attribution', 'Attribution required'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean((formData.licenseTerms as any)[key])}
                  onChange={(e) => updateField('licenseTerms', { ...formData.licenseTerms, [key]: e.target.checked })}
                  className="h-5 w-5 accent-white"
                />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className={labelClass}>Custom legal terms</label>
            <textarea value={formData.customTerms} onChange={(e) => updateField('customTerms', e.target.value)} rows={5} className={`${inputClass} resize-none`} />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Cover image URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input value={formData.coverUrl} onChange={(e) => updateField('coverUrl', e.target.value)} className={`${inputClass} pl-12`} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className={labelClass}>Preview GLB URL</label>
            <input value={formData.previewUrl} onChange={(e) => updateField('previewUrl', e.target.value)} className={inputClass} placeholder="Generated preview URL or safe public preview URL" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-gray-300">
              <input type="checkbox" checked={formData.previewSettings.auto_rotate} onChange={(e) => updateField('previewSettings', { ...formData.previewSettings, auto_rotate: e.target.checked })} className="h-5 w-5 accent-white" />
              Auto rotate
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-gray-300">
              <input type="checkbox" checked={formData.previewSettings.grid} onChange={(e) => updateField('previewSettings', { ...formData.previewSettings, grid: e.target.checked })} className="h-5 w-5 accent-white" />
              Grid
            </label>
          </div>
          <div>
            <label className={labelClass}>Background color</label>
            <input type="color" value={formData.previewSettings.background_color} onChange={(e) => updateField('previewSettings', { ...formData.previewSettings, background_color: e.target.value })} className="h-12 w-20 rounded-xl border-0 bg-transparent" />
          </div>
          <button type="button" onClick={() => updateField('previewSettings', { auto_rotate: false, background_color: '#0A0A0A', grid: false, ground_shadow: true, lighting_intensity: 1, exposure: 1, model_scale: 1 })} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
            <RotateCcw className="h-4 w-4" />
            Reset preview
          </button>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          {[
            ['Product information complete', Boolean(formData.title && formData.description)],
            ['Valid sale files', hasDownloadFile],
            ['License selected', Boolean(formData.licenseName)],
            ['Price configured', formData.priceMinor >= 0],
            ['Cover or fallback available', Boolean(formData.coverUrl || uploads.length)],
            ['Processing jobs created', jobs.length > 0 || uploads.length === 0],
          ].map(([label, ok]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#141414] p-4">
              <span className="text-sm font-medium text-gray-300">{String(label)}</span>
              {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <X className="h-5 w-5 text-red-400" />}
            </div>
          ))}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Blocking issues from the server-side worker will keep buyer downloads unavailable until the file is cleared.
          </div>
        </div>
      )}
    </WizardLayout>
  );
};
