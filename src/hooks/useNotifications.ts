import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { firebaseConfig, messaging } from '../lib/firebase';
import { onMessage } from 'firebase/messaging';
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

export async function requestPushNotifications(userId: string): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted' || !VAPID_PUBLIC_KEY) return permission;

  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return permission;

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;
    registration?.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseMessagingConfig,
    });

    const normalizedKey = VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/');
    const paddedKey = normalizedKey.padEnd(Math.ceil(normalizedKey.length / 4) * 4, '=');
    const keyBytes = Uint8Array.from(atob(paddedKey), (character) => character.charCodeAt(0));
    const subscription = await registration.pushManager.getSubscription()
      || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });
    const subscriptionJson = subscription.toJSON();
    const authKey = subscriptionJson.keys?.auth;
    const p256dhKey = subscriptionJson.keys?.p256dh;

    if (subscription.endpoint && authKey && p256dhKey) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          auth_key: authKey,
          p256dh_key: p256dhKey,
        }, { onConflict: 'endpoint' });
      if (error) throw error;
    }
  } catch (tokenError: any) {
    if (
      tokenError.message?.includes('missing required authentication credential') ||
      tokenError.message?.includes('VAPID') ||
      tokenError.name === 'InvalidAccessError'
    ) {
      console.warn('Push subscription failed: Missing or invalid credentials.');
    } else {
      console.warn('Push subscription failed:', tokenError.message || tokenError);
    }
  }

  return permission;
}

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

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission: () => user ? requestPushNotifications(user.id) : Promise.resolve('denied' as NotificationPermission)
  };
}
