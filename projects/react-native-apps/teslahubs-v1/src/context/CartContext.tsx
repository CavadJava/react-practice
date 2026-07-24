import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PRODUCTS, Product } from '../data/products';

export type CartLine = { product: Product; qty: number };

type CartContextValue = {
  cartItems: CartLine[];
  cartCount: number;
  orderTotal: number;
  isInCart: (id: string) => boolean;
  addToCart: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const addToCart = useCallback((id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const increment = useCallback((id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const decrement = useCallback((id: string) => {
    setQuantities(prev => {
      const next = (prev[id] ?? 0) - 1;
      if (next <= 0) {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setQuantities(prev => {
      const rest = { ...prev };
      delete rest[id];
      return rest;
    });
  }, []);

  const clearCart = useCallback(() => setQuantities({}), []);

  const cartItems = useMemo<CartLine[]>(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const product = PRODUCTS.find(p => p.id === id);
          return product ? { product, qty } : null;
        })
        .filter((x): x is CartLine => x !== null),
    [quantities],
  );

  const isInCart = useCallback((id: string) => (quantities[id] ?? 0) > 0, [quantities]);
  const cartCount = useMemo(() => cartItems.reduce((sum, ci) => sum + ci.qty, 0), [cartItems]);
  const orderTotal = useMemo(() => cartItems.reduce((sum, ci) => sum + ci.product.price * ci.qty, 0), [cartItems]);

  const value: CartContextValue = {
    cartItems,
    cartCount,
    orderTotal,
    isInCart,
    addToCart,
    increment,
    decrement,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
