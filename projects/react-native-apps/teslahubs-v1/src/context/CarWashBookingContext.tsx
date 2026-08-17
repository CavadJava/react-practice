import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VehicleType } from '../data/carWash';

const STORAGE_KEY = 'teslahubs_carwash_bookings';

export type CarWashBooking = {
  id: string;
  providerId: string;
  branchId: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  addonIds: string[];
  customerName: string;
  customerPhone: string;
  total: number;
  createdAt: string;
};

type NewBooking = Omit<CarWashBooking, 'id' | 'createdAt'>;

type CarWashBookingContextValue = {
  bookings: CarWashBooking[];
  isSlotTaken: (providerId: string, branchId: string, date: string, time: string) => boolean;
  addBooking: (booking: NewBooking) => void;
};

const CarWashBookingContext = createContext<CarWashBookingContextValue | undefined>(undefined);

// Booked slots are only stored on this device — there's no shared backend yet,
// so this only prevents double-booking within the same phone. Once a real
// booking API exists, this local lock becomes a cache of the server's truth.
export function CarWashBookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<CarWashBooking[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setBookings(parsed);
        } catch {
          // ignore malformed storage
        }
      }
    });
  }, []);

  const addBooking = (booking: NewBooking) => {
    setBookings(prev => {
      const next = [...prev, { ...booking, id: `cwb_${Date.now()}`, createdAt: new Date().toISOString() }];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo<CarWashBookingContextValue>(
    () => ({
      bookings,
      isSlotTaken: (providerId, branchId, date, time) =>
        bookings.some(b => b.providerId === providerId && b.branchId === branchId && b.date === date && b.time === time),
      addBooking,
    }),
    [bookings],
  );

  return <CarWashBookingContext.Provider value={value}>{children}</CarWashBookingContext.Provider>;
}

export function useCarWashBooking() {
  const ctx = useContext(CarWashBookingContext);
  if (!ctx) throw new Error('useCarWashBooking must be used within CarWashBookingProvider');
  return ctx;
}
