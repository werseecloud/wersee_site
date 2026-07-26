type StorageName = 'localStorage' | 'sessionStorage';

export interface BrowserStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const createSafeStorage = (storageName: StorageName) => {
  const fallback = new Map<string, string>();

  const getBrowserStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      return window[storageName];
    } catch {
      return null;
    }
  };

  return {
    getItem: (key: string) => {
      try {
        const value = getBrowserStorage()?.getItem(key) ?? null;
        if (value !== null) fallback.set(key, value);
        return value ?? fallback.get(key) ?? null;
      } catch {
        return fallback.get(key) ?? null;
      }
    },
    setItem: (key: string, value: string) => {
      fallback.set(key, value);
      try {
        getBrowserStorage()?.setItem(key, value);
      } catch {
        // Memory keeps the current tab working when persistence is blocked.
      }
    },
    removeItem: (key: string) => {
      fallback.delete(key);
      try {
        getBrowserStorage()?.removeItem(key);
      } catch {
        // Memory was already cleared.
      }
    },
  };
};

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');

export const createMigratingStorage = (
  storage: BrowserStorageLike,
  legacyKey: string,
  currentKey: string,
): BrowserStorageLike => {
  const legacyKeyFor = (key: string) => (
    key.startsWith(currentKey) ? `${legacyKey}${key.slice(currentKey.length)}` : null
  );

  return {
    getItem: (key) => {
      const currentValue = storage.getItem(key);
      if (currentValue !== null) return currentValue;

      const fallbackKey = legacyKeyFor(key);
      if (!fallbackKey) return null;

      const legacyValue = storage.getItem(fallbackKey);
      if (legacyValue === null) return null;

      storage.setItem(key, legacyValue);
      storage.removeItem(fallbackKey);
      return legacyValue;
    },
    setItem: (key, value) => {
      storage.setItem(key, value);
      const fallbackKey = legacyKeyFor(key);
      if (fallbackKey) storage.removeItem(fallbackKey);
    },
    removeItem: (key) => {
      storage.removeItem(key);
      const fallbackKey = legacyKeyFor(key);
      if (fallbackKey) storage.removeItem(fallbackKey);
    },
  };
};

export const createBrowserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('-');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
