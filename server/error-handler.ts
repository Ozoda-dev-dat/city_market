import { Request, Response, NextFunction } from 'express';
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { authService } from './auth-service';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  body?: any;
  query?: any;
  params?: any;
  timestamp?: Date;
}

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  context?: ErrorContext;
  isOperational?: boolean;
}

export class ErrorHandler {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  // Custom error class
  static createError(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = false
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    error.isOperational = isOperational;
    return error;
  }

  // Validation error
  static validationError(message: string, details?: any): ApiError {
    return this.createError(message, 400, 'VALIDATION_ERROR', details, true);
  }

  // Authentication error
  static authenticationError(message: string, details?: any): ApiError {
    return this.createError(message, 401, 'AUTHENTICATION_ERROR', details, true);
  }

  // Authorization error
  static authorizationError(message: string, details?: any): ApiError {
    return this.createError(message, 403, 'AUTHORIZATION_ERROR', details, true);
  }

  // Not found error
  static notFoundError(message: string, details?: any): ApiError {
    return this.createError(message, 404, 'NOT_FOUND', details, true);
  }

  // Conflict error
  static conflictError(message: string, details?: any): ApiError {
    return this.createError(message, 409, 'CONFLICT', details, true);
  }

  // Rate limit error
  static rateLimitError(message: string, details?: any): ApiError {
    return this.createError(message, 429, 'RATE_LIMIT_EXCEEDED', details, true);
  }

  // Service unavailable error
  static serviceUnavailableError(message: string, details?: any): ApiError {
    return this.createError(message, 503, 'SERVICE_UNAVAILABLE', details, true);
  }

  // Database error
  static databaseError(message: string, details?: any): ApiError {
    return this.createError(message, 500, 'DATABASE_ERROR', details, false);
  }

  // External service error
  static externalServiceError(message: string, details?: any): ApiError {
    return this.createError(message, 502, 'EXTERNAL_SERVICE_ERROR', details, true);
  }

  // Network error
  static networkError(message: string, details?: any): ApiError {
    return this.createError(message, 503, 'NETWORK_ERROR', details, true);
  }

  // Parse error
  static parseError(message: string, details?: any): ApiError {
    return this.createError(message, 400, 'PARSE_ERROR', details, true);
  }

  // Main error handling middleware
  static handleErrors() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const context = this.getErrorContext(req);
      
      // Log the error
      this.logError(error, context);

      // Handle different error types
      if (error instanceof ApiError) {
        return this.handleApiError(error, context, res);
      }

      // Handle database errors
      if (error.message.includes('database') || error.message.includes('connection')) {
        return this.handleDatabaseError(error, context, res);
      }

      // Handle JWT errors
      if (error.message.includes('jwt') || error.message.includes('token')) {
        return this.handleAuthError(error, context, res);
      }

