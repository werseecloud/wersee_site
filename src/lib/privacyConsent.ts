import { trustCenterAction } from './trustCenter';
import { createBrowserId, safeLocalStorage } from './browserStorage';

export const PRIVACY_CONSENT_VERSION = '2026-07-22-v1';
export const PRIVACY_CONSENT_STORAGE_KEY = 'wersee:privacy-consent:v1';
export const PRIVACY_CONSENT_CHANGE_EVENT = 'wersee:privacy-consent-change';
export const PRIVACY_CONSENT_OPEN_EVENT = 'wersee:privacy-consent-open';

export type PrivacyCategories = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

export type PrivacyConsent = {
  version: string;
  anonymousId: string;
  categories: PrivacyCategories;
  decidedAt: string;
  source: 'consent_sheet' | 'account_settings' | 'footer' | 'browser_signal';
  privacySignal?: string;
};

const privacySignal = () => {
  if (typeof navigator === 'undefined') return '';
  const globalPrivacyControl = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  if (globalPrivacyControl) return 'global_privacy_control';
  if (navigator.doNotTrack === '1') return 'do_not_track';
  return '';
};

export const getAnonymousConsentId = () => {
  if (typeof window === 'undefined') return '';
  const existing = safeLocalStorage.getItem('wersee:privacy-anonymous-id');
  if (existing) return existing;
  const created = createBrowserId();
  safeLocalStorage.setItem('wersee:privacy-anonymous-id', created);
  return created;
};

export const getStoredPrivacyConsent = (): PrivacyConsent | null => {
  if (typeof window === 'undefined') return null;
  const raw = safeLocalStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PrivacyConsent;
    if (parsed.version !== PRIVACY_CONSENT_VERSION || parsed.categories?.necessary !== true) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getDefaultPrivacyCategories = (): PrivacyCategories => ({
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  personalization: false,
});

export async function savePrivacyConsent(
  categories: PrivacyCategories,
  source: PrivacyConsent['source'],
  eventType: 'set' | 'withdrawn' = 'set',
) {
  const signal = privacySignal();
  const normalized: PrivacyCategories = {
    necessary: true,
    preferences: eventType === 'withdrawn' ? false : Boolean(categories.preferences),
    analytics: eventType === 'withdrawn' || signal ? false : Boolean(categories.analytics),
    marketing: eventType === 'withdrawn' || signal ? false : Boolean(categories.marketing),
    personalization: eventType === 'withdrawn' || signal ? false : Boolean(categories.personalization),
  };
  const consent: PrivacyConsent = {
    version: PRIVACY_CONSENT_VERSION,
    anonymousId: getAnonymousConsentId(),
    categories: normalized,
    decidedAt: new Date().toISOString(),
    source,
    privacySignal: signal || undefined,
  };
  safeLocalStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(PRIVACY_CONSENT_CHANGE_EVENT, { detail: consent }));

  await trustCenterAction('record-consent', {
    anonymousId: consent.anonymousId,
    consentVersion: consent.version,
    categories: consent.categories,
    source,
    eventType,
    privacySignal: signal || undefined,
  });
  return consent;
}

export const openPrivacyChoices = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRIVACY_CONSENT_OPEN_EVENT));
};
