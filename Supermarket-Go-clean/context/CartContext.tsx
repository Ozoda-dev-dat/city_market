import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "@/shared/schema";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "@freshmart_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart:", e);
    }
  };

  const addToCart = (product: Product) => {
    // Check if product is in stock
    if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      throw new Error("Bu mahsulot hozircha mavjud emas");
    }
    
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      let newItems: CartItem[];
      if (existing) {
        // Check stock availability before adding to cart
        const newQuantity = existing.quantity + 1;
        if (product.stockQuantity !== undefined && newQuantity > product.stockQuantity) {
          throw new Error(`Mahsulot zaxirada faqat ${product.stockQuantity} ta mavjud`);
        }
        
        newItems = prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQuantity } : i
        );
      } else {
        if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
          throw new Error("Bu mahsulot hozircha mavjud emas");
        }
        newItems = [...prev, { product, quantity: 1 }];
      }
      saveCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.product.id !== productId);
      saveCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => {
      const newItems = prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      );
      saveCart(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  };

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isLoading }),
    [items, totalItems, totalPrice, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
