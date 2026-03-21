// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    VALIDATE_TOKEN: '/auth/validate',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: '/users/:id',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    RESTORE: '/users/:id/restore',
    ACTIVITY: '/users/:id/activity',
    EXPORT: '/users/export',
  },
  PRODUCTS: {
    LIST: '/products',
    GET: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    RECOMMENDED: '/products/recommended',
    TRENDING: '/products/trending',
    INVENTORY: '/products/inventory',
  },
  ORDERS: {
    LIST: '/orders',
    GET: '/orders/:id',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    DELETE: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    TRACK: '/orders/:id/track',
    HISTORY: '/orders/history',
    STATISTICS: '/orders/statistics',
  },
  CATEGORIES: {
    LIST: '/categories',
    GET: '/categories/:id',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id',
  },
  PAYMENTS: {
    PROCESS: '/payments/process',
    CONFIRM: '/payments/confirm',
    CANCEL: '/payments/cancel',
    REFUND: '/payments/refund',
    HISTORY: '/payments/history',
    METHODS: '/payments/methods',
    STATISTICS: '/payments/statistics',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    SALES: '/admin/sales',
    USERS: '/admin/users',
    INVENTORY: '/admin/inventory',
    SETTINGS: '/admin/settings',
    HEALTH: '/admin/health',
    METRICS: '/admin/metrics',
    ALERTS: '/admin/alerts',
  },
  WEBHOOKS: {
    STRIPE: '/webhooks/stripe',
    PAYPAL: '/webhooks/paypal',
    GENERIC: '/webhooks/:provider',
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

// Request Headers
export const HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUEST_ID: 'X-Request-ID',
  X_API_VERSION: 'X-API-Version',
  X_CLIENT_VERSION: 'X-Client-Version',
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_WEBP: 'image/webp',
} as const;

// Response Status Codes
export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// API Version
export const API_VERSION = 'v1';

// Request Timeout (in milliseconds)
export const REQUEST_TIMEOUT = 10000;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_FACTOR: 2,
} as const;
