import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest } from "@/lib/query-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, Category, Order } from "@/constants/data";

interface AppContextValue {
  products: Product[];
  categories: Category[];
  orders: Order[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const addProductMutation = useMutation({
    mutationFn: (newProduct: Omit<Product, "id">) => 
      apiRequest("POST", "/api/products", newProduct),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });

  const updateProductMutation = useMutation({
    mutationFn: (updatedProduct: Product) => 
      apiRequest("PATCH", `/api/products/${updatedProduct.id}`, updatedProduct),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      apiRequest("PATCH", `/api/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/orders"] }),
  });

  const addProduct = (product: Omit<Product, "id">) => addProductMutation.mutate(product);
  const updateProduct = (product: Product) => updateProductMutation.mutate(product);
  const deleteProduct = (id: string) => deleteProductMutation.mutate(id);
  const updateOrderStatus = (id: string, status: string) => updateOrderStatusMutation.mutate({ id, status });

  const value = useMemo(
    () => ({ 
      products, 
      categories, 
      orders,
      addProduct, 
      updateProduct, 
      deleteProduct, 
      updateOrderStatus,
      isLoading: isLoadingProducts || isLoadingCategories || isLoadingOrders
    }),
    [products, categories, orders, isLoadingProducts, isLoadingCategories, isLoadingOrders]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// Keep backward compatibility for now
export const useProducts = useApp;
export const ProductsProvider = AppProvider;
