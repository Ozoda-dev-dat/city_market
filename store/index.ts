import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
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

// Initial states
const initialUserState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  lastLogin: null,
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

// Async thunks
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { phoneNumber: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData: { phoneNumber: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const products = await response.json();
      return products;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch products');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categories = await response.json();
      return categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'orders/fetch',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { user: UserState };
      if (!state.user.token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${state.user.token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const orders = await response.json();
      return orders;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: Partial<Order>, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { user: UserState };
      if (!state.user.token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.user.token}`,
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const order = await response.json();
      return order;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create order');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.lastLogin = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastLogin = new Date().toISOString();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastLogin = new Date().toISOString();
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: 1,
          addedAt: new Date().toISOString(),
        });
      }
      
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.lastUpdated = new Date().toISOString();
      state.isDirty = true;
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.lastUpdated = new Date().toISOString();
      state.isDirty = true;
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(item => item.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        }
        
        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
        state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        state.lastUpdated = new Date().toISOString();
        state.isDirty = true;
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
      state.lastUpdated = new Date().toISOString();
      state.isDirty = true;
    },
    
    markCartSynced: (state) => {
      state.isDirty = false;
    },
  },
});

// Products slice
const productsSlice = createSlice({
  name: 'products',
  initialState: initialProductsState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    markProductsSynced: (state) => {
      state.isDirty = false;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.isDirty = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.isDirty = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Orders slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState: initialOrdersState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    markOrdersSynced: (state) => {
      state.isDirty = false;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.isDirty = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.push(action.payload);
        state.lastUpdated = new Date().toISOString();
        state.isDirty = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// App slice for global state
const appSlice = createSlice({
  name: 'app',
  initialState: {
    isOnline: true,
    lastSync: null,
    syncInProgress: false,
    syncErrors: [],
    promoCodes: [],
  },
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    
    setLastSync: (state) => {
      state.lastSync = new Date().toISOString();
    },
    
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
    },
    
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
    
    setPromoCodes: (state, action: PayloadAction<PromoCode[]>) => {
      state.promoCodes = action.payload;
    },
  },
});

// Combine reducers
const rootReducer = combineReducers({
  user: userSlice.reducer,
  cart: cartSlice.reducer,
  products: productsSlice.reducer,
  orders: ordersSlice.reducer,
  app: appSlice.reducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'cart'], // Only persist user and cart
  blacklist: ['products', 'orders'], // Don't persist products and orders (fetch fresh)
  timeout: 10000, // 10 seconds timeout
  debug: __DEV__,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Export actions
export const { logout, updateUser, clearError: clearUserError } = userSlice.actions;
export const { addToCart, removeFromCart, updateQuantity, clearCart, markCartSynced } = cartSlice.actions;
export const { clearError: clearProductsError, markProductsSynced } = productsSlice.actions;
export const { clearError: clearOrdersError, markOrdersSynced } = ordersSlice.actions;
export const { 
  setOnlineStatus, 
  setSyncInProgress, 
  setLastSync, 
  addSyncError, 
  clearSyncErrors, 
  setPromoCodes 
} = appSlice.actions;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Selectors
export const selectUser = (state: RootState) => state.user;
export const selectCart = (state: RootState) => state.cart;
export const selectProducts = (state: RootState) => state.products;
export const selectOrders = (state: RootState) => state.orders;
export const selectApp = (state: RootState) => state.app;

export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.totalAmount;
export const selectCartItemsCount = (state: RootState) => state.cart.totalItems;
export const selectIsOnline = (state: RootState) => state.app.isOnline;
export const selectSyncInProgress = (state: RootState) => state.app.syncInProgress;

export default store;
