import React, { useEffect, useRef } from 'react';
import { Shield, UserMinus, Ban, MessageSquare, User } from 'lucide-react';

interface UserContextMenuProps {
  x: number;
  y: number;
  user: any;
  permissions: {
    canManageRoles?: boolean;
    canKick?: boolean;
    canBan?: boolean;
    isOwner?: boolean;
  };
  onClose: () => void;
  onAction: (action: string, user: any) => void;
}

export function UserContextMenu({ x, y, user, permissions, onClose, onAction }: UserContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { canManageRoles, canKick, canBan, isOwner } = permissions;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to keep menu on screen
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(x, window.innerWidth - 200),
    zIndex: 1000
  };

  const hasStaffActions = canManageRoles || canKick || canBan || isOwner;

  return (
    <div 
      ref={menuRef}
      style={style}
      className="w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-2 border-b border-white/5 mb-1">
        <p className="text-sm font-medium text-white truncate">{user.full_name || user.name || 'User'}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      <button 
        onClick={() => onAction('profile', user)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
      >
        <User className="w-4 h-4" />
        View Profile
      </button>
      <button 
        onClick={() => onAction('message', user)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        Message
      </button>

      {hasStaffActions && (
        <>
          <div className="h-px bg-white/5 my-1" />
          {(canManageRoles || isOwner) && (
            <button 
              onClick={() => onAction('roles', user)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Manage Roles
            </button>
          )}
          {(canKick || isOwner) && (
            <button 
              onClick={() => onAction('kick', user)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              Kick Member
            </button>
          )}
          {(canBan || isOwner) && (
            <button 
              onClick={() => onAction('ban', user)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Ban Member
            </button>
          )}
        </>
      )}
    </div>
  );
}
