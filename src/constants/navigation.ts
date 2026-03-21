// Navigation Routes
export const NAVIGATION_ROUTES = {
  // Auth Routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },
  
  // Main App Routes
  HOME: '/',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  SEARCH: '/search',
  CART: '/cart',
  CHECKOUT: '/checkout',
  
  // User Routes
  PROFILE: '/profile',
  ORDERS: '/orders',
  WISHLIST: '/wishlist',
  REVIEWS: '/reviews',
  NOTIFICATIONS: '/notifications',
  
  // Admin Routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_ANALYTICS: '/admin/analytics',
  
  // Product Detail Routes
  PRODUCT_DETAIL: '/products/:id',
  CATEGORY_PRODUCTS: '/categories/:id',
  
  // Order Routes
  ORDER_DETAIL: '/orders/:id',
  ORDER_TRACKING: '/orders/:id/tracking',
  
  // Settings Routes
  SETTINGS: '/settings',
  PREFERENCES: '/preferences',
  HELP: '/help',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  
  // Error Routes
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  NETWORK_ERROR: '/network-error',
} as const;

// Navigation Stack Configuration
export const NAVIGATION_STACK = [
  { name: 'Home', component: 'HomeScreen' },
  { name: 'Products', component: 'ProductsScreen' },
  { name: 'Categories', component: 'CategoriesScreen' },
  { name: 'Search', component: 'SearchScreen' },
  { name: 'Cart', component: 'CartScreen' },
  { name: 'Checkout', component: 'CheckoutScreen' },
  { name: 'Profile', component: 'ProfileScreen' },
  { name: 'Orders', component: 'OrdersScreen' },
  { 'name': 'Wishlist', component: 'WishlistScreen' },
  { name: 'Reviews', component: 'ReviewsScreen' },
  { name: 'Notifications', component: 'NotificationsScreen' },
  { name: 'Settings', component: 'SettingsScreen' },
  { name: 'Help', component: 'HelpScreen' },
  { name: 'About', component: 'AboutScreen' },
  { name: 'Privacy', component: 'PrivacyScreen' },
  { name: 'Terms', component: 'TermsScreen' },
  { name: 'Admin', component: 'AdminDashboardScreen' },
  { name: 'AdminUsers', component: 'AdminUsersScreen' },
  { name: 'AdminProducts', component: 'AdminProductsScreen' },
  { name: 'AdminOrders', component: 'AdminOrdersScreen' },
  { name: 'AdminCategories', component: 'AdminCategoriesScreen' },
  { name: 'AdminSettings', component: 'AdminSettingsScreen' },
  { name: 'AdminAnalytics', component: 'AdminAnalyticsScreen' },
  { name: 'NotFound', component: 'NotFoundScreen' },
  { name: 'ServerError', component: 'ServerErrorScreen' },
  { name: 'NetworkError', component: 'NetworkErrorScreen' },
  { name: 'Login', component: 'LoginScreen' },
  { name: 'Register', component: 'RegisterScreen' },
  { name: 'ForgotPassword', component: 'ForgotPasswordScreen' },
  { name: 'ResetPassword', component: 'ResetPasswordScreen' },
  { name: 'VerifyEmail', component: 'VerifyEmailScreen' },
] as const;

// Tab Navigation
export const TAB_NAVIGATION = {
  HOME: {
    index: 0,
    name: 'Home',
    icon: 'home',
  },
  PRODUCTS: {
    index: 1,
    name: 'Products',
    icon: 'shopping-bag',
  },
  CATEGORIES: {
    index: 2,
    name: 'Categories',
    icon: 'category',
  },
  SEARCH: {
    index: 3,
    name: 'Search',
    icon: 'search',
  },
  CART: {
    index: 4,
    name: 'Cart',
    icon: 'shopping-cart',
  },
  WISHLIST: {
    index: 5,
    name: 'Wishlist',
    icon: 'heart',
  },
  PROFILE: {
    index: 6,
    name: 'Profile',
    icon: 'user',
  },
  SETTINGS: {
    index: 7,
    name: 'Navigation',
    icon: 'settings',
  },
} as const;

