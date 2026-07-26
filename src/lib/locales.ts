export type CountryCode =
  | 'AE' | 'AR' | 'AT' | 'AU' | 'BE' | 'BR' | 'CA' | 'CH' | 'CL' | 'CN'
  | 'CO' | 'CZ' | 'DE' | 'DK' | 'EG' | 'ES' | 'FI' | 'FR' | 'GB' | 'GR'
  | 'HU' | 'ID' | 'IE' | 'IL' | 'IN' | 'IT' | 'JP' | 'KE' | 'KR' | 'MX'
  | 'MY' | 'NG' | 'NL' | 'NO' | 'NZ' | 'PE' | 'PH' | 'PL' | 'PT' | 'RO'
  | 'SA' | 'SE' | 'SG' | 'TH' | 'TR' | 'US' | 'VN' | 'ZA';

export type LocaleConfig = {
  countryCode: CountryCode;
  countryName: string;
  languageCode: string;
  languageName: string;
  locale: string;
  currency: string;
  currencyName: string;
};

export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_CURRENCY = 'USD';
export const LOCALE_COOKIE = 'wersee_locale';
export const CURRENCY_COOKIE = 'wersee_currency';
export const FX_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const LOCALE_CONFIGS: LocaleConfig[] = [
  { countryCode: 'AE', countryName: 'United Arab Emirates', languageCode: 'ar', languageName: 'Arabic', locale: 'ar-AE', currency: 'AED', currencyName: 'UAE dirham' },
  { countryCode: 'AR', countryName: 'Argentina', languageCode: 'es', languageName: 'Spanish', locale: 'es-AR', currency: 'ARS', currencyName: 'Argentine peso' },
  { countryCode: 'AT', countryName: 'Austria', languageCode: 'de', languageName: 'German', locale: 'de-AT', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'AU', countryName: 'Australia', languageCode: 'en', languageName: 'English', locale: 'en-AU', currency: 'AUD', currencyName: 'Australian dollar' },
  { countryCode: 'BE', countryName: 'Belgium', languageCode: 'nl', languageName: 'Dutch', locale: 'nl-BE', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'BR', countryName: 'Brazil', languageCode: 'pt', languageName: 'Portuguese', locale: 'pt-BR', currency: 'BRL', currencyName: 'Brazilian real' },
  { countryCode: 'CA', countryName: 'Canada', languageCode: 'en', languageName: 'English', locale: 'en-CA', currency: 'CAD', currencyName: 'Canadian dollar' },
  { countryCode: 'CH', countryName: 'Switzerland', languageCode: 'de', languageName: 'German', locale: 'de-CH', currency: 'CHF', currencyName: 'Swiss franc' },
  { countryCode: 'CL', countryName: 'Chile', languageCode: 'es', languageName: 'Spanish', locale: 'es-CL', currency: 'CLP', currencyName: 'Chilean peso' },
  { countryCode: 'CN', countryName: 'China', languageCode: 'zh', languageName: 'Chinese', locale: 'zh-CN', currency: 'CNY', currencyName: 'Chinese yuan' },
  { countryCode: 'CO', countryName: 'Colombia', languageCode: 'es', languageName: 'Spanish', locale: 'es-CO', currency: 'COP', currencyName: 'Colombian peso' },
  { countryCode: 'CZ', countryName: 'Czech Republic', languageCode: 'cs', languageName: 'Czech', locale: 'cs-CZ', currency: 'CZK', currencyName: 'Czech koruna' },
  { countryCode: 'DE', countryName: 'Germany', languageCode: 'de', languageName: 'German', locale: 'de-DE', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'DK', countryName: 'Denmark', languageCode: 'da', languageName: 'Danish', locale: 'da-DK', currency: 'DKK', currencyName: 'Danish krone' },
  { countryCode: 'EG', countryName: 'Egypt', languageCode: 'ar', languageName: 'Arabic', locale: 'ar-EG', currency: 'EGP', currencyName: 'Egyptian pound' },
  { countryCode: 'ES', countryName: 'Spain', languageCode: 'es', languageName: 'Spanish', locale: 'es-ES', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'FI', countryName: 'Finland', languageCode: 'fi', languageName: 'Finnish', locale: 'fi-FI', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'FR', countryName: 'France', languageCode: 'fr', languageName: 'French', locale: 'fr-FR', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'GB', countryName: 'United Kingdom', languageCode: 'en', languageName: 'English', locale: 'en-GB', currency: 'GBP', currencyName: 'Pound sterling' },
  { countryCode: 'GR', countryName: 'Greece', languageCode: 'el', languageName: 'Greek', locale: 'el-GR', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'HU', countryName: 'Hungary', languageCode: 'hu', languageName: 'Hungarian', locale: 'hu-HU', currency: 'HUF', currencyName: 'Hungarian forint' },
  { countryCode: 'ID', countryName: 'Indonesia', languageCode: 'id', languageName: 'Indonesian', locale: 'id-ID', currency: 'IDR', currencyName: 'Indonesian rupiah' },
  { countryCode: 'IE', countryName: 'Ireland', languageCode: 'en', languageName: 'English', locale: 'en-IE', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'IL', countryName: 'Israel', languageCode: 'he', languageName: 'Hebrew', locale: 'he-IL', currency: 'ILS', currencyName: 'Israeli new shekel' },
  { countryCode: 'IN', countryName: 'India', languageCode: 'en', languageName: 'English', locale: 'en-IN', currency: 'INR', currencyName: 'Indian rupee' },
  { countryCode: 'IT', countryName: 'Italy', languageCode: 'it', languageName: 'Italian', locale: 'it-IT', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'JP', countryName: 'Japan', languageCode: 'ja', languageName: 'Japanese', locale: 'ja-JP', currency: 'JPY', currencyName: 'Japanese yen' },
  { countryCode: 'KE', countryName: 'Kenya', languageCode: 'en', languageName: 'English', locale: 'en-KE', currency: 'KES', currencyName: 'Kenyan shilling' },
  { countryCode: 'KR', countryName: 'South Korea', languageCode: 'ko', languageName: 'Korean', locale: 'ko-KR', currency: 'KRW', currencyName: 'South Korean won' },
  { countryCode: 'MX', countryName: 'Mexico', languageCode: 'es', languageName: 'Spanish', locale: 'es-MX', currency: 'MXN', currencyName: 'Mexican peso' },
  { countryCode: 'MY', countryName: 'Malaysia', languageCode: 'ms', languageName: 'Malay', locale: 'ms-MY', currency: 'MYR', currencyName: 'Malaysian ringgit' },
  { countryCode: 'NG', countryName: 'Nigeria', languageCode: 'en', languageName: 'English', locale: 'en-NG', currency: 'NGN', currencyName: 'Nigerian naira' },
  { countryCode: 'NL', countryName: 'Netherlands', languageCode: 'nl', languageName: 'Dutch', locale: 'nl-NL', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'NO', countryName: 'Norway', languageCode: 'nb', languageName: 'Norwegian Bokmal', locale: 'nb-NO', currency: 'NOK', currencyName: 'Norwegian krone' },
  { countryCode: 'NZ', countryName: 'New Zealand', languageCode: 'en', languageName: 'English', locale: 'en-NZ', currency: 'NZD', currencyName: 'New Zealand dollar' },
  { countryCode: 'PE', countryName: 'Peru', languageCode: 'es', languageName: 'Spanish', locale: 'es-PE', currency: 'PEN', currencyName: 'Peruvian sol' },
  { countryCode: 'PH', countryName: 'Philippines', languageCode: 'en', languageName: 'English', locale: 'en-PH', currency: 'PHP', currencyName: 'Philippine peso' },
  { countryCode: 'PL', countryName: 'Poland', languageCode: 'pl', languageName: 'Polish', locale: 'pl-PL', currency: 'PLN', currencyName: 'Polish zloty' },
  { countryCode: 'PT', countryName: 'Portugal', languageCode: 'pt', languageName: 'Portuguese', locale: 'pt-PT', currency: 'EUR', currencyName: 'Euro' },
  { countryCode: 'RO', countryName: 'Romania', languageCode: 'ro', languageName: 'Romanian', locale: 'ro-RO', currency: 'RON', currencyName: 'Romanian leu' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', languageCode: 'ar', languageName: 'Arabic', locale: 'ar-SA', currency: 'SAR', currencyName: 'Saudi riyal' },
  { countryCode: 'SE', countryName: 'Sweden', languageCode: 'sv', languageName: 'Swedish', locale: 'sv-SE', currency: 'SEK', currencyName: 'Swedish krona' },
  { countryCode: 'SG', countryName: 'Singapore', languageCode: 'en', languageName: 'English', locale: 'en-SG', currency: 'SGD', currencyName: 'Singapore dollar' },
  { countryCode: 'TH', countryName: 'Thailand', languageCode: 'th', languageName: 'Thai', locale: 'th-TH', currency: 'THB', currencyName: 'Thai baht' },
  { countryCode: 'TR', countryName: 'Turkey', languageCode: 'tr', languageName: 'Turkish', locale: 'tr-TR', currency: 'TRY', currencyName: 'Turkish lira' },
  { countryCode: 'US', countryName: 'United States', languageCode: 'en', languageName: 'English', locale: 'en-US', currency: 'USD', currencyName: 'US dollar' },
  { countryCode: 'VN', countryName: 'Vietnam', languageCode: 'vi', languageName: 'Vietnamese', locale: 'vi-VN', currency: 'VND', currencyName: 'Vietnamese dong' },
  { countryCode: 'ZA', countryName: 'South Africa', languageCode: 'en', languageName: 'English', locale: 'en-ZA', currency: 'ZAR', currencyName: 'South African rand' },
];

export const LOCALES = LOCALE_CONFIGS.map((config) => config.locale);
export const CURRENCIES = Array.from(new Set(LOCALE_CONFIGS.map((config) => config.currency))).sort();

export const STRIPE_PRESENTMENT_CURRENCIES = new Set([
  'AED', 'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CZK',
  'DKK', 'EGP', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY',
  'KES', 'KRW', 'MXN', 'MYR', 'NGN', 'NOK', 'NZD', 'PEN', 'PHP', 'PLN',
  'RON', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'VND', 'ZAR',
]);

export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF',
  'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export const normalizeLocale = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().replace('_', '-');
  const exact = LOCALES.find((locale) => locale.toLowerCase() === trimmed.toLowerCase());
  return exact || null;
};

