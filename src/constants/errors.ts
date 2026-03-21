// Error Codes
export const ERROR_CODES = {
  // General Errors (1000-1999)
  UNKNOWN_ERROR: 1000,
  VALIDATION_ERROR: 1001,
  NOT_FOUND: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  TIMEOUT: 1005,
  RATE_LIMIT_EXCEEDED: 1006,
  SERVICE_UNAVAILABLE: 1007,
  
  // Authentication Errors (2000-2999)
  INVALID_CREDENTIALS: 2000,
  TOKEN_EXPIRED: 2001,
  TOKEN_INVALID: 2002,
  ACCOUNT_LOCKED: 2003,
  ACCOUNT_DISABLED: 2004,
  PASSWORD_EXPIRED: 2005,
  INVALID_TOKEN: 2006,
  INSUFFICIENT_PERMISSIONS: 2007,
  
  // Business Logic Errors (3000-3999)
  INSUFFICIENT_STOCK: 3000,
  PRODUCT_NOT_AVAILABLE: 3001,
  ORDER_CANNOT_BE_CANCELLED: 3002,
  PAYMENT_FAILED: 3003,
  REFUND_NOT_ALLOWED: 3004,
  INVALID_PAYMENT_METHOD: 3005,
  PROMO_CODE_EXPIRED: 3006,
  PROMO_CODE_LIMIT_REACHED: 3007,
  
  // Database Errors (4000-4999)
  DATABASE_CONNECTION_FAILED: 4000,
  DATABASE_QUERY_FAILED: 4001,
  DATABASE_CONSTRAINT_VIOLATION: 4002,
  DATABASE_TIMEOUT: 4003,
  DATABASE_LOCK_TIMEOUT: 4004,
  
  // Network Errors (5000-5999)
  NETWORK_ERROR: 5000,
  CONNECTION_REFUSED: 5001,
  CONNECTION_TIMEOUT: 5002,
  DNS_RESOLUTION_FAILED: 5003,
  SSL_ERROR: 5004,
  PROTOCOL_ERROR: 5005,
  
  // File System Errors (6000-6999)
  FILE_NOT_FOUND: 6000,
  FILE_TOO_LARGE: 6001,
  FILE_PERMISSION_DENIED: 6002,
  FILE_TYPE_NOT_SUPPORTED: 6003,
  DISK_FULL: 6004,
  
  // External Service Errors (7000-7999)
  EXTERNAL_SERVICE_ERROR: 7000,
  PAYMENT_GATEWAY_ERROR: 7001,
  EMAIL_SERVICE_ERROR: 7002,
  SMS_SERVICE_ERROR: 7003,
  SHIPPING_SERVICE_ERROR: 7004,
  
  // System Errors (8000-8999)
  SYSTEM_ERROR: 8000,
  MEMORY_ERROR: 8001,
  CPU_ERROR: 8002,
  DISK_ERROR: 8003,
  CONFIGURATION_ERROR: 8004,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // General Errors
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ERROR_CODES.VALIDATION_ERROR]: 'The provided data is invalid. Please check your input and try again.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to access this resource.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.TIMEOUT]: 'The request timed out. Please try again.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
  
  // Authentication Errors
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid username or password.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.TOKEN_INVALID]: 'Invalid authentication token.',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts.',
  [ERROR_CODES.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',
  [ERROR_CODES.PASSWORD_EXPIRED]: 'Your password has expired. Please change it.',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token provided.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions for this action.',
  
  // Business Logic Errors
  [ERROR_CODES.INSUFFICIENT_STOCK]: 'The product is out of stock.',
  [ERROR_CODES.PRODUCT_NOT_AVAILABLE]: 'The product is no longer available.',
  [ERROR_CODES.ORDER_CANNOT_BE_CANCELLED]: 'This order cannot be cancelled.',
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed. Please try again.',
  [ERROR_CODES.REFUND_NOT_ALLOWED]: 'Refunds are not allowed for this order.',
  [ERROR_CODES.INVALID_PAYMENT_METHOD]: 'Invalid payment method selected.',
  [ERROR_CODES.PROMO_CODE_EXPIRED]: 'This promo code has expired.',
  [ERROR_CODES.PROMO_CODE_LIMIT_REACHED]: 'You have reached the usage limit for this promo code.',
  
  // Database Errors
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 'Database connection failed. Please try again.',
  [ERROR_CODES.DATABASE_QUERY_FAILED]: 'Database query failed. Please try again.',
  [ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION]: 'Database constraint violation. Please check your data.',
  [ERROR_CODES.DATABASE_TIMEOUT]: 'Database query timed out. Please try again.',
  [ERROR_CODES.DATABASE_LOCK_TIMEOUT]: 'Database lock timeout. Please try again.',
  
  // Network Errors
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
  [ERROR_CODES.CONNECTION_REFUSED]: 'Connection refused. Please try again later.',
  [ERROR_CODES.CONNECTION_TIMEOUT]: 'Connection timeout. Please check your network.',
  [ERROR_CODES.DNS_RESOLUTION_FAILED]: 'DNS resolution failed. Please check your network settings.',
  [ERROR_CODES.SSL_ERROR]: 'SSL certificate error. Please check your connection.',
  [ERROR_CODES.PROTOCOL_ERROR]: 'Protocol error. Please check your connection.',
  
  // File System Errors
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large.',
  [ERROR_CODES.FILE_PERMISSION_DENIED]: 'Permission denied.',
  [ERROR_CODES.FILE_TYPE_NOT_SUPPORTED]: 'File type not supported.',
  [ERROR_CODES.DISK_FULL]: 'Disk is full.',
  
  // External Service Errors
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
  [ERROR_CODES.PAYMENT_GATEWAY_ERROR]: 'Payment gateway error. Please try again.',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Email service error. Please try again later.',
  [ERROR_CODES.SMS_SERVICE_ERROR]: 'SMS service error. Please try again later.',
  [ERROR_CODES.SHIPPING_SERVICE_ERROR]: 'Shipping service error. Please try again later.',
  
  // System Errors
  [ERROR_CODES.SYSTEM_ERROR]: 'System error. Please try again later.',
  [ERROR_CODES.MEMORY_ERROR]: 'System memory error. Please try again later.',
  [ERROR_CODES.CPU_ERROR]: 'System CPU error. Please try again later.',
  [ERROR_CODES.DISK_ERROR]: 'System disk error. Please try again later.',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
} as const;

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Error Categories
export const ERROR_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  DATABASE: 'database',
  NETWORK: 'network',
  FILE_SYSTEM: 'file_system',
  EXTERNAL_SERVICE: 'external_service',
  SYSTEM: 'system',
} as const;