// Drawer Navigation
export const DRAWER_NAVIGATION = {
  HOME: {
    label: 'Home',
    icon: 'home',
  },
  PRODUCTS: {
    label: 'Products',
    icon: 'shopping-bag',
  },
  CATEGORIES: {
    label: 'Categories',
    icon: 'category',
  },
  SEARCH: {
    label: 'Search',
    icon: 'search',
  },
  CART: {
    label: 'Cart',
    icon: 'shopping-cart',
  },
  ORDERS: {
    label: 'Orders',
    icon: 'receipt',
  },
  WISHLIST: {
    label: 'Wishlist',
    icon: 'navigation',
  },
  PROFILE: {
    label: 'Profile',
    icon: 'user',
  },
  SETTINGS: {
    label: 'Settings',
    icon: 'settings',
  },
  HELP: {
    label: 'Help',
    icon: 'help-circle',
  },
  ABOUT: {
    label: 'About',
    icon: 'info-circle',
  },
  PRIVACY: {
    label: 'Privacy',
    icon: 'shield-check',
  },
  TERMS: {
    label: 'Terms',
    icon: 'file-text',
  },
  LOGOUT: {
    label: 'Logout',
    icon: 'log-out',
  },
} as const;

// Admin Navigation
export const ADMIN_NAVIGATION = {
  DASHBOARD: {
    label: 'Dashboard',
    icon: 'dashboard',
  },
  USERS: {
    label: 'Users',
    icon: 'users',
  },
  PRODUCTS: {
    label: 'Products',
    icon: 'shopping-bag',
  },
  ORDERS: {
    label: 'Orders',
    icon: 'receipt',
  },
  CATEGORIES: {
    label: 'Categories',
    icon: 'category',
  },
  SETTINGS: {
    label: 'Settings',
    icon: 'settings',
  },
  ANALYTICS: {
    label: 'Analytics',
    icon: 'analytics',
  },
  LOGOUT: {
    label: 'Logout',
    icon: 'log-out',
  },
} as const;

