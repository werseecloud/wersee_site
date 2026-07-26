import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { safeLocalStorage } from '../lib/browserStorage';

type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const resolveThemePreference = (preference: ThemePreference): Theme => {
  return preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
};

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const storedPreference = safeLocalStorage.getItem('theme_preference');
  if (storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system') {
    return resolveThemePreference(storedPreference);
  }

  const savedTheme = safeLocalStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((nextTheme: Theme) => setThemeState(nextTheme), []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    safeLocalStorage.setItem('theme', theme);
    safeLocalStorage.setItem('theme_preference', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