export const normalizeCurrency = (value?: string | null) => {
  if (!value) return null;
  const currency = value.trim().toUpperCase();
  return CURRENCIES.includes(currency) ? currency : null;
};

export const getLocaleConfig = (locale?: string | null) => {
  const normalized = normalizeLocale(locale) || DEFAULT_LOCALE;
  return LOCALE_CONFIGS.find((config) => config.locale === normalized) || LOCALE_CONFIGS.find((config) => config.locale === DEFAULT_LOCALE)!;
};

export const getConfigForCountry = (countryCode?: string | null) => {
  if (!countryCode) return null;
  return LOCALE_CONFIGS.find((config) => config.countryCode === countryCode.toUpperCase());
};

export const getConfigForLanguage = (acceptLanguage?: string | null) => {
  if (!acceptLanguage) return null;
  const languageRanges = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0])
    .filter(Boolean);

  for (const range of languageRanges) {
    const locale = normalizeLocale(range);
    if (locale) return getLocaleConfig(locale);

    const language = range.split('-')[0]?.toLowerCase();
    const config = LOCALE_CONFIGS.find((item) => item.languageCode === language);
    if (config) return config;
  }

  return null;
};

export const detectLocaleFromSignals = (params: { countryCode?: string | null; acceptLanguage?: string | null; preferredLocale?: string | null }) => {
  const preferred = normalizeLocale(params.preferredLocale);
  if (preferred) return getLocaleConfig(preferred);

  return getConfigForCountry(params.countryCode)
    || getConfigForLanguage(params.acceptLanguage)
    || getLocaleConfig(DEFAULT_LOCALE);
};

export const getLocaleFromPathname = (pathname: string) => {
  const segment = pathname.split('/').filter(Boolean)[0];
  return normalizeLocale(segment);
};

export const stripLocaleFromPathname = (pathname: string) => {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname || '/';
  const stripped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`, 'i'), '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
};

export const formatMoney = (amount: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency.toUpperCase()} ${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
  }
};

export const toStripeMinorUnits = (amount: number, currency: string) => {
  const normalized = currency.toUpperCase();
  const factor = ZERO_DECIMAL_CURRENCIES.has(normalized) ? 1 : 100;
  return Math.max(0, Math.round(amount * factor));
};

export const isStripeCurrencySupported = (currency?: string | null) => {
  if (!currency) return false;
  return STRIPE_PRESENTMENT_CURRENCIES.has(currency.toUpperCase());
};
