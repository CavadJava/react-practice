import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'teslahubs_sale_end';
const SALE_DURATION_MS = 7 * 86400000;

export function useSaleCountdown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let saleEnd = 0;
    let timer: ReturnType<typeof setInterval>;

    const init = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      saleEnd = Number(stored);
      if (!saleEnd || saleEnd < now) {
        saleEnd = now + SALE_DURATION_MS;
        await AsyncStorage.setItem(STORAGE_KEY, String(saleEnd));
      }
      setRemaining(Math.max(0, saleEnd - Date.now()));
      timer = setInterval(() => setRemaining(Math.max(0, saleEnd - Date.now())), 30000);
    };
    init();

    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: pad(Math.floor(remaining / 86400000)),
    hours: pad(Math.floor((remaining % 86400000) / 3600000)),
    mins: pad(Math.floor((remaining % 3600000) / 60000)),
  };
}
