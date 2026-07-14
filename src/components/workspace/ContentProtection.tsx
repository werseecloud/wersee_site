import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentProtectionProps {
  children: React.ReactNode;
  contentId?: string;
  isEnabled?: boolean;
}

export const ContentProtection: React.FC<ContentProtectionProps> = ({ 
  children, 
  contentId, 
  isEnabled = true 
}) => {
  const [isProtected, setIsProtected] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [watermarkPos, setWatermarkPos] = useState({ x: 10, y: 10 });

  useEffect(() => {
    if (!isEnabled) return;

    // Get user info for watermarking
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email || user.id);
    });

    // 1. Visibility & Focus Protection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsProtected(false);
      } else {
        setIsProtected(true);
      }
    };

    const handleBlur = () => setIsProtected(false);
    const handleFocus = () => setIsProtected(true);

    // 2. Shortcut Detection (PrintScreen, Cmd+Shift+4, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerWarning();
        return false;
      }

      // Mac Screenshot shortcuts (Cmd+Shift+3/4/5)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        triggerWarning();
      }

      // DevTools (F12, Cmd+Opt+I)
      if (e.key === 'F12' || (e.metaKey && e.altKey && e.key === 'i')) {
        // We don't block but we can hide content
      }
    };

    // 3. Context Menu Protection
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    // 4. Moving Watermark Logic
    const watermarkInterval = setInterval(() => {
      setWatermarkPos({
        x: Math.random() * 80 + 5,
        y: Math.random() * 80 + 5
      });
    }, 10000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(watermarkInterval);
    };
  }, [isEnabled]);

  const triggerWarning = useCallback(() => {
    setShowWarning(true);
    setIsProtected(false);
    setTimeout(() => {
      setShowWarning(false);
      setIsProtected(true);
    }, 3000);
  }, []);

  if (!isEnabled) return <>{children}</>;

  return (
    <div className="relative w-full h-full group select-none overflow-hidden">
      {/* The Actual Content */}
      <div className={`w-full h-full transition-all duration-500 ${!isProtected ? 'filter blur-3xl grayscale brightness-0' : ''}`}>
        {children}
      </div>

      {/* Transparent Shield Overlay (Prevents right-click on specific elements) */}
      <div className="absolute inset-0 z-40 bg-transparent" />

      {/* Dynamic Watermark */}
      {userEmail && isProtected && (
        <div 
          className="absolute z-50 pointer-events-none opacity-[0.08] text-white font-mono text-[10px] md:text-xs whitespace-nowrap transition-all duration-1000 ease-in-out"
          style={{ 
            left: `${watermarkPos.x}%`, 
            top: `${watermarkPos.y}%`,
            transform: 'rotate(-15deg)'
          }}
        >
          {userEmail} • {new Date().toLocaleDateString()} • Wersee Protected
        </div>
      )}

      {/* "Black Screen" / Protection Overlay */}
      {!isProtected && !showWarning && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-16 h-16 text-gray-800 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-gray-500">Content Protected</h3>
          <p className="text-gray-600 text-sm mt-2">Please return focus to this window to continue viewing.</p>
        </div>
      )}

      {/* Warning Message */}
      {showWarning && (
        <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Security Alert</h3>
          <p className="text-gray-400 max-w-md">
            Screen capturing or unauthorized recording is strictly prohibited on Wersee. 
            Continued attempts may result in account suspension.
          </p>
        </div>
      )}

      {/* CSS Anti-Capture Trick (Some browsers/OS will black this out in screenshots) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { display: none !important; }
        }
        .protected-video {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      `}} />
    </div>
  );
};
