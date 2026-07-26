export type AccessibilityPreferences = {
  reduced_motion: boolean;
  increased_contrast: boolean;
  interface_text_scale: number;
  captions_enabled: boolean;
};

export const accessibilityDefaults: AccessibilityPreferences = {
  reduced_motion: false,
  increased_contrast: false,
  interface_text_scale: 1,
  captions_enabled: false,
};

const storageKey = 'wersee-accessibility-v1';

export const applyAccessibilityPreferences = (preferences: AccessibilityPreferences) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.reducedMotion = String(preferences.reduced_motion);
  root.dataset.increasedContrast = String(preferences.increased_contrast);
  root.dataset.captions = String(preferences.captions_enabled);
  root.style.setProperty('--wersee-interface-scale', String(Math.min(1.35, Math.max(1, Number(preferences.interface_text_scale) || 1))));
};

export const persistAccessibilityPreferences = (preferences: AccessibilityPreferences) => {
  try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* storage can be unavailable */ }
  applyAccessibilityPreferences(preferences);
};

export const bootstrapAccessibilityPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    applyAccessibilityPreferences(stored ? { ...accessibilityDefaults, ...stored } : accessibilityDefaults);
  } catch {
    applyAccessibilityPreferences(accessibilityDefaults);
  }
};
