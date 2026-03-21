// Database Configuration
export const DB_CONFIG = {
  // Connection Settings
  POOL_MIN: 2,
  POOL_MAX: 10,
  CONNECTION_TIMEOUT: 10000,
  IDLE_TIMEOUT: 10000,
  QUERY_TIMEOUT: 30000,
  
  // Query Settings
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
  
  // Migration Settings
  MIGRATION_TIMEOUT: 300000, // 5 minutes
  BACKUP_TIMEOUT: 600000,   // 10 minutes
  
  // Performance Settings
  ENABLE_QUERY_LOGGING: true,
  ENABLE_SLOW_QUERY_LOGGING: true,
  SLOW_QUERY_THRESHOLD: 1000, // milliseconds
  
  // Cache Settings
  ENABLE_QUERY_CACHE: true,
  QUERY_CACHE_SIZE: 1000,
  QUERY_CACHE_TTL: 300000, // 5 minutes
} as const;

// Table Names
export const TABLES = {
  USERS: 'users',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PROMO_CODES: 'promo_codes',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  PAYMENT_METHODS: 'payment_methods',
  REFUNDS: 'refunds',
  WISHLISTS: 'wishlists',
  PRODUCT_REVIEWS: 'product_reviews',
  NOTIFICATIONS: 'notifications',
  ADMIN_SETTINGS: 'admin_settings',
  INVENTORY_MOVEMENTS: 'inventory_movements',
  SYSTEM_LOGS: 'system_logs',
  AUDIT_LOGS: 'audit_logs',
} as const;

// Index Names
export const INDEXES = {
  // User Indexes
  USERS_PHONE: 'idx_users_phone',
  USERS_EMAIL: 'idx_users_email',
  USERS_ROLE: 'idx_users_role',
  USERS_ACTIVE: 'idx_users_active',
  USERS_CREATED_AT: 'idx_users_created_at',
  
  // Product Indexes
  PRODUCTS_CATEGORY: 'idx_products_category',
  PRODUCTS_PRICE: 'idx_products_price',
  PRODUCTS_RATING: 'idx_products_rating',
  PRODUCTS_STOCK: 'idx_products_stock',
  PRODUCTS_ACTIVE: 'idx_products_active',
  PRODUCTS_SEARCH: 'idx_products_search',
  
  // Order Indexes
  ORDERS_CUSTOMER: 'idx_orders_customer',
  ORDERS_STATUS: 'idx_orders_status',
  ORDERS_CREATED_AT: 'idx_orders_created_at',
  ORDERS_TOTAL: 'idx_orders_total',
  
  // Payment Indexes
  PAYMENT_TRANSACTIONS_USER: 'idx_payment_transactions_user',
  PAYMENT_TRANSACTIONS_ORDER: 'idx_payment_transactions_order',
  PAYMENT_TRANSACTIONS_STATUS: 'idx_payment_transactions_status',
  PAYMENT_TRANSACTIONS_CREATED_AT: 'idx_payment_transactions_created_at',
  
  // Payment Method Indexes
  PAYMENT_METHODS_USER: 'idx_payment_methods_user',
  PAYMENT_METHODS_TYPE: 'idx_payment_methods_type',
  PAYMENT_METHODS_DEFAULT: 'idx_payment_methods_default',
  
  // Refund Indexes
  REFUNDS_TRANSACTION: 'idx_refunds_transaction',
  REFUNDS_USER: 'idx_refunds_user',
  REFUNDS_STATUS: 'idx_refunds_status',
  REFUNDS_CREATED_AT: 'idx_refunds_created_at',
  
  // Notification Indexes
  NOTIFICATIONS_USER: 'idx_notifications_user',
  NOTIFICATIONS_TYPE: 'idx_notifications_type',
  NOTIFICATIONS_READ: 'idx_notifications_read',
  NOTIFICATIONS_CREATED_AT: 'idx_notifications_created_at',
  
  // Audit Indexes
  AUDIT_LOGS_TABLE: 'idx_audit_logs_table',
  AUDIT_LOGS_USER: 'idx_audit_logs_user',
  AUDIT_LOGS_ACTION: 'idx_audit_logs_action',
  AUDIT_LOGS_CREATED_AT: 'idx_audit_logs_created_at',
} as const;

