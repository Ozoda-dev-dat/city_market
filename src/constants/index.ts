// Application Constants
export const APP_CONFIG = {
  NAME: 'Supermarket Go',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern supermarket management system',
  AUTHOR: 'Supermarket Go Team',
  HOMEPAGE: 'https://supermarket-go.uz',
  SUPPORT_EMAIL: 'support@supermarket.uz',
  SUPPORT_PHONE: '+998901234567',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

// Database Configuration
export const DB_CONFIG = {
  MAX_CONNECTIONS: 20,
  CONNECTION_TIMEOUT: 10000,
  QUERY_TIMEOUT: 30000,
  IDLE_TIMEOUT: 10000,
  POOL_MIN: 2,
  POOL_MAX: 10,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  SHORT_TTL: 30 * 1000,      // 30 seconds
  LONG_TTL: 60 * 60 * 1000,   // 1 hour
  MAX_SIZE: 1000,            // Maximum number of items
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/json'
  ],
  IMAGE_QUALITY: 80,
  IMAGE_COMPRESSION: 0.8,
} as const;

// Payment Configuration
export const PAYMENT_CONFIG = {
  CURRENCY: 'UZS',
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 10000000,
  REFUND_PERIOD_DAYS: 30,
  PROCESSING_TIMEOUT: 5 * 60 * 1000, // 5 minutes
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  BATCH_SIZE: 100,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  WEBHOOK_TIMEOUT: 10000,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_EXPIRY: 60 * 60 * 1000,      // 1 hour
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 1000, // 7 days
} as const;

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  SCROLL_THRESHOLD: 100,
  LOAD_MORE_THRESHOLD: 0.8,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Please log in to continue.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  SAVED: 'Saved successfully.',
  LOADED: 'Loaded successfully.',
  SYNCED: 'Synced successfully.',
  UPLOADED: 'Uploaded successfully.',
  DOWNLOADED: 'Downloaded successfully.',
  SENT: 'Sent successfully.',
} as const;

// Status Messages
export const STATUS_MESSAGES = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SYNCING: 'Syncing...',
  PROCESSING: 'Processing...',
  UPLOADING: 'Uploading...',
  DOWNLOADING: 'Downloading...',
  CONNECTING: 'Connecting...',
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number (+998XXXXXXXXX).',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_NUMBER: 'Please enter a valid number.',
  INVALID_URL: 'Please enter a valid URL.',
  TOO_SHORT: 'This field is too short.',
  TOO_LONG: 'This field is too long.',
  INVALID_FORMAT: 'Invalid format.',
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD.MM.YYYY',
  DISPLAY_WITH_TIME: 'DD.MM.YYYY HH:mm',
  DATABASE: 'YYYY-MM-DD',
  DATABASE_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
  API: 'YYYY-MM-DDTHH:mm:ssZ',
  TIME_ONLY: 'HH:mm',
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  PHONE: /^\+998\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
  NUMERIC: /^\d+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9-]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COURIER: 'courier',
  CUSTOMER: 'customer',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  BANK_TRANSFER: 'bank_transfer',
  DIGITAL_WALLET: 'digital_wallet',
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  FRUITS: 'fruits',
  VEGETABLES: 'vegetables',
  DAIRY: 'dairy',
  MEAT: 'meat',
  BAKERY: 'bakery',
  BEVERAGES: 'beverages',
  SNACKS: 'snacks',
  HOUSEHOLD: 'household',
  PERSONAL_CARE: 'personal_care',
  ELECTRONICS: 'electronics',
} as const;

// Product Units
export const PRODUCT_UNITS = {
  PIECE: 'piece',
  KG: 'kg',
  GRAM: 'g',
  LITER: 'l',
  ML: 'ml',
  BOX: 'box',
  BOTTLE: 'bottle',
  PACK: 'pack',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Theme Colors
export const COLORS = {
  PRIMARY: '#2E7D32',
  SECONDARY: '#F97316',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  GRAY: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Screen Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

// Environment
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TESTING: 'testing',
} as const;

// Export all constants
export * from './api';
export * from './database';
export * from './errors';
export * from './navigation';
export * from './permissions';
export * from './storage';