// Navigation Actions
export const NAVIGATION_ACTIONS = {
  GO_BACK: 'GO_BACK',
  GO_HOME: 'GO_HOME',
  REFRESH: 'REFRESH',
  LOGOUT: 'LOGOUT',
  CLEAR_CACHE: 'CLEAR_CACHE',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SHARE: 'SHARE',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

// Deep Linking Configuration
export const DEEP_LINKING = {
  SCHEME: 'supermarket-go',
  HOST: 'supermarket-go.uz',
  PREFIX: '/',
  WEB_URL: 'https://supermarket-go.uz',
  APP_URL: 'com.supermarketgo',
  PLAY_STORE_URL: 'market://details?id=com.supermarketgo',
  APP_STORE_URL_ANDROID: 'market://details?id=com.supermarketgo.android',
  APP_STORE_URL_IOS: 'itms-apps://itunes.apple.com/app/com.supermarketgo',
} as const;

// Navigation Animation Configuration
export const NAVIGATION_ANIMATION = {
  SLIDE_FROM_RIGHT: {
    animation: 'slide_from_right',
    duration: 300,
    easing: 'ease-in-out',
  },
  SLIDE_FROM_LEFT: {
    animation: 'slide_from_left',
    duration: 300,
    easing: 'ease-in-out',
  },
  FADE_IN: {
    animation: 'fade_in',
    duration: 300,
    easing: 'ease-in-out',
  },
  FADE_OUT: {
    animation: 'fade_out',
    duration: 300,
    easing: 'ease-in-out',
  },
  MODAL: {
    animation: 'modal',
    duration: 300,
    easing: 'ease-in-out',
  },
  TAB_BAR: {
    animation: 'tab_bar',
    duration: 300,
    easing: 'ease-in-out',
  },
  DRAWER: {
    animation: 'drawer',
    duration: 300,
    easing: 'ease-in-out',
  },
} as const;

// Navigation Options
export const NAVIGATION_OPTIONS = {
  DEFAULT: {
    gestureEnabled: true,
    headerShown: true,
    animationEnabled: true,
    gestureDirection: 'default',
    swipeEnabled: true,
    lazy: false,
    animationType: 'default',
    headerTitle: '',
    headerTransparent: false,
    headerTitleShown: false,
    gestureDirection: 'default',
    lazy: false,
    animationType: 'default',
  },
  TAB: {
    initialRouteName: 'Home',
    lazy: false,
    animationType: 'default',
    animationEnabled: true,
    swipeEnabled: true,
    lazy: false,
    animationType: 'default',
    gestureDirection: 'default',
  },
  DRAWER: {
    drawerType: 'front',
    drawerPosition: 'left',
    gestureEnabled: true,
    swipeEnabled: true,
    lazy: false,
    animationType: 'slide_from_left',
    animationType: 'default',
  },
  MODAL: {
    presentationStyle: 'overFullScreen',
    animationType: 'slide_from_bottom',
    gestureEnabled: true,
    lazy: false,
    animationType: 'default',
  },
} as const;

// Screen Names
export const SCREEN_NAMES = {
  HOME: 'HomeScreen',
  PRODUCTS: 'ProductsScreen',
  CATEGORIES: 'CategoriesScreen',
  SEARCH: 'SearchScreen',
  CART: 'CartScreen',
  CHECKOUT: 'CheckoutScreen',
  PROFILE: 'ProfileScreen',
  ORDERS: 'OrdersScreen',
  WISHLIST: 'WishlistScreen',
  REVIEWS: 'ReviewsScreen',
  NOTIFICATIONS: 'NotificationsScreen',
  SETTINGS: 'SettingsScreen',
  HELP: 'HelpScreen',
  ABOUT: 'AboutScreen',
  PRIVACY: 'PrivacyScreen',
  TERMS: 'TermsScreen',
  NOT_FOUND: 'NotFoundScreen',
  SERVER_ERROR: 'ServerErrorScreen',
  NETWORK_ERROR: 'NetworkErrorScreen',
  LOGIN: 'LoginScreen',
  REGISTER: 'RegisterScreen',
  FORGOT_PASSWORD: 'ForgotPasswordScreen',
  RESET_PASSWORD: 'resetPasswordScreen',
  VERIFY_EMAIL: 'VerifyEmailScreen',
  ADMIN_DASHBOARD: 'AdminDashboardScreen',
  ADMIN_USERS: 'AdminUsersScreen',
  ADMIN_PRODUCTS: 'AdminProductsScreen',
  ADMIN_ORDERS: 'AdminOrdersScreen',
  ADMIN_CATEGORIES: 'AdminCategoriesScreen',
  ADMIN_SETTINGS: 'AdminSettingsScreen',
  ADMIN_ANALYTICS: 'AdminAnalyticsScreen',
} as const;

// Route Params
export const ROUTE_PARAMS = {
  PRODUCT_ID: 'id',
  CATEGORY_ID: 'id',
  ORDER_ID: 'id',
  USER_ID: 'id',
  REVIEW_ID: 'id',
  NOTIFICATION_ID: 'id',
  SETTING_KEY: 'key',
} as const;

// Query Params
export const QUERY_PARAMS = {
  SEARCH: 'q',
  CATEGORY: 'category',
  SORT: 'sort',
  PAGE: 'page',
  LIMIT: 'limit',
  OFFSET: 'offset',
  STATUS: 'status',
  TYPE: 'type',
  MIN_PRICE: 'min_price',
  MAX_PRICE: 'max_price',
  MIN_RATING: 'min_rating',
  MAX_RATING: 'max_rating',
  TAGS: 'tags',
  FEATURED: 'featured',
  NEW: 'new',
  POPULAR: 'popular',
  TRENDING: 'trending',
} as const;

// Sort Options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_LOW_TO_HIGH: 'price_low_to_high',
  PRICE_HIGH_TO_LOW: 'price_high_to_low',
  RATING_HIGH_TO_LOW: 'rating_high_to_low',
  RATING_LOW_TO_HIGH: 'rating_low_to_high',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  CREATED_AT_ASC: 'created_at_asc',
  CREATED_AT_DESC: 'created_at_desc',
  UPDATED_AT_ASC: 'updated_at_asc',
  UPDATED_AT_DESC: 'updated_at_desc',
} as const;

