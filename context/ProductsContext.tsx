import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { apiRequest } from "@/lib/query-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, Category, Order } from "@/shared/schema";

interface AppContextValue {
  products: Product[];
  categories: Category[];
  orders: Order[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  deleteCategory: (id: string) => void;
  createCategory: (category: any) => Promise<void>;
  updateOrderStatus: (id: string, status: string, courierId?: string) => Promise<void>;
  createOrder: (order: any) => Promise<void>;
  createPromoCode: (promo: any) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products").then(res => res.json()),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories").then(res => res.json()),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status, courierId }: { id: string; status: string; courierId?: string }) =>
      apiRequest("PATCH", `/api/orders/${id}/status`, { status, courierId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/orders"] }),
  });

  const createOrderMutation = useMutation({
    mutationFn: (newOrder: any) => apiRequest("POST", "/api/orders", newOrder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/orders"] }),
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: (promo: any) => apiRequest("POST", "/api/promo-codes", promo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] }),
  });

  const value = useMemo(
    () => ({
      products,
      categories,
      orders,
      addProduct: (product: Omit<Product, "id">) => addProductMutation.mutate(product),
      updateProduct: (product: Product) => updateProductMutation.mutate(product),
      deleteProduct: (id: string) => deleteProductMutation.mutate(id),
      deleteCategory: (id: string) => deleteCategoryMutation.mutate(id),
      updateOrderStatus: (id: string, status: string, courierId?: string) =>
        updateOrderStatusMutation.mutateAsync({ id, status, courierId } as any).then(() => {}),
      createOrder: (order: any) => createOrderMutation.mutateAsync(order).then(() => {}),
      createPromoCode: (promo: any) => createPromoCodeMutation.mutateAsync(promo).then(() => {}),
      createCategory: (cat: any) =>
        apiRequest("POST", "/api/categories", cat).then(() =>
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] })
        ),
      isLoading: isLoadingProducts || isLoadingCategories || isLoadingOrders,
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

export const useProducts = useApp;
export const ProductsProvider = AppProvider;
