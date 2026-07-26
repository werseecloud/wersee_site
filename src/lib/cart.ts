import { useEffect, useState } from 'react';

export type CartItem = {
  listingId: string;
  title: string;
  type: string;
  image: string | null;
  price: number;
  originalPrice: number;
  currency: string;
  planIndex?: number;
};

const CART_STORAGE_KEY = 'wersee-shopping-cart-v1';
const CART_UPDATED_EVENT = 'wersee:cart-updated';

const readCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.listingId === 'string' && typeof item.title === 'string')
      : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
};

export const addCartItem = (item: CartItem) => {
  const items = readCart();
  const key = `${item.listingId}:${item.planIndex ?? ''}`;
  const nextItems = items.filter((existing) => `${existing.listingId}:${existing.planIndex ?? ''}` !== key);
  writeCart([...nextItems, item]);
};

export const removeCartItem = (listingId: string, planIndex?: number) => {
  writeCart(readCart().filter((item) => item.listingId !== listingId || item.planIndex !== planIndex));
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    const refresh = () => setItems(readCart());
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return {
    items,
    count: items.length,
    removeItem: removeCartItem,
  };
};
