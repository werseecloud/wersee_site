import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUp, X, FileText, Mic, Smile, Image as ImageIcon, Command, AppWindow, AtSign, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
  channelName: string;
  onFileTooLarge: () => void;
  onStartRecording?: () => void;
  members?: any[];
  roles?: any[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  channelName, 
  onFileTooLarge, 
  onStartRecording,
  members = [],
  roles = []
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const filteredMentions = [
    { id: 'everyone', name: 'everyone', type: 'special' },
    ...roles.map(r => ({ id: r.id, name: r.name, type: 'role' })),
    ...members.map(m => ({ id: m.user_id, name: m.user?.full_name || 'Unknown', type: 'user' }))
  ].filter(m => m.name.toLowerCase().includes(mentionFilter.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPlusMenu || showMentions) {
        setShowPlusMenu(false);
        setShowMentions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPlusMenu, showMentions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === ' ')) {
      const filter = val.slice(lastAtPos + 1);
      if (!filter.includes(' ')) {
        setMentionFilter(filter);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (mention: any) => {
    const lastAtPos = message.lastIndexOf('@');
    const before = message.slice(0, lastAtPos);
    const after = message.slice(lastAtPos + mentionFilter.length + 1);
    const token = mention.type === 'special' ? `@${mention.name}` : `<@${mention.id}>`;
    setMessage(`${before}${token} ${after}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredMentions[mentionIndex]) {
          insertMention(filteredMentions[mentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      onFileTooLarge();
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images/videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    const attachments = selectedFile ? [{ file: selectedFile, type: selectedFile.type }] : undefined;
    
    onSendMessage(message, attachments);
    
    setMessage('');
    removeFile();
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/5 p-4 z-30 pointer-events-none">
      <div className="max-w-5xl mx-auto relative pointer-events-auto">
        
        {/* Mentions Dropdown */}
        <AnimatePresence>
          {showMentions && filteredMentions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 w-64 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 max-h-64 overflow-y-auto">
                {filteredMentions.map((mention, i) => (
                  <button
                    key={mention.id}
                    onClick={() => insertMention(mention)}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      i === mentionIndex ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      mention.type === 'role' ? 'bg-amber-500/20 text-amber-400' : 
                      mention.type === 'special' ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-white/10 text-white'
                    }`}>
                      {mention.type === 'role' ? <UsersIcon className="w-4 h-4" /> : 
                       mention.type === 'special' ? <AtSign className="w-4 h-4" /> :
                       <AtSign className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-bold truncate">{mention.name}</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-wider font-bold">
                        {mention.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plus Menu Dropdown */}
        <AnimatePresence>
          {showPlusMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 w-56 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold">Upload Photo</span>
                </button>
                <button
                  onClick={() => setShowPlusMenu(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AppWindow className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-bold">Open Apps</span>
                </button>
                <button
                  onClick={() => setShowPlusMenu(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Command className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm font-bold">Commands</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Preview */}
        <AnimatePresence>
          {selectedFile && previewUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/50 border border-white/5">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : selectedFile.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <button 
                  type="button"
                  onClick={removeFile}
                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors backdrop-blur-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col min-w-0 pr-4">
                <div className="text-sm font-bold text-white truncate max-w-[160px]">
                  {selectedFile.name}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={handleSubmit}
          className="bg-[#141414]/90 border border-white/10 rounded-2xl lg:rounded-[2.5rem] p-2 flex items-center shadow-2xl focus-within:border-indigo-500/50 focus-within:bg-[#141414] transition-all backdrop-blur-2xl group ring-1 ring-white/5"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*"
          />
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlusMenu(!showPlusMenu);
            }}
            className={`p-3 lg:p-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl lg:rounded-full transition-all active:scale-90 ${showPlusMenu ? 'bg-white/10 text-white rotate-45' : ''}`}
            title="Attach file"
          >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>

          <input 
            ref={inputRef}
            type="text" 
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-600 px-2 lg:px-4 py-3 lg:py-4 focus:outline-none text-sm lg:text-base"
          />

          <div className="flex items-center gap-1 lg:gap-2 pr-1 lg:pr-2">
            <button 
              type="button"
              className="p-2 lg:p-3 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5 hidden sm:block"
              title="Emoji"
            >
              <Smile className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            
            {onStartRecording && (
              <button 
                type="button"
                onClick={onStartRecording}
                className="p-2 lg:p-3 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                title="Voice Message"
              >
                <Mic className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            )}

            <button 
              type="submit"
              disabled={!message.trim() && !selectedFile}
              className={`p-3 lg:p-4 rounded-xl lg:rounded-full transition-all active:scale-90 shadow-lg ${
                message.trim() || selectedFile
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
