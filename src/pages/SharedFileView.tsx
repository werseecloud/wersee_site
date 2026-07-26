import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { 
  File, Video, Image as ImageIcon, FileText, FileArchive, 
  Download, Loader2, AlertCircle, Folder
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { appToast } from '@/lib/feedback';
export const SharedFileView = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [folderItems, setFolderItems] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loadingFolder, setLoadingFolder] = useState(false);

  const fetchFolderContents = async (path: string = '') => {
    if (!token) return;
    setLoadingFolder(true);
    try {
      const resData = await invokeApiRunner('storage-shared-list-folder', { token, path });
      if (resData.error) throw new Error(resData.error || 'Failed to list folder');
      const { items } = resData;
      setFolderItems(items);
      setCurrentPath(path);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingFolder(false);
    }
  };

  useEffect(() => {
    const fetchSharedFile = async () => {
      if (!token) return;
      
      try {
        // 1. Get share info
        const { data: shareData, error: shareError } = await supabase
          .from('shared_files')
          .select('*')
          .eq('share_token', token)
          .single();

        if (shareError || !shareData) {
          throw new Error('Link is invalid or has expired.');
        }

        if (new Date(shareData.expires_at) < new Date()) {
          throw new Error('This link has expired.');
        }

        if (!shareData.is_public) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('Authentication required to access this file.');
          }
          const isOwner = shareData.user_id === user.id;
          const isAllowed = shareData.allowed_emails?.includes(user.email);
          if (!isOwner && !isAllowed) {
            throw new Error('You do not have permission to access this file.');
          }
        }

        setFileData(shareData);

        // 2. If it's a single file, get a signed URL to view it
        if (!shareData.is_folder) {
          const resData = await invokeApiRunner('storage-shared', { token });
          if (resData.error) throw new Error(resData.error || 'Failed to get file URL');
          const { url, is_downloadable } = resData;
          setSignedUrl(url);
          setFileData({ ...shareData, is_downloadable });
        } else {
          // It's a folder, fetch contents
          await fetchFolderContents('');
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFile();
  }, [token]);

  const handleDownloadItem = async (item: any) => {
    if (!item.id) return; // Cannot download subfolder directly here yet
    
    try {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      const resData = await invokeApiRunner('storage-shared-file-url', { token, path: itemPath });
      if (resData.error) throw new Error(resData.error || 'Failed to get file URL');
      const { url } = resData;
      const fileResponse = await fetch(url);
      const blob = await fileResponse.blob();
      saveAs(blob, item.name);
    } catch (err: any) {
      appToast(err.message);
    }
  };

  const handleDownload = async () => {
    if (!fileData) return;
    
    if (fileData.is_folder) {
      try {
        const resData = await invokeApiRunner('storage-shared-download-folder', { token });
        if (resData.error) throw new Error(resData.error || 'Failed to download folder');
        
        // In preview, this will throw 501. If it returns a blob URL, we can fetch it.
        if (resData.url) {
          const response = await fetch(resData.url);
          const blob = await response.blob();
          const filename = fileData.file_path.split('/').pop() || 'folder';
          saveAs(blob, `${filename}.zip`);
        }
      } catch (err: any) {
        appToast(err.message);
      }
    } else if (signedUrl) {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const filename = fileData.file_path.split('/').pop() || 'download';
      saveAs(blob, filename);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Authentication required');
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white p-4">
        <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          {isAuthError && (
            <button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({ provider: 'google' });
              }}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Sign In to Access
            </button>
          )}
        </div>
      </div>
    );
  }

  const filename = fileData?.file_path.split('/').pop() || 'Unknown File';
  const isVideo = filename.match(/\.(mp4|webm|ogg)$/i);
  const isImage = filename.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
            W
          </div>
          <span className="font-bold text-lg tracking-tight">Wersee Storage</span>
        </div>
        {fileData?.is_downloadable !== false && (
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
            {fileData?.is_folder ? <Folder className="w-5 h-5 text-blue-400" /> : <File className="w-5 h-5 text-gray-400" />}
            <h2 className="font-medium truncate">{filename}</h2>
          </div>
          
          <div className="p-8 flex items-center justify-center min-h-[400px] bg-black/50">
            {fileData?.is_folder ? (
              <div className="w-full">
                {currentPath && (
                  <button 
                    onClick={() => {
                      const parts = currentPath.split('/');
                      parts.pop();
                      fetchFolderContents(parts.join('/'));
                    }}
                    className="mb-4 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    &larr; Back
                  </button>
                )}
                {loadingFolder ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : folderItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folderItems.map((item) => (
                      <div key={item.name} className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                        <div 
                          className={`flex items-center gap-3 ${!item.id ? 'cursor-pointer hover:text-indigo-400' : ''}`}
                          onClick={() => !item.id && fetchFolderContents(currentPath ? `${currentPath}/${item.name}` : item.name)}
                        >
                          {!item.id ? <Folder className="w-5 h-5 text-blue-400" /> : <File className="w-5 h-5 text-gray-400" />}
                          <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                        </div>
                        {item.id && fileData.is_downloadable !== false && (
                          <button 
                            onClick={() => handleDownloadItem(item)}
                            className="p-2 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">This folder is empty</p>
                  </div>
                )}
              </div>
            ) : isVideo && signedUrl ? (
              <video 
                src={signedUrl} 
                controls 
                controlsList={fileData?.is_downloadable === false ? "nodownload" : undefined}
                className="max-w-full max-h-[600px] rounded-lg shadow-2xl" 
                autoPlay 
              />
            ) : isImage && signedUrl ? (
              <img 
                src={signedUrl} 
                alt={filename} 
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl" 
                onContextMenu={(e) => fileData?.is_downloadable === false ? e.preventDefault() : undefined}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center">
                <FileText className="w-24 h-24 mx-auto text-gray-500 mb-4 opacity-50" />
                <p className="text-xl font-medium">No Preview Available</p>
                <p className="text-gray-400 mt-2">This file type cannot be previewed in the browser.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