// HTTP Status Code Mapping
export const HTTP_STATUS_MAPPING = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.TIMEOUT]: 408,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 503,
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.NETWORK_ERROR]: 503,
  [ERROR_CODES.SYSTEM_ERROR]: 500,
  [ERROR_CODES.MEMORY_ERROR]: 500,
  [ERROR_CODES.CPU_ERROR]: 500,
  [ERROR_CODES.DISK_ERROR]: 500,
  [ERROR_CODES.FILE_NOT_FOUND]: 404,
  [ERROR_CODES.FILE_TOO_LARGE]: 413,
  [ERROR_CODES.FILE_PERMISSION_DENIED]: 403,
  [ERROR_CODES.FILE_TYPE_NOT_SUPPORTED]: 415,
  [ERROR_CODES.DISK_FULL]: 507,
} as const;

// Error Class
export class AppError extends Error {
  public readonly code: number;
  public readonly severity: typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];
  public readonly category: typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly requestId?: string;
  public readonly stack?: string;

  constructor(
    message: string,
    code: number = ERROR_CODES.UNKNOWN_ERROR,
    severity: typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY] = ERROR_SEVERITY.MEDIUM,
    category: typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES] = ERROR_CATEGORIES.SYSTEM,
    details?: any,
    userId?: string,
    requestId?: string
  ) {
    super(message);
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.details = details;
    this.timestamp = new Date();
    this.userId = userId;
    this.requestId = requestId;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      requestId: this.requestId,
      stack: this.stack,
    };
  }

  static create(
    message: string,
    code: number,
    severity?: typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY],
    category?: typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES],
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return new AppError(message, code, severity, category, details, userId, requestId);
  }

  static validation(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.VALIDATION_ERROR, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.VALIDATION, details, userId, requestId);
  }

  static notFound(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.NOT_FOUND, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static unauthorized(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.UNAUTHORIZED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static forbidden(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.FORBIDDEN, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHORIZATION, details, userId, requestId);
  }

  static timeout(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.TIMEOUT, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static rateLimitExceeded(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static serviceUnavailable(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.SERVICE_UNAVAILABLE, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static invalidCredentials(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.INVALID_CREDENTIALS, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static tokenExpired(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.TOKEN_EXPIRED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static tokenInvalid(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.TOKEN_INVALID, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static accountLocked(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.ACCOUNT_LOCKED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static accountDisabled(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.ACCOUNT_DISABLED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static passwordExpired(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PASSWORD_EXPIRED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.AUTHENTICATION, details, userId, requestId);
  }

  static insufficientPermissions(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.INSUFFICIENT_PERMISSIONS, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.AUTHORIZATION, details, userId, requestId);
  }

  static insufficientStock(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.INSUFFICIENT_STOCK, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static productNotAvailable(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PRODUCT_NOT_AVAILABLE, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static orderCannotBeCancelled(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.ORDER_CANNOT_BE_CANCELLED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static paymentFailed(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PAYMENT_FAILED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static refundNotAllowed(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.REFUND_NOT_ALLOWED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static invalidPaymentMethod(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.INVALID_PAYMENT_METHOD, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static promoCodeExpired(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PROMO_CODE_EXPIRED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static promoCodeLimitReached(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PROMO_CODE_LIMIT_REACHED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.BUSINESS_LOGIC, details, userId, requestId);
  }

  static databaseConnectionFailed(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DATABASE_CONNECTION_FAILED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.DATABASE, details, userId, requestId);
  }

  static databaseQueryFailed(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DATABASE_QUERY_FAILED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.DATABASE, details, userId, requestId);
  }

  static databaseConstraintViolation(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.DATABASE, details, userId, requestId);
  }

  static databaseTimeout(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DATABASE_TIMEOUT, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.DATABASE, details, userId, requestId);
  }

  static databaseLockTimeout(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DATABASE_LOCK_TIMEOUT, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.DATABASE, details, userId, requestId);
  }

  static networkError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.NETWORK_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static connectionRefused(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.CONNECTION_REFUSED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static connectionTimeout(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.CONNECTION_TIMEOUT, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static dnsResolutionFailed(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DNS_RESOLUTION_FAILED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static sslError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.SSL_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static protocolError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PROTOCOL_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.NETWORK, details, userId, requestId);
  }

  static fileNotFound(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.FILE_NOT_FOUND, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.FILE_SYSTEM, details, userId, requestId);
  }

  static fileTooLarge(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.FILE_TOO_LARGE, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.FILE_SYSTEM, details, userId, requestId);
  }

  static filePermissionDenied(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.FILE_PERMISSION_DENIED, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.FILE_SYSTEM, details, userId, requestId);
  }

  static fileTypeNotSupported(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.FILE_TYPE_NOT_SUPPORTED, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORIES.FILE_SYSTEM, details, userId, requestId);
  }

  static diskFull(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DISK_FULL, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.FILE_SYSTEM, details, userId, requestId);
  }

  static externalServiceError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.EXTERNAL_SERVICE_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.EXTERNAL_SERVICE, details, userId, requestId);
  }

  static paymentGatewayError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.PAYMENT_GATEWAY_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.EXTERNAL_SERVICE, details, userId, requestId);
  }

  static emailServiceError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.EMAIL_SERVICE_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.EXTERNAL_SERVICE, details, userId, requestId);
  }

  static smsServiceError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.SMS_SERVICE_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.EXTERNAL_SERVICE, details, userId, requestId);
  }

  static shippingServiceError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.SHIPPING_SERVICE_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.EXTERNAL_SERVICE, details, userId, requestId);
  }

  static systemError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.SYSTEM_ERROR, ERROR_SEVERITY.CRITICAL, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static memoryError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.MEMORY_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static cpuError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.CPU_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static diskError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.DISK_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }

  static configurationError(
    message: string,
    details?: any,
    userId?: string,
    requestId?: string
  ): AppError {
    return AppError.create(message, ERROR_CODES.CONFIGURATION_ERROR, ERROR_SEVERITY.HIGH, ERROR_CATEGORIES.SYSTEM, details, userId, requestId);
  }
}
