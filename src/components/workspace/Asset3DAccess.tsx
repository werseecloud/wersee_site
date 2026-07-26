import React, { useEffect, useState } from 'react';
import { ArrowLeft, Box, Download, FileArchive, FileText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { formatBytes } from '../../lib/asset3d';
import { Wersee3DViewer } from '../asset3d/Wersee3DViewer';

interface Asset3DAccessProps {
  listing: any;
  onClose: () => void;
}

export const Asset3DAccess: React.FC<Asset3DAccessProps> = ({ listing, onClose }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [previews, setPreviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [filesRes, detailsRes, previewsRes, settingsRes] = await Promise.all([
        supabase.from('product_3d_files').select('*').eq('listing_id', listing.id).eq('buyer_downloadable', true).order('created_at', { ascending: true }),
        supabase.from('product_3d_details').select('*').eq('listing_id', listing.id).maybeSingle(),
        supabase.from('product_3d_previews').select('*').eq('listing_id', listing.id).order('created_at', { ascending: false }),
        supabase.from('product_3d_preview_settings').select('*').eq('listing_id', listing.id).maybeSingle(),
      ]);
      setFiles(filesRes.data || []);
      setDetails(detailsRes.data || null);
      setPreviews(previewsRes.data || []);
      setSettings(settingsRes.data || null);
    };
    load().catch((error) => console.error('Failed to load purchased 3D asset', error));
  }, [listing.id]);

  const publicPreviewUrl = (preview: any) => {
    if (!preview?.is_public) return null;
    return supabase.storage.from(preview.bucket_id).getPublicUrl(preview.storage_path).data.publicUrl;
  };

  const poster = publicPreviewUrl(previews.find((preview) => ['poster', 'thumbnail'].includes(preview.preview_type))) || listing.images?.[0] || listing.image_url || listing.metadata?.asset3d?.coverUrl;
  const previewUrl = publicPreviewUrl(previews.find((preview) => preview.preview_type === 'glb')) || listing.metadata?.asset3d?.previewUrl;

  const handleDownload = async (file: any) => {
    setDownloading(file.id);
    try {
      const result = await invokeApiRunner('3d/request-download', { fileId: file.id });
      if (result.error) throw new Error(result.error);
      window.location.href = result.signedUrl;
    } catch (error: any) {
      toast.error(error.message || 'Download is not available.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl p-6 pt-10">
        <button onClick={onClose} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Wersee3DViewer
              title={listing.title}
              posterUrl={poster}
              previewUrl={previewUrl}
              settings={settings || listing.metadata?.asset3d?.previewSettings}
              technicalSummary={{
                format: details?.primary_format,
                sizeBytes: details?.download_size_bytes,
              }}
            />
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Purchase verified
              </div>
              <h1 className="text-3xl font-semibold tracking-normal text-white">{listing.title}</h1>
              <p className="mt-3 text-sm leading-6 text-gray-400">{listing.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Box className="h-5 w-5 text-sky-300" />
                <h2 className="text-xl font-semibold text-white">Downloads</h2>
              </div>
              {files.length === 0 ? (
                <p className="text-sm leading-6 text-gray-400">No cleared download files are available yet.</p>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          {file.original_filename?.match(/\.(zip|7z)$/i) ? <FileArchive className="h-5 w-5 text-amber-300" /> : <FileText className="h-5 w-5 text-gray-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{file.original_filename}</p>
                          <p className="mt-1 text-xs text-gray-500">{file.detected_format || file.declared_extension} · {formatBytes(file.size_bytes)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloading === file.id || file.quarantine_status !== 'clear' || file.virus_scan_status !== 'clean'}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === file.id ? 'Signing download...' : 'Download file'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
