import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Image as ImageIcon, X, Eye, CheckCircle, AlertCircle, File, Trash2, HelpCircle, Moon, Sun } from 'lucide-react';
import { FileUpload } from '../FileUpload';
import { Tooltip } from '../ui/Tooltip';
import { BuilderLoader } from '../BuilderLoader';
import { useTheme } from '../../context/ThemeContext';

import { appToast } from '@/lib/feedback';
interface DigitalProductBuilderProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const DigitalProductBuilder = ({ initialData, onSave, onCancel }: DigitalProductBuilderProps) => {
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [data, setData] = useState({
    mainFileUrl: initialData?.mainFileUrl || '',
    previewFileUrl: initialData?.previewFileUrl || '',
    coverUrl: initialData?.coverUrl || '',
    pages: initialData?.pages || '',
    language: initialData?.language || 'English',
    format: initialData?.format || 'PDF',
    fileSize: initialData?.fileSize || '',
    versionHistory: initialData?.versionHistory || '',
    license: initialData?.license || '',
    updatesIncluded: initialData?.updatesIncluded || '',
    deviceLimit: initialData?.deviceLimit || '',
    ...initialData
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState<'content' | 'preview'>('content');



  const handleSave = () => {
    if (!data.mainFileUrl) {
      appToast('Please upload a main file.');
      return;
    }
    onSave(data);
  };

  if (loading) {
    return <BuilderLoader onComplete={() => setLoading(false)} title="Digital Product Builder" />;
  }

  return (
    <div className={`fixed inset-0 z-[110] flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <div className={`h-16 border-b flex items-center justify-between px-4 md:px-6 backdrop-blur-md sticky top-0 z-10 transition-colors ${
        isDark ? 'bg-[#050505]/80 border-white/10' : 'bg-white/80 border-gray-100'
      }`}>
        <div className="flex items-center gap-2 md:gap-4">
          <Tooltip content="Close Builder">
            <button 
              onClick={onCancel} 
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
          <h2 className={`text-sm md:text-lg font-bold truncate max-w-[150px] md:max-w-none ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Digital Product</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className={`hidden md:block h-6 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <button 
            onClick={() => setActiveTab(activeTab === 'preview' ? 'content' : 'preview')}
            className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
              activeTab === 'preview' 
                ? (isDark ? 'bg-white text-black' : 'bg-gray-100 text-black')
                : (isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-50')
            }`}
          >
            <Eye className="w-4 h-4 inline-block md:mr-2" />
            <span className="hidden md:inline">Preview</span>
          </button>
          <button 
            onClick={handleSave}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-colors flex items-center gap-2 ${
              isDark 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden md:inline">Save Product</span>
            <span className="md:hidden">Save</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-colors ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F7]'}`}>
        <div className="max-w-4xl mx-auto">
          {activeTab === 'content' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Main File Upload */}
                <section className={`p-6 md:p-8 rounded-2xl md:rounded-3xl border shadow-sm transition-colors ${
                  isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Main Product File</h3>
                        <Tooltip content="This is the file your customers will receive after purchase.">
                          <HelpCircle className={`w-4 h-4 cursor-help ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </Tooltip>
                      </div>
                      <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>The file customers will access after purchase.</p>
                    </div>
                  </div>
                  
                  <FileUpload
                    bucket="digital-downloads"
                    onUpload={(url) => setData({ ...data, mainFileUrl: url })}
                    label="Upload PDF, EPUB, or ZIP"
                    accept=".pdf,.epub,.zip,.txt"
                    maxSizeMB={100}
                    darkMode={isDark}
                  />
                  
                  {data.mainFileUrl && (
                    <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${
                      isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-green-300' : 'text-green-800'}`}>File uploaded successfully</span>
                      <button 
                        onClick={() => setData({ ...data, mainFileUrl: '' })}
                        className={`text-xs font-bold hover:underline ${isDark ? 'text-green-400' : 'text-green-700'}`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </section>

                {/* Cover Image */}
                <section className={`p-6 md:p-8 rounded-2xl md:rounded-3xl border shadow-sm transition-colors ${
                  isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
                    }`}>
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Cover Image</h3>
                      <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This will be displayed on the product page.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FileUpload
                      bucket="listings"
                      onUpload={(url) => setData({ ...data, coverUrl: url })}
                      label="Upload Cover Image"
                      accept=".jpg,.png,.webp"
                      maxSizeMB={5}
                      darkMode={isDark}
                    />
                    
                    {data.coverUrl ? (
                      <div className={`aspect-[3/4] rounded-xl overflow-hidden border relative group ${
                        isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => setData({ ...data, coverUrl: '' })}
                            className={`p-2 rounded-full ${isDark ? 'bg-black text-red-400 hover:bg-white/10' : 'bg-white text-red-500 hover:bg-red-50'}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${
                        isDark ? 'border-white/10 bg-[#1A1A1A] text-gray-600' : 'border-gray-200 bg-gray-50 text-gray-400'
                      }`}>
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium">No cover image</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Metadata */}
              <div className="space-y-6">
                <section className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>Product Details</h3>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Format</label>
                    <select 
                      value={data.format}
                      onChange={(e) => setData({ ...data, format: e.target.value })}
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark 
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30' 
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black'
                      }`}
                    >
                      <option value="PDF">PDF</option>
                      <option value="EPUB">EPUB</option>
                      <option value="ZIP">ZIP Archive</option>
                      <option value="TXT">Text File</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Page Count (Optional)</label>
                    <input 
                      type="number"
                      value={data.pages || ''}
                      onChange={(e) => setData({ ...data, pages: e.target.value })}
                      placeholder="e.g. 120"
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark 
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600' 
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Language</label>
                    <select 
                      value={data.language}
                      onChange={(e) => setData({ ...data, language: e.target.value })}
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark 
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30' 
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black'
                      }`}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Dutch">Dutch</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>File Size</label>
                    <input
                      type="text"
                      value={data.fileSize || ''}
                      onChange={(e) => setData({ ...data, fileSize: e.target.value })}
                      placeholder="e.g. 42 MB"
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>License</label>
                    <input
                      type="text"
                      value={data.license || ''}
                      onChange={(e) => setData({ ...data, license: e.target.value })}
                      placeholder="e.g. Personal and commercial use"
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Updates Included</label>
                    <input
                      type="text"
                      value={data.updatesIncluded || ''}
                      onChange={(e) => setData({ ...data, updatesIncluded: e.target.value })}
                      placeholder="e.g. 12 months of updates"
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Device / Activation Limits</label>
                    <input
                      type="text"
                      value={data.deviceLimit || ''}
                      onChange={(e) => setData({ ...data, deviceLimit: e.target.value })}
                      placeholder="e.g. 2 devices, 1 active install"
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors ${
                        isDark
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Version History</label>
                    <textarea
                      value={data.versionHistory || ''}
                      onChange={(e) => setData({ ...data, versionHistory: e.target.value })}
                      placeholder="e.g. v1.1 added EPUB, v1.0 initial release"
                      rows={3}
                      className={`w-full p-3 rounded-xl border outline-none text-sm transition-colors resize-none ${
                        isDark
                          ? 'bg-[#1A1A1A] border-white/10 text-white focus:border-white/30 placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-gray-400'
                      }`}
                    />
                  </div>
                </section>

                <section className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Builder Tip</h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        Adding a high-quality cover image increases conversion by up to 40%. Make sure your PDF is optimized for web viewing.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className={`w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'
              }`}>
                {/* Preview Card */}
                <div className={`aspect-[3/4] relative ${isDark ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`}>
                  {data.coverUrl ? (
                    <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {data.format}
                      </span>
                      {data.pages && (
                        <span className="text-xs font-medium opacity-80">{data.pages} Pages</span>
                      )}
                    </div>
                    <h3 className="font-bold text-xl">Product Title Preview</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className={`flex justify-between items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Language</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{data.language}</span>
                  </div>
                  <div className={`flex justify-between items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>File Type</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{data.format}</span>
                  </div>
                  <button className={`w-full py-3 rounded-xl font-bold mt-4 ${
                    isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                  }`}>
                    Download Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
