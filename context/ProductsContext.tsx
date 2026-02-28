import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES, Category } from "@/constants/data";

const CUSTOM_PRODUCTS_KEY = "@freshmart_custom_products";
const DELETED_IDS_KEY = "@freshmart_deleted_ids";

interface ProductsContextValue {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [cp, di] = await Promise.all([
        AsyncStorage.getItem(CUSTOM_PRODUCTS_KEY),
        AsyncStorage.getItem(DELETED_IDS_KEY),
      ]);
      if (cp) setCustomProducts(JSON.parse(cp));
      if (di) setDeletedIds(JSON.parse(di));
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomProducts = async (items: Product[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const saveDeletedIds = async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(DELETED_IDS_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  const addProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: "custom_" + Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    setCustomProducts((prev) => {
      const updated = [...prev, newProduct];
      saveCustomProducts(updated);
      return updated;
    });
  };

  const updateProduct = (product: Product) => {
    const isCustom = product.id.startsWith("custom_");
    if (isCustom) {
      setCustomProducts((prev) => {
        const updated = prev.map((p) => (p.id === product.id ? product : p));
        saveCustomProducts(updated);
        return updated;
      });
    } else {
      setCustomProducts((prev) => {
        const existing = prev.find((p) => p.id === product.id);
        let updated: Product[];
        if (existing) {
          updated = prev.map((p) => (p.id === product.id ? product : p));
        } else {
          updated = [...prev, product];
        }
        saveCustomProducts(updated);
        return updated;
      });
      setDeletedIds((prev) => {
        const cleaned = prev.filter((id) => id !== product.id);
        saveDeletedIds(cleaned);
        return cleaned;
      });
    }
  };

  const deleteProduct = (id: string) => {
    const isCustom = id.startsWith("custom_");
    if (isCustom) {
      setCustomProducts((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        saveCustomProducts(updated);
        return updated;
      });
    } else {
      setDeletedIds((prev) => {
        const updated = [...prev, id];
        saveDeletedIds(updated);
        return updated;
      });
    }
  };

  const products = useMemo(() => {
    const filteredStatic = STATIC_PRODUCTS.filter((p) => {
      const isDeleted = deletedIds.includes(p.id);
      const isOverridden = customProducts.some((cp) => cp.id === p.id);
      return !isDeleted && !isOverridden;
    });
    return [...filteredStatic, ...customProducts];
  }, [customProducts, deletedIds]);

  const value = useMemo(
    () => ({ products, categories: STATIC_CATEGORIES, addProduct, updateProduct, deleteProduct, isLoading }),
    [products, isLoading]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
