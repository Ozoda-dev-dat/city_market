import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { errorHandlingService, ErrorContext } from '../lib/error-handling';

/**
 * Global error handler hook
 * Provides consistent error handling across the application
 */

export interface UseErrorHandlerOptions {
  component?: string;
  userId?: string;
  enableGlobalHandlers?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { component, userId, enableGlobalHandlers = true } = options;

  /**
   * Handle error with context
   */
  const handleError = useCallback((error: Error | string, action?: string) => {
    const context: ErrorContext = {
      component,
      action,
      userId,
    };
    
    return errorHandlingService.handleError(error, context);
  }, [component, userId]);

  /**
   * Handle async error
   */
  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    action?: string
  ): Promise<any> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), action);
      throw error;
    }
  }, [handleError]);

  /**
   * Wrap async function with error handling
   */
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    action?: string
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), action);
        throw error;
      }
    }) as T;
  }, [handleError]);

  /**
   * Handle promise rejection
   */
  const handlePromiseRejection = useCallback((event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    handleError(error, 'unhandled_promise_rejection');
  }, [handleError]);

  /**
   * Handle uncaught error
   */
  const handleUncaughtError = useCallback((error: ErrorEvent) => {
    const errorObj = error.error instanceof Error ? error.error : new Error(error.message);
    handleError(errorObj, 'uncaught_error');
  }, [handleError]);

  /**
   * Setup global error handlers
   */
  useEffect(() => {
    if (enableGlobalHandlers && Platform.OS === 'web') {
      // Web-specific global error handlers
      window.addEventListener('unhandledrejection', handlePromiseRejection);
      window.addEventListener('error', handleUncaughtError);

      return () => {
        window.removeEventListener('unhandledrejection', handlePromiseRejection);
        window.removeEventListener('error', handleUncaughtError);
      };
    }
  }, [enableGlobalHandlers, handlePromiseRejection, handleUncaughtError]);

  return {
    handleError,
    handleAsyncError,
    withErrorHandling,
  };
}

/**
 * Higher-order component for error boundary
 */
export function withErrorHandler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseErrorHandlerOptions = {}
) {
  return function WithErrorHandlerComponent(props: P) {
    const { handleError } = useErrorHandler(options);

    // Create error handler for the component
    const componentErrorHandler = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
      handleError(error, 'react_error_boundary');
    }, [handleError]);

    // In a real implementation, this would wrap the component in an ErrorBoundary
    // For now, we'll just return the component with error handling context
    return <WrappedComponent {...props} />;
  };
}

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Create error with context
   */
  createError: (message: string, context?: Partial<ErrorContext>): Error => {
    const error = new Error(message);
    (error as any).context = context;
    return error;
  },

  /**
   * Check if error is network related
   */
  isNetworkError: (error: Error | string): boolean => {
    const message = error instanceof Error ? error.message : error;
    return message.includes('Network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('ECONNREFUSED') ||
           message.includes('ENOTFOUND');
  },

  /**
   * Check if error is authentication related
   */
  isAuthError: (error: Error | string): boolean => {
    const message = error instanceof Error ? error.message : error;
    return message.includes('401') || 
           message.includes('403') || 
           message.includes('Unauthorized') || 
           message.includes('Forbidden') ||
           message.includes('Token expired');
  },

  /**
   * Check if error is server related
   */
  isServerError: (error: Error | string): boolean => {
    const message = error instanceof Error ? error.message : error;
    return message.includes('500') || 
           message.includes('Internal Server Error') ||
           message.includes('502') ||
           message.includes('503') ||
           message.includes('504');
  },

  /**
   * Check if error is validation related
   */
  isValidationError: (error: Error | string): boolean => {
    const message = error instanceof Error ? error.message : error;
    return message.includes('validation') || 
           message.includes('Invalid') || 
           message.includes('required') ||
           message.includes('400');
  },

  /**
   * Get error type
   */
  getErrorType: (error: Error | string): 'network' | 'auth' | 'server' | 'validation' | 'unknown' => {
    if (errorUtils.isNetworkError(error)) return 'network';
    if (errorUtils.isAuthError(error)) return 'auth';
    if (errorUtils.isServerError(error)) return 'server';
    if (errorUtils.isValidationError(error)) return 'validation';
    return 'unknown';
  },

  /**
   * Determine if error should be retried
   */
  shouldRetry: (error: Error | string, retryCount: number = 0): boolean => {
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) return false;
    
    const errorType = errorUtils.getErrorType(error);
    
    // Retry network errors
    if (errorType === 'network') return true;
    
    // Don't retry authentication errors
    if (errorType === 'auth') return false;
    
    // Retry server errors occasionally
    if (errorType === 'server' && retryCount < 2) return true;
    
    // Don't retry validation errors
    if (errorType === 'validation') return false;
    
    return false;
  },

  /**
   * Get retry delay
   */
  getRetryDelay: (retryCount: number): number => {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(delay + jitter, 0);
  },
};

/**
 * Error handling middleware for API calls
 */
export const createApiErrorHandler = (defaultContext?: Partial<ErrorContext>) => {
  return async (apiCall: () => Promise<any>, context?: Partial<ErrorContext>) => {
    try {
      return await apiCall();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const finalContext = { ...defaultContext, ...context };
      
      errorHandlingService.handleError(errorObj, finalContext);
      throw errorObj;
    }
  };
};

/**
 * Retry wrapper for async functions
 */
export const withRetry = async <T,>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: Error | string, retryCount: number) => boolean;
    context?: Partial<ErrorContext>;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = errorUtils.shouldRetry,
    context,
  } = options;

  let lastError: Error | string;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries || !shouldRetry(lastError, i)) {
        errorHandlingService.handleError(lastError, context);
        throw lastError;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
};
