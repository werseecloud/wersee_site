import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../lib/browserStorage';
import {
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  FX_CACHE_TTL_MS,
  LOCALE_COOKIE,
  detectLocaleFromSignals,
  formatMoney,
  getLocaleConfig,
  getLocaleFromPathname,
  isStripeCurrencySupported,
  normalizeCurrency,
  normalizeLocale,
} from '../lib/locales';

type ExchangeRate = {
  base: string;
  target: string;
  rate: number;
  date?: string;
  fetchedAt: number;
};

type LocaleContextValue = {
  locale: string;
  countryCode: string;
  currency: string;
  rateStatus: 'idle' | 'loading' | 'ready' | 'error';
  rateError: string | null;
  setLocalePreference: (locale: string) => void;
  setCurrencyPreference: (currency: string) => void;
  formatBasePrice: (amount: number, baseCurrency?: string | null) => {
    text: string;
    originalText: string;
    isConverted: boolean;
    isIndicative: boolean;
    checkoutCurrency: string;
    checkoutAmount: number;
  };
  refreshRate: (baseCurrency?: string | null, targetCurrency?: string | null) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const memoryRates = new Map<string, ExchangeRate>();
const pendingRateRequests = new Map<string, Promise<void>>();

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
};

const rateKey = (base: string, target: string) => `${base.toUpperCase()}_${target.toUpperCase()}`;

const readStoredRate = (base: string, target: string) => {
  const key = rateKey(base, target);
  const memory = memoryRates.get(key);
  if (memory && Date.now() - memory.fetchedAt < FX_CACHE_TTL_MS) return memory;

  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(safeLocalStorage.getItem(`wersee_fx_${key}`) || 'null') as ExchangeRate | null;
    if (parsed && Date.now() - parsed.fetchedAt < FX_CACHE_TTL_MS) {
      memoryRates.set(key, parsed);
      return parsed;
    }
  } catch {
    safeLocalStorage.removeItem(`wersee_fx_${key}`);
  }
  return null;
};

const writeStoredRate = (rate: ExchangeRate) => {
  const key = rateKey(rate.base, rate.target);
  memoryRates.set(key, rate);
  if (typeof window !== 'undefined') {
    safeLocalStorage.setItem(`wersee_fx_${key}`, JSON.stringify(rate));
  }
};

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const pathLocale = getLocaleFromPathname(typeof window !== 'undefined' ? window.location.pathname : location.pathname);
  const cookieLocale = normalizeLocale(readCookie(LOCALE_COOKIE));
  const initialConfig = getLocaleConfig(pathLocale || cookieLocale || DEFAULT_LOCALE);
  const [locale, setLocale] = useState(initialConfig.locale);
  const [currency, setCurrency] = useState(normalizeCurrency(readCookie(CURRENCY_COOKIE)) || initialConfig.currency || DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Map<string, ExchangeRate>>(memoryRates);
  const [rateStatus, setRateStatus] = useState<LocaleContextValue['rateStatus']>('idle');
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    const currentPathLocale = getLocaleFromPathname(window.location.pathname);
    const nextLocale = currentPathLocale || normalizeLocale(readCookie(LOCALE_COOKIE));
    if (nextLocale && nextLocale !== locale) {
      setLocale(nextLocale);
      const config = getLocaleConfig(nextLocale);
      if (!normalizeCurrency(readCookie(CURRENCY_COOKIE))) setCurrency(config.currency);
    }
  }, [location.pathname, locale]);

  const setLocalePreference = useCallback((nextLocale: string) => {
    const normalized = normalizeLocale(nextLocale);
    if (!normalized) return;
    writeCookie(LOCALE_COOKIE, normalized);
    setLocale(normalized);
  }, []);

  const setCurrencyPreference = useCallback((nextCurrency: string) => {
    const normalized = normalizeCurrency(nextCurrency);
    if (!normalized) return;
    writeCookie(CURRENCY_COOKIE, normalized);
    setCurrency(normalized);
  }, []);

  const refreshRate = useCallback(async (baseCurrency?: string | null, targetCurrency?: string | null) => {
    const base = (baseCurrency || DEFAULT_CURRENCY).toUpperCase();
    const target = (targetCurrency || currency).toUpperCase();
    if (base === target) return;

    const cached = readStoredRate(base, target);
    if (cached) {
      setRates(new Map(memoryRates));
      return;
    }

    const key = rateKey(base, target);
    const pending = pendingRateRequests.get(key);
    if (pending) {
      await pending;
      setRates(new Map(memoryRates));
      return;
    }

    const request = (async () => {
      setRateStatus('loading');
      setRateError(null);
      const { data, error } = await supabase.functions.invoke('localization', {
        body: { action: 'exchange-rate', base, target },
      });
      if (error) throw error;
      if (!data?.rate || !Number.isFinite(Number(data.rate))) throw new Error('Wisselkoers is tijdelijk niet beschikbaar.');

      writeStoredRate({
        base,
        target,
        rate: Number(data.rate),
        date: data.date,
        fetchedAt: Date.now(),
      });
      setRates(new Map(memoryRates));
      setRateStatus('ready');
    })();

    pendingRateRequests.set(key, request);
    try {
      await request;
    } catch (error: any) {
      setRateStatus('error');
      setRateError(error?.message || 'Lokale prijs kon niet worden geladen.');
    } finally {
      pendingRateRequests.delete(key);
    }
  }, [currency]);

  const formatBasePrice = useCallback((amount: number, baseCurrency?: string | null) => {
    const base = (baseCurrency || 'EUR').toUpperCase();
    const target = currency.toUpperCase();
    const numericAmount = Number(amount) || 0;
    const originalText = formatMoney(numericAmount, base, locale);
    const cached = readStoredRate(base, target) || rates.get(rateKey(base, target));
    const canConvert = base !== target && cached?.rate && Number.isFinite(cached.rate);
    const convertedAmount = canConvert ? numericAmount * cached.rate : numericAmount;
    const displayCurrency = canConvert ? target : base;

    return {
      text: formatMoney(convertedAmount, displayCurrency, locale),
      originalText,
      isConverted: Boolean(canConvert),
      isIndicative: Boolean(canConvert && !isStripeCurrencySupported(target)),
      checkoutCurrency: canConvert && isStripeCurrencySupported(target) ? target : base,
      checkoutAmount: canConvert && isStripeCurrencySupported(target) ? convertedAmount : numericAmount,
    };
  }, [currency, locale, rates]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    countryCode: getLocaleConfig(locale).countryCode,
    currency,
    rateStatus,
    rateError,
    setLocalePreference,
    setCurrencyPreference,
    formatBasePrice,
    refreshRate,
  }), [currency, formatBasePrice, locale, rateError, rateStatus, refreshRate, setCurrencyPreference, setLocalePreference]);

  useEffect(() => {
    writeCookie(LOCALE_COOKIE, locale);
    writeCookie(CURRENCY_COOKIE, currency);
  }, [currency, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
};

export const detectClientLocale = () => {
  if (typeof navigator === 'undefined') return getLocaleConfig(DEFAULT_LOCALE);
  return detectLocaleFromSignals({
    preferredLocale: readCookie(LOCALE_COOKIE),
    acceptLanguage: navigator.languages?.join(',') || navigator.language,
  });
};
