const RECENTLY_VIEWED_KEY = 'wersee-recently-viewed-v1';
const RECENTLY_VIEWED_EVENT = 'wersee:recently-viewed';
const MAX_RECENTLY_VIEWED = 24;

type RecentlyViewedEntry = {
  id: string;
  viewedAt: number;
};

const isRecentlyViewedEntry = (value: unknown): value is RecentlyViewedEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as RecentlyViewedEntry;
  return typeof entry.id === 'string' && entry.id.length > 0 && Number.isFinite(entry.viewedAt);
};

export const readRecentlyViewed = (): RecentlyViewedEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter(isRecentlyViewedEntry).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
};

export const rememberRecentlyViewed = (listingId: string) => {
  if (typeof window === 'undefined' || !listingId) return;

  const nextEntries = [
    { id: listingId, viewedAt: Date.now() },
    ...readRecentlyViewed().filter((entry) => entry.id !== listingId),
  ].slice(0, MAX_RECENTLY_VIEWED);

  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextEntries));
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT));
  } catch {
    // Product discovery should keep working when browser storage is unavailable.
  }
};

export const subscribeToRecentlyViewed = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(RECENTLY_VIEWED_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(RECENTLY_VIEWED_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
