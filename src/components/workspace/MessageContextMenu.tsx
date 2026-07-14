import React, { useEffect, useRef } from 'react';
import { Copy, Share2, Trash2, Edit2 } from 'lucide-react';

interface MessageContextMenuProps {
  x: number;
  y: number;
  messageId: string;
  isMe: boolean;
  content: string;
  onClose: () => void;
  onCopy: (content: string) => void;
  onShare: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x, y, messageId, isMe, content, onClose, onCopy, onShare, onDelete, onEdit
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Ensure menu stays within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
  };

  // Adjust position if it goes off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${viewportWidth - rect.width - 10}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${viewportHeight - rect.height - 10}px`;
      }
    }
  }, [x, y]);

  return (
    <div 
      ref={menuRef}
      style={style}
      className="bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] overflow-hidden animate-in fade-in zoom-in duration-150"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button 
        onClick={() => { onCopy(content); onClose(); }}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-white/90 transition-colors"
      >
        <Copy className="w-4 h-4" />
        <span className="text-sm font-medium">Copy Text</span>
      </button>
      
      <button 
        onClick={() => { onShare(messageId); onClose(); }}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-white/90 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share Message</span>
      </button>

      {isMe && onEdit && (
        <button 
          onClick={() => { onEdit(messageId); onClose(); }}
          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-white/90 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Message</span>
        </button>
      )}

      {isMe && onDelete && (
        <>
          <div className="h-px bg-white/10 my-1 mx-2" />
          <button 
            onClick={() => { onDelete(messageId); onClose(); }}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Delete Message</span>
          </button>
        </>
      )}
    </div>
  );
};