// Foreign Key Constraints
export const FOREIGN_KEYS = {
  ORDERS_CUSTOMER_ID: 'fk_orders_customer_id',
  ORDERS_COURIER_ID: 'fk_orders_courier_id',
  ORDER_ITEMS_ORDER_ID: 'fk_order_items_order_id',
  ORDER_ITEMS_PRODUCT_ID: 'fk_order_items_product_id',
  PAYMENT_TRANSACTIONS_USER_ID: 'fk_payment_transactions_user_id',
  PAYMENT_TRANSACTIONS_ORDER_ID: 'fk_payment_transactions_order_id',
  PAYMENT_METHODS_USER_ID: 'fk_payment_methods_user_id',
  REFUNDS_PAYMENT_TRANSACTION_ID: 'fk_refunds_payment_transaction_id',
  REFUNDS_USER_ID: 'fk_refunds_user_id',
  REFUNDS_ORDER_ID: 'fk_refunds_order_id',
  WISHLISTS_USER_ID: 'fk_wishlists_user_id',
  WISHLISTS_PRODUCT_ID: 'fk_wishlists_product_id',
  PRODUCT_REVIEWS_USER_ID: 'fk_product_reviews_user_id',
  PRODUCT_REVIEWS_PRODUCT_ID: 'fk_product_reviews_product_id',
  NOTIFICATIONS_USER_ID: 'fk_notifications_user_id',
  ADMIN_SETTINGS_UPDATED_BY: 'fk_admin_settings_updated_by',
  INVENTORY_MOVEMENTS_PRODUCT_ID: 'fk_inventory_movements_product_id',
  INVENTORY_MOVEMENTS_USER_ID: 'fk_inventory_movements_user_id',
  AUDIT_LOGS_USER_ID: 'fk_audit_logs_user_id',
} as const;

// Check Constraints
export const CHECK_CONSTRAINTS = {
  USERS_PHONE_LENGTH: 'chk_users_phone_length',
  USERS_EMAIL_FORMAT: 'chk_users_email_format',
  PRODUCTS_PRICE_POSITIVE: 'chk_products_price_positive',
  PRODUCTS_STOCK_POSITIVE: 'chk_products_stock_positive',
  ORDERS_TOTAL_POSITIVE: 'chk_orders_total_positive',
  PAYMENT_TRANSACTIONS_AMOUNT_POSITIVE: 'chk_payment_transactions_amount_positive',
  REFUNDS_AMOUNT_POSITIVE: 'chk_refunds_amount_positive',
} as const;

// Query Patterns
export const QUERY_PATTERNS = {
  // Common Patterns
  ACTIVE_RECORDS: 'deleted_at IS NULL AND is_active = true',
  BY_CREATED_AT: 'ORDER BY created_at',
  BY_UPDATED_AT: 'ORDER BY updated_at',
  BY_ID: 'ORDER BY id',
  
  // User Queries
  ACTIVE_USERS: 'WHERE deleted_at IS NULL AND is_active = true',
  ADMIN_USERS: 'WHERE deleted_at IS NULL AND is_active = true AND role = \'admin\'',
  CUSTOMER_USERS: 'WHERE deleted_at IS NULL AND is_active = true AND role = \'customer\'',
  
  // Product Queries
  ACTIVE_PRODUCTS: 'WHERE deleted_at IS NULL AND is_active = true',
  IN_STOCK_PRODUCTS: 'WHERE deleted_at IS NULL AND is_active = true AND stock_quantity > 0',
  LOW_STOCK_PRODUCTS: 'WHERE deleted_at IS NULL AND is_active = true AND stock_quantity <= 10',
  OUT_OF_STOCK_PRODUCTS: 'WHERE deleted_at IS_null AND is_active = true AND stock_quantity = 0',
  
  // Order Queries
  ACTIVE_ORDERS: 'WHERE deleted_at IS NULL',
  PENDING_ORDERS: 'WHERE deleted_at IS NULL AND status = \'pending\'',
  PROCESSING_ORDERS: 'WHERE deleted_at IS NULL AND status IN (\'processing\', \'confirmed\', \'shipped\')',
  COMPLETED_ORDERS: 'WHERE deleted_at IS NULL AND status = \'delivered\'',
  
  // Payment Queries
  SUCCESSFUL_PAYMENTS: 'WHERE deleted_at IS NULL AND status = \'completed\'',
  FAILED_PAYMENTS: 'WHERE deleted_at IS NULL AND status = \'failed\'',
  PENDING_PAYMENTS: 'WHERE deleted_at IS NULL AND status = \'pending\'',
  
  // Notification Queries
  UNREAD_NOTIFICATIONS: 'WHERE deleted_at IS NULL AND is_read = false',
  RECENT_NOTIFICATIONS: 'WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL \'7 days\'',
} as const;

// Database Functions
export const DB_FUNCTIONS = {
  // Date Functions
  CURRENT_TIMESTAMP: 'CURRENT_TIMESTAMP',
  NOW: 'NOW()',
  CURRENT_DATE: 'CURRENT_DATE',
  
  // String Functions
  LOWER: 'LOWER',
  UPPER: 'UPPER',
  TRIM: 'TRIM',
  LENGTH: 'LENGTH',
  
  // Numeric Functions
  ROUND: 'ROUND',
  CEIL: 'CEIL',
  FLOOR: 'FLOOR',
  ABS: 'ABS',
  
  // Aggregate Functions
  COUNT: 'COUNT',
  SUM: 'SUM',
  AVG: 'AVG',
  MIN: 'MIN',
  MAX: 'MAX',
} as const;

