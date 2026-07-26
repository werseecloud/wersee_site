import React, { useRef, useState } from 'react';
import { Loader2, UploadCloud, Video, X } from 'lucide-react';
import { uploadWerseeFile } from '../../services/werseeStorage';
import { appToast } from '@/lib/feedback';
import { QuickPayVideoPlayer } from '../public/QuickPayVideoPlayer';

type PaymentLinkVideoUploadProps = {
  userId: string;
  value: string;
  poster?: string;
  onChange: (url: string) => void;
};

const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_VIDEO_BYTES = 512 * 1024 * 1024;

export const PaymentLinkVideoUpload = ({
  userId,
  value,
  poster,
  onChange,
}: PaymentLinkVideoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      appToast('Choose an MP4, WebM, OGG or MOV video.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      appToast('The video may be up to 512 MB.');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const object = await uploadWerseeFile({
        bucketId: 'payment-link-media',
        logicalPath: `${userId}/quick-pay/${crypto.randomUUID()}.${extension}`,
        file,
        concurrency: 3,
        onProgress: ({ percent }) => setProgress(percent),
      });
      if (!object.url) throw new Error('STRATO_PUBLIC_VIDEO_URL_MISSING');
      onChange(object.url);
      appToast('Video uploaded to Wersee Storage.');
    } catch (error) {
      console.error('Payment link video upload failed', error);
      appToast(error instanceof Error ? error.message : 'The video could not be uploaded.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <QuickPayVideoPlayer src={value} poster={poster} title="Payment link video preview" className="aspect-video" />
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Remove video"
          className="absolute right-3 top-3 z-20 rounded-full bg-black/65 p-2 text-white backdrop-blur-md transition hover:bg-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.03] text-center transition hover:border-yellow-400/45 hover:bg-yellow-400/[0.04] disabled:cursor-wait"
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-yellow-300" />
            <span className="mt-3 text-sm font-bold text-white">Uploading to STRATO… {progress}%</span>
            <span className="mt-1 text-xs text-white/35">The upload can safely continue in chunks.</span>
          </>
        ) : (
          <>
            <span className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-300">
              <Video className="h-6 w-6" />
            </span>
            <span className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
              <UploadCloud className="h-4 w-4" /> Add background video
            </span>
            <span className="mt-1 text-xs text-white/35">MP4, WebM, OGG or MOV · max 512 MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime,.mov"
        onChange={uploadVideo}
        className="hidden"
      />
    </div>
  );
};
