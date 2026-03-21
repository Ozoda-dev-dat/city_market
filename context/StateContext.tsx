import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Product, Order, Category, PromoCode } from '@/shared/schema';

// Types
export interface CartItem extends Product {
  quantity: number;
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  lastUpdated: string;
  isDirty: boolean;
}

export interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastLogin: string | null;
  isDirty?: boolean;
}

export interface ProductsState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isDirty: boolean;
}

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isDirty: boolean;
}

export interface AppState {
  user: UserState;
  cart: CartState;
  products: ProductsState;
  orders: OrdersState;
  promoCodes: PromoCode[];
  isOnline: boolean;
  lastSync: string | null;
  syncInProgress: boolean;
  syncErrors: string[];
}

// Context
interface StateContextType {
  state: AppState;
  // User actions
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // Products actions
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  // Orders actions
  fetchOrders: () => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<void>;
  // App actions
  setOnlineStatus: (isOnline: boolean) => void;
  syncData: () => Promise<void>;
  clearErrors: () => void;
}

const StateContext = createContext<StateContextType | null>(null);

// Initial states
const initialUserState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  lastLogin: null,
  isDirty: false,
};

const initialCartState: CartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  lastUpdated: new Date().toISOString(),
  isDirty: false,
};

const initialProductsState: ProductsState = {
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  isDirty: false,
};

const initialOrdersState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  isDirty: false,
};

const initialAppState: AppState = {
  user: initialUserState,
  cart: initialCartState,
  products: initialProductsState,
  orders: initialOrdersState,
  promoCodes: [],
  isOnline: true,
  lastSync: null,
  syncInProgress: false,
  syncErrors: [],
};

// Storage keys
const STORAGE_KEYS = {
  USER: '@freshmart_user',
  CART: '@freshmart_cart',
  LAST_SYNC: '@freshmart_last_sync',
};

