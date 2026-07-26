import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Eye, AlertCircle, ShieldAlert } from 'lucide-react';

export const GlobalProtection = () => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    };

    const handleClick = () => {
      if (contextMenu) setContextMenu(null);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);

  return (
    <>
      {/* Global CSS for selection disabling */}
      <style>{`
        .no-select {
          user-select: none;
          -webkit-user-select: none;
        }
        /* Apply to sensitive areas or globally if requested */
        body {
          /* user-select: none; */ /* Maybe too aggressive globally, let's apply to specific containers */
        }
        .protected-content {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[9999] min-w-[200px] bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-gray-100 mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avenue Protection</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">Copying Disabled</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View Source Disabled</span>
            </div>
          </motion.div>
        )}

        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold">Developer tools are restricted</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
