import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, DEFAULT_CURRENCY, formatPrice } from '../currency/currency';

const STORAGE_KEY = 'teslahubs_currency';

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  format: (usd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'USD' || stored === 'AZN') setCurrencyState(stored);
    });
  }, []);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, setCurrency, format: (usd: number) => formatPrice(usd, currency) }),
    [currency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
