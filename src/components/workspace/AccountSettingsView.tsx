import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Bell, CreditCard, Link as LinkIcon, Code, AlertTriangle,
  Smartphone, Monitor, Globe, Clock, MapPin, Loader2, Save, Download, Trash2, FileText, Database,
  CheckCircle2, Lock, LogOut, Zap, Accessibility,
  ChevronRight, ChevronLeft, Calendar, KeyRound, Sun, Moon, RefreshCw, ArrowRight, ShieldCheck
} from 'lucide-react';

import { supabase, invokeApiRunner } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { PasskeysSettings } from './settings/PasskeysSettings';
import { EmailNotificationSettings } from './settings/EmailNotificationSettings';
import { PrivacyDataCenter } from './settings/PrivacyDataCenter';
import { AccessibilitySettings } from './settings/AccessibilitySettings';
import { SubscriptionManagement } from './settings/SubscriptionManagement';
import { trustCenterAction } from '../../lib/trustCenter';
import { useTheme } from '../../context/ThemeContext';
import { safeLocalStorage } from '../../lib/browserStorage';

import { appToast, destructiveAction } from '@/lib/feedback';

const loadExternalScript = (src: string) => new Promise<void>((resolve, reject) => {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing?.dataset.loaded === 'true') {
    resolve();
    return;
  }
  const script = existing || document.createElement('script');
  script.addEventListener('load', () => {
    script.dataset.loaded = 'true';
    resolve();
  }, { once: true });
  script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
  if (!existing) {
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  }
});

interface AccountSettingsViewProps {
  initialTab?: string;
  onNavigate?: (view: string) => void;
}

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_OPTIONS = [
  {
    id: 'light' as const,
    label: 'Light',
    description: 'Bright, calm surfaces with crisp contrast.',
    icon: Sun,
  },
  {
    id: 'dark' as const,
    label: 'Dark',
    description: 'The classic focused Wersee workspace.',
    icon: Moon,
  },
  {
    id: 'system' as const,
    label: 'Use device',
    description: 'Match your operating system appearance.',
    icon: Monitor,
  },
];

const isThemePreference = (value: unknown): value is ThemePreference => {
  return value === 'light' || value === 'dark' || value === 'system';
};

const THEME_PREFERENCE_STORAGE_KEY = 'theme_preference';

const getStoredThemePreference = (): ThemePreference => {
  const savedPreference = safeLocalStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  if (isThemePreference(savedPreference)) {
    return savedPreference;
  }

  const savedTheme = safeLocalStorage.getItem('theme');
  return isThemePreference(savedTheme) ? savedTheme : 'system';
};

const resolveThemePreference = (preference: ThemePreference) => {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
};

const fetchWorkspaceThemePreference = async (userId: string): Promise<ThemePreference | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('workspace_theme_preference')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading workspace theme preference:', error);
      return null;
    }

    return isThemePreference(data?.workspace_theme_preference) ? data.workspace_theme_preference : null;
  } catch {
    return null;
  }
};

const setThemePreferenceLocally = (preference: ThemePreference) => {
  safeLocalStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
};

