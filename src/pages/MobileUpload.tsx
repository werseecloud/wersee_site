import React, { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadWerseeFile } from '../services/werseeStorage';

import { appToast } from '@/lib/feedback';
export const MobileUpload = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const bucket = searchParams.get('bucket') || 'listings';
  
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const object = await uploadWerseeFile({
        bucketId: bucket,
        logicalPath: filePath,
        file,
      });
      if (!object.url) throw new Error('STORAGE_PUBLIC_URL_MISSING');
      
      // Broadcast the URL to the desktop session
      await supabase.channel(`mobile_upload_${sessionId}`).send({
        type: 'broadcast',
        event: 'upload_complete',
        payload: { url: object.url }
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      appToast('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-[#1D1D1F] dark:text-white mb-2">Upload Successful!</h1>
        <p className="text-gray-500 dark:text-gray-400">You can now return to your desktop.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-[#1D1D1F] p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1D1D1F] dark:text-white mb-2">Upload Photo</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Take a photo or choose from your library to upload to your desktop session.</p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Select Photo
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
