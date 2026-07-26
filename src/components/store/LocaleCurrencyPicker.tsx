import React from 'react';
import { Globe2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { CURRENCIES, LOCALE_CONFIGS, getLocaleFromPathname, stripLocaleFromPathname } from '../../lib/locales';

type LocaleCurrencyPickerProps = {
  className?: string;
  dark?: boolean;
};

export const LocaleCurrencyPicker = ({ className = '', dark = true }: LocaleCurrencyPickerProps) => {
  const { locale, currency, setLocalePreference, setCurrencyPreference } = useLocale();
  const controlClass = dark
    ? 'liquid-glass-pill text-white'
    : 'liquid-glass-pill-light text-gray-900';

  const handleLocaleChange = (nextLocale: string) => {
    setLocalePreference(nextLocale);
    const currentPath = window.location.pathname;
    const stripped = stripLocaleFromPathname(currentPath);
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const nextPath = `/${nextLocale}${stripped === '/' ? '' : stripped}${search}${hash}`;
    if (getLocaleFromPathname(currentPath) !== nextLocale) {
      window.location.assign(nextPath);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 rounded-full px-3.5 py-2 ${controlClass}`}>
        <Globe2 className="h-4 w-4 opacity-70" />
        <select
          value={locale}
          onChange={(event) => handleLocaleChange(event.target.value)}
          className="bg-transparent text-xs font-bold outline-none"
          aria-label="Taal kiezen"
        >
          {LOCALE_CONFIGS.map((config) => (
            <option key={config.locale} value={config.locale} className="text-black">
              {config.languageName} ({config.countryCode})
            </option>
          ))}
        </select>
      </div>
      <select
        value={currency}
        onChange={(event) => setCurrencyPreference(event.target.value)}
        className={`rounded-full px-3.5 py-2 text-xs font-bold outline-none ${controlClass}`}
        aria-label="Valuta kiezen"
      >
        {CURRENCIES.map((item) => (
          <option key={item} value={item} className="text-black">
            {item}
          </option>
        ))}
      </select>
    </div>
  );
};
