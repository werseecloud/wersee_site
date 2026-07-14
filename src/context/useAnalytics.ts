import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export const useAnalytics = (businessId: string | undefined) => {
  const { user } = useAuth();
  const [visitorId, setVisitorId] = useState<string>('');
  const [pageViewId, setPageViewId] = useState<string | null>(null);

  useEffect(() => {
    // Generate or retrieve visitor ID
    let vid = localStorage.getItem('wersee_visitor_id');
    if (!vid) {
      vid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('wersee_visitor_id', vid);
    }
    setVisitorId(user?.id || vid);
  }, [user]);

  useEffect(() => {
    if (!businessId || !visitorId) return;

    const startTime = Date.now();
    let currentViewId: string | null = null;

    const trackPageView = async () => {
      try {
        const { data, error } = await supabase
          .from('page_views')
          .insert([{
            business_id: businessId,
            visitor_id: visitorId,
            path: window.location.pathname,
            duration_seconds: 0
          }])
          .select('id')
          .single();

        if (!error && data) {
          currentViewId = data.id;
          setPageViewId(data.id);
        }
      } catch (err) {
        console.error('Error tracking page view:', err);
      }
    };

    trackPageView();

    const updateDuration = async () => {
      if (!currentViewId) return;
      const duration = Math.floor((Date.now() - startTime) / 1000);
      try {
        await supabase
          .from('page_views')
          .update({ duration_seconds: duration })
          .eq('id', currentViewId);
      } catch (err) {
        // Ignore errors on unload
      }
    };

    // Update duration periodically
    const interval = setInterval(updateDuration, 10000); // Every 10 seconds

    // Update duration on unmount
    return () => {
      clearInterval(interval);
      updateDuration();
    };
  }, [businessId, visitorId, window.location.pathname]);

  const trackClick = async (elementId: string) => {
    if (!businessId || !visitorId) return;
    try {
      await supabase
        .from('clicks')
        .insert([{
          business_id: businessId,
          visitor_id: visitorId,
          element_id: elementId
        }]);
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  return { trackClick };
};
