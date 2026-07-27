import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARGO_COMPANIES } from '../data/cargo';

const STORAGE_KEY = 'teslahubs_cargo_accounts';

export type CargoAccount = {
  id: string;
  companyId: string;
  label: string;
  username: string;
  password: string;
};

function seedAccounts(): CargoAccount[] {
  return CARGO_COMPANIES.flatMap(company =>
    [1, 2, 3].map(n => ({
      id: `${company.id}-seed-${n}`,
      companyId: company.id,
      label: `İstifadəçi ${n}`,
      username: '',
      password: '',
    })),
  );
}

type CargoAccountsContextValue = {
  accounts: CargoAccount[];
  accountsForCompany: (companyId: string) => CargoAccount[];
  getAccount: (id: string) => CargoAccount | undefined;
  addAccount: (account: Omit<CargoAccount, 'id'>) => void;
  updateAccount: (id: string, account: Omit<CargoAccount, 'id'>) => void;
  removeAccount: (id: string) => void;
};

const CargoAccountsContext = createContext<CargoAccountsContextValue | undefined>(undefined);

export function CargoAccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<CargoAccount[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setAccounts(parsed);
            return;
          }
        } catch {
          // ignore malformed storage
        }
      }
      const seeded = seedAccounts();
      setAccounts(seeded);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    });
  }, []);

  const persist = (updater: (prev: CargoAccount[]) => CargoAccount[]) => {
    setAccounts(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addAccount = (account: Omit<CargoAccount, 'id'>) => {
    persist(prev => [...prev, { ...account, id: `${Date.now()}` }]);
  };

  const updateAccount = (id: string, account: Omit<CargoAccount, 'id'>) => {
    persist(prev => prev.map(a => (a.id === id ? { ...account, id } : a)));
  };

  const removeAccount = (id: string) => {
    persist(prev => prev.filter(a => a.id !== id));
  };

  const value: CargoAccountsContextValue = {
    accounts,
    accountsForCompany: companyId => accounts.filter(a => a.companyId === companyId),
    getAccount: id => accounts.find(a => a.id === id),
    addAccount,
    updateAccount,
    removeAccount,
  };

  return <CargoAccountsContext.Provider value={value}>{children}</CargoAccountsContext.Provider>;
}

export function useCargoAccounts() {
  const ctx = useContext(CargoAccountsContext);
  if (!ctx) throw new Error('useCargoAccounts must be used within CargoAccountsProvider');
  return ctx;
}
