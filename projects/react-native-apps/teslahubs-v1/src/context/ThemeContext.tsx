import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME, THEMES, ThemeColors, ThemeKey } from '../theme/theme';

const STORAGE_KEY = 'teslahubs_theme';

type ThemeContextValue = {
  themeKey: ThemeKey;
  colors: ThemeColors;
  setThemeKey: (key: ThemeKey) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored && stored in THEMES) setThemeKeyState(stored as ThemeKey);
    });
  }, []);

  const setThemeKey = (key: ThemeKey) => {
    setThemeKeyState(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ themeKey, colors: THEMES[themeKey].colors, setThemeKey }),
    [themeKey],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
