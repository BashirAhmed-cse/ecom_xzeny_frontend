"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface CartItem {
  id: string;
  name: string;
  size: string;
  originalPrice: string;
  discountedPrice: string;
  image: string;
  quantity: number;
  appliedDiscount?: number;
  variant?: string;
  color?: string;
  sku?: string;
}

interface FlashDiscount {
  id: number;
  percentage: number;
  trigger_condition: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  message: string;
  is_active: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getItemCount: () => number;
  applyDiscountToItem: (itemId: string, discountPercentage: number) => void;
  removeDiscountFromItem: (itemId: string) => void;
  isInCart: (id: string) => boolean;
  getItem: (id: string) => CartItem | undefined;
  activeFlashDiscounts: FlashDiscount[];
  setActiveFlashDiscounts: (discounts: FlashDiscount[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeFlashDiscounts, setActiveFlashDiscounts] = useState<FlashDiscount[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const savedDiscounts = localStorage.getItem('activeFlashDiscounts');
      
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      if (savedDiscounts) {
        setActiveFlashDiscounts(JSON.parse(savedDiscounts));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      localStorage.setItem('activeFlashDiscounts', JSON.stringify(activeFlashDiscounts));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems, activeFlashDiscounts]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      // Check if item already exists in cart (same ID and size)
      const existingItemIndex = prev.findIndex(
        cartItem => cartItem.id === item.id && cartItem.size === item.size
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveFlashDiscounts([]);
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.discountedPrice) || parseFloat(item.originalPrice);
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = (): number => {
    return cartItems.length;
  };

  const getItemCount = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const applyDiscountToItem = (itemId: string, discountPercentage: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const originalPrice = parseFloat(item.originalPrice);
          const discountedPrice = originalPrice * (1 - discountPercentage / 100);
          return {
            ...item,
            discountedPrice: discountedPrice.toFixed(2),
            appliedDiscount: discountPercentage
          };
        }
        return item;
      })
    );
  };

  const removeDiscountFromItem = (itemId: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            discountedPrice: item.originalPrice,
            appliedDiscount: undefined
          };
        }
        return item;
      })
    );
  };

  const isInCart = (id: string): boolean => {
    return cartItems.some(item => item.id === id);
  };

  const getItem = (id: string): CartItem | undefined => {
    return cartItems.find(item => item.id === id);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getItemCount,
    applyDiscountToItem,
    removeDiscountFromItem,
    isInCart,
    getItem,
    activeFlashDiscounts,
    setActiveFlashDiscounts
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};