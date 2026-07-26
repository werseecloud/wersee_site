import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, Package, Lock, ExternalLink, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { PdfViewer } from './PdfViewer';

interface DigitalProductAccessProps {
  listing: any;
  onClose: () => void;
}

export const DigitalProductAccess: React.FC<DigitalProductAccessProps> = ({ listing, onClose }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  useEffect(() => {
    const extractFiles = () => {
      const extractedFiles = [];
      if (listing?.metadata?.mainFileUrl) {
        extractedFiles.push({
          id: 'main',
          name: 'Main Product File',
          url: listing.metadata.mainFileUrl,
          type: 'pdf'
        });
      }
      if (listing?.metadata?.files && Array.isArray(listing.metadata.files)) {
        extractedFiles.push(...listing.metadata.files.map((f: any, i: number) => ({
          id: `file-${i}`,
          name: f.name || `File ${i + 1}`,
          url: f.url || f.file_url,
          type: f.type || 'file'
        })));
      }
      setFiles(extractedFiles);
    };
    extractFiles();
  }, [listing]);

  const handleView = (file: any) => {
    setSelectedFile(file);
  };

  if (selectedFile) {
    return (
      <div className="h-full bg-[#F5F5F7] dark:bg-black flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#1D1D1F]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</h2>
          </div>
          <div className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
            {selectedFile.type}
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          {selectedFile.type.toLowerCase() === 'pdf' || selectedFile.url.toLowerCase().endsWith('.pdf') ? (
            <PdfViewer url={selectedFile.url} />
          ) : selectedFile.type.toLowerCase().match(/jpg|jpeg|png|gif|webp/) || selectedFile.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/) ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
              <img 
                src={selectedFile.url} 
                alt={selectedFile.name} 
                className="max-w-full max-h-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </div>
          ) : selectedFile.type.toLowerCase().match(/mp3|wav|ogg|m4a/) || selectedFile.url.toLowerCase().match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-8">
              <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-8">{selectedFile.name}</h3>
              <audio 
                controls 
                controlsList="nodownload"
                className="w-full max-w-md"
                src={selectedFile.url}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : selectedFile.type.toLowerCase().match(/mp4|webm|ogg/) || selectedFile.url.toLowerCase().match(/\.(mp4|webm|ogg)(\?.*)?$/) ? (
            <div className="w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
              <video 
                controls 
                controlsList="nodownload"
                className="w-full max-h-full"
                src={selectedFile.url}
                onContextMenu={(e) => e.preventDefault()}
              >
                Your browser does not support the video element.
              </video>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Preview Not Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                This file type cannot be previewed directly in the browser. 
                For security reasons, direct downloads are disabled.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#F5F5F7] dark:bg-black overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <button 
          onClick={onClose}
          className="mb-8 text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2"
        >
          &larr; Back to Workspace
        </button>

        <div className="bg-white dark:bg-[#1D1D1F] rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-square bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden relative flex-shrink-0">
              {listing?.image_url || listing?.image ? (
                <img src={listing.image_url || listing.image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                <FileText className="w-3 h-3" /> Digital Product
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{listing?.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {listing?.description || 'Thank you for your purchase. You can view your files below.'}
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Available Files
                </h3>
                
                {files.length > 0 ? (
                  <div className="grid gap-3">
                    {files.map((file) => (
                      <motion.div 
                        key={file.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{file.type}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleView(file)}
                          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> View File
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No files available to view.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