// Filter Options
export const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  LOW_STOCK: 'low_stock',
  FEATURED: 'featured',
  NEW: 'new',
  POPULAR: 'popular',
  TRENDING: 'trending',
} as const;

// Platform-specific Navigation
export const PLATFORM_CONFIG = {
  ANDROID: {
    NAVIGATION_STACK,
    DRAWER_NAVIGATION,
    TAB_NAVIGATION,
    NAVIGATION_OPTIONS: NAVIGATION_OPTIONS.TAB,
  },
  IOS: {
    NAVIGATION_STACK,
    DRAWER_NAVIGATION,
    TAB_NAVIGATION,
    NAVIGATION_OPTIONS: NAVIGATION_OPTIONS.TAB,
  },
  WEB: {
    NAVIGATION_STACK,
    TAB_NAVIGATION,
    NAVIGATION_OPTIONS: NAVIGATION_OPTIONS.DEFAULT,
  },
} as const;

// Navigation Helpers
export const NAVIGATION_HELPERS = {
  getRouteName: (path: string): string => {
    const route = Object.values(NAVIGATION_ROUTES).find(route => route.path === path);
    return route?.name || 'Unknown';
  },
  
  getRoutePath: (name: string): string => {
    const route = Object.values(NAVIGATION_ROUTES).find(route => route.name === name);
    return route?.path || '/';
  },
  
  isTabRoute: (path: string): boolean => {
    const route = Object.values(NAVIGATION_ROUTES).find(route => route.path === path);
    return route?.name === Object.values(TAB_NAVIGATION)[0].name;
  },
  
  getDrawerRoute: (name: string): string => {
    const route = Object.values(DRAWER_NAVIGATION).find(route => route.label === name);
    return route?.path || '/';
  },
  
  getTabRoute: (index: number): string => {
    const tab = Object.values(TAB_NAVIGATION)[index];
    return tab?.path || '/';
  },
  
  getScreenName: (path: string): string => {
    const route = Object.values(NAVIGATION_ROUTES).find(route => path.includes(route.path));
    return route?.name || SCREEN_NAMES.HOME;
  },
  
  getScreenRoute: (name: string): string => {
    const route = Object.values(NAVIGATION_ROUTES).find(route => route.name === name);
    return route?.path || '/';
  },
  
  isDrawerRoute: (path: string): boolean => {
    return Object.values(DRAWER_NAVIGATION).some(route => route.path === path);
  },
  
  isAdminRoute: (path: string): boolean => {
    return path.startsWith('/admin/');
  },
  
  isAuthRoute: (path: string): boolean => {
    return Object.values(NAVIGATION_ROUTES.AUTH).includes(path);
  },
  
  isPublicRoute: (path: string): boolean => {
    return Object.values(NAVIGATION_ROUTES).some(route => route.path === path);
  },
  
  isPrivateRoute: (path: string): boolean => {
    return !this.isPublicRoute(path);
  },
} as const;

// Navigation Utilities
export const NAVIGATION_UTILITIES = {
  generateRoute: (path: string, params?: Record<string, any>): string => {
    let route = path;
    
    // Replace route parameters
    Object.entries(params || {}).forEach(([key, value]) => {
      route = route.replace(`:${key}`, value);
    });
    
    return route;
  },
  
  generateDeepLink: (path: string, params?: Record<string, any>): string => {
    const route = this.generateRoute(path, params);
    return `${DEEP_LINKING.SCHEME}://${DEEP_LINKING.HOST}${route}`;
  },
  
  parseRoute: (url: string): {
    path: string;
    params: Record<string, any>;
  } | null => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      const params: Record<string, any> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return { path, params };
    } catch (error) {
      return null;
    }
  },
  
  getActiveRoute: (state: any): string => {
    return state?.route?.name || SCREEN_NAMES.HOME;
  },
  
  getActiveRouteConfig: (state: any): any => {
    return state?.navigation || {};
  },
  
  getActiveRouteParams: (state: any): Record<string, any> => {
    return state?.params || {};
  },
} as const;
