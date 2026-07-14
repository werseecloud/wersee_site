import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: string;
  onUpload: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  darkMode?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
  customTrigger?: React.ReactNode;
}

export const FileUpload = ({ 
  bucket, 
  onUpload, 
  accept = "image/*,video/*", 
  maxSizeMB = 50,
  label = "Upload Image or Video",
  darkMode = false,
  compact = false,
  iconOnly = false,
  customTrigger
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768);
    
    // Generate a unique session ID for mobile upload
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);

    // Subscribe to realtime updates for this session
    const channel = supabase.channel(`mobile_upload_${newSessionId}`)
      .on('broadcast', { event: 'upload_complete' }, (payload) => {
        if (payload.payload.url) {
          setPreview(payload.payload.url);
          onUpload(payload.payload.url);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpload]);

  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Conversion failed'));
        }, 'image/webp', 0.8);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max size is ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    try {
      let fileToUpload = file;
      let fileExt = file.name.split('.').pop();
      
      // Convert images to WebP
      if (file.type.startsWith('image/')) {
        const webpBlob = await convertToWebP(file);
        fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, ".webp"), {
          type: 'image/webp'
        });
        fileExt = 'webp';
      }

      // We don't convert videos to webp, just upload them directly
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      setPreview(data.publicUrl);
      onUpload(data.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const mobileUploadUrl = `${window.location.origin}/upload-mobile/${sessionId}?bucket=${bucket}`;

  if (customTrigger) {
    return (
      <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer w-full h-full">
        {uploading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-white' : 'text-gray-900'}`} />
          </div>
        ) : (
          customTrigger
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  if (iconOnly) {
    return (
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors ${
          darkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
        }`}
      >
        {uploading ? (
          <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-white' : 'text-white'}`} />
        ) : (
          <Upload className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-white'}`} />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {preview && !compact ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group bg-black">
          {preview.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={preview} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          )}
          <button
            onClick={() => {
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 p-1 bg-white dark:bg-black rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      ) : (
        <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} gap-4`}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 ${compact ? 'h-full' : 'aspect-video'} rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group ${
              darkMode 
                ? 'border-white/10 hover:border-white/20 hover:bg-[#1A1A1A]' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? 'text-white' : 'text-gray-400'}`} />
            ) : (
              <>
                <div className={`p-3 rounded-full ${compact ? 'mb-1' : 'mb-3'} group-hover:scale-110 transition-transform ${
                  darkMode ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  <Upload className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                {!compact && (
                  <>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Max {maxSizeMB}MB</span>
                  </>
                )}
              </>
            )}
          </div>
          
          {!compact && isDesktop && accept.includes('image') && (
            <div className={`flex-1 aspect-video rounded-xl border flex flex-col items-center justify-center p-4 text-center ${
              darkMode 
                ? 'border-white/10 bg-[#1A1A1A]' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                <QRCodeSVG value={mobileUploadUrl} size={80} />
              </div>
              <h4 className={`text-sm font-semibold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-[#1D1D1F]'}`}>
                <Smartphone className="w-4 h-4" /> Upload via Mobile
              </h4>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scan to take a photo directly</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
