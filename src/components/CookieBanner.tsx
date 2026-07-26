import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Cookie, Loader2, Settings2, X } from 'lucide-react';
import {
  getDefaultPrivacyCategories,
  getStoredPrivacyConsent,
  openPrivacyChoices,
  PRIVACY_CONSENT_OPEN_EVENT,
  savePrivacyConsent,
  type PrivacyCategories,
} from '../lib/privacyConsent';

const choices: Array<{ key: keyof PrivacyCategories; title: string; description: string; locked?: boolean }> = [
  { key: 'necessary', title: 'Necessary', description: 'Authentication, security, checkout and saved privacy choices.', locked: true },
  { key: 'preferences', title: 'Preferences', description: 'Language, appearance and convenience settings.' },
  { key: 'analytics', title: 'Analytics', description: 'Helps Wersee understand product performance and errors.' },
  { key: 'marketing', title: 'Marketing', description: 'Measures campaigns and relevant promotions.' },
  { key: 'personalization', title: 'Personalization', description: 'Adapts recommendations using your activity.' },
];

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<PrivacyCategories>(getDefaultPrivacyCategories);

  useEffect(() => {
    const stored = getStoredPrivacyConsent();
    if (stored) setCategories(stored.categories);
    else {
      const timer = window.setTimeout(() => setVisible(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const open = () => {
      setCategories(getStoredPrivacyConsent()?.categories || getDefaultPrivacyCategories());
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(PRIVACY_CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(PRIVACY_CONSENT_OPEN_EVENT, open);
  }, []);

  const persist = async (next: PrivacyCategories, source: 'consent_sheet' | 'footer' = 'consent_sheet') => {
    setSaving(true);
    setError('');
    try {
      await savePrivacyConsent(next, source);
      setCategories(next);
      setVisible(false);
      setCustomizing(false);
    } catch (requestError: any) {
      setError(requestError?.message || 'Your choice was saved on this device, but account sync is temporarily unavailable.');
      window.setTimeout(() => setVisible(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  const reject = () => persist(getDefaultPrivacyCategories());
  const acceptAll = () => persist({ necessary: true, preferences: true, analytics: true, marketing: true, personalization: true });

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          role="dialog"
          aria-modal="false"
          aria-labelledby="privacy-sheet-title"
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl rounded-[1.75rem] border border-black/10 bg-white/95 p-4 text-[#1D1D1F] shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#121212]/95 dark:text-white sm:inset-x-6 sm:bottom-6 sm:p-6"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="privacy-sheet-title" className="text-base font-bold sm:text-lg">Your privacy choices</h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-black/55 dark:text-white/55 sm:text-sm">
                    Necessary storage keeps Wersee working. Everything else is optional, and you can change it at any time.
                  </p>
                </div>
                {getStoredPrivacyConsent() && (
                  <button onClick={() => setVisible(false)} className="rounded-full p-2 text-black/45 hover:bg-black/5 hover:text-black dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close privacy choices">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {customizing && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {choices.map((choice) => (
                        <label key={choice.key} className="flex min-h-20 cursor-pointer items-start justify-between gap-3 rounded-2xl border border-black/[0.07] bg-black/[0.025] p-3.5 dark:border-white/[0.08] dark:bg-white/[0.035]">
                          <span>
                            <span className="flex items-center gap-1.5 text-sm font-bold">{choice.title}{choice.locked && <Check className="h-3.5 w-3.5" />}</span>
                            <span className="mt-1 block text-xs leading-4 text-black/50 dark:text-white/50">{choice.description}</span>
                          </span>
                          <input
                            type="checkbox"
                            className="mt-1 h-5 w-5 accent-black dark:accent-white"
                            checked={categories[choice.key]}
                            disabled={choice.locked}
                            onChange={(event) => setCategories((current) => ({ ...current, [choice.key]: event.target.checked }))}
                          />
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p role="status" className="mt-3 text-xs text-amber-700 dark:text-amber-300">{error}</p>}

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => setCustomizing((value) => !value)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-black/65 hover:bg-black/5 dark:text-white/65 dark:hover:bg-white/10">
                  <Settings2 className="h-4 w-4" /> Customize <ChevronDown className={`h-4 w-4 transition ${customizing ? 'rotate-180' : ''}`} />
                </button>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button disabled={saving} onClick={reject} className="h-11 rounded-full border border-black/10 px-5 text-sm font-bold hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10">Reject optional</button>
                  {customizing ? (
                    <button disabled={saving} onClick={() => persist(categories)} className="flex h-11 items-center justify-center rounded-full bg-[#1D1D1F] px-5 text-sm font-bold text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save choices'}
                    </button>
                  ) : (
                    <button disabled={saving} onClick={acceptAll} className="flex h-11 items-center justify-center rounded-full bg-[#1D1D1F] px-5 text-sm font-bold text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept all'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export { openPrivacyChoices };
