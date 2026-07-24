export type Currency = 'USD' | 'AZN';

export const CURRENCIES: { key: Currency; symbol: string; label: string }[] = [
  { key: 'AZN', symbol: '₼', label: 'AZN' },
  { key: 'USD', symbol: '$', label: 'USD' },
];

export const DEFAULT_CURRENCY: Currency = 'AZN';

// Prices in data/products.ts are stored in USD; this is the display-only conversion rate.
const USD_TO_AZN = 1.7;

export function convertFromUsd(usd: number, currency: Currency): number {
  return currency === 'AZN' ? usd * USD_TO_AZN : usd;
}

export function formatPrice(usd: number, currency: Currency): string {
  const amount = convertFromUsd(usd, currency).toFixed(2);
  return currency === 'AZN' ? `${amount} ₼` : `$${amount}`;
}