export const AccountSettingsView = ({ initialTab = 'profile', onNavigate }: AccountSettingsViewProps) => {
  const { isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileView, setMobileView] = useState<'menu' | 'detail'>('menu');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [fetchingSessions, setFetchingSessions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadingData, setDownloadingData] = useState(false);
  const [exportHistory] = useState<any[]>([]);
  const [interactiveHistory] = useState<any[]>([]);
  const [fetchingExports] = useState(false);

  const handleDownloadData = async () => {
    setDownloadingData(true);
    try {
      await trustCenterAction('request-export', { exportType: 'full' });
      setSuccessMessage('Your secure export is being prepared.');
    } catch (error: any) {
      appToast(error?.message || 'The export request could not be submitted.');
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDownloadPreviousExport = async (exportItem: any) => {
    try {
      const result = await trustCenterAction<{ signedUrl: string }>('download-export', { exportId: exportItem.id });
      window.location.assign(result.signedUrl);
    } catch (error: any) {
      appToast(error?.message || 'The export is not available.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!(await destructiveAction({ description: 'Schedule account deletion with a 30-day cancellation period?' }))) return;
    try {
      await trustCenterAction('request-deletion');
      setActiveTab('privacy');
      setSuccessMessage('Account deletion scheduled.');
    } catch (error: any) {
      appToast(error?.message || 'The deletion request could not be scheduled.');
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab !== 'profile') {
      setMobileView('detail');
    }
  }, [initialTab]);

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Google Calendar Sync states
  const [isGoogleCalendarSynced, setIsGoogleCalendarSynced] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  const handleGoogleCalendarSync = async () => {
    setSyncingCalendar(true);
    try {
      await Promise.all([
        loadExternalScript('https://apis.google.com/js/api.js'),
        loadExternalScript('https://accounts.google.com/gsi/client'),
      ]);
      const gapi = (window as any).gapi;
      const google = (window as any).google;

      if (!gapi || !google) {
        throw new Error('Google API libraries not loaded');
      }
      if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
        throw new Error('Google Calendar environment variables are not configured');
      }

      // Initialize GAPI client
      await new Promise((resolve, reject) => {
        gapi.load('client', {
          callback: resolve,
          onerror: reject
        });
      });

      await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });

      // Initialize GIS token client
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp: any) => {
          if (resp.error !== undefined) {
            throw resp;
          }
          setIsGoogleCalendarSynced(true);
          await listUpcomingEvents();
          setSyncingCalendar(false);
        },
      });

      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (error: any) {
      console.error('Error syncing Google Calendar:', error);
      appToast('Failed to sync Google Calendar: ' + (error.message || 'Unknown error'));
      setSyncingCalendar(false);
    }
  };

  const listUpcomingEvents = async () => {
    try {
      const gapi = (window as any).gapi;
      const response = await gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
      });
      setCalendarEvents(response.result.items || []);
    } catch (err) {
      console.error('Error listing events:', err);
    }
  };

  const handleGoogleSignout = () => {
    const gapi = (window as any).gapi;
    const google = (window as any).google;
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      setIsGoogleCalendarSynced(false);
      setCalendarEvents([]);
    }
  };

  // Stripe account info states
  const [stripeAccountInfo, setStripeAccountInfo] = useState<any>(null);
  const [stripeBalance, setStripeBalance] = useState<any>(null);
  const [fetchingStripeInfo, setFetchingStripeInfo] = useState(false);
  const [stripeInfoError, setStripeInfoError] = useState('');

  const fetchStripeAccountDetails = async () => {
    const accountId = profile?.stripe_account_id;
    if (!accountId) {
      setStripeAccountInfo(null);
      setStripeBalance(null);
      setStripeInfoError('');
      return;
    }

    setFetchingStripeInfo(true);
    setStripeInfoError('');
    try {
      const account = await invokeApiRunner('get-account', { id: accountId });
      if (account?.error) throw new Error(account.error);
      setStripeAccountInfo(account);

      try {
        const balance = await invokeApiRunner('stripe-balance-get', { accountId });
        setStripeBalance(balance?.error ? null : balance);
      } catch {
        setStripeBalance(null);
      }
    } catch (error: any) {
      console.error('Error fetching Wersee Pay status:', error);
      setStripeAccountInfo(null);
      setStripeBalance(null);
      setStripeInfoError('We could not verify your Wersee Pay connection right now.');
    } finally {
      setFetchingStripeInfo(false);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    website: '',
    bio: '',
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    currency: 'EUR',
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    privacy_show_profile: true,
    privacy_allow_tracking: false,
  });

  // ── Desktop (Electron) detection & PC settings state ────────────────────
  const desktopApi: any = typeof window !== 'undefined' ? (window as any).werseeDesktop : null;
  const isDesktopApp = !!desktopApi?.isDesktop;
  const [pcSettings, setPcSettings] = useState<any>({
    launchOnStartup:      false,
    minimizeToTray:       true,
    startMinimized:       false,
    hardwareAcceleration: true,
    zoomLevel:            1.0,
    notificationsEnabled: true,
    autoUpdate:           true,
  });
  const [pcAppVersion, setPcAppVersion] = useState<string>('');
  const [pcPlatform, setPcPlatform] = useState<string>('');
  const [pcSavingKey, setPcSavingKey] = useState<string>('');

  useEffect(() => {
    if (!isDesktopApp) return;
    (async () => {
      try {
        const all = await desktopApi.settings.getAll();
        if (all) setPcSettings((prev: any) => ({ ...prev, ...all }));
        const v = await desktopApi.version();
        setPcAppVersion(v || '');
        const p = await desktopApi.platform();
        setPcPlatform(p || '');
      } catch (_) {}
    })();
  }, [isDesktopApp]);

  const updatePcSetting = async (key: string, value: any) => {
    if (!isDesktopApp) return;
    setPcSavingKey(key);
    setPcSettings((prev: any) => ({ ...prev, [key]: value }));
    try {
      await desktopApi.settings.set(key, value);
    } catch (_) {}
    setTimeout(() => setPcSavingKey(''), 400);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'passkeys', label: 'Passkeys', icon: KeyRound },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'wersee-pay', label: 'Wersee Pay Settings', icon: Zap },
    { id: 'connected', label: 'Connected Accounts', icon: LinkIcon },
    ...(isDesktopApp ? [{ id: 'desktop', label: 'Desktop App', icon: Monitor }] : []),
    { id: 'developer', label: 'Developer / API', icon: Code },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'wersee-pay' && profile) {
      fetchStripeAccountDetails();
    }
  }, [activeTab, profile?.stripe_account_id]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [{ data: profile, error: profileError }, remoteThemePreference] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
          fetchWorkspaceThemePreference(user.id),
        ]);

        if (profileError) {
          console.error('Error loading profile settings:', profileError);
        }

        if (profile) {
          setProfile(profile);
        }

        const storedTheme = getStoredThemePreference();
        const legacyProfileTheme = isThemePreference(profile?.theme) ? profile.theme : null;
        const nextThemePreference = remoteThemePreference || storedTheme || legacyProfileTheme || 'system';

        setTheme(resolveThemePreference(nextThemePreference));
        setThemePreferenceLocally(nextThemePreference);

        if (profile) {
          setFormData({
            ...formData,
            full_name: profile.full_name || '',
            username: profile.username || '',
            website: profile.website || '',
            bio: profile.bio || '',
            theme: nextThemePreference,
            email_notifications: profile.email_notifications ?? true,
            push_notifications: profile.push_notifications ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setFetchingSessions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const data = await invokeApiRunner('get-active-sessions');
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setFetchingSessions(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          website: formData.website,
          bio: formData.bio,
          email_notifications: formData.email_notifications,
          push_notifications: formData.push_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      appToast('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (preference: ThemePreference) => {
    setFormData((current) => ({ ...current, theme: preference }));
    setTheme(resolveThemePreference(preference));
    setThemePreferenceLocally(preference);

    if (!user) return;

    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        workspace_theme_preference: preference,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      setSuccessMessage('Appearance saved');
      window.setTimeout(() => setSuccessMessage(''), 2500);
    } catch (error) {
      console.error('Error saving appearance:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
      });
      setSuccessMessage('Appearance is saved locally. Sync to cloud failed.');
      window.setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to log out this device?' }))) return;
    
    try {
      const data = await invokeApiRunner('terminate-session', { sessionId });
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    if (!(await destructiveAction({ description: 'Are you sure you want to log out all other devices? You will need to log in again.' }))) return;

    try {
      const data = await invokeApiRunner('terminate-all-other-sessions');
      if (data.success) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Error terminating all sessions:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      // Note: Supabase requires the user to be logged in to update their password.
      // If they signed in with OAuth, they might not have a password.
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      setPasswordSuccess('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const stripeAccountId = profile?.stripe_account_id as string | undefined;
  const stripeReady = Boolean(
    stripeAccountInfo?.details_submitted &&
    stripeAccountInfo?.charges_enabled &&
    stripeAccountInfo?.payouts_enabled
  );
  const stripeStatusItems = [
    { label: 'Payments', value: stripeAccountInfo?.charges_enabled ? 'Enabled' : 'Pending' },
    { label: 'Payouts', value: stripeAccountInfo?.payouts_enabled ? 'Enabled' : 'Pending' },
    { label: 'Country', value: String(stripeAccountInfo?.country || '—').toUpperCase() },
    { label: 'Account', value: stripeAccountInfo?.type || 'Connected' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-transparent min-h-[100dvh]">
      {/* Settings Sidebar - Desktop */}
      <div className="hidden md:block w-64 shrink-0 border-r border-white/5 bg-[#0A0A0A] p-6 sticky top-0 h-[100dvh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 px-2">Account Settings</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive 
                    ? tab.danger ? 'bg-red-500/10 text-red-400' : 'bg-white/10 text-white' 
                    : tab.danger ? 'text-red-400/70 hover:bg-red-500/5 hover:text-red-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Navigation - Mobile (Menu View) */}
      <div className={`md:hidden ${mobileView === 'menu' ? 'block' : 'hidden'} flex-1 bg-transparent min-h-[100dvh]`}>
        <div className={`px-4 py-6 sticky top-0 ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-xl z-10 border-b border-white/5`}>
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
        </div>
        <div className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileView('detail');
                  window.scrollTo(0, 0);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                  tab.danger 
                    ? 'bg-red-500/5 border-red-500/10 text-red-400' 
                    : 'bg-[#111] border-white/5 text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${tab.danger ? 'bg-red-500/10' : 'bg-white/5'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-base">{tab.label}</span>
                </div>
                <ChevronRight className={`w-5 h-5 ${tab.danger ? 'text-red-400/50' : 'text-gray-500'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 ${mobileView === 'detail' ? 'block' : 'hidden md:block'}`}>
        <div className="max-w-3xl mx-auto">
          
          {/* Header & Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileView('menu')}
                className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>
            </div>
            {!['danger', 'security', 'passkeys', 'desktop', 'privacy', 'appearance', 'accessibility', 'billing', 'wersee-pay'].includes(activeTab) && (
              <div className="flex items-center gap-4">
                <AnimatePresence>
                  {successMessage && (
                    <motion.span 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-emerald-400 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-white/10"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Identity & Profile</h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border border-white/10 shrink-0">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors mb-2">
                        Change Avatar
                      </button>
                      <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 5MB.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors" 
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                    />
                    <p className="text-xs text-gray-500 mt-2">To change your email, please contact support.</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bio / Description</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors resize-none" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Website / Social Link</label>
                    <input 
                      type="text" 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors" 
                    />
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-6">App Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                      <select 
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                      >
                        <option value="en">English</option>
                        <option value="nl">Dutch</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                      <select 
                        value={formData.theme}
                        onChange={(e) => handleThemeChange(e.target.value as ThemePreference)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                      <select 
                        value={formData.timezone}
                        onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Currency</label>
                      <select 
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-purple-500/5 to-transparent p-5 md:p-8">
                  <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
                  <div className="relative max-w-xl">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20">
                      {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white">Make the workspace yours</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      Your choice applies instantly across navigation, dashboards, settings, and workspace tools, and follows you on your next sign-in.
                    </p>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/5 bg-[#141414] p-4 md:p-6">
                  <div className="mb-5">
                    <h4 className="font-bold text-white">Workspace theme</h4>
                    <p className="mt-1 text-sm text-gray-500">Choose the contrast that feels best for your work.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {THEME_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.theme === option.id;
                      const previewClass = option.id === 'light'
                        ? 'from-white to-slate-100'
                        : option.id === 'dark'
                          ? 'from-slate-950 to-slate-800'
                          : 'from-white via-slate-100 to-slate-900';

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleThemeChange(option.id)}
                          aria-pressed={isSelected}
                          className={`group rounded-3xl border p-3 text-left transition-all focus-visible:outline-none ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_14px_35px_rgba(99,102,241,0.14)]'
                              : 'border-white/10 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20'
                          }`}
                        >
                          <span className={`relative mb-4 block h-28 overflow-hidden rounded-2xl bg-gradient-to-br ${previewClass} ring-1 ring-black/5`}>
                            <span className="absolute inset-x-3 top-3 flex h-5 items-center gap-1.5 rounded-md bg-black/10 px-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              <span className="h-1.5 w-8 rounded-full bg-slate-400/50" />
                            </span>
                            <span className="absolute bottom-3 left-3 top-11 w-7 rounded-lg bg-indigo-500/15" />
                            <span className="absolute bottom-3 left-12 right-3 top-11 grid grid-cols-2 gap-2">
                              <span className="rounded-lg bg-indigo-500/20" />
                              <span className="rounded-lg bg-black/10" />
                              <span className="col-span-2 rounded-lg bg-black/10" />
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-3 px-1">
                            <span>
                              <span className="flex items-center gap-2 font-bold text-white">
                                <Icon className="h-4 w-4 text-indigo-400" />
                                {option.label}
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-gray-500">{option.description}</span>
                            </span>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'}`}>
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm text-gray-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p>Appearance is saved automatically. No page refresh is needed.</p>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Password & Authentication</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-white font-medium">Change Password</h4>
                          <p className="text-sm text-gray-400">Update your password to keep your account secure.</p>
                        </div>
                        <button 
                          onClick={() => setIsChangingPassword(!isChangingPassword)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          {isChangingPassword ? 'Cancel' : 'Update'}
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {isChangingPassword && (
                          <motion.form 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                            onSubmit={handleChangePassword}
                          >
                            <div className="pt-4 border-t border-white/5 space-y-4">
                              {passwordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                                  {passwordError}
                                </div>
                              )}
                              {passwordSuccess && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl">
                                  {passwordSuccess}
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                                <input 
                                  type="password" 
                                  value={passwordData.new}
                                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors" 
                                  required
                                  minLength={6}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                                <input 
                                  type="password" 
                                  value={passwordData.confirm}
                                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors" 
                                  required
                                  minLength={6}
                                />
                              </div>
                              <div className="flex justify-end pt-2">
                                <button 
                                  type="submit"
                                  disabled={changingPassword}
                                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  Save Password
                                </button>
                              </div>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <h4 className="text-white font-medium">Two-Factor Authentication (2FA)</h4>
                        <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                      </div>
                      <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Active Sessions</h3>
                    <button 
                      onClick={handleTerminateAllOtherSessions}
                      className="text-sm text-red-400 hover:text-red-300 font-medium"
                    >
                      Log out all other devices
                    </button>
                  </div>
                  
                  {fetchingSessions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                              {session.device_type === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-white font-medium truncate">{session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}</h4>
                                {session.is_current && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {session.ip_address || 'Unknown IP'}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location || 'Unknown Location'}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.last_active ? formatDistanceToNow(new Date(session.last_active), { addSuffix: true }) : 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                          {!session.is_current && (
                            <button 
                              onClick={() => handleTerminateSession(session.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                              title="Log out device"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No active sessions found or session tracking is unavailable.</p>
                      <p className="text-sm mt-2">You are currently logged in on this device.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* PASSKEYS TAB */}
            {activeTab === 'passkeys' && (
              <PasskeysSettings user={user} />
            )}

            {activeTab === 'privacy' && <PrivacyDataCenter />}

            {activeTab === 'accessibility' && <AccessibilitySettings />}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy-legacy' && (
              <>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Privacy Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Public Profile</p>
                        <p className="text-sm text-gray-400">Allow others to find and view your profile.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.privacy_show_profile} onChange={(e) => setFormData({...formData, privacy_show_profile: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Analytics & Tracking</p>
                        <p className="text-sm text-gray-400">Allow us to collect usage data to improve Wersee.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.privacy_allow_tracking} onChange={(e) => setFormData({...formData, privacy_allow_tracking: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Data Portability</h3>
                      <p className="text-sm text-gray-400">Download a copy of your data or view previous exports.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleDownloadData}
                        disabled={downloadingData}
                        className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {downloadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Request New Export
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Interactive Data Sites</h4>
                      {interactiveHistory.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {interactiveHistory.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                  <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">Interactive Data Explorer</p>
                                  <p className="text-xs text-gray-500">
                                    Created {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })} • Expires {format(new Date(session.expires_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => window.open(`/export/interactive/${session.id}`, '_blank')}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-colors"
                              >
                                View Site
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                          <p className="text-sm text-gray-500">No interactive sites generated yet.</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Archive Files (ZIP/PDF)</h4>
                      {fetchingExports ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                        </div>
                      ) : exportHistory.length > 0 ? (
                        <div className="space-y-3">
                          {exportHistory.map((exp) => (
                            <div key={exp.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                  <Download className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">{exp.file_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })} • {(exp.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDownloadPreviousExport(exp)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                          <p className="text-sm text-gray-500">No previous exports found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Legal Agreements</h3>
                  <div className="space-y-4">
                    <a href="/terms" target="_blank" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group">
                      <span className="text-white font-medium">Terms of Service</span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-300">Last updated: Jan 1, 2026</span>
                    </a>
                    <a href="/privacy" target="_blank" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group">
                      <span className="text-white font-medium">Privacy Policy</span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-300">Last updated: Jan 1, 2026</span>
                    </a>
                    <a href="/cookies" target="_blank" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group">
                      <span className="text-white font-medium">Cookie Policy</span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-300">Last updated: Jan 1, 2026</span>
                    </a>
                  </div>
                </div>
              </>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <EmailNotificationSettings />
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <SubscriptionManagement />
            )}

            {/* CONNECTED ACCOUNTS TAB */}
            {activeTab === 'connected' && (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Connected Accounts</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Google Calendar</h4>
                          <p className="text-sm text-gray-400">{isGoogleCalendarSynced ? 'Connected' : 'Not connected'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={isGoogleCalendarSynced ? handleGoogleSignout : handleGoogleCalendarSync}
                        disabled={syncingCalendar}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isGoogleCalendarSynced 
                            ? 'bg-white/10 hover:bg-white/20 text-white' 
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {syncingCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : isGoogleCalendarSynced ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>

                    {isGoogleCalendarSynced && calendarEvents.length > 0 && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-400" />
                          Upcoming Events
                        </h4>
                        <div className="space-y-2">
                          {calendarEvents.map((event: any) => (
                            <div key={event.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <span className="text-sm text-gray-300 truncate pr-4">{event.summary}</span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {event.start.dateTime ? format(new Date(event.start.dateTime), 'MMM d, HH:mm') : event.start.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Google</h4>
                        <p className="text-sm text-gray-400">Connected</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                      Disconnect
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Discord</h4>
                        <p className="text-sm text-gray-400">Not connected</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WERSEE PAY TAB */}
            {activeTab === 'wersee-pay' && (
              <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent p-5 md:p-8">
                  <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                  <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-xl">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <Zap className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-white">Wersee Pay Settings</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        Connect and manage payouts securely through Wersee Pay. Payment credentials are managed server-side, so you never need to paste API keys into the workspace.
                      </p>
                    </div>
                    <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${
                      stripeReady
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                        : stripeAccountId
                          ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 bg-white/5 text-gray-400'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${stripeReady ? 'bg-emerald-400' : stripeAccountId ? 'bg-amber-400' : 'bg-gray-500'}`} />
                      {stripeReady ? 'Ready for payments' : stripeAccountId ? 'Setup in progress' : 'Not connected'}
                    </div>
                  </div>
                </section>

                {fetchingStripeInfo ? (
                  <section className="flex min-h-56 items-center justify-center rounded-[2rem] border border-white/5 bg-[#141414]">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-400" />
                      <p className="mt-3 text-sm text-gray-500">Checking your secure connection…</p>
                    </div>
                  </section>
                ) : stripeAccountInfo ? (
                  <section className="rounded-[2rem] border border-white/5 bg-[#141414] p-5 md:p-6">
                    <div className="flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stripeReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {stripeReady ? <ShieldCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{stripeReady ? 'Wersee Pay is active' : 'Finish your Wersee Pay setup'}</h4>
                          <p className="mt-0.5 text-xs text-gray-500">Live status from your connected payment account</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={fetchStripeAccountDetails}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-5 md:grid-cols-4">
                      {stripeStatusItems.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                          <p className="mt-2 truncate text-sm font-bold capitalize text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {stripeBalance && (
                      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Available balance</p>
                          <p className="mt-2 text-lg font-black text-white">
                            {stripeBalance.available?.map((balance: any) => `${(balance.amount / 100).toFixed(2)} ${balance.currency.toUpperCase()}`).join(', ') || '0.00'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pending balance</p>
                          <p className="mt-2 text-lg font-black text-white">
                            {stripeBalance.pending?.map((balance: any) => `${(balance.amount / 100).toFixed(2)} ${balance.currency.toUpperCase()}`).join(', ') || '0.00'}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onNavigate?.('money-setup')}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-black shadow-xl shadow-white/5 transition-all hover:bg-gray-100 active:scale-[0.98] sm:w-auto"
                    >
                      {stripeReady ? 'Manage Wersee Pay' : 'Continue secure setup'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </section>
                ) : (
                  <section className="rounded-[2rem] border border-white/5 bg-[#141414] p-5 md:p-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Connect Wersee Pay</h4>
                          <p className="mt-1 max-w-md text-sm leading-relaxed text-gray-500">
                            Complete the hosted onboarding flow to accept payments and receive payouts. No developer setup or credentials are required.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate?.('money-setup')}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 active:scale-[0.98]"
                      >
                        Start setup <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                )}

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-white">Credentials stay protected</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">Wersee Pay uses the platform's managed Stripe connection. Secret keys are never requested, displayed, or stored in this browser.</p>
                  </div>
                </div>

                {stripeInfoError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <p>{stripeInfoError}</p>
                      <button type="button" onClick={fetchStripeAccountDetails} className="mt-2 font-bold text-red-300 hover:text-white">Try again</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DESKTOP APP TAB (Electron only) */}
            {activeTab === 'desktop' && isDesktopApp && (
              <div className="space-y-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">Wersee Desktop</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">
                    These settings only affect the desktop app on this computer.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Version</p>
                      <p className="text-white font-semibold">{pcAppVersion || '—'}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Platform</p>
                      <p className="text-white font-semibold capitalize">{pcPlatform || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-5">Startup & Window</h3>
                  {[
                    { k: 'launchOnStartup', label: 'Launch on system startup', desc: 'Open Wersee automatically when you sign in to your computer.' },
                    { k: 'startMinimized',  label: 'Start minimized to tray', desc: 'Start Wersee in the background without opening a window.' },
                    { k: 'minimizeToTray',  label: 'Close to system tray',    desc: 'Keep Wersee running in the tray when you close the window.' },
                  ].map((opt) => (
                    <div key={opt.k} className="flex items-start justify-between gap-4 py-4 border-b border-white/5 last:border-0">
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm">{opt.label}</p>
                        <p className="text-gray-500 text-xs mt-1">{opt.desc}</p>
                      </div>
                      <button
                        onClick={() => updatePcSetting(opt.k, !pcSettings[opt.k])}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pcSettings[opt.k] ? 'bg-indigo-500' : 'bg-white/10'}`}
                        aria-pressed={!!pcSettings[opt.k]}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pcSettings[opt.k] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-5">Performance & Display</h3>

                  <div className="flex items-start justify-between gap-4 py-4 border-b border-white/5">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm">Hardware acceleration</p>
                      <p className="text-gray-500 text-xs mt-1">Use the GPU for smoother rendering. Turn off if you see graphical glitches. Requires restart.</p>
                    </div>
                    <button
                      onClick={() => updatePcSetting('hardwareAcceleration', !pcSettings.hardwareAcceleration)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pcSettings.hardwareAcceleration ? 'bg-indigo-500' : 'bg-white/10'}`}
                      aria-pressed={!!pcSettings.hardwareAcceleration}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pcSettings.hardwareAcceleration ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="py-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">Zoom level</p>
                        <p className="text-gray-500 text-xs mt-1">Scale the interface text and UI.</p>
                      </div>
                      <span className="text-indigo-400 font-mono text-sm">{Math.round(pcSettings.zoomLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={pcSettings.zoomLevel}
                      onChange={(e) => updatePcSetting('zoomLevel', parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                      <span>75%</span><span>100%</span><span>150%</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-4 border-b border-white/5">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm">Native notifications</p>
                      <p className="text-gray-500 text-xs mt-1">Show system notifications for messages, orders and payments.</p>
                    </div>
                    <button
                      onClick={() => updatePcSetting('notificationsEnabled', !pcSettings.notificationsEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pcSettings.notificationsEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                      aria-pressed={!!pcSettings.notificationsEnabled}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pcSettings.notificationsEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm">Automatic updates</p>
                      <p className="text-gray-500 text-xs mt-1">Download and install new Wersee releases in the background.</p>
                    </div>
                    <button
                      onClick={() => updatePcSetting('autoUpdate', !pcSettings.autoUpdate)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pcSettings.autoUpdate ? 'bg-indigo-500' : 'bg-white/10'}`}
                      aria-pressed={!!pcSettings.autoUpdate}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pcSettings.autoUpdate ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-white mb-4">App Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => desktopApi?.relaunch?.()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Restart app
                    </button>
                    <button
                      onClick={() => desktopApi?.signOut?.()}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign out on this device
                    </button>
                    <button
                      onClick={() => desktopApi?.quit?.()}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
                    >
                      Quit Wersee
                    </button>
                  </div>
                  {pcSavingKey && (
                    <p className="text-emerald-400 text-xs mt-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'developer' && (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Code className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Developer & API</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  Manage your API keys and developer access to integrate Wersee with your own applications.
                </p>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Secret API Key</span>
                    <span className="text-xs text-gray-500">Shown only when created</span>
                  </div>
                  <div className="font-mono text-xs md:text-sm text-gray-500 bg-black p-3 rounded-lg border border-white/5 break-all">
                    Created keys are shown once, then only prefixes and audit history remain visible.
                  </div>
                </div>
                <button className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  Generate New Key
                </button>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === 'danger-legacy' && (
              <div className="space-y-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">10-Year Historical Lookup</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">
                    Access your complete historical archive. We retain your data for up to 10 years for compliance and personal record-keeping. Links in this archive remain active for 6 months.
                  </p>
                  <div className="space-y-4 mb-6">
                    {exportHistory.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {exportHistory.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-sm truncate">Historical Archive ({format(new Date(exp.created_at), 'yyyy')})</p>
                                <p className="text-xs text-gray-500">Generated {format(new Date(exp.created_at), 'PPP')}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDownloadPreviousExport(exp)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider shrink-0"
                            >
                              Retrieve PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-black/40 rounded-2xl border border-dashed border-white/5">
                        <p className="text-sm text-gray-500">No historical records found for the last 10 years.</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleDownloadData}
                    disabled={downloadingData}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {downloadingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    {downloadingData ? 'Generating Full Archive...' : 'Generate 10-Year Data Export'}
                  </button>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg font-bold text-red-400 mb-2">Delete Account</h3>
                  <p className="text-red-400/70 text-sm mb-6">
                    Permanently delete your account and all of your content. This action cannot be undone.
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.04] p-6">
                <h2 className="text-lg font-black text-white">Privacy and account closure</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Exports and account deletion now use a verified, auditable workflow with a cancellation period and separate handling for records that must be retained.</p>
                <button onClick={() => setActiveTab('privacy')} className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-black text-black">Open Privacy &amp; Data</button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Sticky Save Button */}
      {mobileView === 'detail' && !['danger', 'security', 'passkeys', 'desktop', 'privacy', 'accessibility', 'billing'].includes(activeTab) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/5 z-50">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xl shadow-white/10"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};
