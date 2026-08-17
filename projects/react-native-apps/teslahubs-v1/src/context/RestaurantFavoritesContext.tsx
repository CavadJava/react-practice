import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'teslahubs_restaurant_favorites';

type RestaurantFavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
};

const RestaurantFavoritesContext = createContext<RestaurantFavoritesContextValue | undefined>(undefined);

export function RestaurantFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFavoriteIds(parsed);
        } catch {
          // ignore malformed storage
        }
      }
    });
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <RestaurantFavoritesContext.Provider value={{ favoriteIds, isFavorite: id => favoriteIds.includes(id), toggleFavorite }}>
      {children}
    </RestaurantFavoritesContext.Provider>
  );
}

export function useRestaurantFavorites() {
  const ctx = useContext(RestaurantFavoritesContext);
  if (!ctx) throw new Error('useRestaurantFavorites must be used within RestaurantFavoritesProvider');
  return ctx;
}
