import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCALE, Locale, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'teslahubs_locale';

type Vars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Vars) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function resolve(path: string, dict: unknown): string {
  const value = path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), dict);
  return typeof value === 'string' ? value : path;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(vars[key] ?? ''));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'en' || stored === 'az') setLocaleState(stored);
    });
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const t = useMemo(() => {
    const dict = TRANSLATIONS[locale];
    return (path: string, vars?: Vars) => interpolate(resolve(path, dict), vars);
  }, [locale]);

  const value: LocaleContextValue = { locale, setLocale, t };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
