export type WerseeStoredObject = {
  objectId: string;
  provider: 'strato' | 'supabase';
  bucketId: string;
  logicalPath: string;
  fileId: string | null;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  visibility: 'public' | 'private';
  status: 'uploading' | 'available' | 'failed' | 'deleted';
  url: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StorageProgress = {
  acknowledgedBytes: number;
  totalBytes: number;
  percent: number;
  currentFile?: number;
  totalFiles?: number;
};

export type WerseeUploadOptions = {
  bucketId: string;
  logicalPath: string;
  file: File;
  workspaceId?: string | null;
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (progress: StorageProgress) => void;
  onController?: (controller: WerseeUploadController) => void;
};

export type WerseeUploadController = {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
};

export type StorageApiErrorPayload = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
};

export type BucketPolicy = {
  id: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  enabled: boolean;
  write_provider: 'strato' | 'supabase';
  read_mode: 'hybrid' | 'strato-only' | 'supabase-only';
  fallback_to_supabase: boolean;
};