// Provider
export function StateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Save data when state changes
  useEffect(() => {
    if (state.user.isDirty || state.cart.isDirty) {
      savePersistedData();
    }
  }, [state.user, state.cart]);

  // Auto-sync when online
  useEffect(() => {
    if (state.isOnline && !state.syncInProgress) {
      checkAndSync();
    }
  }, [state.isOnline]);

  const loadPersistedData = async () => {
    try {
      const [userStr, cartStr, lastSyncStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.CART),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (userStr) {
        const userData = JSON.parse(userStr);
        setState(prev => ({
          ...prev,
          user: { ...prev.user, ...userData, isDirty: false },
        }));
      }

      if (cartStr) {
        const cartData = JSON.parse(cartStr);
        setState(prev => ({
          ...prev,
          cart: { ...prev.cart, ...cartData, isDirty: false },
        }));
      }

      if (lastSyncStr) {
        setState(prev => ({
          ...prev,
          lastSync: lastSyncStr,
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  };

  const savePersistedData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user)),
        AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart)),
        state.lastSync && AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, state.lastSync),
      ]);
    } catch (error) {
      console.error('Failed to save persisted data:', error);
    }
  };

  const checkAndSync = async () => {
    const lastSync = state.lastSync;
    const now = new Date();
    const syncInterval = 5 * 60 * 1000; // 5 minutes

    if (!lastSync || (now.getTime() - new Date(lastSync).getTime() > syncInterval)) {
      await syncData();
    }
  };

  // API helper functions
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001'}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (state.user.token) {
      headers.Authorization = `Bearer ${state.user.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  // User actions
  const login = async (phoneNumber: string, password: string) => {
    setState(prev => ({ ...prev, user: { ...prev.user, isLoading: true, error: null } }));
    
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, password }),
      });

      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          lastLogin: new Date().toISOString(),
          isDirty: true,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        },
      }));
      throw error;
    }
  };

  const register = async (phoneNumber: string, password: string, name: string) => {
    setState(prev => ({ ...prev, user: { ...prev.user, isLoading: true, error: null } }));
    
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, password, name }),
      });

      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          lastLogin: new Date().toISOString(),
          isDirty: true,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        },
      }));
      throw error;
    }
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      user: { ...initialUserState, isDirty: true },
      cart: { ...initialCartState, isDirty: true },
    }));
  };

  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        user: prev.user.user ? { ...prev.user.user, ...userData } : null,
        isDirty: true,
      },
    }));
  }, []);

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    setState(prev => {
      const existingItem = prev.cart.items.find(item => item.id === product.id);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = prev.cart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev.cart.items, { ...product, quantity: 1, addedAt: new Date().toISOString() }];
      }

      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: newItems,
          totalItems,
          totalAmount,
          lastUpdated: new Date().toISOString(),
          isDirty: true,
        },
      };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState(prev => {
      const newItems = prev.cart.items.filter(item => item.id !== productId);
      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: newItems,
          totalItems,
          totalAmount,
          lastUpdated: new Date().toISOString(),
          isDirty: true,
        },
      };
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setState(prev => {
      let newItems: CartItem[];

      if (quantity <= 0) {
        newItems = prev.cart.items.filter(item => item.id !== productId);
      } else {
        newItems = prev.cart.items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
      }

      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: newItems,
          totalItems,
          totalAmount,
          lastUpdated: new Date().toISOString(),
          isDirty: true,
        },
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setState(prev => ({
      ...prev,
      cart: {
        ...initialCartState,
        isDirty: true,
      },
    }));
  }, []);

  // Products actions
  const fetchProducts = async () => {
    setState(prev => ({ ...prev, products: { ...prev.products, isLoading: true, error: null } }));
    
    try {
      const products = await apiRequest('/api/products');
      
      setState(prev => ({
        ...prev,
        products: {
          ...prev.products,
          products,
          isLoading: false,
          lastUpdated: new Date().toISOString(),
          isDirty: false,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        products: {
          ...prev.products,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch products',
        },
      }));
    }
  };

  const fetchCategories = async () => {
    setState(prev => ({ ...prev, products: { ...prev.products, isLoading: true, error: null } }));
    
    try {
      const categories = await apiRequest('/api/categories');
      
      setState(prev => ({
        ...prev,
        products: {
          ...prev.products,
          categories,
          isLoading: false,
          lastUpdated: new Date().toISOString(),
          isDirty: false,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        products: {
          ...prev.products,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch categories',
        },
      }));
    }
  };

  // Orders actions
  const fetchOrders = async () => {
    if (!state.user.isAuthenticated) return;
    
    setState(prev => ({ ...prev, orders: { ...prev.orders, isLoading: true, error: null } }));
    
    try {
      const orders = await apiRequest('/api/orders');
      
      setState(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          orders,
          isLoading: false,
          lastUpdated: new Date().toISOString(),
          isDirty: false,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch orders',
        },
      }));
    }
  };

  const createOrder = async (orderData: Partial<Order>) => {
    if (!state.user.isAuthenticated) throw new Error('Not authenticated');
    
    setState(prev => ({ ...prev, orders: { ...prev.orders, isLoading: true, error: null } }));
    
    try {
      const order = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      setState(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          orders: [...prev.orders.orders, order],
          isLoading: false,
          lastUpdated: new Date().toISOString(),
          isDirty: true,
        },
        cart: { ...initialCartState, isDirty: true }, // Clear cart after successful order
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create order',
        },
      }));
      throw error;
    }
  };

  // App actions
  const setOnlineStatus = useCallback((isOnline: boolean) => {
    setState(prev => ({ ...prev, isOnline }));
  }, []);

  const syncData = async () => {
    if (!state.isOnline || state.syncInProgress) return;
    
    setState(prev => ({ ...prev, syncInProgress: true, syncErrors: [] }));
    
    try {
      // Sync user data if authenticated
      if (state.user.isAuthenticated && state.user.user) {
        // User data is already persisted locally
        // In a real app, you might sync with server here
      }

      // Sync cart data if authenticated
      if (state.user.isAuthenticated && state.cart.isDirty) {
        // In a real app, you would sync cart with server
        setState(prev => ({
          ...prev,
          cart: { ...prev.cart, isDirty: false },
        }));
      }

      setState(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        syncInProgress: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        syncInProgress: false,
        syncErrors: [error instanceof Error ? error.message : 'Sync failed'],
      }));
    }
  };

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, error: null },
      products: { ...prev.products, error: null },
      orders: { ...prev.orders, error: null },
      syncErrors: [],
    }));
  }, []);

  const value: StateContextType = {
    state,
    login,
    register,
    logout,
    updateUser,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchProducts,
    fetchCategories,
    fetchOrders,
    createOrder,
    setOnlineStatus,
    syncData,
    clearErrors,
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

// Hook
export function useStateContext() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
}

// Selectors
export const useUser = () => {
  const { state } = useStateContext();
  return state.user;
};

export const useCart = () => {
  const { state } = useStateContext();
  return state.cart;
};

export const useProducts = () => {
  const { state } = useStateContext();
  return state.products;
};

export const useOrders = () => {
  const { state } = useStateContext();
  return state.orders;
};

export const useApp = () => {
  const { state } = useStateContext();
  return {
    isOnline: state.isOnline,
    syncInProgress: state.syncInProgress,
    syncErrors: state.syncErrors,
    lastSync: state.lastSync,
    promoCodes: state.promoCodes,
  };
};

// Convenience hooks
export const useAuth = () => {
  const { login, register, logout, updateUser } = useStateContext();
  const user = useUser();
  
  return {
    ...user,
    login,
    register,
    logout,
    updateUser,
  };
};

export const useCartActions = () => {
  const { addToCart, removeFromCart, updateQuantity, clearCart } = useStateContext();
  const cart = useCart();
  
  return {
    ...cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};

export const useProductsData = () => {
  const { fetchProducts, fetchCategories } = useStateContext();
  const products = useProducts();
  
  return {
    ...products,
    fetchProducts,
    fetchCategories,
  };
};

export const useOrdersData = () => {
  const { fetchOrders, createOrder } = useStateContext();
  const orders = useOrders();
  
  return {
    ...orders,
    fetchOrders,
    createOrder,
  };
};
