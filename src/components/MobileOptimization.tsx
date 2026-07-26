import React, { useEffect } from 'react';

/**
 * MobileOptimization component handles mobile-specific logic and enhancements.
 */
export const MobileOptimization: React.FC = () => {
  useEffect(() => {
    // 1. Handle viewport height for mobile browsers (the 100vh issue)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // 2. Prevent zooming on double tap for some elements
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      // We could selectively prevent zoom here if needed
    };
    document.addEventListener('touchstart', preventZoom, { passive: false });

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      document.removeEventListener('touchstart', preventZoom);
    };
  }, []);

  return null;
};
