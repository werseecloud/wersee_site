import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  MessageSquare,
  Share,
  ShieldCheck,
  Star,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, invokeApiRunner } from '../../../lib/supabase';
import { formatBytes, formatMinorCurrency } from '../../../lib/asset3d';
import { useAuth } from '../../../context/AuthContext';
import { Wersee3DViewer } from '../../asset3d/Wersee3DViewer';
import { ReviewsSection } from './ReviewsSection';
import { ProductTypeFacts } from './ProductTypeFacts';

interface Asset3DDetailProps {
  listing: any;
  reviews: any[];
  relatedListings: any[];
  onContactSeller: () => void;
  onShare: () => void;
  onEnroll: (planIndex?: number) => void;
  canBuy: boolean;
  isSandbox?: boolean;
  listingId?: string;
  onReviewAdded?: () => void;
}

const formatStatus = (status?: string) => String(status || 'pending').replace(/_/g, ' ');

export const Asset3DDetail: React.FC<Asset3DDetailProps> = ({
  listing,
  reviews,
  relatedListings,
  onContactSeller,
  onShare,
  canBuy,
  isSandbox,
  listingId,
  onReviewAdded,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const isOwner = user?.id === listing.seller_id;

  useEffect(() => {
    const load3DData = async () => {
      const [
        detailsRes,
        filesRes,
        analysisRes,
        issuesRes,
        previewsRes,
        settingsRes,
        licensesRes,
      ] = await Promise.all([
        supabase.from('product_3d_details').select('*').eq('listing_id', listing.id).maybeSingle(),
        supabase.from('product_3d_files').select('*').eq('listing_id', listing.id).order('created_at', { ascending: true }),
        supabase.from('product_3d_analysis').select('*').eq('listing_id', listing.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('product_3d_analysis_issues').select('*').eq('listing_id', listing.id).order('created_at', { ascending: false }),
        supabase.from('product_3d_previews').select('*').eq('listing_id', listing.id).order('created_at', { ascending: false }),
        supabase.from('product_3d_preview_settings').select('*').eq('listing_id', listing.id).maybeSingle(),
        supabase.from('product_3d_licenses').select('*, product_3d_license_prices(*)').eq('listing_id', listing.id).eq('active', true).order('created_at', { ascending: true }),
      ]);

      if (detailsRes.data) setDetails(detailsRes.data);
      if (filesRes.data) setFiles(filesRes.data);
      if (analysisRes.data) setAnalysis(analysisRes.data);
      if (issuesRes.data) setIssues(issuesRes.data);
      if (previewsRes.data) setPreviews(previewsRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (licensesRes.data) {
        setLicenses(licensesRes.data);
        setSelectedLicenseId((current) => current || licensesRes.data[0]?.id || '');
      }
    };
    load3DData().catch((error) => console.error('Failed to load 3D asset data', error));
  }, [listing.id]);

  const selectedLicense = licenses.find((license) => license.id === selectedLicenseId) || licenses[0];
  const selectedPrice = selectedLicense?.product_3d_license_prices?.[0];
  const priceMinor = Number(selectedPrice?.sale_price_minor ?? selectedPrice?.price_minor ?? Math.round(Number(listing.price || 0) * 100));
  const currency = selectedPrice?.currency || 'eur';
  const previewPublicUrl = (preview: any) => {
    if (!preview?.bucket_id || !preview?.storage_path || !preview?.is_public) return null;
    return supabase.storage.from(preview.bucket_id).getPublicUrl(preview.storage_path).data.publicUrl;
  };
  const posterPreview = previews.find((preview) => preview.preview_type === 'poster' || preview.preview_type === 'thumbnail');
  const glbPreviewRow = previews.find((preview) => preview.preview_type === 'glb' && preview.is_public);
  const posterUrl = previewPublicUrl(posterPreview) || listing.images?.[0] || listing.image_url || listing.metadata?.asset3d?.coverUrl;
  const glbPreview = previewPublicUrl(glbPreviewRow) || listing.metadata?.asset3d?.previewUrl;
  const canShowPreview = Boolean(glbPreview);
  const downloadFiles = files.filter((file) => file.buyer_downloadable || isOwner);

  const specChips = useMemo(() => {
    const chips = [
      details?.primary_format?.toUpperCase(),
      details?.rigged ? 'Rigged' : null,
      details?.animated ? `${analysis?.animation_count || 1} animations` : null,
      details?.game_ready ? 'Game-ready' : null,
      details?.pbr ? 'PBR' : null,
      details?.has_uvs ? 'UV mapped' : null,
      analysis?.triangle_count ? `${Number(analysis.triangle_count).toLocaleString()} tris` : null,
      details?.download_size_bytes ? formatBytes(details.download_size_bytes) : null,
    ].filter(Boolean);
    return chips as string[];
  }, [details, analysis]);

  const handleBuy = async () => {
    if (!selectedLicense) {
      toast.error('Select a license before checkout.');
      return;
    }
    if (priceMinor === 0) {
      try {
        const result = await invokeApiRunner('3d/create-free-order', {
          listingId: listing.id,
          licenseId: selectedLicense.id,
        });
        if (result.error) throw new Error(result.error);
        navigate(`/payment-success?listingId=${listing.id}&order_id=${result.orderId}`);
      } catch (error: any) {
        toast.error(error.message || 'Could not create free order.');
      }
      return;
    }
    navigate(`/checkout/${listing.id}?license=${selectedLicense.id}`);
  };

  const handleDownload = async (file: any) => {
    setDownloadingFileId(file.id);
    try {
      const result = await invokeApiRunner('3d/request-download', { fileId: file.id });
      if (result.error) throw new Error(result.error);
      window.location.href = result.signedUrl;
    } catch (error: any) {
      toast.error(error.message || 'Download is not available.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onShare} className="rounded-xl border border-white/10 p-3 text-gray-300 transition hover:bg-white/10 hover:text-white" aria-label="Share listing">
              <Share className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isSandbox && (
          <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
            This seller has not completed Stripe onboarding. Paid purchases are currently handled in sandbox mode.
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Wersee3DViewer
              title={listing.title}
              posterUrl={posterUrl}
              previewUrl={canShowPreview ? glbPreview : null}
              settings={settings || listing.metadata?.asset3d?.previewSettings}
              technicalSummary={{
                format: details?.primary_format || analysis?.format,
                sizeBytes: details?.download_size_bytes,
                vertices: analysis?.vertex_count,
                triangles: analysis?.triangle_count,
                materials: analysis?.material_count,
                textures: analysis?.texture_count,
                animations: analysis?.animation_count,
              }}
            />

            {!canShowPreview && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm leading-6 text-gray-400">
                No interactive browser preview is available for the current source format. Buyers still see the real included formats, thumbnails and technical metadata.
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              {specChips.map((chip) => (
                <span key={chip} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-200">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#141414] p-7 shadow-2xl">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-gray-300">
                    {details?.subcategory || '3D Assets'}
                  </span>
                  {reviews.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      {Number(listing.rating_avg || listing.rating || 0).toFixed(1)}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-semibold tracking-normal text-white">{listing.title}</h1>
                <Link to={`/@${listing.seller_handle}`} className="mt-3 block text-sm font-medium text-indigo-300 hover:underline">
                  by {listing.seller || 'Wersee Seller'}
                </Link>
                <p className="mt-5 text-sm leading-6 text-gray-400">{listing.description}</p>

                <div className="mt-7 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-gray-500">License</p>
                  {licenses.map((license) => {
                    const price = license.product_3d_license_prices?.[0];
                    const minor = Number(price?.sale_price_minor ?? price?.price_minor ?? 0);
                    return (
                      <button
                        key={license.id}
                        type="button"
                        onClick={() => setSelectedLicenseId(license.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedLicenseId === license.id ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/30'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold">{license.name}</span>
                          <span className="font-semibold">{minor === 0 ? 'Free' : formatMinorCurrency(minor, price?.currency || 'eur')}</span>
                        </div>
                        <p className={`mt-1 text-xs ${selectedLicenseId === license.id ? 'text-black/60' : 'text-gray-500'}`}>
                          {String(license.license_type).replace(/_/g, ' ')}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex items-baseline justify-between border-t border-white/10 pt-6">
                  <span className="text-sm font-semibold text-gray-400">Total</span>
                  <span className="text-4xl font-semibold tracking-normal text-white">{priceMinor === 0 ? 'Free' : formatMinorCurrency(priceMinor, currency)}</span>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={!canBuy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {priceMinor === 0 ? 'Get asset' : 'Buy license'}
                </button>
                <button
                  onClick={onContactSeller}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  <MessageSquare className="h-5 w-5" />
                  Ask seller
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14">
          <ProductTypeFacts
            type="asset_3d"
            listing={listing}
            asset3d={{ details, analysis, licenses }}
          />

          <div className="mb-8 mt-10 flex gap-2 overflow-x-auto">
            {['overview', 'included files', 'specifications', 'license', 'updates', 'reviews', 'support'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-white text-black' : 'border border-white/10 text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
                <Box className="mb-4 h-6 w-6 text-gray-400" />
                <h3 className="font-semibold text-white">Formats</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{(details?.included_formats || []).map((format: string) => format.toUpperCase()).join(', ') || 'Formats are listed after processing.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
                <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-400" />
                <h3 className="font-semibold text-white">Compatibility</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{[...(details?.supported_software || []), ...(details?.supported_engines || [])].join(', ') || 'Compatibility details are not provided yet.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
                <Tag className="mb-4 h-6 w-6 text-gray-400" />
                <h3 className="font-semibold text-white">Use cases</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{(details?.suitable_applications || []).join(', ') || 'No use cases provided.'}</p>
              </div>
            </section>
          )}

          {activeTab === 'included files' && (
            <section className="space-y-3">
              {downloadFiles.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-sm text-gray-400">No downloadable files are visible yet.</div>
              ) : downloadFiles.map((file) => (
                <div key={file.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                      {file.original_filename?.match(/\.(zip|7z)$/i) ? <FileArchive className="h-5 w-5 text-amber-300" /> : <FileText className="h-5 w-5 text-gray-300" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">{file.detected_format || file.declared_extension} · {formatBytes(file.size_bytes)} · {formatStatus(file.quarantine_status)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFileId === file.id || (!isOwner && (file.quarantine_status !== 'clear' || file.virus_scan_status !== 'clean'))}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-gray-600"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingFileId === file.id ? 'Signing...' : 'Download'}
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'specifications' && (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
              {[
                ['Vertices', analysis?.vertex_count],
                ['Triangles', analysis?.triangle_count],
                ['Materials', analysis?.material_count],
                ['Textures', analysis?.texture_count],
                ['Animations', analysis?.animation_count],
                ['Rig', analysis?.has_rig ? 'Yes' : 'No'],
                ['UV maps', analysis?.has_uv_maps ? 'Yes' : 'No'],
                ['PBR materials', analysis?.has_pbr_materials ? 'Yes' : 'No'],
                ['Up axis', analysis?.up_axis || 'Not analyzed'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between border-b border-white/8 px-5 py-4 last:border-b-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-white">{typeof value === 'number' ? value.toLocaleString() : String(value || 'Not analyzed')}</span>
                </div>
              ))}
              {issues.length > 0 && (
                <div className="space-y-3 border-t border-white/10 p-5">
                  {issues.map((issue) => (
                    <div key={issue.id} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <AlertTriangle className="h-4 w-4" />
                        {issue.title}
                      </div>
                      <p className="mt-1 text-sm text-amber-100/80">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'license' && selectedLicense && (
            <section className="rounded-2xl border border-white/10 bg-[#141414] p-6">
              <h3 className="text-xl font-semibold text-white">{selectedLicense.name}</h3>
              <p className="mt-2 text-sm capitalize text-gray-400">{String(selectedLicense.license_type).replace(/_/g, ' ')}</p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(selectedLicense.terms || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="text-sm capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={value ? 'text-emerald-300' : 'text-gray-600'}>{value ? 'Allowed' : 'Not allowed'}</span>
                  </div>
                ))}
              </div>
              {selectedLicense.custom_terms && <p className="mt-6 whitespace-pre-line text-sm leading-6 text-gray-300">{selectedLicense.custom_terms}</p>}
            </section>
          )}

          {activeTab === 'updates' && (
            <section className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-sm leading-6 text-gray-400">
              <h3 className="mb-2 text-xl font-semibold text-white">Version {details?.version_label || '1.0.0'}</h3>
              {details?.changelog || 'No changelog has been published yet.'}
            </section>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection reviews={reviews} listingId={listingId} onReviewAdded={onReviewAdded} />
          )}

          {activeTab === 'support' && (
            <section className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-sm leading-6 text-gray-400">
              <h3 className="mb-2 text-xl font-semibold text-white">Support</h3>
              {details?.support_contact || 'Contact the seller through Wersee for support and update questions.'}
            </section>
          )}
        </div>

        {relatedListings.length > 0 && (
          <div className="mt-14">
            <h3 className="mb-5 text-2xl font-semibold text-white">More from the marketplace</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedListings.slice(0, 3).map((item) => (
                <Link key={item.id} to={`/listing/${item.id}`} className="rounded-2xl border border-white/10 bg-[#141414] p-4 transition hover:bg-white/[0.06]">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.category || item.type}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