// Data Types
export const DATA_TYPES = {
  // String Types
  TEXT: 'TEXT',
  VARCHAR: 'VARCHAR',
  CHAR: 'CHAR',
  
  // Numeric Types
  INTEGER: 'INTEGER',
  BIGINT: 'BIGINT',
  DECIMAL: 'DECIMAL',
  NUMERIC: 'NUMERIC',
  REAL: 'REAL',
  DOUBLE_PRECISION: 'DOUBLE PRECISION',
  
  // Date/Time Types
  TIMESTAMP: 'TIMESTAMP',
  DATE: 'DATE',
  TIME: 'TIME',
  INTERVAL: 'INTERVAL',
  
  // Boolean Type
  BOOLEAN: 'BOOLEAN',
  
  // JSON Type
  JSON: 'JSON',
  JSONB: 'JSONB',
  
  // UUID Type
  UUID: 'UUID',
} as const;

// Default Values
export const DEFAULT_VALUES = {
  // Boolean Defaults
  TRUE: true,
  FALSE: false,
  
  // Numeric Defaults
  ZERO: 0,
  ONE: 1,
  
  // String Defaults
  EMPTY_STRING: '',
  ACTIVE: 'active',
  PENDING: 'pending',
  
  // Date/Time Defaults
  NOW: 'NOW()',
  CURRENT_TIMESTAMP: 'CURRENT_TIMESTAMP',
  
  // JSON Defaults
  EMPTY_JSON: '\'{}\'',
  EMPTY_ARRAY: '\'[]\'',
} as const;

// Schema Validation
export const SCHEMA_VALIDATION = {
  // User Validation
  PHONE_NUMBER_LENGTH: {
    MIN: 9,
    MAX: 13,
  },
  PASSWORD_LENGTH: {
    MIN: 8,
    MAX: 128,
  },
  
  // Product Validation
  NAME_LENGTH: {
    MIN: 1,
    MAX: 255,
  },
  DESCRIPTION_LENGTH: {
    MIN: 0,
    MAX: 1000,
  },
  PRICE_RANGE: {
    MIN: 0,
    MAX: 999999999,
  },
  STOCK_QUANTITY_RANGE: {
    MIN: 0,
    MAX: 999999,
  },
  
  // Order Validation
  TOTAL_RANGE: {
    MIN: 0,
    MAX: 999999999,
  },
  
  // Review Validation
  RATING_RANGE: {
    MIN: 1,
    MAX: 5,
  },
  COMMENT_LENGTH: {
    MIN: 0,
    MAX: 1000,
  },
  
  // Notification Validation
  MESSAGE_LENGTH: {
    MIN: 1,
    MAX: 1000,
  },
} as const;

// Migration Settings
export const MIGRATION_CONFIG = {
  // Migration Table
  TABLE_NAME: 'migrations',
  
  // Migration File Naming
  FILE_PATTERN: /^\d{14}_.*\.ts$/,
  
  // Migration Lock
  LOCK_TIMEOUT: 300000, // 5 minutes
  
  // Migration Rollback
  ROLLBACK_TIMEOUT: 600000, // 10 minutes
  
  // Migration Validation
  VALIDATION_TIMEOUT: 60000, // 1 minute
} as const;

// Backup Settings
export const BACKUP_CONFIG = {
  // Backup Directory
  DIRECTORY: './backups',
  
  // Backup Retention
  RETENTION_DAYS: 30,
  
  // Backup Compression
  COMPRESSION_ENABLED: true,
  
  // Backup Encryption
  ENCRYPTION_ENABLED: false,
  
  // Backup Scheduling
  SCHEDULE_ENABLED: true,
  SCHEDULE_INTERVAL: '0 2 * * * *', // 2 AM daily
  
  // Backup Types
  FULL_BACKUP: 'full',
  INCREMENTAL_BACKUP: 'incremental',
  SCHEMA_BACKUP: 'schema',
  DATA_BACKUP: 'data',
} as const;

// Performance Settings
export const PERFORMANCE_CONFIG = {
  // Query Optimization
  EXPLAIN_ANALYZE_ENABLED: false,
  QUERY_PLAN_CACHE_SIZE: 1000,
  
  // Connection Pooling
  CONNECTION_POOLING_ENABLED: true,
  STATEMENT_TIMEOUT: 30000,
  
  // Query Timeout
  QUERY_TIMEOUT: 30000,
  
  // Slow Query Threshold
  SLOW_QUERY_THRESHOLD: 1000,
  
  // Query Logging
  QUERY_LOGGING_ENABLED: true,
  QUERY_LOG_LEVEL: 'warn',
} as const;

// Security Settings
export const SECURITY_CONFIG = {
  // SQL Injection Prevention
  PARAMETERIZED_QUERIES: true,
  
  // Data Encryption
  ENCRYPTION_AT_REST: false,
  ENCRYPTION_KEY_ROTATION: false,
  
  // Access Control
  ROW_LEVEL_SECURITY: false,
  COLUMN_LEVEL_SECURITY: false,
  
  // Audit Logging
  AUDIT_LOGGING_ENABLED: true,
  AUDIT_LOG_RETENTION_DAYS: 90,
} as const;
