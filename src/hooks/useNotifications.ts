import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { firebaseConfig, messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '../context/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string || '';
const firebaseMessagingConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    subscribeToPush();

    // Subscribe to real-time changes in Supabase
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          fetchNotifications(); // Re-fetch on any change to keep it simple and accurate
        }
      )
      .subscribe();

    // Setup Firebase foreground messaging
    const setupForegroundMessaging = async () => {
      const msg = await messaging();
      if (msg) {
        onMessage(msg, (payload) => {
          // Real-time Supabase subscription handles UI updates when the notification is saved to the DB
        });
      }
    };
    setupForegroundMessaging();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!user) return;
    try {
      const msg = await messaging();
      if (!msg) return;

      // Check if we are in a secure context and notifications are supported
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          if (!VAPID_PUBLIC_KEY) {
            console.warn('FCM subscription skipped: VAPID_PUBLIC_KEY is not defined. Set VITE_FIREBASE_VAPID_KEY in your environment to enable push notifications.');
            return;
          }
          const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          registration?.active?.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseMessagingConfig,
          });
          const token = await getToken(msg, { vapidKey: VAPID_PUBLIC_KEY });
          if (token) {
            // Save token to Supabase
            const { error } = await supabase
              .from('push_subscriptions')
              .upsert({
                user_id: user.id,
                token: token,
                updated_at: new Date().toISOString()
              }, { onConflict: 'token' });
              
            if (error) throw error;
          }
        } catch (tokenError: any) {
          // Silently fail for token errors to avoid annoying the user with configuration issues
          if (tokenError.message?.includes('missing required authentication credential') || 
              tokenError.message?.includes('VAPID') ||
              tokenError.code === 'messaging/invalid-vapid-key') {
            console.warn('FCM subscription failed: Missing or invalid credentials. This is likely a Firebase configuration issue.');
          } else {
            console.warn('FCM subscription failed:', tokenError.message || tokenError);
          }
        }
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission: subscribeToPush
  };
}