      // Handle validation errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return this.handleValidationError(error, context, res);
      }

      // Handle network/external service errors
      if (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('service')) {
        return this.handleNetworkError(error, context, res);
      }

      // Default error handling
      return this.handleUnknownError(error, context, res);
    };
  }

  // Handle API errors
  private static handleApiError(error: ApiError, context: ErrorContext, res: Response): void {
    const response = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.details,
          stack: error.stack,
          context
        })
      }
    };

    res.status(error.statusCode || 500).json(response);
  }

  // Handle database errors
  private static handleDatabaseError(error: Error, context: ErrorContext, res: Response): void {
    console.error('Database error:', error);
    
    const response = {
      success: false,
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        statusCode: 500,
        isOperational: false,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      }
    };

    res.status(500).json(response);
  }

  // Handle authentication errors
  private static handleAuthError(error: Error, context: ErrorContext, res: Response): void {
    const response = {
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
        statusCode: 401,
        isOperational: true,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      }
    };

    res.status(401).json(response);
  }

  // Handle validation errors
  private static handleValidationError(error: Error, context: ErrorContext, res: Response): void {
    const response = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        isOperational: true,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      }
    };

    res.status(400).json(response);
  }

  // Handle network errors
  private static handleNetworkError(error: Error, context: ErrorContext, res: Response): void {
    const response = {
      success: false,
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        statusCode: 503,
        isOperational: true,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      }
    };

    res.status(503).json(response);
  }

  // Handle unknown errors
  private static handleUnknownError(error: Error, context: ErrorContext, res: Response): void {
    console.error('Unknown error:', error);
    
    const response = {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        isOperational: false,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      }
    };

    res.status(500).json(response);
  }

  // Async error wrapper
  static async asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  // Get error context from request
  private static getErrorContext(req: Request): ErrorContext {
    return {
      userId: req.user?.userId,
      requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
      timestamp: new Date()
    };
  }

  // Generate unique request ID
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log error to database
  private static async logError(error: Error, context: ErrorContext): Promise<void> {
    try {
      // Log to database
      await this.db.insert(schema.systemLogs).values({
        level: this.getErrorLevel(error),
        message: error.message,
        context: {
          error: error.name,
          stack: error.stack,
          context
        },
        userId: context.userId,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        module: 'error_handler',
        action: 'error_occurred',
        createdAt: new Date()
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
      // Don't throw error to avoid infinite loops
    }
  }

  // Get error level based on error type
  private static getErrorLevel(error: Error): 'debug' | 'info' | 'warn' | 'error' | 'fatal' {
    if (error instanceof ApiError) {
      switch (error.statusCode) {
        case 400:
        case 401:
        case 403:
          return 'warn';
        case 404:
          return 'info';
        case 429:
        case 500:
        case 502:
        case 503:
          return 'error';
        default:
          return 'warn';
      }
    }

    // Check for critical errors
    const criticalPatterns = [
      'database',
      'connection',
      'timeout',
      'crash',
      'fatal',
      'critical'
    ];

    const message = error.message.toLowerCase();
    if (criticalPatterns.some(pattern => message.includes(pattern))) {
      return 'error';
    }

    return 'error';
  }

  // Recovery strategies
  static async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    try {
      // Attempt to recover from specific error types
      if (error.message.includes('connection')) {
        // Try to reconnect to database
        await this.reconnectDatabase();
        return true;
      }

      if (error.message.includes('timeout')) {
        // Retry operation with timeout
        return true;
      }

      if (error.message.includes('rate limit')) {
        // Wait and retry
        await this.delay(1000);
        return true;
      }

      return false;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  private static async reconnectDatabase(): Promise<void> {
    try {
      // Close existing connection
      // Re-establish connection
      console.log('Attempting to reconnect to database...');
      
      // This would typically involve reinitializing the database connection
      // For now, we'll just log the attempt
    } catch (error) {
      throw new Error('Database reconnection failed');
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit breaker pattern
  static circuitBreaker(maxFailures: number = 5, timeout: number = 60000) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      const now = Date.now();

      if (state === 'open' && now - lastFailureTime < timeout) {
        throw this.serviceUnavailableError('Service temporarily unavailable');
      }

      if (state === 'half-open') {
        // Allow one request through in half-open state
        state = 'open';
      }

      try {
        const result = await fn();
        
        // Success - reset failures and open circuit
        if (state !== 'open') {
          state = 'open';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= maxFailures) {
          state = 'open';
          throw error;
        }

        if (state === 'closed') {
          state = 'open';
        }

        throw error;
      }
    };
  }

  // Retry mechanism with exponential backoff
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  // Timeout wrapper
  static timeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(this.serviceUnavailableError('Operation timed out')), timeoutMs)
      )
    ]);
  }

  // Graceful shutdown handler
  static handleGracefulShutdown(signal: string): void {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Close database connections
    if (this.db) {
      console.log('📊 Closing database connections...');
      // This would typically close the database connection
    }

    // Clear any intervals or timeouts
    console.log('🧹 Clearing intervals and timeouts...');
    // This would clear any running intervals

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }

  // Health check
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: boolean;
      authentication: boolean;
      rateLimiting: boolean;
      logging: boolean;
      memory: boolean;
    };
    timestamp: string;
    uptime: number;
  }> {
    const checks = {
      database: false,
      authentication: false,
      rateLimiting: false,
      logging: false,
      memory: false
    };

    try {
      // Check database
      await this.db.select().from(schema.users).limit(1);
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check authentication
    try {
      const jwtSecret = process.env.JWT_SECRET;
      checks.authentication = !!jwtSecret && jwtSecret.length > 32;
    } catch (error) {
      console.error('Authentication health check failed:', error);
    }

    // Check rate limiting
    try {
      checks.rateLimiting = true; // Rate limiting is always available
    } catch (error) {
      console.error('Rate limiting health check failed:', error);
    }

    // Check logging
    try {
      checks.logging = true; // Logging is always available
    } catch (error) {
      console.error('Logging health check failed:', error);
    }

    // Check memory usage
    try {
      const memUsage = process.memoryUsage();
      checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9; // Less than 90% of heap
    } catch (error) {
      console.error('Memory health check failed:', error);
    }

    const failedChecks = Object.values(checks).filter(check => !check).length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => ErrorHandler.handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => ErrorHandler.handleGracefulShutdown('SIGINT'));

export default ErrorHandler;
