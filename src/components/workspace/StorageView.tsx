import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Folder, File as FileIcon, Upload, Download, Trash2, Share2, 
  Video, Image as ImageIcon, FileText, FileArchive,
  ChevronRight, MoreVertical, X, Play, HardDrive, Search, Edit3,
  Loader2, Link as LinkIcon, Grid, List, ArrowDownAZ, Calendar, HardDrive as DriveIcon,
  Plus, CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageSidebar } from './StorageSidebar';
import { Skeleton } from '../ui/Skeleton';

import { appToast, destructiveAction } from '@/lib/feedback';
interface StorageItem {
  id: string;
  name: string;
  isFolder: boolean;
  size?: number;
  type?: string;
  updatedAt: string;
  path: string;
  url?: string;
  isStarred?: boolean;
}

export const StorageView = () => {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ current: 0, total: 0 });
  const [usage, setUsage] = useState({ used: 0, limit: 20 * 1024 * 1024 * 1024 });
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [sidebarItem, setSidebarItem] = useState<StorageItem | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // New features state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [folders, setFolders] = useState<StorageItem[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'starred' | 'recent'>('all');
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkSetup();
    fetchUsage();
    // Load starred items from local storage for persistence
    const savedStars = localStorage.getItem('wersee_starred_files');
    if (savedStars) setStarredIds(new Set(JSON.parse(savedStars)));
  }, []);

  useEffect(() => {
    localStorage.setItem('wersee_starred_files', JSON.stringify(Array.from(starredIds)));
  }, [starredIds]);

  useEffect(() => {
    fetchStorage();
  }, [currentPath, sortBy, sortOrder]);

  const checkSetup = async () => {
    const hasSetup = localStorage.getItem('wersee_storage_setup');
    if (!hasSetup) {
      setShowWizard(true);
    }
  };

  const completeSetup = () => {
    localStorage.setItem('wersee_storage_setup', 'true');
    setShowWizard(false);
  };

  const fetchUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUsage({ used: data.used_bytes, limit: data.plan_limit_bytes });
    }
  };

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pathString = [user.id, ...currentPath].join('/');
      
      const { data, error } = await supabase.storage
        .from('business_storage')
        .list(pathString, {
          limit: 1000,
          offset: 0,
        });

      if (error) throw error;

      let formattedItems: StorageItem[] = data.map(item => ({
        id: item.id || item.name,
        name: item.name,
        isFolder: !item.id,
        size: item.metadata?.size,
        type: item.metadata?.mimetype,
        updatedAt: item.created_at || new Date().toISOString(),
        path: [...currentPath, item.name].join('/'),
        isStarred: starredIds.has(item.id || item.name)
      })).filter(item => item.name !== '.emptyFolderPlaceholder');

      // Filtering
      if (filterMode === 'starred') {
        formattedItems = formattedItems.filter(item => starredIds.has(item.id));
      } else if (filterMode === 'recent') {
        formattedItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        formattedItems = formattedItems.slice(0, 20);
      }

      if (searchQuery) {
        formattedItems = formattedItems.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sorting
      formattedItems.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        } else if (sortBy === 'size') {
          comparison = (a.size || 0) - (b.size || 0);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Folders always first
      formattedItems.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return 0;
      });

      setItems(formattedItems);

      // If we are at root, update the sidebar folders list
      if (currentPath.length === 0) {
        setFolders(formattedItems.filter(i => i.isFolder));
      }
    } catch (err) {
      console.error('Error fetching storage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
    // Reset input
    if (e.target) e.target.value = '';
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadStats({ current: 0, total: files.length });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let totalUploaded = 0;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let completedFiles = 0;

    try {
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          appToast(`File ${file.name} exceeds 50MB limit.`);
          completedFiles++;
          continue;
        }

        const relativePath = file.webkitRelativePath || file.name;
        const fullPath = [user.id, ...currentPath, relativePath].join('/');

        const { error } = await supabase.storage
          .from('business_storage')
          .upload(fullPath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error('Upload error:', error);
        } else {
          totalUploaded += file.size;
          completedFiles++;
          setUploadProgress(Math.round((totalUploaded / totalSize) * 100));
          setUploadStats(prev => ({ ...prev, current: completedFiles }));
          
          await supabase.rpc('increment_storage_usage', { 
            user_id: user.id, 
            bytes: file.size 
          });
        }
      }
    } catch (err) {
      console.error('Error during upload:', err);
    } finally {
      setUploading(false);
      fetchStorage();
      fetchUsage();
    }
  };

  const handleDownload = async (item: StorageItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (item.isFolder) {
      setLoading(true);
      try {
        const zip = new JSZip();
        await addFolderToZip(zip, [user.id, ...currentPath, item.name].join('/'), item.name);
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${item.name}.zip`);
      } catch (err) {
        console.error('Error zipping folder:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const { data, error } = await supabase.storage
        .from('business_storage')
        .download([user.id, item.path].join('/'));
        
      if (error) {
        console.error('Download error:', error);
        return;
      }
      saveAs(data, item.name);
    }
  };

  const addFolderToZip = async (zip: JSZip, folderPath: string, zipPath: string) => {
    const { data, error } = await supabase.storage
      .from('business_storage')
      .list(folderPath);
      
    if (error || !data) return;

    for (const item of data) {
      if (!item.id) {
        const newZipFolder = zip.folder(item.name);
        if (newZipFolder) {
          await addFolderToZip(newZipFolder, `${folderPath}/${item.name}`, `${zipPath}/${item.name}`);
        }
      } else {
        const { data: fileData } = await supabase.storage
          .from('business_storage')
          .download(`${folderPath}/${item.name}`);
        if (fileData) {
          zip.file(item.name, fileData);
        }
      }
    }
  };

  const handleDelete = async (item: StorageItem) => {
    if (!(await destructiveAction({ description: `Are you sure you want to delete ${item.name}?` }))) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      if (item.isFolder) {
        await deleteFolderContents([user.id, item.path].join('/'));
      } else {
        await supabase.storage
          .from('business_storage')
          .remove([[user.id, item.path].join('/')]);
          
        if (item.size) {
          await supabase.rpc('decrement_storage_usage', { 
            user_id: user.id, 
            bytes: item.size 
          });
        }
      }
      fetchStorage();
      fetchUsage();
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFolderContents = async (folderPath: string) => {
    const { data } = await supabase.storage.from('business_storage').list(folderPath);
    if (!data) return;

    for (const item of data) {
      if (!item.id) {
        await deleteFolderContents(`${folderPath}/${item.name}`);
      } else {
        await supabase.storage.from('business_storage').remove([`${folderPath}/${item.name}`]);
        if (item.metadata?.size) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
             await supabase.rpc('decrement_storage_usage', { user_id: user.id, bytes: item.metadata.size });
          }
        }
      }
    }
    // Remove the empty folder placeholder if it exists
    await supabase.storage.from('business_storage').remove([`${folderPath}/.emptyFolderPlaceholder`]);
  };

  const handleShare = (item: StorageItem) => {
    setSidebarItem(item);
  };

  const handleRename = async () => {
    if (!selectedItem || !newName.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const oldPath = [user.id, selectedItem.path].join('/');
      const newPath = [user.id, ...currentPath, newName].join('/');

      const { error } = await supabase.storage
        .from('business_storage')
        .move(oldPath, newPath);

      if (error) throw error;
      
      setRenameModalOpen(false);
      fetchStorage();
    } catch (err) {
      console.error('Error renaming:', err);
      appToast('Failed to rename. Make sure the name is unique.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      // In Supabase storage, folders are created by uploading a placeholder file
      const placeholderPath = [user.id, ...currentPath, newFolderName, '.emptyFolderPlaceholder'].join('/');
      
      const { error } = await supabase.storage
        .from('business_storage')
        .upload(placeholderPath, new Blob(['']), {
          upsert: true
        });

      if (error) throw error;
      
      setNewFolderModalOpen(false);
      setNewFolderName('');
      fetchStorage();
    } catch (err) {
      console.error('Error creating folder:', err);
      appToast('Failed to create folder.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = (item: StorageItem) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!(await destructiveAction({ description: `Are you sure you want to delete ${selectedIds.size} items?` }))) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const itemsToDelete = items.filter(i => selectedIds.has(i.id));
      const paths = itemsToDelete.map(i => [user.id, i.path].join('/'));
      
      const { error } = await supabase.storage
        .from('business_storage')
        .remove(paths);

      if (error) throw error;

      // Update usage
      const totalSize = itemsToDelete.reduce((acc, i) => acc + (i.size || 0), 0);
      await supabase.rpc('decrement_storage_usage', { 
        user_id: user.id, 
        bytes: totalSize 
      });

      setSelectedIds(new Set());
      fetchStorage();
      fetchUsage();
    } catch (err) {
      console.error('Batch delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUnzip = async (item: StorageItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('business_storage')
        .download([user.id, item.path].join('/'));
        
      if (error || !data) throw error;

      const zip = new JSZip();
      const contents = await zip.loadAsync(data);
      
      const folderName = item.name.replace('.zip', '');
      const filesToUpload: File[] = [];

      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir) {
          const blob = await zipEntry.async('blob');
          const file = new File([blob], `${folderName}/${filename}`);
          filesToUpload.push(file);
        }
      }

      await uploadFiles(filesToUpload);
    } catch (err) {
      console.error('Error unzipping:', err);
      appToast('Failed to unzip file.');
    } finally {
      setLoading(false);
    }
  };

  const openViewer = async (item: StorageItem) => {
    if (item.isFolder) {
      setCurrentPath([...currentPath, item.name]);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.storage
      .from('business_storage')
      .createSignedUrl([user.id, item.path].join('/'), 3600);

    if (data) {
      setSelectedItem({ ...item, url: data.signedUrl });
      setViewerOpen(true);
    }
  };

  const getIcon = (item: StorageItem) => {
    if (item.isFolder) {
      const name = item.name.toLowerCase();
      if (name.includes('export')) return <Folder className="w-8 h-8 text-indigo-400" />;
      if (name.includes('image') || name.includes('photo')) return <Folder className="w-8 h-8 text-emerald-400" />;
      if (name.includes('video') || name.includes('movie')) return <Folder className="w-8 h-8 text-purple-400" />;
      if (name.includes('document') || name.includes('pdf')) return <Folder className="w-8 h-8 text-blue-400" />;
      if (name.includes('music') || name.includes('audio')) return <Folder className="w-8 h-8 text-pink-400" />;
      if (name.includes('archive') || name.includes('zip')) return <Folder className="w-8 h-8 text-yellow-400" />;
      return <Folder className="w-8 h-8 text-gray-400" />;
    }
    if (item.name.endsWith('.zip')) return <FileArchive className="w-8 h-8 text-yellow-400" />;
    if (item.type?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-emerald-400" />;
    if (item.type?.startsWith('video/')) return <Video className="w-8 h-8 text-purple-400" />;
    if (item.type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const usagePercent = Math.min(100, (usage.used / usage.limit) * 100);

  return (
    <div className="flex h-full bg-[#0A0A0A] text-white overflow-hidden">
      {/* Setup Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            >
              {wizardStep === 1 ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DriveIcon className="w-10 h-10 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Welcome to Wersee Storage</h2>
                  <p className="text-gray-400 mb-8">
                    Your secure, private cloud storage built directly into your workspace. 
                    Store assets, share files with clients, and let your AI assistant access your documents instantly.
                  </p>
                  <button 
                    onClick={() => setWizardStep(2)}
                    className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-center">What will you store?</h2>
                  <div className="space-y-3 mb-8">
                    {['Digital Products & Assets', 'Client Deliverables', 'Marketing Materials', 'Personal Backup'].map((opt, i) => (
                      <button key={i} className="w-full p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-left flex items-center justify-between group">
                        <span className="font-medium">{opt}</span>
                        <CheckCircle2 className="w-5 h-5 text-transparent group-hover:text-white/20" />
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={completeSetup}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0A0A0A] flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-lg">Storage</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button 
            onClick={() => { setCurrentPath([]); setFilterMode('all'); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${currentPath.length === 0 && filterMode === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <HardDrive className="w-4 h-4" />
            <span className="font-medium text-sm">My Files</span>
          </button>

          <button 
            onClick={() => setFilterMode('recent')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${filterMode === 'recent' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium text-sm">Recent</span>
          </button>

          <button 
            onClick={() => setFilterMode('starred')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${filterMode === 'starred' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-sm">Starred</span>
          </button>
          
          <div className="pt-4 pb-2 px-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Folders</span>
          </div>
          {folders.map(folder => (
            <button 
              key={folder.id}
              onClick={() => setCurrentPath([folder.name])}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${currentPath[0] === folder.name ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Folder className={`w-4 h-4 ${currentPath[0] === folder.name ? 'text-blue-400' : ''}`} />
              <span className="font-medium text-sm truncate">{folder.name}</span>
            </button>
          ))}
        </div>
        
        {/* Storage Usage */}
        <div className="p-4 border-t border-white/5 bg-white/5 m-3 rounded-2xl">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">Storage</span>
            <span className="font-medium">{formatSize(usage.used)}</span>
          </div>
          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">{formatSize(usage.limit)} total</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-0 sm:h-16 bg-[#0A0A0A] shrink-0 gap-3 sm:gap-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button 
                onClick={() => setCurrentPath([])}
                className="text-gray-400 hover:text-white transition-colors font-medium"
              >
                My Files
              </button>
              {currentPath.map((folder, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  <button 
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    className="text-gray-400 hover:text-white transition-colors font-medium truncate max-w-[100px] sm:max-w-none"
                  >
                    {folder}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="relative max-w-xs w-full ml-auto sm:ml-4 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {/* Mobile Search */}
            <div className="relative flex-1 sm:hidden min-w-[120px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center bg-white/5 rounded-lg p-1 shrink-0">
              <button 
                onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortBy === 'name' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Name
              </button>
              <button 
                onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortBy === 'date' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Date
              </button>
              <button 
                onClick={() => { setSortBy('size'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortBy === 'size' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Size
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-1 shrink-0 hidden sm:flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

            <button 
              onClick={() => setNewFolderModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-white/20 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white text-black rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-200 transition-colors shrink-0"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">File</span>
            </button>
            <button 
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-white/20 transition-colors shrink-0"
            >
              <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Folder</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
            <input type="file" ref={folderInputRef} onChange={handleFileUpload} className="hidden" {...{ webkitdirectory: "", directory: "" } as any} />
          </div>
        </div>

        {/* File List Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* New Folder Modal */}
          <AnimatePresence>
            {newFolderModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl"
                >
                  <h2 className="text-xl font-bold mb-4">New Folder</h2>
                  <input 
                    type="text"
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setNewFolderModalOpen(false)}
                      className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || loading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rename Modal */}
          <AnimatePresence>
            {renameModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl"
                >
                  <h2 className="text-xl font-bold mb-4">Rename {selectedItem?.isFolder ? 'Folder' : 'File'}</h2>
                  <input 
                    type="text"
                    placeholder="New name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setRenameModalOpen(false)}
                      className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRename}
                      disabled={!newName.trim() || loading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Rename
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedIds.size > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white text-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
              <span className="font-bold text-sm">{selectedIds.size} selected</span>
              <div className="h-4 w-px bg-black/10" />
              <div className="flex items-center gap-4">
                <button onClick={handleBatchDelete} className="flex items-center gap-2 text-sm font-bold text-red-600 hover:opacity-70">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-sm font-bold hover:opacity-70">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-400 font-medium">
                    Uploading {uploadStats.current} of {uploadStats.total} files...
                  </span>
                  <span className="text-blue-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Folder className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm">Upload files or folders to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map(item => (
                <div 
                  key={item.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSidebarItem(item);
                  }}
                  className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition-colors group relative flex flex-col ${selectedIds.has(item.id) ? 'border-blue-500 bg-blue-500/5' : 'border-white/5'}`}
                >
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-0"
                    />
                  </div>

                  <div 
                    className="flex flex-col items-center justify-center gap-4 cursor-pointer flex-1 py-4"
                    onClick={() => openViewer(item)}
                  >
                    <div className="relative">
                      {getIcon(item)}
                      {item.isStarred && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                          <CheckCircle2 className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full px-2">
                      <h3 className="font-bold truncate text-sm text-gray-200" title={item.name}>{item.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
                        {item.isFolder ? 'Directory' : formatSize(item.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleStar(item); }}
                        className={`p-1.5 rounded-lg transition-colors ${item.isStarred ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedItem(item);
                          setNewName(item.name);
                          setRenameModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleStar(item)} 
                      className={`p-1.5 rounded-lg transition-colors ${starredIds.has(item.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                      title={starredIds.has(item.id) ? 'Unstar' : 'Star'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${starredIds.has(item.id) ? 'fill-yellow-400' : ''}`} />
                    </button>
                    {item.name.endsWith('.zip') && (
                      <button onClick={() => handleUnzip(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Extract">
                        <FileArchive className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedItem(item); setNewName(item.name); setRenameModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Rename">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleShare(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSidebarItem(item);
                      }} 
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" 
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={items.length > 0 && selectedIds.size === items.length}
                        onChange={() => {
                          if (selectedIds.size === items.length) setSelectedIds(new Set());
                          else setSelectedIds(new Set(items.map(i => i.id)));
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-0"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Date Modified</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map(item => (
                    <tr 
                      key={item.id} 
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSidebarItem(item);
                      }}
                      className={`hover:bg-white/5 group ${selectedIds.has(item.id) ? 'bg-blue-500/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => openViewer(item)}
                        >
                          {getIcon(item)}
                          <span className="font-medium">{item.name}</span>
                          {starredIds.has(item.id) && <CheckCircle2 className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {item.isFolder ? '--' : formatSize(item.size)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleStar(item)} 
                            className={`p-1.5 rounded-lg transition-colors ${starredIds.has(item.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title={starredIds.has(item.id) ? 'Unstar' : 'Star'}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${starredIds.has(item.id) ? 'fill-yellow-400' : ''}`} />
                          </button>
                          {item.name.endsWith('.zip') && (
                            <button onClick={() => handleUnzip(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Extract">
                              <FileArchive className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { setSelectedItem(item); setNewName(item.name); setRenameModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Rename">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleShare(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownload(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSidebarItem(item);
                            }} 
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" 
                            title="More Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Rename Item</h3>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 mb-6"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setRenameModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button 
                  onClick={handleRename}
                  className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewer Modal */}
      <AnimatePresence>
        {viewerOpen && selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                {getIcon(selectedItem)}
                <h2 className="font-medium">{selectedItem.name}</h2>
              </div>
              <button onClick={() => setViewerOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
              {selectedItem.type?.startsWith('image/') ? (
                <img src={selectedItem.url} alt={selectedItem.name} className="max-w-full max-h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
              ) : selectedItem.type?.startsWith('video/') ? (
                <video src={selectedItem.url} controls className="max-w-full max-h-full rounded-lg" autoPlay />
              ) : (
                <div className="text-center">
                  <FileText className="w-24 h-24 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">Preview not available for this file type.</p>
                  <button 
                    onClick={() => handleDownload(selectedItem)}
                    className="mt-4 px-6 py-2 bg-white text-black rounded-xl font-bold"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarItem && (
          <StorageSidebar 
            item={sidebarItem} 
            onClose={() => setSidebarItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
