import React, { useEffect, useRef } from 'react';
import { LogOut, ExternalLink, Copy, Share2, Star, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkspaceItemContextMenuProps {
  x: number;
  y: number;
  item: any;
  type: 'product' | 'community';
  onClose: () => void;
  onAction: (action: string, item: any) => void;
}

export function WorkspaceItemContextMenu({ x, y, item, type, onClose, onAction }: WorkspaceItemContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use a small timeout to prevent immediate closure if the right-click event is still propagating
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  const menuWidth = 200;
  const menuHeight = 240;
  
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: adjustedY,
    left: adjustedX,
    zIndex: 1000
  };

  return (
    <motion.div 
      ref={menuRef}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="w-52 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1.5 backdrop-blur-xl"
    >
      <div className="px-3 py-2 border-b border-white/5 mb-1.5">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest truncate">
          {type === 'product' ? 'Product' : 'Community'}
        </p>
        <p className="text-sm font-bold text-white truncate">
          {type === 'product' ? item.title : item.name}
        </p>
      </div>

      <button 
        onClick={() => { onAction('open', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-indigo-400" />
        Open
      </button>

      <button 
        onClick={() => { onAction('info', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Info className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
        View Details
      </button>

      <button 
        onClick={() => { onAction('message', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
        Message Owner
      </button>

      <button 
        onClick={() => { onAction('copy-link', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Copy className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" />
        Copy Link
      </button>

      <button 
        onClick={() => { onAction('share', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Share2 className="w-4 h-4 text-gray-500 group-hover:text-emerald-400" />
        Share
      </button>

      <button 
        onClick={() => { onAction('favorite', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Star className="w-4 h-4 text-gray-500 group-hover:text-yellow-500" />
        Favorite
      </button>

      <div className="h-px bg-white/5 my-1.5" />

      <button 
        onClick={() => { onAction('leave', item); onClose(); }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors group"
      >
        <LogOut className="w-4 h-4 text-red-500/50 group-hover:text-red-400" />
        {type === 'product' ? 'Archive Product' : 'Leave Community'}
      </button>
    </motion.div>
  );
}
