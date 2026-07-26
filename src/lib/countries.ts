import { LOCALE_CONFIGS } from './locales';

export const COUNTRIES = LOCALE_CONFIGS
  .map((config) => ({ code: config.countryCode, name: config.countryName }))
  .sort((a, b) => a.name.localeCompare(b.name));
