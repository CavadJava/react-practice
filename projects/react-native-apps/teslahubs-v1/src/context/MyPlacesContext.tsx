import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'teslahubs_my_places';

export type MyPlace = {
  id: string;
  label: string;
  address: string;
  note?: string;
  lat?: number;
  lng?: number;
};

type MyPlacesContextValue = {
  places: MyPlace[];
  addPlace: (place: Omit<MyPlace, 'id'>) => void;
  updatePlace: (id: string, place: Omit<MyPlace, 'id'>) => void;
  removePlace: (id: string) => void;
};

const MyPlacesContext = createContext<MyPlacesContextValue | undefined>(undefined);

export function MyPlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<MyPlace[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setPlaces(parsed);
        } catch {
          // ignore malformed storage
        }
      }
    });
  }, []);

  const persist = (updater: (prev: MyPlace[]) => MyPlace[]) => {
    setPlaces(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addPlace = (place: Omit<MyPlace, 'id'>) => {
    persist(prev => [...prev, { ...place, id: `${Date.now()}` }]);
  };

  const updatePlace = (id: string, place: Omit<MyPlace, 'id'>) => {
    persist(prev => prev.map(p => (p.id === id ? { ...place, id } : p)));
  };

  const removePlace = (id: string) => {
    persist(prev => prev.filter(p => p.id !== id));
  };

  return <MyPlacesContext.Provider value={{ places, addPlace, updatePlace, removePlace }}>{children}</MyPlacesContext.Provider>;
}

export function useMyPlaces() {
  const ctx = useContext(MyPlacesContext);
  if (!ctx) throw new Error('useMyPlaces must be used within MyPlacesProvider');
  return ctx;
}
