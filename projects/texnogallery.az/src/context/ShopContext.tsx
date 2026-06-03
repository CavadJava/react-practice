import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Product {
  name: string;
  price: string | number;
  imageUrl: string;
  oldPrice?: string;
  badge?: string;
  description?: string;
}

export interface CartItem extends Product {
  id: string;
  numericPrice: number;
  quantity: number;
}

interface ShopContextType {
  cartItems: CartItem[];
  wishlistItems: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (name: string) => boolean;
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') return price;
  const parsed = parseInt(price.replace(/\D/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.name === product.name);
      if (existing) {
        return prev.map(item =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, id: product.name, numericPrice: parsePrice(product.price), quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const toggleWishlist = (product: Product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.name === product.name);
      if (exists) {
        return prev.filter(item => item.name !== product.name);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (name: string) => {
    return wishlistItems.some(item => item.name === name);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.numericPrice * item.quantity, 0);

  return (
    <ShopContext.Provider value={{
      cartItems, wishlistItems, addToCart, removeFromCart, updateQuantity,
      toggleWishlist, isInWishlist, cartCount, wishlistCount, cartTotal
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
