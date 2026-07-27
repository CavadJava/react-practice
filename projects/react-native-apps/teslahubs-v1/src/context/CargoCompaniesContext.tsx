import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CargoCompany, DEFAULT_CARGO_COMPANIES } from '../data/cargo';

const STORAGE_KEY = 'teslahubs_cargo_companies';

type CargoCompaniesContextValue = {
  companies: CargoCompany[];
  getCompany: (id: string) => CargoCompany | undefined;
  addCompany: (company: Omit<CargoCompany, 'id'>) => void;
  updateCompany: (id: string, company: Omit<CargoCompany, 'id'>) => void;
  removeCompany: (id: string) => void;
};

const CargoCompaniesContext = createContext<CargoCompaniesContextValue | undefined>(undefined);

export function CargoCompaniesProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<CargoCompany[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCompanies(parsed);
            return;
          }
        } catch {
          // ignore malformed storage
        }
      }
      setCompanies(DEFAULT_CARGO_COMPANIES);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARGO_COMPANIES));
    });
  }, []);

  const persist = (updater: (prev: CargoCompany[]) => CargoCompany[]) => {
    setCompanies(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addCompany = (company: Omit<CargoCompany, 'id'>) => {
    persist(prev => [...prev, { ...company, id: `${Date.now()}` }]);
  };

  const updateCompany = (id: string, company: Omit<CargoCompany, 'id'>) => {
    persist(prev => prev.map(c => (c.id === id ? { ...company, id } : c)));
  };

  const removeCompany = (id: string) => {
    persist(prev => prev.filter(c => c.id !== id));
  };

  const value: CargoCompaniesContextValue = {
    companies,
    getCompany: id => companies.find(c => c.id === id),
    addCompany,
    updateCompany,
    removeCompany,
  };

  return <CargoCompaniesContext.Provider value={value}>{children}</CargoCompaniesContext.Provider>;
}

export function useCargoCompanies() {
  const ctx = useContext(CargoCompaniesContext);
  if (!ctx) throw new Error('useCargoCompanies must be used within CargoCompaniesProvider');
  return ctx;
}
