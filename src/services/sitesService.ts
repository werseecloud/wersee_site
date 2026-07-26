import { Upload } from 'tus-js-client';
import { supabase, supabasePublishableKey } from '../lib/supabase';

export class SitesApiError extends Error {
  constructor(public code: string, message: string, public details: Record<string, unknown> = {}, public status = 400) {
    super(message);
  }
}

export type WerseeBusiness = {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
};

export type WerseeSiteRelease = {
  id: string;
  site_id: string;
  version: number;
  status: string;
  file_count: number;
  total_bytes: number;
  notes?: string | null;
  created_at: string;
  published_at?: string | null;
  vercel_deployment_id?: string | null;
  vercel_deployment_url?: string | null;
};

export type WerseeSite = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  site_type: 'uploaded_static' | 'wersee_builder';
  status: string;
  public_url: string;
  marketplace_listing_id?: string | null;
  marketplace_published_at?: string | null;
  spa_fallback: boolean;
  analytics_enabled: boolean;
  indexing_enabled?: boolean;
  indexing_status?: 'not_submitted' | 'submitted' | 'failed' | 'disabled';
  last_indexing_requested_at?: string | null;
  ai_text_enhancement_enabled?: boolean;
  strict_security_mode: boolean;
  default_document: string;
  custom_404_behavior: 'file' | 'spa' | 'default';
  active_release_id?: string | null;
  active_release?: WerseeSiteRelease | null;
  current_job?: { status: string; stage: string; progress: number; support_reference?: string } | null;
  business?: WerseeBusiness;
  views_last_7_days?: number;
  last_editor?: string;
  created_at: string;
  updated_at: string;
};

export type SitesOverviewResponse = {
  businesses: WerseeBusiness[];
  sites: WerseeSite[];
  username?: string | null;
};

export const parseSitesOverviewResponse = (payload: unknown): SitesOverviewResponse => {
  if (!payload || typeof payload !== 'object') {
    throw new SitesApiError(
      'INVALID_SITES_RESPONSE',
      'Wersee Sites returned an invalid response. Try again or contact support if this continues.',
      {},
      502,
    );
  }

  const response = payload as Partial<SitesOverviewResponse>;
  if (!Array.isArray(response.businesses) || !Array.isArray(response.sites)) {
    throw new SitesApiError(
      'INVALID_SITES_RESPONSE',
      'Wersee Sites returned an incomplete response. Try again or contact support if this continues.',
      {},
      502,
    );
  }

  return {
    businesses: response.businesses,
    sites: response.sites,
    username: typeof response.username === 'string' || response.username === null
      ? response.username
      : undefined,
  };
};

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new SitesApiError('AUTH_REQUIRED', 'Sign in to manage Wersee Sites.', {}, 401);
  return data.session.access_token;
};

export const sitesRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(path.startsWith('/api/') ? path : `/api/sites${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error || {};
    throw new SitesApiError(error.code || 'SITE_REQUEST_FAILED', error.message || 'Wersee Sites could not complete the request.', error.details || {}, response.status);
  }
  return payload as T;
};

export type SiteUploadDestination = {
  bucket: string;
  prefix: string;
  tusEndpoint: string;
  chunkSize: number;
};

type UploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
  remainingFiles: number;
  speedBytesPerSecond: number;
};

export const uploadSiteSources = async (
  files: Array<{ file: File; relativePath: string }>,
  destination: SiteUploadDestination,
  onProgress: (progress: UploadProgress) => void,
  signal: AbortSignal,
) => {
  const token = await getAccessToken();
  const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0);
  const completedBytes = new Map<number, number>();
  const startedAt = Date.now();
  let activeUpload: Upload | null = null;

  const report = (remainingFiles: number) => {
    const uploadedBytes = [...completedBytes.values()].reduce((sum, value) => sum + value, 0);
    const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.25);
    onProgress({ uploadedBytes, totalBytes, remainingFiles, speedBytesPerSecond: uploadedBytes / elapsedSeconds });
  };

  const abort = () => { void activeUpload?.abort(false); };
  signal.addEventListener('abort', abort);
  try {
    for (let index = 0; index < files.length; index += 1) {
      if (signal.aborted) throw new SitesApiError('SITE_UPLOAD_CANCELLED', 'The upload was paused. Resume to continue.');
      const item = files[index];
      const relativePath = item.relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
      const objectName = `${destination.prefix}/${files.length === 1 && item.file.name.toLowerCase().endsWith('.zip') ? 'source.zip' : `files/${relativePath}`}`;
      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(item.file, {
          endpoint: destination.tusEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: destination.chunkSize,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          headers: { authorization: `Bearer ${token}`, apikey: supabasePublishableKey },
          metadata: {
            bucketName: destination.bucket,
            objectName,
            contentType: item.file.type || 'application/octet-stream',
            cacheControl: '3600',
          },
          fingerprint: async () => `wersee-sites-${objectName}-${item.file.size}-${item.file.lastModified}`,
          onError: (error) => reject(new SitesApiError('SITE_UPLOAD_FAILED', error.message || 'The upload failed.')),
          onProgress: (uploaded) => {
            completedBytes.set(index, uploaded);
            report(files.length - index - 1);
          },
          onSuccess: () => {
            completedBytes.set(index, item.file.size);
            report(files.length - index - 1);
            resolve();
          },
        });
        activeUpload = upload;
        signal.addEventListener('abort', () => {
          void upload.abort(false).finally(() => reject(new SitesApiError('SITE_UPLOAD_CANCELLED', 'The upload was paused. Resume to continue.')));
        }, { once: true });
        void upload.findPreviousUploads().then((previous) => {
          if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        }).catch(reject);
      });
    }
  } finally {
    signal.removeEventListener('abort', abort);
  }
};

export const downloadSitesAnalyticsCsv = async (siteId: string, from: string, to: string) => {
  const token = await getAccessToken();
  const response = await fetch(`/api/sites/${siteId}/analytics/export?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new SitesApiError(payload?.error?.code || 'SITE_EXPORT_FAILED', payload?.error?.message || 'The CSV export failed.');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const name = disposition.match(/filename="([^"]+)"/)?.[1] || 'wersee-sites-analytics.csv';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};
