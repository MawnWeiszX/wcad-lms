'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  thumbnail_url: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (course: CartItem) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito desde localStorage en el primer render
  useEffect(() => {
    const savedCart = localStorage.getItem('wcad_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wcad_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (course: CartItem) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === course.id)) return prev;
      return [...prev, course];
    });
  };

  const removeFromCart = (courseId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== courseId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (courseId: string) => {
    return items.some((item) => item.id === courseId);
  };

  const total = items.reduce((acc, item) => acc + Number(item.price), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, isInCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
